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
    const header = request.headers['x-internal-token'];
    const provided = Array.isArray(header) ? header[0] : header;

    if (!provided || !safeCompare(provided, expected)) {
      throw AppError.unauthorized('Invalid internal task token');
    }

    return true;
  }
}
