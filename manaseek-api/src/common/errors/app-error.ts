import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Machine-readable error codes. The mobile client and Engineer B's modules
 * branch on these, never on the human-readable message.
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_TOO_MANY_ATTEMPTS: 'OTP_TOO_MANY_ATTEMPTS',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  MUTAWIF_NOT_VERIFIED: 'MUTAWIF_NOT_VERIFIED',
  MUTAWIF_UNAVAILABLE: 'MUTAWIF_UNAVAILABLE',
  BOOKING_INVALID_TRANSITION: 'BOOKING_INVALID_TRANSITION',
  BOOKING_SLOT_TAKEN: 'BOOKING_SLOT_TAKEN',
  REVIEW_ALREADY_EXISTS: 'REVIEW_ALREADY_EXISTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends HttpException {
  constructor(
    readonly code: ErrorCodeValue,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }

  static notFound(entity: string, id?: string): AppError {
    return new AppError(
      ErrorCode.NOT_FOUND,
      id ? `${entity} ${id} not found` : `${entity} not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  static forbidden(message = 'You are not allowed to perform this action'): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
  }

  static conflict(code: ErrorCodeValue, message: string, details?: unknown): AppError {
    return new AppError(code, message, HttpStatus.CONFLICT, details);
  }
}
