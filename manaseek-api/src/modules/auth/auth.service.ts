import { Injectable } from '@nestjs/common';
import { OtpPurpose, UserStatus, type User } from '@prisma/client';
import { AppError, ErrorCode } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import { normalizePhone } from '@/common/utils/phone.util';
import { AuditService } from '@/modules/audit/audit.service';
import type { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { OtpService, type RequestOtpResult } from './otp.service';
import { TokenService, type SessionContext, type TokenPair } from './token.service';

export interface AuthSession extends TokenPair {
  user: {
    id: string;
    phone: string;
    name: string | null;
    role: User['role'];
    isNewUser: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async requestOtp(dto: RequestOtpDto, ipAddress?: string): Promise<RequestOtpResult> {
    const phone = normalizePhone(dto.phone);

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing?.status === UserStatus.SUSPENDED) {
      throw new AppError(ErrorCode.ACCOUNT_SUSPENDED, 'This account is suspended', 403);
    }

    return this.otp.request(phone, OtpPurpose.LOGIN, ipAddress);
  }

  /**
   * Verifying an OTP both logs in an existing user and registers a new one.
   * There is no separate sign-up endpoint: the phone number is the identity.
   */
  async verifyOtp(dto: VerifyOtpDto, context: SessionContext): Promise<AuthSession> {
    const phone = normalizePhone(dto.phone);

    await this.otp.verify(phone, dto.code, OtpPurpose.LOGIN);

    const existing = await this.prisma.user.findUnique({ where: { phone } });

    if (existing?.status === UserStatus.SUSPENDED) {
      throw new AppError(ErrorCode.ACCOUNT_SUSPENDED, 'This account is suspended', 403);
    }

    const now = new Date();
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            lastLoginAt: now,
            phoneVerifiedAt: existing.phoneVerifiedAt ?? now,
            name: existing.name ?? dto.name ?? null,
          },
        })
      : await this.prisma.user.create({
          data: {
            phone,
            name: dto.name ?? null,
            phoneVerifiedAt: now,
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
        phone: user.phone,
        name: user.name,
        role: user.role,
        isNewUser: !existing,
      },
    };
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
        phone: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        status: true,
        organizationId: true,
        phoneVerifiedAt: true,
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
}
