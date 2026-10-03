import { ChatRole } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@/common/prisma/prisma.service';
import { ChatService } from './chat.service';
import { AiProviderError } from './chat-answer.provider';
import { chatMessagesQuerySchema, chatSessionsQuerySchema } from './dto/chat.dto';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const now = new Date('2026-09-29T10:00:00Z');
const session = { id: SESSION_ID, title: 'Tentang ihram', createdAt: now, updatedAt: now };
const question = {
  id: 'question-id', role: ChatRole.USER, content: 'Apa itu ihram?',
  citedSlugs: [], escalated: false, createdAt: now,
};
const reply = {
  id: 'reply-id', role: ChatRole.ASSISTANT, content: 'Jawaban dari panduan.',
  citedSlugs: ['ihram'], escalated: true, createdAt: new Date(now.getTime() + 1000),
};

function createPrisma() {
  return {
    chatSession: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(session),
      create: vi.fn().mockResolvedValue(session),
      update: vi.fn().mockResolvedValue(session),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    chatMessage: {
      findMany: vi.fn().mockResolvedValue([question]),
      count: vi.fn().mockResolvedValue(1),
      create: vi.fn().mockResolvedValueOnce(question).mockResolvedValueOnce(reply),
    },
    guidanceTopic: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
  };
}

