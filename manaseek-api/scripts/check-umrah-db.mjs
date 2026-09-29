import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { UmrahService } from '../dist/modules/umrah/umrah.service.js';

// Real persistence/concurrency checks only run against a local development DB.
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL).hostname), 'Use a local migrated PostgreSQL database.');
const prisma = new PrismaClient();
const service = new UmrahService(prisma);
const suffix = randomUUID();
const users = [];
let pkg;
try {
  for (const name of ['owner', 'other']) users.push(await prisma.user.create({ data: { email: `${name}-${suffix}@example.test`, name: 'Jamaah Test' } }));
  const seed = await prisma.umrahPackage.findFirstOrThrow();
  pkg = await prisma.umrahPackage.create({ data: {
    slug: `test-${suffix}`, name: 'Integration test', summary: 'Demo', description: 'Test fixture', durationDays: 9,
    departureCity: 'Jakarta', basePrice: 24900000, tripleSupplement: 1200000, doubleSupplement: 2500000, details: seed.details,
  } });
  const departure = await prisma.umrahDeparture.create({ data: { packageId: pkg.id, departureDate: new Date('2099-01-01'), returnDate: new Date('2099-01-09'), availableSeats: 4 } });
  const dto = { requestId: randomUUID(), departureId: departure.id, roomType: 'TRIPLE', contactName: 'Ahmad Demo', contactEmail: 'demo@example.com', contactPhone: '081234567890', travelers: [{ fullName: 'Ahmad Demo', gender: 'MALE', birthDate: '1990-01-01' }, { fullName: 'Siti Demo', gender: 'FEMALE', birthDate: '1992-02-02' }], acceptDemo: true };
  const order = await service.createOrder(users[0].id, dto);
  assert.equal(order.totalAmount.toString(), '52200000');
  assert.equal(order.payment.amount.toString(), '52200000');
  assert.equal(order.payment.status, 'SUCCESS');
  assert.equal(order.payment.method, 'DUMMY');
  assert.equal(order.status, 'CONFIRMED');
  assert.equal(order.travelers.length, 2);
  assert.equal('requestHash' in order, false);
  assert.equal((await service.createOrder(users[0].id, dto)).id, order.id);
  assert.equal((await prisma.umrahDeparture.findUniqueOrThrow({ where: { id: departure.id } })).availableSeats, 2);
  await assert.rejects(service.createOrder(users[0].id, { ...dto, roomType: 'DOUBLE' }), error => error.getStatus() === 409);
  await assert.rejects(service.getOrder(users[1].id, order.id), error => error.getStatus() === 404);
  assert.equal((await service.listOrders(users[1].id, { page: 1, limit: 10 })).meta.total, 0);
  const reconnected = new PrismaClient();
  try { assert.equal((await reconnected.umrahOrder.findUniqueOrThrow({ where: { id: order.id }, include: { payment: true } })).payment.reference, order.payment.reference); } finally { await reconnected.$disconnect(); }
  await prisma.umrahPackage.update({ where: { id: pkg.id }, data: { name: 'Changed after purchase', basePrice: 999 } });
  assert.equal((await service.getOrder(users[0].id, order.id)).packageSnapshot.name, 'Integration test');
  assert.equal((await service.getOrder(users[0].id, order.id)).unitPrice.toString(), '26100000');
  console.log('PASS persisted payment, server pricing, ownership, immutable snapshot and idempotent replay');

  // Two identical requests race for the final seat: only one order/payment.
  await prisma.umrahDeparture.update({ where: { id: departure.id }, data: { availableSeats: 1 } });
  const one = { ...dto, requestId: randomUUID(), travelers: [dto.travelers[0]] };
  const replayed = await Promise.all([service.createOrder(users[0].id, one), service.createOrder(users[0].id, one)]);
  assert.equal(replayed[0].id, replayed[1].id);
  assert.equal(await prisma.umrahPayment.count({ where: { orderId: replayed[0].id } }), 1);
  assert.equal((await prisma.umrahDeparture.findUniqueOrThrow({ where: { id: departure.id } })).availableSeats, 0);

  // Two different purchases race for one seat: one must fail, never oversell.
  await prisma.umrahDeparture.update({ where: { id: departure.id }, data: { availableSeats: 1 } });
  const raced = await Promise.allSettled(users.map((user) => service.createOrder(user.id, { ...one, requestId: randomUUID() })));
  assert.equal(raced.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(raced.filter((result) => result.status === 'rejected').length, 1);
  assert.equal((await prisma.umrahDeparture.findUniqueOrThrow({ where: { id: departure.id } })).availableSeats, 0);
  console.log('PASS duplicate request races and last-seat concurrency');

  // Force an order constraint failure after the seat update to prove rollback.
  await prisma.umrahDeparture.update({ where: { id: departure.id }, data: { availableSeats: 1 } });
  await prisma.umrahPackage.update({ where: { id: pkg.id }, data: { basePrice: -1 } });
  const before = await prisma.umrahOrder.count({ where: { departureId: departure.id } });
  await assert.rejects(service.createOrder(users[0].id, { ...one, roomType: 'QUAD', requestId: randomUUID() }));
  assert.equal((await prisma.umrahDeparture.findUniqueOrThrow({ where: { id: departure.id } })).availableSeats, 1);
  assert.equal(await prisma.umrahOrder.count({ where: { departureId: departure.id } }), before);
  await prisma.umrahPackage.update({ where: { id: pkg.id }, data: { basePrice: 24900000, isDemo: false } });
  await assert.rejects(service.createOrder(users[0].id, { ...one, requestId: randomUUID() }), error => error.getStatus() === 403);
  await prisma.umrahPackage.update({ where: { id: pkg.id }, data: { isDemo: true, active: false } });
  await assert.rejects(service.createOrder(users[0].id, { ...one, requestId: randomUUID() }), error => error.getStatus() === 404);
  await prisma.umrahPackage.update({ where: { id: pkg.id }, data: { active: true } });
  await prisma.umrahDeparture.update({ where: { id: departure.id }, data: { departureDate: new Date('2000-01-01') } });
  await assert.rejects(service.createOrder(users[0].id, { ...one, requestId: randomUUID() }), error => error.getStatus() === 409);
  console.log('PASS atomic rollback and expired, inactive or non-demo package rejection');
} finally {
  await prisma.umrahOrder.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
  if (pkg) {
    await prisma.umrahDeparture.deleteMany({ where: { packageId: pkg.id } });
    await prisma.umrahPackage.delete({ where: { id: pkg.id } });
  }
  await prisma.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
  await prisma.$disconnect();
}
