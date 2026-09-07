import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma, UserRole } from '@prisma/client';
import { paginate, toSkipTake, type Paginated } from '@/common/dto/pagination.dto';
import { AppError, ErrorCode } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { AuditService } from '@/modules/audit/audit.service';
import type { CreateReviewDto, ListReviewsDto, UpdateReviewDto } from './dto/reviews.dto';

/** How long a jamaah may still edit their own review. */
const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(jamaahId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      select: { id: true, jamaahId: true, mutawifId: true, status: true },
    });

    if (!booking) throw AppError.notFound('Booking', dto.bookingId);
    if (booking.jamaahId !== jamaahId) {
      throw AppError.forbidden('Only the jamaah on this booking can review it');
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw AppError.conflict(
        ErrorCode.BOOKING_INVALID_TRANSITION,
        'Only a completed booking can be reviewed',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { bookingId: booking.id },
      select: { id: true },
    });
    if (existing) {
      throw AppError.conflict(
        ErrorCode.REVIEW_ALREADY_EXISTS,
        'This booking has already been reviewed',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          bookingId: booking.id,
          jamaahId,
          mutawifId: booking.mutawifId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      await this.recalculateRating(tx, booking.mutawifId);
      return review;
    });
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw AppError.notFound('Review', id);
    if (review.jamaahId !== actor.id) throw AppError.forbidden();

    if (Date.now() - review.createdAt.getTime() > EDIT_WINDOW_MS) {
      throw AppError.conflict(ErrorCode.CONFLICT, 'A review can only be edited within 7 days');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({ where: { id }, data: dto });
      await this.recalculateRating(tx, review.mutawifId);
      return updated;
    });
  }

  async remove(actor: AuthenticatedUser, id: string): Promise<void> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw AppError.notFound('Review', id);

    const isOwner = review.jamaahId === actor.id;
    if (!isOwner && actor.role !== UserRole.ADMIN) throw AppError.forbidden();

    await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      await this.recalculateRating(tx, review.mutawifId);
    });

    await this.audit.record({
      actorId: actor.id,
      action: 'review.deleted',
      entity: 'Review',
      entityId: id,
      metadata: { mutawifId: review.mutawifId, byAdmin: !isOwner },
    });
  }

  async listForMutawif(dto: ListReviewsDto): Promise<Paginated<unknown>> {
    const where = { mutawifId: dto.mutawifId };
    const { skip, take } = toSkipTake(dto);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          jamaah: { select: { name: true, avatarUrl: true } },
          booking: { select: { serviceType: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return paginate(items, total, dto);
  }

  /**
   * Recomputes the denormalised rating from the reviews themselves rather than
   * adjusting a running average, so a delete or an edit can never leave the
   * aggregate drifting away from the underlying rows.
   */
  private async recalculateRating(
    tx: Prisma.TransactionClient,
    mutawifId: string,
  ): Promise<void> {
    const aggregate = await tx.review.aggregate({
      where: { mutawifId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await tx.mutawifProfile.update({
      where: { id: mutawifId },
      data: {
        ratingAverage: Math.round((aggregate._avg.rating ?? 0) * 100) / 100,
        ratingCount: aggregate._count._all,
      },
    });
  }
}