describe('chat history', () => {
  let prisma: ReturnType<typeof createPrisma>;
  let service: ChatService;
  let answers: { ensureConfigured: ReturnType<typeof vi.fn>; generate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = createPrisma();
    answers = { ensureConfigured: vi.fn(), generate: vi.fn() };
    service = new ChatService(prisma as unknown as PrismaService, answers);
    answers.generate.mockResolvedValue({
      object: { answer: reply.content, citedSlugs: ['invented-slug'], needsHuman: true, answerDetails: { version: 1, status: 'sourced', references: [], prayers: [] } },
      model: 'test-model', promptTokens: 10, completionTokens: 5,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('deletes one conversation with ownership constrained in the database write', async () => {
    expect(await service.deleteSessions(USER_ID, SESSION_ID)).toEqual({ deleted: 1 });
    expect(prisma.chatSession.deleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID, id: SESSION_ID } });
    expect(prisma.chatSession.findFirst).not.toHaveBeenCalled();
    expect(answers.generate).not.toHaveBeenCalled();
  });

  it('clears only the authenticated user history, including sessions outside loaded pages', async () => {
    prisma.chatSession.deleteMany.mockResolvedValue({ count: 31 });
    expect(await service.deleteSessions(USER_ID)).toEqual({ deleted: 31 });
    expect(prisma.chatSession.deleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
  });

  it('treats an already deleted or other-user conversation as an idempotent no-op', async () => {
    prisma.chatSession.deleteMany.mockResolvedValue({ count: 0 });
    expect(await service.deleteSessions(USER_ID, SESSION_ID)).toEqual({ deleted: 0 });
    expect(prisma.chatSession.deleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID, id: SESSION_ID } });
  });

  it('scopes both history results and totals to the authenticated owner', async () => {
    prisma.chatSession.findMany.mockResolvedValue([{
      ...session, messages: [{ content: 'Jawaban\n  terakhir' }], _count: { messages: 4 },
    }]);
    prisma.chatSession.count.mockResolvedValue(25);

    const result = await service.listSessions(USER_ID, { page: 2, limit: 20 });

    const where = { userId: USER_ID, messages: { some: {} } };
    expect(prisma.chatSession.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where, skip: 20, take: 20, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    }));
    expect(prisma.chatSession.count).toHaveBeenCalledWith({ where });
    expect(result).toEqual({
      items: [{ ...session, preview: 'Jawaban terakhir', messageCount: 4 }],
      meta: { page: 2, limit: 20, total: 25, totalPages: 2 },
    });
  });

  it('returns an empty page for users with no saved conversations', async () => {
    expect(await service.listSessions(USER_ID, { page: 1, limit: 20 })).toEqual({
      items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });
    expect(answers.generate).not.toHaveBeenCalled();
  });

  it('limits history previews without exposing internal relation results', async () => {
    prisma.chatSession.findMany.mockResolvedValue([{
      ...session, messages: [{ content: 'x'.repeat(300) }], _count: { messages: 2 },
    }]);
    const result = await service.listSessions(USER_ID, { page: 1, limit: 20 });
    expect(result.items[0].preview).toHaveLength(160);
    expect(result.items[0]).not.toHaveProperty('messages');
    expect(result.items[0]).not.toHaveProperty('_count');
  });

  it('reads the latest message page and returns it chronologically with citations', async () => {
    prisma.chatMessage.findMany.mockResolvedValue([reply, question]);
    prisma.chatMessage.count.mockResolvedValue(62);
    const result = await service.getMessages(USER_ID, SESSION_ID, { page: 1, limit: 50 });

    expect(prisma.chatSession.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: SESSION_ID, userId: USER_ID } }));
    expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { sessionId: SESSION_ID }, skip: 0, take: 50,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }));
    expect(result.items).toEqual([question, reply]);
    expect(result.session).toEqual(session);
    expect(result.meta).toEqual({ page: 1, limit: 50, total: 62, totalPages: 2 });
  });

  it('supports loading older messages without returning token accounting fields', async () => {
    await service.getMessages(USER_ID, SESSION_ID, { page: 2, limit: 50 });
    const args = prisma.chatMessage.findMany.mock.calls[0][0];
    expect(args.skip).toBe(50);
    expect(args.select).not.toHaveProperty('promptTokens');
    expect(args.select).not.toHaveProperty('completionTokens');
    expect(args.select).not.toHaveProperty('model');
  });

  it('rejects missing or other-user sessions before reading any messages', async () => {
    prisma.chatSession.findFirst.mockResolvedValue(null);
    await expect(service.getMessages(USER_ID, SESSION_ID, { page: 1, limit: 50 }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(prisma.chatMessage.findMany).not.toHaveBeenCalled();
    expect(prisma.chatMessage.count).not.toHaveBeenCalled();
  });

  it('rejects continuing another user’s conversation before writing or calling the model', async () => {
    prisma.chatSession.findFirst.mockResolvedValue(null);
    await expect(service.sendMessage(USER_ID, { sessionId: SESSION_ID, text: question.content }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(prisma.chatSession.findFirst).toHaveBeenCalledWith({ where: { id: SESSION_ID, userId: USER_ID } });
    expect(prisma.chatMessage.create).not.toHaveBeenCalled();
    expect(answers.generate).not.toHaveBeenCalled();
  });

  it('creates a session for the current user and returns canonical question and reply IDs', async () => {
    const result = await service.sendMessage(USER_ID, { text: question.content });
    expect(prisma.chatSession.create).toHaveBeenCalledWith({ data: { userId: USER_ID, title: question.content } });
    expect(result).toEqual({ sessionId: SESSION_ID, userMessage: question, message: reply });
    expect(prisma.chatSession.update).toHaveBeenCalledTimes(2);
    expect(prisma.chatMessage.create.mock.calls[1][0].data).toMatchObject({
      sessionId: SESSION_ID, role: 'ASSISTANT', citedSlugs: [], escalated: true,
      answerDetails: { version: 1, status: 'sourced', references: [], prayers: [] },
    });
  });

  it('continues an owned session using the saved conversation as model context', async () => {
    prisma.chatMessage.findMany.mockResolvedValue([question, reply, { ...question, content: 'Pertanyaan sebelumnya' }]);
    await service.sendMessage(USER_ID, { sessionId: SESSION_ID, text: question.content });
    expect(prisma.chatSession.create).not.toHaveBeenCalled();
    expect(answers.generate).toHaveBeenCalledWith(expect.objectContaining({ turns: [
      { role: 'user', text: 'Pertanyaan sebelumnya' },
      { role: 'assistant', text: reply.content },
      { role: 'user', text: question.content },
    ] }));
  });

  it('retains structured prayer context for follow-up questions', async () => {
    const answerDetails = { version: 1, status: 'sourced', references: [], prayers: [{ title: 'Doa Sapu Jagat', arabic: 'ربنا آتنا', translation: 'Ya Tuhan kami', evidence: 'Al-Baqarah: 201', sourceId: 1 }] };
    prisma.chatMessage.findMany.mockResolvedValue([question, { ...reply, answerDetails }]);
    await service.sendMessage(USER_ID, { sessionId: SESSION_ID, text: 'Apa arti doa tadi?' });
    expect(answers.generate).toHaveBeenCalledWith(expect.objectContaining({ turns: [
      { role: 'assistant', text: expect.stringContaining('Doa Sapu Jagat') },
      { role: 'user', text: question.content },
    ] }));
  });

  it.each([
    ['quota', 'AI_QUOTA_EXCEEDED'],
    ['unavailable', 'AI_UNAVAILABLE'],
  ] as const)('keeps the question discoverable when the model fails with %s', async (reason, code) => {
    vi.mocked(answers.generate).mockRejectedValue(new AiProviderError(reason));
    await expect(service.sendMessage(USER_ID, { text: question.content })).rejects.toMatchObject({
      code, details: { sessionId: SESSION_ID, userMessage: question },
    });
    expect(prisma.chatMessage.create).toHaveBeenCalledTimes(1);
    expect(prisma.chatSession.update).toHaveBeenCalledWith({ where: { id: SESSION_ID }, data: { updatedAt: expect.any(Date) } });
  });

  it('identifies the saved question on an unexpected model failure too', async () => {
    vi.mocked(answers.generate).mockRejectedValue(new Error('Invalid model response'));
    await expect(service.sendMessage(USER_ID, { text: question.content })).rejects.toMatchObject({
      code: 'INTERNAL_ERROR', details: { sessionId: SESSION_ID, userMessage: question },
    });
  });

  it('identifies the saved session if loading guidance fails before the model call', async () => {
    prisma.guidanceTopic.findMany.mockRejectedValue(new Error('Guidance unavailable'));
    await expect(service.sendMessage(USER_ID, { text: question.content })).rejects.toMatchObject({
      code: 'INTERNAL_ERROR', details: { sessionId: SESSION_ID, userMessage: question },
    });
    expect(answers.generate).not.toHaveBeenCalled();
  });

  it('keeps the saved question identifiable if storing the assistant reply fails', async () => {
    prisma.chatMessage.create.mockReset()
      .mockResolvedValueOnce(question)
      .mockRejectedValueOnce(new Error('Reply could not be saved'));
    await expect(service.sendMessage(USER_ID, { text: question.content })).rejects.toMatchObject({
      code: 'INTERNAL_ERROR', details: { sessionId: SESSION_ID, userMessage: question },
    });
  });
});

describe('chat pagination validation', () => {
  it('defaults to 20 sessions and 50 messages and ignores a caller-supplied owner', () => {
    expect(chatSessionsQuerySchema.parse({ userId: 'someone-else' })).toEqual({ page: 1, limit: 20 });
    expect(chatMessagesQuerySchema.parse({})).toEqual({ page: 1, limit: 50 });
    expect(chatMessagesQuerySchema.parse({ page: '2', limit: '25' })).toEqual({ page: 2, limit: 25 });
  });

  it.each([{ page: 0 }, { page: -1 }, { page: 1.5 }, { limit: 0 }, { limit: 101 }, { limit: 'all' }])('rejects invalid pagination %j', (query) => {
    expect(chatSessionsQuerySchema.safeParse(query).success).toBe(false);
    expect(chatMessagesQuerySchema.safeParse(query).success).toBe(false);
  });
});
