import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/** SHA-256 hex digest. Used for OTP codes and refresh tokens at rest. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** Cryptographically random numeric OTP code. */
export function generateOtpCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

export function generateOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

/** Short human-friendly reference, e.g. MSK-7F3K9Q. Collision-checked by caller. */
export function generateReferenceCode(prefix = 'MSK'): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[randomInt(0, alphabet.length)];
  }
  return `${prefix}-${suffix}`;
}
