import { describe, expect, it } from 'vitest';
import { Prisma, UmrahRoomType } from '@prisma/client';
import { createUmrahOrderSchema } from './dto/umrah.dto';
import { roomSupplement } from './umrah.service';

const valid = {
  requestId: '7761c5e8-87ad-4f45-8206-65d237819552',
  departureId: '7761c5e8-87ad-4f45-8206-65d237819553',
  roomType: 'QUAD', contactName: 'Jamaah Demo', contactEmail: 'demo@example.com', contactPhone: '081234567890',
  travelers: [{ fullName: 'Jamaah Demo', gender: 'MALE', birthDate: '1990-01-01' }],
  acceptDemo: true,
};

describe('umrah checkout contract', () => {
  it('accepts one to six travelers, trims names and validates international phone numbers', () => {
    expect(createUmrahOrderSchema.parse({ ...valid, contactName: ' Jamaah Demo ', contactPhone: '+6281234567890' }).contactName).toBe('Jamaah Demo');
    expect(createUmrahOrderSchema.safeParse({ ...valid, travelers: Array(6).fill(valid.travelers[0]) }).success).toBe(true);
  });
  it.each([
    { travelers: [] }, { travelers: Array(7).fill(valid.travelers[0]) }, { acceptDemo: false },
    { requestId: 'bad-id' }, { roomType: 'FREE' }, { contactEmail: 'invalid' },
    { contactPhone: 'abc' }, { contactName: ' ' }, { totalAmount: 1 }, { paymentStatus: 'SUCCESS' },
    { travelers: [{ ...valid.travelers[0], birthDate: '2026-02-30' }] },
    { travelers: [{ ...valid.travelers[0], birthDate: '2999-01-01' }] },
    { travelers: [{ ...valid.travelers[0], gender: 'invalid' }] },
  ])('rejects invalid or client-controlled payment fields: %j', (patch) => {
    expect(createUmrahOrderSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
  it.each([[UmrahRoomType.QUAD, '0'], [UmrahRoomType.TRIPLE, '1200000'], [UmrahRoomType.DOUBLE, '2500000']])('prices %s rooms on the server', (room, expected) => {
    expect(roomSupplement({ tripleSupplement: new Prisma.Decimal(1200000), doubleSupplement: new Prisma.Decimal(2500000) }, room).toString()).toBe(expected);
  });
});
