import { BookingStatus, UserRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { assertTransition, isTerminal } from './booking.state-machine';

describe('assertTransition', () => {
  it('lets a mutawif walk the happy path', () => {
    expect(assertTransition(BookingStatus.REQUESTED, 'ACCEPT', UserRole.MUTAWIF)).toBe(
      BookingStatus.ACCEPTED,
    );
    expect(assertTransition(BookingStatus.ACCEPTED, 'START', UserRole.MUTAWIF)).toBe(
      BookingStatus.ONGOING,
    );
    expect(assertTransition(BookingStatus.ONGOING, 'COMPLETE', UserRole.MUTAWIF)).toBe(
      BookingStatus.COMPLETED,
    );
  });

  it('rejects an action from the wrong status', () => {
    expect(() => assertTransition(BookingStatus.REQUESTED, 'COMPLETE', UserRole.MUTAWIF)).toThrow(
      /Cannot complete/,
    );
  });

  it('rejects an action from the wrong actor', () => {
    expect(() => assertTransition(BookingStatus.REQUESTED, 'ACCEPT', UserRole.JAMAAH)).toThrow(
      /cannot accept/,
    );
  });

  it('only lets the system expire a booking', () => {
    expect(assertTransition(BookingStatus.REQUESTED, 'EXPIRE', 'SYSTEM')).toBe(
      BookingStatus.EXPIRED,
    );
    expect(() => assertTransition(BookingStatus.REQUESTED, 'EXPIRE', UserRole.ADMIN)).toThrow();
  });

  it('allows cancellation from every active status but no terminal one', () => {
    for (const status of [BookingStatus.REQUESTED, BookingStatus.ACCEPTED, BookingStatus.ONGOING]) {
      expect(assertTransition(status, 'CANCEL', UserRole.JAMAAH)).toBe(BookingStatus.CANCELLED);
    }

    for (const status of [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.EXPIRED]) {
      expect(() => assertTransition(status, 'CANCEL', UserRole.JAMAAH)).toThrow();
    }
  });
});

describe('isTerminal', () => {
  it('classifies statuses', () => {
    expect(isTerminal(BookingStatus.COMPLETED)).toBe(true);
    expect(isTerminal(BookingStatus.EXPIRED)).toBe(true);
    expect(isTerminal(BookingStatus.ONGOING)).toBe(false);
  });
});
