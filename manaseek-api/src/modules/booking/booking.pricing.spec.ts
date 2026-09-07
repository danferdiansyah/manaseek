import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { overlaps, quote } from './booking.pricing';

describe('quote', () => {
  it('multiplies the hourly rate by the duration', () => {
    const result = quote(new Prisma.Decimal('350000'), 3);
    expect(result.totalAmount.toString()).toBe('1050000');
    expect(result.currency).toBe('IDR');
  });

  it('keeps decimal precision instead of using floats', () => {
    const result = quote(new Prisma.Decimal('333333.33'), 3);
    expect(result.totalAmount.toString()).toBe('999999.99');
  });
});

describe('overlaps', () => {
  const at = (hour: number) => new Date(Date.UTC(2026, 0, 1, hour));

  it('detects an overlapping window', () => {
    expect(overlaps(at(8), 3, at(10), 2)).toBe(true);
  });

  it('treats back-to-back bookings as free of conflict', () => {
    expect(overlaps(at(8), 2, at(10), 2)).toBe(false);
  });

  it('detects full containment', () => {
    expect(overlaps(at(8), 6, at(10), 1)).toBe(true);
  });

  it('ignores windows on different days', () => {
    expect(overlaps(at(8), 2, new Date(Date.UTC(2026, 0, 2, 8)), 2)).toBe(false);
  });
});
