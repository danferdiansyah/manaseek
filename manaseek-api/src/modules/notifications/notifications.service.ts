import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { maskPhone } from '@/common/utils/phone.util';
import { PUSH_PROVIDER, type PushProvider } from './providers/push.provider';
import { SMS_PROVIDER, type SmsProvider } from './providers/sms.provider';
import { renderTemplate, type NotificationTemplateKey } from './templates';

export interface SendToUserOptions {
  userId: string;
  templateKey: NotificationTemplateKey;
  vars?: Record<string, string>;
  /** Arbitrary key/value payload the mobile app uses for deep linking. */
  data?: Record<string, string>;
}

/**
 * Owned by Engineer A. Other modules call `sendToUser` / `sendSms` and never
 * touch the notification tables or the providers directly.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_PROVIDER) private readonly push: PushProvider,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  /**
   * Fire-and-forget push notification. Delivery failures are recorded on the
   * notification row and never propagate: a failed push must not roll back the
   * business action that triggered it.
   */
  async sendToUser(options: SendToUserOptions): Promise<void> {
    const { userId, templateKey, vars = {}, data } = options;
    const { title, body } = renderTemplate(templateKey, vars);

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        channel: NotificationChannel.PUSH,
        templateKey,
        title,
        body,
        data: data ?? undefined,
      },
    });

    try {
      const devices = await this.prisma.deviceToken.findMany({
        where: { userId },
        select: { token: true },
      });

      if (devices.length === 0) {
        await this.markSent(notification.id);
        return;
      }

      const result = await this.push.send({
        tokens: devices.map((device) => device.token),
        title,
        body,
        data: { ...data, templateKey },
      });

      if (result.invalidTokens.length > 0) {
        await this.prisma.deviceToken.deleteMany({
          where: { token: { in: result.invalidTokens } },
        });
      }

      await this.markSent(notification.id);
    } catch (error) {
      await this.markFailed(notification.id, error);
    }
  }

  /** Direct text delivery for flows with no user row yet, such as login OTP. */
  async sendSms(phone: string, body: string, templateKey = 'raw'): Promise<void> {
    try {
      await this.sms.send({ phone, body });
    } catch (error) {
      this.logger.error(
        `SMS delivery failed for ${maskPhone(phone)} (${templateKey}): ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async listForUser(userId: string, skip: number, take: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return { items, total };
  }

  async registerDevice(
    userId: string,
    token: string,
    platform: 'ANDROID' | 'IOS' | 'WEB',
  ): Promise<void> {
    // A device token is globally unique; reassign it if the phone changed hands.
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, lastSeenAt: new Date() },
    });
  }

  async unregisterDevice(userId: string, token: string): Promise<void> {
    await this.prisma.deviceToken.deleteMany({ where: { userId, token } });
  }

  private async markSent(id: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.SENT, sentAt: new Date() },
    });
  }

  private async markFailed(id: string, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Notification ${id} failed: ${message}`);
    await this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.FAILED, error: message.slice(0, 500) },
    });
  }
}
