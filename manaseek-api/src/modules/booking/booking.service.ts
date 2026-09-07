import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  BookingStatus,
  Prisma,
  UserRole,
  type Booking,
} from '@prisma/client';
import { AppConfigService } from '@/common/config/config.service';
import { paginate, toSkipTake, type Paginated } from '@/common/dto/pagination.dto';
import { AppError, ErrorCode } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { generateReferenceCode } from '@/common/utils/crypto.util';
import { AuditService } from '@/modules/audit/audit.service';
import { MutawifService } from '@/modules/mutawif/mutawif.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import type { NotificationTemplateKey } from '@/modules/notifications/templates';
import { assertTransition, BLOCKING_STATUSES, type BookingAction } from './booking.state-machine';
import { overlaps, quote } from './booking.pricing';
import type {
  CancelBookingDto,
  CreateBookingDto,
  ListBookingsDto,
  RejectBookingDto,
  UpdatePaymentDto,
} from './dto/booking.dto';

const SERVICE_LABELS: Record<string, string> = {
  IBADAH_GUIDANCE: 'Pendampingan Ibadah',
  MOBILITY_ASSISTANCE: 'Bantuan Mobilitas',
  EMERGENCY: 'Penanganan Darurat',
};

const bookingInclude = {
  jamaah: { select: { id: true, name: true, phone: true, avatarUrl: true } },
  mutawif: {
    select: {
      id: true,
      city: true,
      ratingAverage: true,
      user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.BookingInclude;

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly mutawif: MutawifService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async create(jamaahId: string, dto: CreateBookingDto) {
    if (dto.scheduledStartAt.getTime() <= Date.now()) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'scheduledStartAt must be in the future');
    }

    const { profile, rate } = await this.mutawif.requireBookable(dto.mutawifId, dto.serviceType);

    if (profile.userId === jamaahId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'You cannot book yourself');
    }

    await this.assertNoConflict(profile.id, dto.scheduledStartAt, dto.durationHours);

    const priced = quote(rate.hourlyRate, dto.durationHours, rate.currency);
    const ttlMinutes = this.config.get('BOOKING_REQUEST_TTL_MINUTES');
    // A request never outlives the appointment it is for.
    const expiresAt = new Date(
      Math.min(Date.now() + ttlMinutes * 60_000, dto.scheduledStartAt.getTime()),
    );

    const booking = await this.prisma.booking.create({
      data: {
        code: await this.nextCode(),
        jamaahId,
        mutawifId: profile.id,
        serviceType: dto.serviceType,
        scheduledStartAt: dto.scheduledStartAt,
        durationHours: dto.durationHours,
        hourlyRate: priced.hourlyRate,
        totalAmount: priced.totalAmount,
        currency: priced.currency,
        meetingPointLabel: dto.meetingPointLabel,
        meetingLatitude: dto.meetingLatitude,
        meetingLongitude: dto.meetingLongitude,
        notes: dto.notes,
        expiresAt,
        events: {
          create: {
            toStatus: BookingStatus.REQUESTED,
            actorId: jamaahId,
            actorRole: UserRole.JAMAAH,
          },
        },
      },
      include: bookingInclude,
    });

    await this.notifications.sendToUser({
      userId: profile.userId,
      templateKey: 'booking.requested',
      vars: {
        jamaahName: booking.jamaah.name ?? 'Jamaah',
        serviceLabel: SERVICE_LABELS[dto.serviceType] ?? dto.serviceType,
        schedule: this.formatSchedule(booking.scheduledStartAt),
        expiresAt: this.formatSchedule(expiresAt),
      },
      data: { bookingId: booking.id, type: 'booking.requested' },
    });

    return booking;
  }

  async list(actor: AuthenticatedUser, dto: ListBookingsDto): Promise<Paginated<unknown>> {
    const where = await this.scopeFor(actor, dto);
    await this.expireStaleWithin(where);

    const { skip, take } = toSkipTake(dto);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: bookingInclude,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return paginate(items, total, dto);
  }

  async getById(actor: AuthenticatedUser, id: string) {
    await this.expireStaleWithin({ id });

    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { ...bookingInclude, events: { orderBy: { createdAt: 'asc' } }, review: true },
    });

    if (!booking) throw AppError.notFound('Booking', id);
    await this.assertParticipant(actor, booking);

    return booking;
  }

  accept(actor: AuthenticatedUser, id: string) {
    return this.transition(actor, id, 'ACCEPT', { notify: 'booking.accepted' });
  }

  reject(actor: AuthenticatedUser, id: string, dto: RejectBookingDto) {
    return this.transition(actor, id, 'REJECT', { reason: dto.reason, notify: 'booking.rejected' });
  }

  start(actor: AuthenticatedUser, id: string) {
    return this.transition(actor, id, 'START', { notify: 'booking.started' });
  }

  complete(actor: AuthenticatedUser, id: string) {
    return this.transition(actor, id, 'COMPLETE', { notify: 'booking.completed' });
  }

  cancel(actor: AuthenticatedUser, id: string, dto: CancelBookingDto) {
    return this.transition(actor, id, 'CANCEL', { reason: dto.reason, notify: 'booking.cancelled' });
  }

  async updatePayment(adminId: string, id: string, dto: UpdatePaymentDto) {
    const booking = await this.prisma.booking.update({
      where: { id },
      data: { paymentStatus: dto.paymentStatus },
      select: { id: true, code: true, paymentStatus: true },
    });

    await this.audit.record({
      actorId: adminId,
      action: 'booking.payment_updated',
      entity: 'Booking',
      entityId: id,
      metadata: { paymentStatus: dto.paymentStatus, note: dto.note ?? null },
    });

    return booking;
  }

  /**
   * Expires requests the mutawif never answered. Runs on a schedule rather than
   * lazily so the jamaah sees the booking close on its own and can rebook.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async expireStaleRequestsOnSchedule(): Promise<number> {
    if (!this.config.get('SCHEDULER_ENABLED')) return 0;
    return this.expireStaleRequests();
  }

  /** Same work, callable from the internal task endpoint on serverless hosts. */
  async expireStaleRequests(): Promise<number> {
    let expired = 0;
    const stale = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.REQUESTED,
        expiresAt: { lte: new Date() },
      },
      select: { id: true, code: true, jamaahId: true },
      take: 100,
    });

    for (const booking of stale) {
      try {
        await this.prisma.$transaction([
          this.prisma.booking.update({
            where: { id: booking.id, status: BookingStatus.REQUESTED },
            data: { status: BookingStatus.EXPIRED },
          }),
          this.prisma.bookingEvent.create({
            data: {
              bookingId: booking.id,
              fromStatus: BookingStatus.REQUESTED,
              toStatus: BookingStatus.EXPIRED,
              reason: 'Not answered before the request deadline',
            },
          }),
        ]);

        await this.notifications.sendToUser({
          userId: booking.jamaahId,
          templateKey: 'booking.expired',
          vars: { code: booking.code },
          data: { bookingId: booking.id, type: 'booking.expired' },
        });

        expired += 1;
      } catch (error) {
        // A concurrent accept wins the race; nothing to repair.
        this.logger.debug(`Skipped expiring ${booking.code}: ${(error as Error).message}`);
      }
    }

    return expired;
  }

  /**
   * Closes out requests whose deadline passed, limited to the rows the caller
   * is about to read.
   *
   * The scheduled sweep is the one that notifies; this only stops a client
   * from ever seeing a request that is visibly past its deadline. It matters on
   * hosts where the platform scheduler runs infrequently.
   */
  private async expireStaleWithin(where: Prisma.BookingWhereInput): Promise<void> {
    const now = new Date();

    const { count } = await this.prisma.booking.updateMany({
      where: { ...where, status: BookingStatus.REQUESTED, expiresAt: { lte: now } },
      data: { status: BookingStatus.EXPIRED },
    });

    if (count === 0) return;

    const expired = await this.prisma.booking.findMany({
      where: { ...where, status: BookingStatus.EXPIRED, updatedAt: { gte: now } },
      select: { id: true },
    });

    await this.prisma.bookingEvent.createMany({
      data: expired.map((booking) => ({
        bookingId: booking.id,
        fromStatus: BookingStatus.REQUESTED,
        toStatus: BookingStatus.EXPIRED,
        reason: 'Not answered before the request deadline',
      })),
    });
  }

  // -- internals ----------------------------------------------------------

  private async transition(
    actor: AuthenticatedUser,
    id: string,
    action: BookingAction,
    options: { reason?: string; notify: NotificationTemplateKey },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { mutawif: { select: { id: true, userId: true } } },
    });

    if (!booking) throw AppError.notFound('Booking', id);

    const role = await this.roleInBooking(actor, booking);
    const nextStatus = assertTransition(booking.status, action, role);

    if (nextStatus === BookingStatus.ACCEPTED) {
      await this.assertNoConflict(
        booking.mutawifId,
        booking.scheduledStartAt,
        booking.durationHours,
        booking.id,
      );
    }

    const now = new Date();
    const timestamps: Prisma.BookingUpdateInput = {
      [BookingStatus.ACCEPTED]: { acceptedAt: now },
      [BookingStatus.ONGOING]: { startedAt: now },
      [BookingStatus.COMPLETED]: { completedAt: now },
      [BookingStatus.CANCELLED]: { cancelledAt: now, cancelledById: actor.id, cancelReason: options.reason },
      [BookingStatus.REJECTED]: { cancelReason: options.reason },
      [BookingStatus.EXPIRED]: {},
      [BookingStatus.REQUESTED]: {},
    }[nextStatus];

    const updated = await this.prisma.$transaction(async (tx) => {
      // The status guard makes the update a compare-and-swap: two concurrent
      // accepts cannot both win.
      const result = await tx.booking.update({
        where: { id, status: booking.status },
        data: { status: nextStatus, ...timestamps },
        include: bookingInclude,
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: id,
          fromStatus: booking.status,
          toStatus: nextStatus,
          actorId: actor.id,
          actorRole: actor.role,
          reason: options.reason,
        },
      });

      if (nextStatus === BookingStatus.COMPLETED) {
        await tx.mutawifProfile.update({
          where: { id: booking.mutawifId },
          data: { completedBookings: { increment: 1 } },
        });
      }

      return result;
    });

    await this.audit.record({
      actorId: actor.id,
      action: `booking.${action.toLowerCase()}`,
      entity: 'Booking',
      entityId: id,
      metadata: { from: booking.status, to: nextStatus, reason: options.reason ?? null },
    });

    // Whoever did not trigger the action is the one who needs to hear about it.
    const recipientId =
      actor.id === booking.jamaahId ? booking.mutawif.userId : booking.jamaahId;

    await this.notifications.sendToUser({
      userId: recipientId,
      templateKey: options.notify,
      vars: {
        code: updated.code,
        mutawifName: updated.mutawif.user.name ?? 'Mutawif',
        jamaahName: updated.jamaah.name ?? 'Jamaah',
        schedule: this.formatSchedule(updated.scheduledStartAt),
        meetingPoint: updated.meetingPointLabel,
        reason: options.reason ?? '-',
      },
      data: { bookingId: id, type: options.notify },
    });

    return updated;
  }

  private async assertNoConflict(
    mutawifId: string,
    startAt: Date,
    durationHours: number,
    excludeBookingId?: string,
  ): Promise<void> {
    const windowStart = new Date(startAt.getTime() - 12 * 3_600_000);
    const windowEnd = new Date(startAt.getTime() + durationHours * 3_600_000);

    const candidates = await this.prisma.booking.findMany({
      where: {
        mutawifId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: { in: BLOCKING_STATUSES },
        scheduledStartAt: { gte: windowStart, lt: windowEnd },
      },
      select: { id: true, code: true, scheduledStartAt: true, durationHours: true },
    });

    const clash = candidates.find((candidate) =>
      overlaps(startAt, durationHours, candidate.scheduledStartAt, candidate.durationHours),
    );

    if (clash) {
      throw AppError.conflict(
        ErrorCode.BOOKING_SLOT_TAKEN,
        'This mutawif already has a confirmed booking in that time window',
        { conflictingBookingCode: clash.code },
      );
    }
  }

  private async roleInBooking(
    actor: AuthenticatedUser,
    booking: Booking & { mutawif: { userId: string } },
  ): Promise<UserRole> {
    if (actor.role === UserRole.ADMIN) return UserRole.ADMIN;
    if (actor.id === booking.jamaahId) return UserRole.JAMAAH;
    if (actor.id === booking.mutawif.userId) return UserRole.MUTAWIF;

    throw AppError.forbidden('You are not a participant in this booking');
  }

  private async assertParticipant(
    actor: AuthenticatedUser,
    booking: { jamaahId: string; mutawif: { user: { id: string } } },
  ): Promise<void> {
    if (actor.role === UserRole.ADMIN) return;
    if (actor.id === booking.jamaahId) return;
    if (actor.id === booking.mutawif.user.id) return;

    throw AppError.forbidden('You are not a participant in this booking');
  }

  private async scopeFor(
    actor: AuthenticatedUser,
    dto: ListBookingsDto,
  ): Promise<Prisma.BookingWhereInput> {
    if (actor.role === UserRole.ADMIN) {
      return { status: dto.status, mutawifId: dto.mutawifId, jamaahId: dto.jamaahId };
    }

    if (actor.role === UserRole.MUTAWIF) {
      const profile = await this.prisma.mutawifProfile.findUnique({
        where: { userId: actor.id },
        select: { id: true },
      });

      if (!profile) throw AppError.notFound('MutawifProfile');
      return { mutawifId: profile.id, status: dto.status };
    }

    return { jamaahId: actor.id, status: dto.status };
  }

  /** Retries on the (unlikely) collision of a random reference code. */
  private async nextCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateReferenceCode('MSK');
      const taken = await this.prisma.booking.findUnique({ where: { code }, select: { id: true } });
      if (!taken) return code;
    }

    throw new AppError(ErrorCode.INTERNAL_ERROR, 'Could not allocate a booking code', 500);
  }

  private formatSchedule(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Riyadh',
    }).format(date);
  }
}
