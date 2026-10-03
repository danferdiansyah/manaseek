import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppError, ErrorCode } from '../errors/app-error';
import type { AccessTokenPayload } from '../types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';
import { canAccessAi } from '../access/ai-access';

/** Registered globally: every route is authenticated unless marked `@Public()`. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw AppError.unauthorized('Missing bearer token');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('Missing subject');
    } catch {
      throw new AppError(ErrorCode.TOKEN_INVALID, 'Access token is invalid or expired', 401);
    }

    // A signed token proves identity, not current permissions. Resolve these
    // once per request so suspension and role changes take effect immediately.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true, email: true, emailVerifiedAt: true },
    });
    if (!user) throw AppError.unauthorized('Account no longer exists');
    if (user.status !== 'ACTIVE') {
      throw new AppError(ErrorCode.ACCOUNT_SUSPENDED, 'This account is suspended', 403);
    }
    request.user = { id: user.id, role: user.role, permissions: { aiChat: canAccessAi(user) } };
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;

    const [scheme, value] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && value ? value : null;
  }
}
