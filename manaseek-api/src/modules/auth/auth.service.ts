import { Injectable, Logger } from '@nestjs/common';
import { UserStatus, type User, type UserRole } from '@prisma/client';
import { AppConfigService } from '@/common/config/config.service';
import { AppError, ErrorCode } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import type { DevLoginDto, GoogleLoginDto } from './dto/auth.dto';
import { GoogleAuthService, type GoogleProfile } from './google-auth.service';
import { TokenService, type SessionContext, type TokenPair } from './token.service';

export interface AuthSession extends TokenPair {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
    role: UserRole;
    isNewUser: boolean;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly google: GoogleAuthService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Google Sign-In is both login and registration: the Google account is the
   * identity, so there is no separate sign-up endpoint.
   */
  async loginWithGoogle(dto: GoogleLoginDto, context: SessionContext): Promise<AuthSession> {
    const profile = await this.google.verifyIdToken(dto.idToken);
    const existing = await this.findByGoogleProfile(profile);

    return this.startSession(existing, context, {
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      emailVerifiedAt: new Date(),
    });
  }

  /**
   * Mints a session from an email address alone. Gated behind AUTH_DEV_LOGIN,
   * which the config validator refuses to accept in production.
   */
  async devLogin(dto: DevLoginDto, context: SessionContext): Promise<AuthSession> {
    if (!this.config.get('AUTH_DEV_LOGIN')) {
      throw AppError.forbidden('Development login is disabled');
    }

    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    this.logger.warn(`Development login used for ${email}`);

    return this.startSession(existing, context, {
      email,
      name: dto.name ?? null,
      // A role is only honoured while creating the account, never as a way to
      // escalate an existing one.
      role: existing ? undefined : dto.role,
      emailVerifiedAt: new Date(),
    });
  }

  async refresh(refreshToken: string, context: SessionContext): Promise<TokenPair> {
    return this.tokens.rotate(refreshToken, context);
  }

  async logout(userId: string, refreshToken: string, ipAddress?: string): Promise<void> {
    await this.tokens.revoke(refreshToken);
    await this.audit.record({
      actorId: userId,
      action: 'auth.logout',
      entity: 'User',
      entityId: userId,
      ipAddress,
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokens.revokeAllForUser(userId);
    await this.audit.record({
      actorId: userId,
      action: 'auth.logout_all',
      entity: 'User',
      entityId: userId,
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatarUrl: true,
        role: true,
        status: true,
        organizationId: true,
        emailVerifiedAt: true,
        createdAt: true,
        mutawifProfile: {
          select: { id: true, verificationStatus: true, availabilityStatus: true },
        },
      },
    });

    if (!user) {
      throw AppError.notFound('User', userId);
    }

    return user;
  }

  /**
   * Matches on the Google subject first, then falls back to the email address
   * so an account seeded or created before its first Google login is adopted
   * rather than duplicated.
   */
  private async findByGoogleProfile(profile: GoogleProfile): Promise<User | null> {
    const byGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (byGoogleId) return byGoogleId;

    return this.prisma.user.findUnique({ where: { email: profile.email } });
  }

  private async startSession(
    existing: User | null,
    context: SessionContext,
    profile: {
      googleId?: string;
      email: string;
      name: string | null;
      avatarUrl?: string | null;
      role?: UserRole;
      emailVerifiedAt: Date;
    },
  ): Promise<AuthSession> {
    if (existing?.status === UserStatus.SUSPENDED) {
      throw new AppError(ErrorCode.ACCOUNT_SUSPENDED, 'This account is suspended', 403);
    }

    const now = new Date();
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            googleId: existing.googleId ?? profile.googleId,
            // Never overwrite details the user has since edited themselves.
            name: existing.name ?? profile.name,
            avatarUrl: existing.avatarUrl ?? profile.avatarUrl ?? null,
            emailVerifiedAt: existing.emailVerifiedAt ?? profile.emailVerifiedAt,
            lastLoginAt: now,
          },
        })
      : await this.prisma.user.create({
          data: {
            googleId: profile.googleId,
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.avatarUrl ?? null,
            role: profile.role,
            emailVerifiedAt: profile.emailVerifiedAt,
            lastLoginAt: now,
            jamaahProfile: { create: {} },
          },
        });

    const tokens = await this.tokens.issue(user, context);

    await this.audit.record({
      actorId: user.id,
      action: existing ? 'auth.login' : 'auth.register',
      entity: 'User',
      entityId: user.id,
      ipAddress: context.ipAddress,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isNewUser: !existing,
      },
    };
  }
}
