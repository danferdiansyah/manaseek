import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createPublicKey, type JsonWebKey } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AppConfigService } from '@/common/config/config.service';
import { AppError, ErrorCode } from '@/common/errors/app-error';

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS: [string, ...string[]] = [
  'accounts.google.com',
  'https://accounts.google.com',
];
const KEY_CACHE_TTL_MS = 60 * 60 * 1000;

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

interface GoogleIdTokenClaims {
  sub: string;
  aud: string;
  iss: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
}

/**
 * Verifies Google ID tokens without pulling in google-auth-library: fetch the
 * published JWKS, pick the key the token's `kid` names, and let jsonwebtoken
 * check the signature and the standard claims.
 *
 * The client (web or mobile) runs Google Sign-In, receives an ID token, and
 * posts it here. We never handle a Google secret, so there is nothing to leak.
 */
@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private keyCache: { keys: Map<string, string>; fetchedAt: number } | null = null;

  constructor(private readonly config: AppConfigService) {}

  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    const audiences = this.config.get('GOOGLE_CLIENT_IDS');
    if (audiences.length === 0) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'GOOGLE_CLIENT_IDS is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const publicKey = await this.publicKeyFor(this.keyIdOf(idToken));

    let claims: GoogleIdTokenClaims;
    try {
      claims = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        audience: audiences as [string, ...string[]],
        issuer: GOOGLE_ISSUERS,
      }) as GoogleIdTokenClaims;
    } catch (error) {
      throw new AppError(
        ErrorCode.TOKEN_INVALID,
        `Google ID token rejected: ${(error as Error).message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!claims.email) {
      throw new AppError(
        ErrorCode.TOKEN_INVALID,
        'Google ID token has no email claim; request the email scope',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Google serialises the flag as a boolean or the string "true".
    const emailVerified = claims.email_verified === true || claims.email_verified === 'true';
    if (!emailVerified) {
      throw new AppError(
        ErrorCode.TOKEN_INVALID,
        'This Google account has an unverified email address',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      googleId: claims.sub,
      email: claims.email.toLowerCase(),
      emailVerified,
      name: claims.name ?? null,
      picture: claims.picture ?? null,
    };
  }

  private keyIdOf(idToken: string): string {
    const kid = jwt.decode(idToken, { complete: true })?.header?.kid;

    if (!kid) {
      throw new AppError(
        ErrorCode.TOKEN_INVALID,
        'Google ID token is malformed',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return kid;
  }

  private async publicKeyFor(kid: string): Promise<string> {
    let keys = await this.googleKeys();

    // A key id we have never seen means Google rotated; refetch once.
    if (!keys.has(kid)) {
      this.keyCache = null;
      keys = await this.googleKeys();
    }

    const key = keys.get(kid);
    if (!key) {
      throw new AppError(
        ErrorCode.TOKEN_INVALID,
        'Google ID token was signed with an unknown key',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return key;
  }

  private async googleKeys(): Promise<Map<string, string>> {
    if (this.keyCache && Date.now() - this.keyCache.fetchedAt < KEY_CACHE_TTL_MS) {
      return this.keyCache.keys;
    }

    const jwks = await this.fetchJwks();
    const keys = new Map<string, string>();

    for (const jwk of jwks) {
      if (!jwk.kid) continue;
      try {
        keys.set(
          jwk.kid,
          createPublicKey({ key: jwk as JsonWebKey, format: 'jwk' })
            .export({ type: 'spki', format: 'pem' })
            .toString(),
        );
      } catch (error) {
        this.logger.warn(`Skipped unusable Google key ${jwk.kid}: ${(error as Error).message}`);
      }
    }

    this.keyCache = { keys, fetchedAt: Date.now() };
    return keys;
  }

  /** Seam for tests: overridden to serve a local key set. */
  protected async fetchJwks(): Promise<Array<JsonWebKey & { kid?: string }>> {
    const response = await fetch(GOOGLE_CERTS_URL);

    if (!response.ok) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        `Could not fetch Google signing keys (${response.status})`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const payload = (await response.json()) as { keys: Array<JsonWebKey & { kid?: string }> };
    return payload.keys ?? [];
  }
}
