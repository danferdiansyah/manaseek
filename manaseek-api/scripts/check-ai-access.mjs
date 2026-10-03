// Hermetic HTTP checks: real JWT + chat controller/guard, in-memory identities,
// stubbed chat operations. Never connects to a database or an AI provider.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Module } = require('@nestjs/common');
const { NestFactory, Reflector } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { ChatController } = require('../dist/modules/chat/chat.controller');
const { ChatService } = require('../dist/modules/chat/chat.service');
const { AiAccessGuard } = require('../dist/modules/chat/ai-access.guard');
const { AuthService } = require('../dist/modules/auth/auth.service');
const { JwtAuthGuard } = require('../dist/common/guards/jwt-auth.guard');
const { PrismaService } = require('../dist/common/prisma/prisma.service');

const emails = [
  'rizky2004cool@gmail.com', 'manaseekindonesia@gmail.com',
  'rozan.faiq@gmail.com', 'ismailshlh21@gmail.com',
  'danferdianstyle@gmail.com', 'aakiki091004@gmail.com',
  'business.tasyahafizahputri@gmail.com',
];
const identity = (email, extra = {}) => ({ email, emailVerifiedAt: new Date(), status: 'ACTIVE', ...extra });
const users = new Map(emails.map((email, index) => [`allowed-${index}`, identity(email)]));
users.set('case', identity(` ${emails[0].toUpperCase()} `));
users.set('outsider', identity('other@example.com'));
users.set('admin', identity('admin@example.com'));
users.set('alias', identity('rizky2004cool+extra@gmail.com'));
users.set('lookalike', identity('rizky2004cool@gmail.com.evil.example'));
users.set('unverified', identity(emails[0], { emailVerifiedAt: null }));
users.set('suspended', identity(emails[0], { status: 'SUSPENDED' }));
users.set('no-email', identity(null));
const prisma = { user: { findUnique: async ({ where }) => users.has(where.id)
  ? { id: where.id, role: where.id === 'admin' ? 'ADMIN' : 'JAMAAH', ...users.get(where.id) } : null } };
const operations = [];
const chat = Object.fromEntries(['sendMessage', 'listSessions', 'getMessages', 'deleteSessions'].map(name => [
  name, async (userId) => { operations.push({ name, userId }); return { ok: true }; },
]));
class TestModule {}
Module({
  controllers: [ChatController],
  providers: [AiAccessGuard, { provide: PrismaService, useValue: prisma }, { provide: ChatService, useValue: chat }],
})(TestModule);
const jwt = new JwtService({ secret: randomBytes(32).toString('hex') });
const app = await NestFactory.create(TestModule, { logger: false });
app.useGlobalGuards(new JwtAuthGuard(jwt, new Reflector(), prisma));
const sessionId = '22222222-2222-4222-8222-222222222222';
const routes = [
  ['POST', '/chat/messages'], ['GET', '/chat/sessions'],
  ['GET', `/chat/sessions/${sessionId}/messages`],
  ['DELETE', '/chat/sessions'], ['DELETE', `/chat/sessions/${sessionId}`],
];
let checks = 0;
try {
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  for (const subject of [...users.keys(), 'deleted-user', 'anonymous', 'invalid-token']) {
    const allowed = subject.startsWith('allowed-') || subject === 'case';
    const authenticated = !['anonymous', 'invalid-token', 'deleted-user'].includes(subject);
    const token = subject === 'invalid-token' ? 'invalid' : jwt.sign({
      sub: subject, role: subject === 'admin' ? 'ADMIN' : 'JAMAAH',
      // Untrusted claimed permissions must never override the database identity.
      email: emails[0], permissions: { aiChat: true },
    }, { expiresIn: '1m' });
    for (const [method, path] of routes) {
      const before = operations.length;
      const response = await fetch(`${base}${path}?email=${emails[0]}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(subject === 'anonymous' ? {} : { Authorization: `Bearer ${token}` }) },
        ...(method === 'POST' ? { body: JSON.stringify({ text: 'Apa itu ihram?', email: emails[0], permissions: { aiChat: true } }) } : {}),
      });
      const payload = await response.json();
      assert.equal(response.status, allowed ? 200 : authenticated ? 403 : 401, `${subject}: ${method} ${path}`);
      assert.equal(operations.length - before, allowed ? 1 : 0, 'Denied requests must never reach chat operations');
      if (allowed) assert.equal(operations.at(-1).userId, subject);
      if (!allowed && authenticated) assert.equal(payload.code, subject === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'AI_ACCESS_DENIED');
      checks++;
    }
    if (users.has(subject)) {
      const profile = await new AuthService(prisma).me(subject);
      assert.equal(profile.permissions.aiChat, allowed, 'Profile capability must match API authorization');
      checks++;
    }
  }
  // An existing token must lose access immediately after the current identity
  // no longer qualifies; neither its role nor a previous request is cached.
  const token = jwt.sign({ sub: 'allowed-0', role: 'ADMIN' }, { expiresIn: '1m' });
  users.set('allowed-0', identity('revoked@example.com'));
  const before = operations.length;
  const revoked = await fetch(`${base}/chat/sessions`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(revoked.status, 403);
  assert.equal(operations.length, before);
  checks++;
  console.log(`AI access: ${checks} checks passed across all 5 chat endpoints; no real data or model calls.`);
} finally {
  await app.close();
}
