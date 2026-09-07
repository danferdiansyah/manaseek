import { Injectable, Logger } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AppConfigService } from '@/common/config/config.service';
import type { PushMessage, PushProvider, PushSendResult } from './push.provider';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const TOKEN_TTL_SECONDS = 3600;
const TOKEN_REFRESH_MARGIN_MS = 60_000;

/**
 * Firebase Cloud Messaging HTTP v1.
 *
 * Implemented directly against the REST API rather than firebase-admin: the
 * only thing we need is a service-account signed OAuth token, and this keeps
 * the deployment bundle small.
 */
@Injectable()
export class FcmPushProvider implements PushProvider {
  private readonly logger = new Logger(FcmPushProvider.name);
  private accessToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: AppConfigService) {}

  async send(message: PushMessage): Promise<PushSendResult> {
    if (message.tokens.length === 0) {
      return { successCount: 0, invalidTokens: [] };
    }

    const projectId = this.config.get('FCM_PROJECT_ID');
    if (!projectId) {
      throw new Error('FCM_PROJECT_ID is not configured');
    }

    const accessToken = await this.getAccessToken();
    const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    let successCount = 0;
    const invalidTokens: string[] = [];

    // HTTP v1 has no multicast endpoint; one request per device token.
    await Promise.all(
      message.tokens.map(async (token) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: message.title, body: message.body },
              data: message.data,
              android: { priority: 'HIGH' },
            },
          }),
        });

        if (response.ok) {
          successCount += 1;
          return;
        }

        const detail = await response.text();
        if (response.status === 404 || response.status === 400) {
          invalidTokens.push(token);
        }
        this.logger.warn(`FCM send failed (${response.status}): ${detail.slice(0, 300)}`);
      }),
    );

    return { successCount, invalidTokens };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
      return this.accessToken.value;
    }

    const clientEmail = this.config.get('FCM_CLIENT_EMAIL');
    const privateKey = this.config.get('FCM_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      throw new Error('FCM_CLIENT_EMAIL and FCM_PRIVATE_KEY are required for the fcm provider');
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const assertion = jwt.sign(
      {
        iss: clientEmail,
        scope: FCM_SCOPE,
        aud: GOOGLE_TOKEN_URL,
        iat: issuedAt,
        exp: issuedAt + TOKEN_TTL_SECONDS,
      },
      privateKey,
      { algorithm: 'RS256' },
    );

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to obtain FCM access token: ${response.status}`);
    }

    const payload = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = {
      value: payload.access_token,
      expiresAt: Date.now() + payload.expires_in * 1000,
    };

    return this.accessToken.value;
  }
}
