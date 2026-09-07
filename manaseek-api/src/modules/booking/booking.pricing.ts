import { Prisma } from '@prisma/client';

export interface Quote {
  hourlyRate: Prisma.Decimal;
  durationHours: number;
  totalAmount: Prisma.Decimal;
  currency: string;
}

/**
 * Pricing is deliberately simple for the MVP: hourly rate times duration, with
 * no surge, platform fee or discount. The quote is snapshotted onto the booking
 * so a later rate change never rewrites an existing agreement.
 */
export function quote(
  hourlyRate: Prisma.Decimal,
  durationHours: number,
  currency = 'IDR',
): Quote {
  return {
    hourlyRate,
    durationHours,
    totalAmount: hourlyRate.mul(durationHours),
    currency,
  };
}

/** Two bookings clash when their [start, end) windows overlap. */
export function overlaps(
  aStart: Date,
  aDurationHours: number,
  bStart: Date,
  bDurationHours: number,
): boolean {
  const aEnd = aStart.getTime() + aDurationHours * 3_600_000;
  const bEnd = bStart.getTime() + bDurationHours * 3_600_000;

  return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
}
