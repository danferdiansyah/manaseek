import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '@/common/config/config.service';
import { AppError } from '@/common/errors/app-error';
import { safeCompare } from '@/common/utils/crypto.util';

/**
 * Guards machine-to-machine task endpoints with a shared secret. Used by the
 * platform scheduler (Vercel Cron, Cloud Scheduler, a Kubernetes CronJob) when
 * the in-process scheduler is disabled.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get('INTERNAL_TASK_TOKEN');
    if (!expected) {
      throw AppError.forbidden('Internal task endpoints are disabled');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = this.tokenFrom(request);

    if (!provided || !safeCompare(provided, expected)) {
      throw AppError.unauthorized('Invalid internal task token');
    }

    return true;
  }

  /**
   * Accepts either `x-internal-token: <token>` or `Authorization: Bearer
   * <token>`. Vercel Cron can only send the latter, from CRON_SECRET.
   */
  private tokenFrom(request: Request): string | null {
    const custom = request.headers['x-internal-token'];
    if (custom) return Array.isArray(custom) ? custom[0] : custom;

    const authorization = request.headers.authorization;
    if (!authorization) return null;

    const [scheme, value] = authorization.split(' ');
    return scheme?.toLowerCase() === 'bearer' && value ? value : null;
  }
}
