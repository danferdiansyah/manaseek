import { Injectable, Logger } from '@nestjs/common';
import type { PushMessage, PushProvider, PushSendResult } from './push.provider';

/** Development fallback: logs instead of delivering. */
@Injectable()
export class NoopPushProvider implements PushProvider {
  private readonly logger = new Logger(NoopPushProvider.name);

  async send(message: PushMessage): Promise<PushSendResult> {
    this.logger.log(
      `[push:noop] -> ${message.tokens.length} device(s) | ${message.title} | ${message.body}`,
    );
    return { successCount: message.tokens.length, invalidTokens: [] };
  }
}
