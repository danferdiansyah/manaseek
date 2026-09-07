import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '@/common/config/config.service';
import { maskPhone } from '@/common/utils/phone.util';
import type { SmsMessage, SmsProvider } from './sms.provider';

const FONNTE_ENDPOINT = 'https://api.fonnte.com/send';

/**
 * WhatsApp delivery through Fonnte. Chosen because OTP over WhatsApp has
 * materially better delivery rates than SMS for Indonesian numbers.
 */
@Injectable()
export class FonnteSmsProvider implements SmsProvider {
  private readonly logger = new Logger(FonnteSmsProvider.name);

  constructor(private readonly config: AppConfigService) {}

  async send(message: SmsMessage): Promise<void> {
    const token = this.config.get('FONNTE_TOKEN');
    if (!token) {
      throw new Error('FONNTE_TOKEN is required for the fonnte provider');
    }

    const response = await fetch(FONNTE_ENDPOINT, {
      method: 'POST',
      headers: { authorization: token, 'content-type': 'application/json' },
      body: JSON.stringify({
        // Fonnte expects the number without the leading plus sign.
        target: message.phone.replace(/^\+/, ''),
        message: message.body,
        countryCode: '',
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(
        `Fonnte send failed for ${maskPhone(message.phone)} (${response.status}): ${detail.slice(0, 300)}`,
      );
      throw new Error(`SMS delivery failed with status ${response.status}`);
    }
  }
}
