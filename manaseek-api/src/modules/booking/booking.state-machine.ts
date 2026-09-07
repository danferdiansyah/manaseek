import { BookingStatus, UserRole } from '@prisma/client';
import { AppError, ErrorCode } from '@/common/errors/app-error';

export type BookingAction =
  | 'ACCEPT'
  | 'REJECT'
  | 'START'
  | 'COMPLETE'
  | 'CANCEL'
  | 'EXPIRE';

export type Actor = UserRole | 'SYSTEM';

interface Transition {
  from: BookingStatus[];
  to: BookingStatus;
  /** Roles allowed to trigger the action. */
  actors: Actor[];
}

/**
 * The single source of truth for the booking lifecycle.
 *
 *   REQUESTED --accept--> ACCEPTED --start--> ONGOING --complete--> COMPLETED
 *       |                     |                  |
 *       |--reject--> REJECTED |--cancel--> CANCELLED <--cancel-----|
 *       |--expire--> EXPIRED
 *       |--cancel--> CANCELLED
 */
export const TRANSITIONS: Record<BookingAction, Transition> = {
  ACCEPT: {
    from: [BookingStatus.REQUESTED],
    to: BookingStatus.ACCEPTED,
    actors: [UserRole.MUTAWIF],
  },
  REJECT: {
    from: [BookingStatus.REQUESTED],
    to: BookingStatus.REJECTED,
    actors: [UserRole.MUTAWIF],
  },
  START: {
    from: [BookingStatus.ACCEPTED],
    to: BookingStatus.ONGOING,
    actors: [UserRole.MUTAWIF],
  },
  COMPLETE: {
    from: [BookingStatus.ONGOING],
    to: BookingStatus.COMPLETED,
    actors: [UserRole.MUTAWIF],
  },
  CANCEL: {
    from: [BookingStatus.REQUESTED, BookingStatus.ACCEPTED, BookingStatus.ONGOING],
    to: BookingStatus.CANCELLED,
    actors: [UserRole.JAMAAH, UserRole.MUTAWIF, UserRole.ADMIN],
  },
  EXPIRE: {
    from: [BookingStatus.REQUESTED],
    to: BookingStatus.EXPIRED,
    actors: ['SYSTEM'],
  },
};

export const TERMINAL_STATUSES: BookingStatus[] = [
  BookingStatus.REJECTED,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.EXPIRED,
];

/** Statuses that hold a mutawif's calendar slot. */
export const BLOCKING_STATUSES: BookingStatus[] = [
  BookingStatus.ACCEPTED,
  BookingStatus.ONGOING,
];

export function isTerminal(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Throws unless `action` is legal from `current` for `actor`.
 * Returns the resulting status.
 */
export function assertTransition(
  current: BookingStatus,
  action: BookingAction,
  actor: Actor,
): BookingStatus {
  const transition = TRANSITIONS[action];

  if (!transition.actors.includes(actor)) {
    throw AppError.forbidden(`${actor} cannot ${action.toLowerCase()} a booking`);
  }

  if (!transition.from.includes(current)) {
    throw new AppError(
      ErrorCode.BOOKING_INVALID_TRANSITION,
      `Cannot ${action.toLowerCase()} a booking in status ${current}`,
      409,
      { current, allowedFrom: transition.from },
    );
  }

  return transition.to;
}
