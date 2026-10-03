import { describe, expect, it, vi } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Reflector } from '@nestjs/core';
import type { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

function setup() {
  const request: { headers: { authorization?: string }; user?: unknown } = { headers: { authorization: 'Bearer signed-token' } };
  const jwt = { verifyAsync: vi.fn().mockResolvedValue({ sub: 'user-id', role: 'ADMIN', permissions: { aiChat: true } }) };
  const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
  const identity = { id: 'user-id', role: 'JAMAAH', status: 'ACTIVE', email: 'other@example.com', emailVerifiedAt: new Date() };
  const prisma = { user: { findUnique: vi.fn().mockResolvedValue(identity) } };
  const context = { getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
  const guard = new JwtAuthGuard(jwt as unknown as JwtService, reflector as unknown as Reflector, prisma as unknown as PrismaService);
  return { request, jwt, reflector, identity, prisma, context, guard };
}

describe('request identity boundary', () => {
  it('uses current database role and permissions rather than stale/forged claims', async () => {
    const t = setup();
    expect(await t.guard.canActivate(t.context)).toBe(true);
    expect(t.request.user).toEqual({ id: 'user-id', role: 'JAMAAH', permissions: { aiChat: false } });
    expect(t.prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });
  it('blocks an already issued access token after suspension', async () => {
    const t = setup();
    t.prisma.user.findUnique.mockResolvedValue({ ...t.identity, status: 'SUSPENDED' });
    await expect(t.guard.canActivate(t.context)).rejects.toMatchObject({ code: 'ACCOUNT_SUSPENDED' });
    expect(t.request.user).toBeUndefined();
  });
  it('blocks deleted identities', async () => {
    const t = setup();
    t.prisma.user.findUnique.mockResolvedValue(null);
    await expect(t.guard.canActivate(t.context)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
  it('does not disguise database outages as bad credentials', async () => {
    const t = setup();
    const outage = new Error('Database unavailable');
    t.prisma.user.findUnique.mockRejectedValue(outage);
    await expect(t.guard.canActivate(t.context)).rejects.toBe(outage);
  });
  it('rejects an invalid signature before loading an account', async () => {
    const t = setup();
    t.jwt.verifyAsync.mockRejectedValue(new Error('Bad signature'));
    await expect(t.guard.canActivate(t.context)).rejects.toMatchObject({ code: 'TOKEN_INVALID' });
    expect(t.prisma.user.findUnique).not.toHaveBeenCalled();
  });
  it('leaves public endpoints independent of session and database availability', async () => {
    const t = setup();
    t.reflector.getAllAndOverride.mockReturnValue(true);
    expect(await t.guard.canActivate(t.context)).toBe(true);
    expect(t.jwt.verifyAsync).not.toHaveBeenCalled();
    expect(t.prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
