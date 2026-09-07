import { generateKeyPairSync, type JsonWebKey } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AppConfigService } from '@/common/config/config.service';
import { GoogleAuthService } from './google-auth.service';

const KID = 'test-key-1';
const CLIENT_ID = '1234567890-web.apps.googleusercontent.com';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256' };

/** Serves the locally generated key instead of Google's published JWKS. */
class TestableGoogleAuthService extends GoogleAuthService {
  fetchCount = 0;

  protected override async fetchJwks(): Promise<Array<JsonWebKey & { kid?: string }>> {
    this.fetchCount += 1;
    return [jwk as JsonWebKey & { kid?: string }];
  }
}

const config = {
  get: (key: string) => (key === 'GOOGLE_CLIENT_IDS' ? [CLIENT_ID] : undefined),
} as unknown as AppConfigService;

const sign = (claims: Record<string, unknown>, options: jwt.SignOptions = {}): string =>
  jwt.sign(claims, privateKey, { algorithm: 'RS256', keyid: KID, expiresIn: '5m', ...options });

const validClaims = {
  sub: '117204028374650192837',
  aud: CLIENT_ID,
  iss: 'https://accounts.google.com',
  email: 'Ahmad@Example.com',
  email_verified: true,
  name: 'Ahmad Fauzi',
  picture: 'https://lh3.googleusercontent.com/a/photo',
};

describe('GoogleAuthService.verifyIdToken', () => {
  let service: TestableGoogleAuthService;

  beforeEach(() => {
    service = new TestableGoogleAuthService(config);
  });

  it('accepts a well-formed token and normalises the email', async () => {
    const profile = await service.verifyIdToken(sign(validClaims));

    expect(profile).toEqual({
      googleId: validClaims.sub,
      email: 'ahmad@example.com',
      emailVerified: true,
      name: 'Ahmad Fauzi',
      picture: validClaims.picture,
    });
  });

  it('accepts email_verified sent as the string "true"', async () => {
    const profile = await service.verifyIdToken(sign({ ...validClaims, email_verified: 'true' }));
    expect(profile.emailVerified).toBe(true);
  });

  it('rejects a token minted for another client id', async () => {
    await expect(
      service.verifyIdToken(sign({ ...validClaims, aud: 'someone-else.apps.googleusercontent.com' })),
    ).rejects.toThrow(/rejected/);
  });

  it('rejects a token from the wrong issuer', async () => {
    await expect(
      service.verifyIdToken(sign({ ...validClaims, iss: 'https://evil.example.com' })),
    ).rejects.toThrow(/rejected/);
  });

  it('rejects an expired token', async () => {
    await expect(
      service.verifyIdToken(sign(validClaims, { expiresIn: '-1m' })),
    ).rejects.toThrow(/rejected/);
  });

  it('rejects a token signed by a different key', async () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const forged = jwt.sign(validClaims, other.privateKey, {
      algorithm: 'RS256',
      keyid: KID,
      expiresIn: '5m',
    });

    await expect(service.verifyIdToken(forged)).rejects.toThrow(/rejected/);
  });

  it('rejects an unverified Google email', async () => {
    await expect(
      service.verifyIdToken(sign({ ...validClaims, email_verified: false })),
    ).rejects.toThrow(/unverified/);
  });

  it('rejects a token with no email claim', async () => {
    const { email: _email, ...withoutEmail } = validClaims;
    await expect(service.verifyIdToken(sign(withoutEmail))).rejects.toThrow(/no email claim/);
  });

  it('rejects a malformed token', async () => {
    await expect(service.verifyIdToken('not-a-jwt')).rejects.toThrow(/malformed/);
  });

  it('caches the key set across calls', async () => {
    await service.verifyIdToken(sign(validClaims));
    await service.verifyIdToken(sign(validClaims));

    expect(service.fetchCount).toBe(1);
  });

  it('refetches once when the key id is unknown, then gives up', async () => {
    const unknownKid = jwt.sign(validClaims, privateKey, {
      algorithm: 'RS256',
      keyid: 'rotated-key',
      expiresIn: '5m',
    });

    await expect(service.verifyIdToken(unknownKid)).rejects.toThrow(/unknown key/);
    expect(service.fetchCount).toBe(2);
  });
});
