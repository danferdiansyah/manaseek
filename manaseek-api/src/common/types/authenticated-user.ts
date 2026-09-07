import type { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
