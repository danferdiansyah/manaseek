import { Injectable } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { AppError } from '@/common/errors/app-error';
import { paginate, toSkipTake, type Paginated } from '@/common/dto/pagination.dto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { TokenService } from '@/modules/auth/token.service';
import type {
  CreateDocumentDto,
  CreateTripDto,
  ListUsersDto,
  UpdateAccountDto,
  UpdateDocumentDto,
  UpdateProfileDto,
  UpdateTripDto,
  UpdateUserStatusDto,
} from './dto/users.dto';

/** Dates arrive as YYYY-MM-DD and are stored as calendar dates, not instants. */
const toDate = (value?: string): Date | undefined => (value ? new Date(`${value}T00:00:00Z`) : undefined);

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tokens: TokenService,
  ) {}

  // -- account ------------------------------------------------------------

  async updateAccount(userId: string, dto: UpdateAccountDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, phone: true, name: true, email: true, avatarUrl: true, role: true },
    });
  }

  // -- jamaah profile -----------------------------------------------------

  async getProfile(userId: string) {
    const profile = await this.prisma.jamaahProfile.findUnique({ where: { userId } });

    // Profiles are created alongside the user, but a user promoted from an
    // import or created before this module existed may not have one yet.
    return profile ?? this.prisma.jamaahProfile.create({ data: { userId } });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data = { ...dto, birthDate: toDate(dto.birthDate) };

    return this.prisma.jamaahProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  // -- travel documents ---------------------------------------------------

  listDocuments(userId: string) {
    return this.prisma.travelDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createDocument(userId: string, dto: CreateDocumentDto) {
    return this.prisma.travelDocument.create({
      data: {
        userId,
        type: dto.type,
        number: dto.number,
        fileUrl: dto.fileUrl,
        issuedAt: toDate(dto.issuedAt),
        expiresAt: toDate(dto.expiresAt),
      },
    });
  }

  async updateDocument(userId: string, id: string, dto: UpdateDocumentDto) {
    await this.assertDocumentOwner(userId, id);

    return this.prisma.travelDocument.update({
      where: { id },
      data: {
        ...dto,
        issuedAt: toDate(dto.issuedAt),
        expiresAt: toDate(dto.expiresAt),
      },
    });
  }

  async deleteDocument(userId: string, id: string): Promise<void> {
    await this.assertDocumentOwner(userId, id);
    await this.prisma.travelDocument.delete({ where: { id } });
  }

  // -- trips --------------------------------------------------------------

  listTrips(userId: string) {
    return this.prisma.trip.findMany({
      where: { userId },
      orderBy: { departureDate: 'desc' },
    });
  }

  createTrip(userId: string, dto: CreateTripDto) {
    return this.prisma.trip.create({
      data: {
        userId,
        type: dto.type,
        packageName: dto.packageName,
        agencyName: dto.agencyName,
        groupCode: dto.groupCode,
        departureDate: toDate(dto.departureDate)!,
        returnDate: toDate(dto.returnDate),
      },
    });
  }

  async updateTrip(userId: string, id: string, dto: UpdateTripDto) {
    const trip = await this.prisma.trip.findUnique({ where: { id }, select: { userId: true } });
    if (!trip) throw AppError.notFound('Trip', id);
    if (trip.userId !== userId) throw AppError.forbidden();

    return this.prisma.trip.update({
      where: { id },
      data: {
        ...dto,
        departureDate: toDate(dto.departureDate),
        returnDate: toDate(dto.returnDate),
      },
    });
  }

  async deleteTrip(userId: string, id: string): Promise<void> {
    const trip = await this.prisma.trip.findUnique({ where: { id }, select: { userId: true } });
    if (!trip) throw AppError.notFound('Trip', id);
    if (trip.userId !== userId) throw AppError.forbidden();

    await this.prisma.trip.delete({ where: { id } });
  }

  // -- admin --------------------------------------------------------------

  async list(dto: ListUsersDto): Promise<Paginated<unknown>> {
    const where: Prisma.UserWhereInput = {
      role: dto.role,
      status: dto.status,
      ...(dto.search
        ? {
            OR: [
              { name: { contains: dto.search, mode: 'insensitive' } },
              { phone: { contains: dto.search } },
              { email: { contains: dto.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const { skip, take } = toSkipTake(dto);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(items, total, dto);
  }

  async updateStatus(actorId: string, userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
      select: { id: true, phone: true, status: true },
    });

    // A suspended user must lose access immediately, not at token expiry.
    if (dto.status === UserStatus.SUSPENDED) {
      await this.tokens.revokeAllForUser(userId);
    }

    await this.audit.record({
      actorId,
      action: 'user.status_changed',
      entity: 'User',
      entityId: userId,
      metadata: { status: dto.status, reason: dto.reason ?? null },
    });

    return user;
  }

  private async assertDocumentOwner(userId: string, id: string): Promise<void> {
    const document = await this.prisma.travelDocument.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!document) throw AppError.notFound('TravelDocument', id);
    if (document.userId !== userId) throw AppError.forbidden();
  }
}
