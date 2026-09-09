import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * Rate limits per account, falling back to IP for anonymous routes.
 *
 * Keying on IP alone is wrong here twice over. Behind the web app's rewrite
 * the API sees the proxy rather than the jamaah, so every user would share one
 * bucket and a handful of them would lock everyone out. And an IP is
 * spoofable through a forwarded header, while a session is not.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const userId = req.user?.id;
    if (userId) return `user:${userId}`;

    return `ip:${req.ip ?? 'unknown'}`;
  }
}
