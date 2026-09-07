import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../errors/app-error';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Injects the authenticated principal. Throws rather than returning undefined
 * so a route that forgot `@Public()` fails loudly instead of silently running
 * with no user.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw AppError.unauthorized();
    }

    return field ? user[field] : user;
  },
);
