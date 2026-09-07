import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { AppConfigService } from '@/common/config/config.service';
import { AppError, ErrorCode } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { AccessTokenPayload } from '@/common/types/authenticated-user';
import { generateOpaqueToken, sha256 } from '@/common/utils/crypto.util';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface SessionContext {
  userAgent?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async issue(user: User, context: SessionContext = {}): Promise<TokenPair> {
    const payload: AccessTokenPayload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.createRefreshToken(user.id, context);

    return { accessToken, refreshToken, expiresIn: this.config.get('JWT_ACCESS_TTL') };
  }

  /**
   * Rotates a refresh token. Presenting a token that was already rotated or
   * revoked means the token leaked, so every session for that user is killed.
   */
  async rotate(rawToken: string, context: SessionContext = {}): Promise<TokenPair> {
    const tokenHash = sha256(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new AppError(ErrorCode.TOKEN_INVALID, 'Refresh token is invalid', 401);
    }

    if (stored.revokedAt || stored.replacedById) {
      await this.revokeAllForUser(stored.userId);
      throw new AppError(
        ErrorCode.TOKEN_INVALID,
        'Refresh token was already used; all sessions have been revoked',
        401,
      );
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new AppError(ErrorCode.TOKEN_INVALID, 'Refresh token has expired', 401);
    }

    if (stored.user.status === 'SUSPENDED') {
      throw new AppError(ErrorCode.ACCOUNT_SUSPENDED, 'This account is suspended', 403);
    }

    const refreshToken = await this.createRefreshToken(stored.userId, context);
    const replacement = await this.prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: sha256(refreshToken) },
      select: { id: true },
    });

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedById: replacement.id },
    });

    const payload: AccessTokenPayload = {
      sub: stored.user.id,
      phone: stored.user.phone,
      role: stored.user.role,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      refreshToken,
      expiresIn: this.config.get('JWT_ACCESS_TTL'),
    };
  }

  async revoke(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async createRefreshToken(userId: string, context: SessionContext): Promise<string> {
    const rawToken = generateOpaqueToken();
    const ttlDays = this.config.get('JWT_REFRESH_TTL_DAYS');

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(rawToken),
        expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
        userAgent: context.userAgent?.slice(0, 255) ?? null,
        ipAddress: context.ipAddress ?? null,
      },
    });

    return rawToken;
  }
}
