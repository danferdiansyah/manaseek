import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { OtpPurpose } from '@prisma/client';
import { AppConfigService } from '@/common/config/config.service';
import { AppError, ErrorCode } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { generateOtpCode, safeCompare, sha256 } from '@/common/utils/crypto.util';
import { maskPhone } from '@/common/utils/phone.util';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { renderTemplate } from '@/modules/notifications/templates';

const HOURLY_LIMIT_PER_PHONE = 5;
const HOURLY_LIMIT_PER_IP = 20;
const ONE_HOUR_SECONDS = 3600;

export interface RequestOtpResult {
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
  /** Only populated in development so the client can auto-fill during testing. */
  devCode?: string;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async request(
    phone: string,
    purpose: OtpPurpose,
    ipAddress?: string,
  ): Promise<RequestOtpResult> {
    await this.enforceRateLimits(phone, ipAddress);

    const ttlSeconds = this.config.get('OTP_TTL_SECONDS');
    const code = generateOtpCode();

    // Invalidate any code still outstanding for this phone and purpose.
    await this.prisma.otpRequest.updateMany({
      where: { phone, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    });

    await this.prisma.otpRequest.create({
      data: {
        phone,
        purpose,
        codeHash: sha256(code),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        ipAddress: ipAddress ?? null,
      },
    });

    const message = renderTemplate('auth.otp', {
      code,
      minutes: String(Math.round(ttlSeconds / 60)),
    });

    await this.notifications.sendSms(phone, message.body, 'auth.otp');
    this.logger.log(`OTP issued for ${maskPhone(phone)} (${purpose})`);

    return {
      expiresInSeconds: ttlSeconds,
      resendAvailableInSeconds: this.config.get('OTP_RESEND_COOLDOWN_SECONDS'),
      devCode: this.config.isDevelopment ? code : undefined,
    };
  }

  /** Consumes the OTP. Throws on any failure; returns nothing on success. */
  async verify(phone: string, code: string, purpose: OtpPurpose): Promise<void> {
    const bypassCode = this.config.get('OTP_DEV_BYPASS_CODE');
    if (bypassCode && !this.config.isProduction && safeCompare(code, bypassCode)) {
      this.logger.warn(`OTP bypass code used for ${maskPhone(phone)}`);
      return;
    }

    const request = await this.prisma.otpRequest.findFirst({
      where: { phone, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!request) {
      throw new AppError(ErrorCode.OTP_INVALID, 'No active verification code for this number', HttpStatus.BAD_REQUEST);
    }

    if (request.expiresAt.getTime() <= Date.now()) {
      throw new AppError(ErrorCode.OTP_EXPIRED, 'Verification code has expired', HttpStatus.BAD_REQUEST);
    }

    const maxAttempts = this.config.get('OTP_MAX_ATTEMPTS');
    if (request.attempts >= maxAttempts) {
      throw new AppError(
        ErrorCode.OTP_TOO_MANY_ATTEMPTS,
        'Too many incorrect attempts. Request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!safeCompare(sha256(code), request.codeHash)) {
      await this.prisma.otpRequest.update({
        where: { id: request.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError(ErrorCode.OTP_INVALID, 'Verification code is incorrect', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.otpRequest.update({
      where: { id: request.id },
      data: { consumedAt: new Date() },
    });
  }

  private async enforceRateLimits(phone: string, ipAddress?: string): Promise<void> {
    const cooldownSeconds = this.config.get('OTP_RESEND_COOLDOWN_SECONDS');
    const cooldownKey = `otp:cooldown:${phone}`;

    const remaining = await this.redis.ttl(cooldownKey);
    if (remaining > 0) {
      throw new AppError(
        ErrorCode.RATE_LIMITED,
        `Please wait ${remaining} seconds before requesting another code`,
        HttpStatus.TOO_MANY_REQUESTS,
        { retryAfterSeconds: remaining },
      );
    }

    const phoneCount = await this.redis.incrementWithTtl(`otp:hour:${phone}`, ONE_HOUR_SECONDS);
    if (phoneCount > HOURLY_LIMIT_PER_PHONE) {
      throw new AppError(
        ErrorCode.RATE_LIMITED,
        'Too many verification codes requested for this number. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (ipAddress) {
      const ipCount = await this.redis.incrementWithTtl(`otp:ip:${ipAddress}`, ONE_HOUR_SECONDS);
      if (ipCount > HOURLY_LIMIT_PER_IP) {
        throw new AppError(
          ErrorCode.RATE_LIMITED,
          'Too many verification codes requested from this network. Try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    await this.redis.set(cooldownKey, '1', cooldownSeconds);
  }
}
