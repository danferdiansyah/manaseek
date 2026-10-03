import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { ChatService } from '../dist/modules/chat/chat.service.js';

// Only synthetic rows inside a transaction that ALWAYS rolls back.
// No existing users, conversations or messages are read or modified.
const prisma = new PrismaClient();
const rollback = new Error('ROLLBACK_CHAT_DELETION_FIXTURES');
const marker = randomUUID();
try {
  await prisma.$transaction(async tx => {
    const owner = await tx.user.create({ data: { email: `chat-owner-${marker}@example.test`, name: 'History test' } });
    const other = await tx.user.create({ data: { email: `chat-other-${marker}@example.test`, name: 'History test' } });
    const make = userId => tx.chatSession.create({ data: { userId, title: 'Deletion fixture', messages: { create: [{ role: 'USER', content: 'Fixture question' }, { role: 'ASSISTANT', content: 'Fixture reply' }] } } });
    const first = await make(owner.id);
    const second = await make(owner.id);
    const foreign = await make(other.id);
    const service = new ChatService(tx, {});
    assert.deepEqual(await service.deleteSessions(owner.id, foreign.id), { deleted: 0 });
    assert.equal(await tx.chatMessage.count({ where: { sessionId: foreign.id } }), 2);
    assert.deepEqual(await service.deleteSessions(owner.id, first.id), { deleted: 1 });
    assert.equal(await tx.chatMessage.count({ where: { sessionId: first.id } }), 0);
    assert.deepEqual(await service.deleteSessions(owner.id, first.id), { deleted: 0 });
    assert.equal(await tx.chatMessage.count({ where: { sessionId: second.id } }), 2);
    assert.deepEqual(await service.deleteSessions(owner.id), { deleted: 1 });
    assert.equal(await tx.chatSession.count({ where: { userId: owner.id } }), 0);
    assert.equal(await tx.chatMessage.count({ where: { sessionId: second.id } }), 0);
    assert.equal(await tx.chatMessage.count({ where: { sessionId: foreign.id } }), 2);
    assert.deepEqual(await service.deleteSessions(owner.id), { deleted: 0 });
    throw rollback;
  }, { timeout: 30000 });
  assert.fail('Test transaction must roll back');
} catch (error) {
  if (error !== rollback) throw error;
  console.log('PASS: owned deletion, message cascade, foreign-user isolation, delete-all, idempotence; fixtures rolled back.');
} finally {
  await prisma.$disconnect();
}
