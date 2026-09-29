import { Injectable } from '@nestjs/common';
import { Prisma, UmrahRoomType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { paginate, toSkipTake, type PaginationDto } from '@/common/dto/pagination.dto';
import { AppError, ErrorCode } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import { sha256 } from '@/common/utils/crypto.util';
import type { CreateUmrahOrderDto } from './dto/umrah.dto';

const orderInclude = {
  payment: true,
  travelers: { orderBy: { position: 'asc' as const } },
} satisfies Prisma.UmrahOrderInclude;

export function roomSupplement(pkg: { tripleSupplement: Prisma.Decimal; doubleSupplement: Prisma.Decimal }, room: UmrahRoomType) {
  return room === UmrahRoomType.DOUBLE ? pkg.doubleSupplement
    : room === UmrahRoomType.TRIPLE ? pkg.tripleSupplement : new Prisma.Decimal(0);
}

// Serialize only public order fields; internal idempotency hashes stay private.
function publicOrder<T extends { requestId: string; requestHash: string; userId: string }>(order: T) {
  const { requestId: _requestId, requestHash: _requestHash, userId: _userId, ...result } = order;
  return result;
}

@Injectable()
export class UmrahService {
  constructor(private readonly prisma: PrismaService) {}

  async listPackages() {
    const items = await this.prisma.umrahPackage.findMany({
      where: { active: true, isDemo: true },
      orderBy: [{ basePrice: 'asc' }, { id: 'asc' }],
      include: { departures: { where: { departureDate: { gt: new Date() } }, orderBy: { departureDate: 'asc' } } },
    });
    return { items };
  }

  async getPackage(slug: string) {
    const pkg = await this.prisma.umrahPackage.findFirst({
      where: { slug, active: true, isDemo: true },
      include: { departures: { where: { departureDate: { gt: new Date() } }, orderBy: { departureDate: 'asc' } } },
    });
    if (!pkg) throw AppError.notFound('Paket umroh');
    return pkg;
  }

  async listOrders(userId: string, query: PaginationDto) {
    const where = { userId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.umrahOrder.findMany({
        where, ...toSkipTake(query), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { payment: true },
      }),
      this.prisma.umrahOrder.count({ where }),
    ]);
    return paginate(items.map(publicOrder), total, query);
  }

  async getOrder(userId: string, id: string) {
    const order = await this.prisma.umrahOrder.findFirst({ where: { id, userId }, include: orderInclude });
    if (!order) throw AppError.notFound('Pesanan umroh');
    return publicOrder(order);
  }

  async createOrder(userId: string, dto: CreateUmrahOrderDto) {
    const requestHash = sha256(JSON.stringify(dto));
    const uniqueRequest = { userId_requestId: { userId, requestId: dto.requestId } };
    const existing = await this.prisma.umrahOrder.findUnique({ where: uniqueRequest, include: orderInclude });
    if (existing) return this.replay(existing, requestHash);

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const departure = await tx.umrahDeparture.findUnique({
          where: { id: dto.departureId }, include: { package: true },
        });
        if (!departure || !departure.package.active) throw AppError.notFound('Keberangkatan umroh');
        if (!departure.package.isDemo) throw AppError.forbidden('Pembayaran dummy hanya tersedia untuk paket demo.');
        if (departure.departureDate <= new Date()) {
          throw AppError.conflict(ErrorCode.CONFLICT, 'Tanggal keberangkatan sudah lewat. Pilih jadwal lain.');
        }

        const travelerCount = dto.travelers.length;
        const reserved = await tx.umrahDeparture.updateMany({
          where: { id: departure.id, availableSeats: { gte: travelerCount } },
          data: { availableSeats: { decrement: travelerCount } },
        });
        if (reserved.count !== 1) {
          throw AppError.conflict(ErrorCode.CONFLICT, 'Kursi tidak mencukupi. Pilih jadwal atau jumlah jamaah lain.');
        }

        const pkg = departure.package;
        const supplement = roomSupplement(pkg, dto.roomType);
        const unitPrice = pkg.basePrice.add(supplement);
        const totalAmount = unitPrice.mul(travelerCount);
        // The server owns all prices and success flags. No external payment,
        // airline or hotel is contacted; this is explicitly a demo purchase.
        return tx.umrahOrder.create({
          data: {
            code: `UMR-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`,
            userId, departureId: departure.id, requestId: dto.requestId, requestHash,
            roomType: dto.roomType, travelerCount,
            contactName: dto.contactName, contactEmail: dto.contactEmail, contactPhone: dto.contactPhone,
            unitPrice, totalAmount, currency: pkg.currency,
            packageSnapshot: {
              id: pkg.id, slug: pkg.slug, name: pkg.name, durationDays: pkg.durationDays,
              departureCity: pkg.departureCity, details: pkg.details,
              departureDate: departure.departureDate.toISOString(), returnDate: departure.returnDate.toISOString(),
              basePrice: pkg.basePrice.toFixed(2), roomSupplement: supplement.toFixed(2),
            } as Prisma.InputJsonObject,
            travelers: { create: dto.travelers.map((traveler, position) => ({
              ...traveler, birthDate: new Date(traveler.birthDate), position,
            })) },
            payment: { create: { reference: `DEMO-${randomUUID()}`, amount: totalAmount, currency: pkg.currency } },
          },
          include: orderInclude,
        });
      });
      return publicOrder(order);
    } catch (error) {
      // A concurrent duplicate can hit either the unique request constraint or
      // the final-seat check. Read the winner only after our transaction rolls back.
      const winner = await this.prisma.umrahOrder.findUnique({ where: uniqueRequest, include: orderInclude });
      if (winner) return this.replay(winner, requestHash);
      throw error;
    }
  }

  private replay<T extends { requestId: string; requestHash: string; userId: string }>(order: T, requestHash: string) {
    if (order.requestHash !== requestHash) {
      throw AppError.conflict(ErrorCode.CONFLICT, 'Permintaan ini sudah digunakan untuk pesanan berbeda. Mulai pemesanan baru.');
    }
    return publicOrder(order);
  }
}
