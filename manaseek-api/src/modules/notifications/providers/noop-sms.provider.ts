import { Injectable, Logger } from '@nestjs/common';
import { maskPhone } from '@/common/utils/phone.util';
import type { SmsMessage, SmsProvider } from './sms.provider';

/**
 * Development fallback. Logs the full message including any OTP code so the
 * flow is testable without a provider account. Config validation forbids the
 * matching OTP bypass in production.
 */
@Injectable()
export class NoopSmsProvider implements SmsProvider {
  private readonly logger = new Logger(NoopSmsProvider.name);

  async send(message: SmsMessage): Promise<void> {
    this.logger.log(`[sms:noop] -> ${maskPhone(message.phone)} | ${message.body}`);
  }
}
