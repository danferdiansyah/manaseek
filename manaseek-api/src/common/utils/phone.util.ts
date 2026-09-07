import { HttpStatus } from '@nestjs/common';
import { AppError, ErrorCode } from '../errors/app-error';

/**
 * Normalises Indonesian and Saudi phone input to E.164.
 * Accepts: 08123456789, 8123456789, +628123456789, 628123456789, 0966..., +966...
 * Defaults to the Indonesian country code when none is present.
 */
export function normalizePhone(input: string, defaultCountryCode = '62'): string {
  const digits = input.replace(/[^\d+]/g, '');

  let normalized = digits.startsWith('+') ? digits.slice(1) : digits;

  if (normalized.startsWith('0')) {
    normalized = defaultCountryCode + normalized.slice(1);
  } else if (!normalized.startsWith(defaultCountryCode) && !normalized.startsWith('966')) {
    // Bare subscriber number such as 8123456789
    normalized = defaultCountryCode + normalized;
  }

  if (!/^\d{9,15}$/.test(normalized)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Phone number format is invalid',
      HttpStatus.BAD_REQUEST,
    );
  }

  return `+${normalized}`;
}

/** +6281234567890 -> +6281****7890 for logs and audit trails. */
export function maskPhone(phone: string): string {
  if (phone.length <= 8) return phone;
  return `${phone.slice(0, 5)}****${phone.slice(-4)}`;
}
