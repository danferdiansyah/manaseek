import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppError, ErrorCode } from '@/common/errors/app-error';

@Injectable()
export class AiAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<Request>();
    if (!user?.id) throw AppError.unauthorized();

    // This permission is resolved by the global authentication guard from the
    // current database identity, never from a body, query, or token claim.
    if (user.permissions?.aiChat !== true) {
      throw new AppError(
        ErrorCode.AI_ACCESS_DENIED,
        'Tanya Manaseek belum tersedia untuk akun ini. Akses AI terbatas untuk akun yang telah diizinkan.',
        403,
      );
    }
    return true;
  }
}
