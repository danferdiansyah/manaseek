import { Injectable } from '@nestjs/common';
import {
  AvailabilityStatus,
  Prisma,
  ServiceType,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { AppConfigService } from '@/common/config/config.service';
import { paginate, toSkipTake, type Paginated } from '@/common/dto/pagination.dto';
import { AppError, ErrorCode } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import { boundingBox } from '@/common/utils/geo.util';
import { AuditService } from '@/modules/audit/audit.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import type {
  AddDocumentDto,
  ApplyDto,
  ListMutawifDto,
  NearbyDto,
  ReviewApplicationDto,
  SetRatesDto,
  SetSlotsDto,
  UpdateAvailabilityDto,
  UpdateLocationDto,
  UpdateMutawifDto,
} from './dto/mutawif.dto';

export interface NearbyMutawif {
  id: string;
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  city: string | null;
  languages: string[];
  yearsExperience: number;
  ratingAverage: number;
  ratingCount: number;
  completedBookings: number;
  distanceKm: number;
  hourlyRate: number | null;
}

interface NearbyRow extends Omit<NearbyMutawif, 'distanceKm' | 'hourlyRate'> {
  distance_km: number;
  hourly_rate: Prisma.Decimal | null;
}

@Injectable()
export class MutawifService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // -- application --------------------------------------------------------

  async apply(userId: string, dto: ApplyDto) {
    const existing = await this.prisma.mutawifProfile.findUnique({ where: { userId } });
    if (existing) {
      throw AppError.conflict(ErrorCode.CONFLICT, 'A mutawif application already exists');
    }

    return this.prisma.mutawifProfile.create({ data: { userId, ...dto } });
  }

  async getOwn(userId: string) {
    const profile = await this.prisma.mutawifProfile.findUnique({
      where: { userId },
      include: { documents: true, rates: true, slots: { orderBy: { dayOfWeek: 'asc' } } },
    });

    if (!profile) throw AppError.notFound('MutawifProfile');
    return profile;
  }

  async updateOwn(userId: string, dto: UpdateMutawifDto) {
    const profile = await this.requireOwnProfile(userId);

    // Approved mutawif edit freely; an application under review is frozen so a
    // reviewer never approves details that changed underneath them.
    if (profile.verificationStatus === VerificationStatus.UNDER_REVIEW) {
      throw AppError.conflict(
        ErrorCode.CONFLICT,
        'Your application is under review and cannot be edited right now',
      );
    }

    return this.prisma.mutawifProfile.update({ where: { id: profile.id }, data: dto });
  }

  async addDocument(userId: string, dto: AddDocumentDto) {
    const profile = await this.requireOwnProfile(userId);
    return this.prisma.mutawifDocument.create({ data: { mutawifId: profile.id, ...dto } });
  }

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const profile = await this.requireOwnProfile(userId);
    const deleted = await this.prisma.mutawifDocument.deleteMany({
      where: { id: documentId, mutawifId: profile.id },
    });

    if (deleted.count === 0) throw AppError.notFound('MutawifDocument', documentId);
  }

  async submitForReview(userId: string) {
    const profile = await this.requireOwnProfile(userId);

    if (
      profile.verificationStatus !== VerificationStatus.DRAFT &&
      profile.verificationStatus !== VerificationStatus.REJECTED
    ) {
      throw AppError.conflict(
        ErrorCode.CONFLICT,
        `Cannot submit an application in state ${profile.verificationStatus}`,
      );
    }

    const documentCount = await this.prisma.mutawifDocument.count({
      where: { mutawifId: profile.id },
    });
    if (documentCount === 0) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Upload at least one supporting document before submitting',
      );
    }

    const rateCount = await this.prisma.mutawifServiceRate.count({
      where: { mutawifId: profile.id },
    });
    if (rateCount === 0) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Set at least one service rate before submitting',
      );
    }

    return this.prisma.mutawifProfile.update({
      where: { id: profile.id },
      data: {
        verificationStatus: VerificationStatus.SUBMITTED,
        submittedAt: new Date(),
        verificationNote: null,
      },
    });
  }

  // -- rates and schedule -------------------------------------------------

  async setRates(userId: string, dto: SetRatesDto) {
    const profile = await this.requireOwnProfile(userId);

    await this.prisma.$transaction(
      dto.rates.map((rate) =>
        this.prisma.mutawifServiceRate.upsert({
          where: {
            mutawifId_serviceType: { mutawifId: profile.id, serviceType: rate.serviceType },
          },
          create: {
            mutawifId: profile.id,
            serviceType: rate.serviceType,
            hourlyRate: new Prisma.Decimal(rate.hourlyRate),
            active: rate.active,
          },
          update: { hourlyRate: new Prisma.Decimal(rate.hourlyRate), active: rate.active },
        }),
      ),
    );

    return this.prisma.mutawifServiceRate.findMany({ where: { mutawifId: profile.id } });
  }

  async setSlots(userId: string, dto: SetSlotsDto) {
    const profile = await this.requireOwnProfile(userId);

    // The client always sends the full weekly schedule; replace it wholesale.
    await this.prisma.$transaction([
      this.prisma.availabilitySlot.deleteMany({ where: { mutawifId: profile.id } }),
      this.prisma.availabilitySlot.createMany({
        data: dto.slots.map((slot) => ({ mutawifId: profile.id, ...slot })),
      }),
    ]);

    return this.prisma.availabilitySlot.findMany({
      where: { mutawifId: profile.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  }

  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const profile = await this.requireOwnProfile(userId);

    if (profile.verificationStatus !== VerificationStatus.APPROVED) {
      throw new AppError(
        ErrorCode.MUTAWIF_NOT_VERIFIED,
        'Only verified mutawif can go online',
        403,
      );
    }

    return this.prisma.mutawifProfile.update({
      where: { id: profile.id },
      data: { availabilityStatus: dto.status },
      select: { id: true, availabilityStatus: true },
    });
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const profile = await this.requireOwnProfile(userId);

    return this.prisma.mutawifProfile.update({
      where: { id: profile.id },
      data: { ...dto, locationUpdatedAt: new Date() },
      select: { id: true, latitude: true, longitude: true, locationUpdatedAt: true },
    });
  }

  // -- discovery ----------------------------------------------------------

  /**
   * Nearby search. A bounding box narrows the candidate set using the
   * (latitude, longitude) index, then haversine gives the exact distance.
   * Plain Postgres, no PostGIS extension required.
   *
   * Exported for the booking module and for Engineer B's chatbot escalation.
   */
  async findNearby(dto: NearbyDto): Promise<NearbyMutawif[]> {
    const maxRadius = this.config.get('NEARBY_MAX_RADIUS_KM');
    const radiusKm = Math.min(dto.radiusKm ?? this.config.get('NEARBY_DEFAULT_RADIUS_KM'), maxRadius);
    const box = boundingBox({ latitude: dto.latitude, longitude: dto.longitude }, radiusKm);

    const rows = await this.prisma.$queryRaw<NearbyRow[]>`
      SELECT
        m.id,
        m."userId",
        u.name,
        u."avatarUrl",
        m.city,
        m.languages,
        m."yearsExperience",
        m."ratingAverage",
        m."ratingCount",
        m."completedBookings",
        r."hourlyRate" AS hourly_rate,
        (6371 * 2 * asin(sqrt(
          power(sin(radians(m.latitude - ${dto.latitude}::double precision) / 2), 2)
          + cos(radians(${dto.latitude}::double precision)) * cos(radians(m.latitude))
          * power(sin(radians(m.longitude - ${dto.longitude}::double precision) / 2), 2)
        ))) AS distance_km
      FROM mutawif_profiles m
      JOIN users u ON u.id = m."userId"
      LEFT JOIN mutawif_service_rates r
        ON r."mutawifId" = m.id
       AND r.active = true
       AND (${dto.serviceType ?? null}::"ServiceType" IS NULL OR r."serviceType" = ${dto.serviceType ?? null}::"ServiceType")
      WHERE m."verificationStatus" = 'APPROVED'
        AND m."availabilityStatus" = 'ONLINE'
        AND u.status = 'ACTIVE'
        AND m.latitude BETWEEN ${box.minLat} AND ${box.maxLat}
        AND m.longitude BETWEEN ${box.minLng} AND ${box.maxLng}
        AND (${dto.serviceType ?? null}::"ServiceType" IS NULL OR r.id IS NOT NULL)
      ORDER BY distance_km ASC
      LIMIT ${dto.limit}
    `;

    return rows
      .filter((row) => row.distance_km <= radiusKm)
      .map((row) => ({
        id: row.id,
        userId: row.userId,
        name: row.name,
        avatarUrl: row.avatarUrl,
        city: row.city,
        languages: row.languages,
        yearsExperience: row.yearsExperience,
        ratingAverage: row.ratingAverage,
        ratingCount: row.ratingCount,
        completedBookings: row.completedBookings,
        distanceKm: Math.round(row.distance_km * 100) / 100,
        hourlyRate: row.hourly_rate ? Number(row.hourly_rate) : null,
      }));
  }

  async getPublicProfile(id: string) {
    const profile = await this.prisma.mutawifProfile.findUnique({
      where: { id },
      select: {
        id: true,
        bio: true,
        languages: true,
        yearsExperience: true,
        city: true,
        availabilityStatus: true,
        verificationStatus: true,
        ratingAverage: true,
        ratingCount: true,
        completedBookings: true,
        user: { select: { name: true, avatarUrl: true } },
        rates: {
          where: { active: true },
          select: { serviceType: true, hourlyRate: true, currency: true },
        },
        slots: {
          orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
          select: { dayOfWeek: true, startMinute: true, endMinute: true },
        },
      },
    });

    if (!profile || profile.verificationStatus !== VerificationStatus.APPROVED) {
      throw AppError.notFound('Mutawif', id);
    }

    return profile;
  }

  // -- admin --------------------------------------------------------------

  async list(dto: ListMutawifDto): Promise<Paginated<unknown>> {
    const where: Prisma.MutawifProfileWhereInput = {
      verificationStatus: dto.verificationStatus,
      city: dto.city,
      ...(dto.search
        ? { user: { OR: [{ name: { contains: dto.search, mode: 'insensitive' } }, { phone: { contains: dto.search } }] } }
        : {}),
    };

    const { skip, take } = toSkipTake(dto);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.mutawifProfile.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true, status: true } },
          documents: { select: { id: true, type: true, status: true, fileUrl: true } },
        },
      }),
      this.prisma.mutawifProfile.count({ where }),
    ]);

    return paginate(items, total, dto);
  }

  async reviewApplication(adminId: string, id: string, dto: ReviewApplicationDto) {
    const profile = await this.prisma.mutawifProfile.findUnique({ where: { id } });
    if (!profile) throw AppError.notFound('MutawifProfile', id);

    const nextStatus = {
      APPROVE: VerificationStatus.APPROVED,
      REJECT: VerificationStatus.REJECTED,
      REQUEST_CHANGES: VerificationStatus.UNDER_REVIEW,
    }[dto.decision];

    const approved = nextStatus === VerificationStatus.APPROVED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.mutawifProfile.update({
        where: { id },
        data: {
          verificationStatus: nextStatus,
          verificationNote: dto.note ?? null,
          verifiedAt: approved ? new Date() : null,
          verifiedById: approved ? adminId : null,
          // A rejected or re-opened application must not stay discoverable.
          availabilityStatus: approved
            ? profile.availabilityStatus
            : AvailabilityStatus.OFFLINE,
        },
      });

      if (approved) {
        await tx.user.update({ where: { id: profile.userId }, data: { role: UserRole.MUTAWIF } });
      }

      return result;
    });

    await this.audit.record({
      actorId: adminId,
      action: `mutawif.${dto.decision.toLowerCase()}`,
      entity: 'MutawifProfile',
      entityId: id,
      metadata: { note: dto.note ?? null },
    });

    if (nextStatus === VerificationStatus.APPROVED) {
      await this.notifications.sendToUser({
        userId: profile.userId,
        templateKey: 'mutawif.verification_approved',
        data: { mutawifId: id },
      });
    } else if (nextStatus === VerificationStatus.REJECTED) {
      await this.notifications.sendToUser({
        userId: profile.userId,
        templateKey: 'mutawif.verification_rejected',
        vars: { note: dto.note ?? '-' },
        data: { mutawifId: id },
      });
    }

    return updated;
  }

  // -- shared helpers used by the booking module ---------------------------

  async requireBookable(mutawifId: string, serviceType: ServiceType) {
    const profile = await this.prisma.mutawifProfile.findUnique({
      where: { id: mutawifId },
      include: { rates: { where: { serviceType, active: true } }, user: true },
    });

    if (!profile) throw AppError.notFound('Mutawif', mutawifId);

    if (profile.verificationStatus !== VerificationStatus.APPROVED || profile.user.status !== 'ACTIVE') {
      throw new AppError(ErrorCode.MUTAWIF_NOT_VERIFIED, 'This mutawif is not available', 409);
    }

    const rate = profile.rates[0];
    if (!rate) {
      throw new AppError(
        ErrorCode.MUTAWIF_UNAVAILABLE,
        'This mutawif does not offer the requested service',
        409,
      );
    }

    return { profile, rate };
  }

  private async requireOwnProfile(userId: string) {
    const profile = await this.prisma.mutawifProfile.findUnique({ where: { userId } });
    if (!profile) throw AppError.notFound('MutawifProfile');
    return profile;
  }
}
