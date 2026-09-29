import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ChatRole, Prisma } from '@prisma/client';
import { AppConfigService } from '@/common/config/config.service';
import { paginate, toSkipTake, type PaginationDto } from '@/common/dto/pagination.dto';
import { AppError, ErrorCode } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SYSTEM_PROMPT, renderContext, type TopicContext } from './chat.prompt';
import { GeminiClient, GeminiUnavailableError } from './gemini.client';
import type { SendMessageDto } from './dto/chat.dto';

/** How much of the conversation is replayed to the model. */
const HISTORY_TURNS = 8;
const CONTEXT_TTL_MS = 5 * 60 * 1000;
const MESSAGE_SELECT = {
  id: true,
  role: true,
  content: true,
  citedSlugs: true,
  escalated: true,
  createdAt: true,
} satisfies Prisma.ChatMessageSelect;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private contextCache: { text: string; slugs: Set<string>; builtAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async listSessions(userId: string, query: PaginationDto) {
    const where = { userId, messages: { some: {} } };
    const [sessions, total] = await this.prisma.$transaction([
      this.prisma.chatSession.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(query),
        select: {
          id: true, title: true, createdAt: true, updatedAt: true,
          _count: { select: { messages: true } },
          messages: {
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 1,
            select: { content: true },
          },
        },
      }),
      this.prisma.chatSession.count({ where }),
    ]);

    return paginate(sessions.map(({ messages, _count, ...session }) => ({
      ...session,
      preview: messages[0]?.content.replace(/\s+/g, ' ').trim().slice(0, 160) ?? '',
      messageCount: _count.messages,
    })), total, query);
  }

  async getMessages(userId: string, sessionId: string, query: PaginationDto) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
    if (!session) throw AppError.notFound('ChatSession', sessionId);

    const [messages, total] = await this.prisma.$transaction([
      this.prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(query),
        select: MESSAGE_SELECT,
      }),
      this.prisma.chatMessage.count({ where: { sessionId } }),
    ]);

    return { ...paginate(messages.reverse(), total, query), session };
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    const apiKey = this.config.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Asisten AI belum dikonfigurasi. Hubungi admin.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const session = dto.sessionId
      ? await this.requireSession(userId, dto.sessionId)
      : await this.prisma.chatSession.create({
          data: { userId, title: dto.text.slice(0, 80) },
        });

    // Persist the question and its activity timestamp together, even when the
    // model cannot answer. Error responses identify the saved conversation.
    const [userMessage] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: { sessionId: session.id, role: ChatRole.USER, content: dto.text },
        select: MESSAGE_SELECT,
      }),
      this.prisma.chatSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      }),
    ]);
    const savedQuestion = { sessionId: session.id, userMessage };

    try {
      const history = await this.prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: HISTORY_TURNS,
        select: { role: true, content: true },
      });
      const context = await this.guidanceContext();
      const models = [this.config.get('GEMINI_MODEL'), ...this.config.get('GEMINI_FALLBACK_MODELS')];
      const result = await GeminiClient.generateAnswer({
        apiKey,
        models,
        system: `${SYSTEM_PROMPT}\n\n${context.text}`,
        turns: history.reverse().map((m) => ({
          role: m.role === ChatRole.USER ? ('user' as const) : ('model' as const),
          text: m.content,
        })),
      });

      // Keep only citations that exist in the curated library.
      const citedSlugs = result.object.citedSlugs.filter((slug) => context.slugs.has(slug));
      const [reply] = await this.prisma.$transaction([
        this.prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: ChatRole.ASSISTANT,
            content: result.object.answer,
            citedSlugs,
            escalated: result.object.needsHuman,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            model: result.model,
          },
          select: MESSAGE_SELECT,
        }),
        this.prisma.chatSession.update({
          where: { id: session.id },
          data: { updatedAt: new Date() },
        }),
      ]);

      this.logger.log(
        `chat ${session.id} model=${result.model} in=${result.promptTokens ?? '?'} out=${result.completionTokens ?? '?'}`,
      );

      return { sessionId: session.id, userMessage, message: reply };
    } catch (error) {
      if (error instanceof GeminiUnavailableError) {
        this.logger.warn(error.message);

        // Two different failures, two different truths. Telling a jamaah to
        // "try again shortly" when the daily allowance is spent is a lie.
        if (error.allQuota) {
          throw new AppError(
            ErrorCode.AI_QUOTA_EXCEEDED,
            'Kuota harian asisten AI sudah habis. Coba lagi besok, atau tanyakan langsung ke mutawif.',
            HttpStatus.TOO_MANY_REQUESTS,
            savedQuestion,
          );
        }

        throw new AppError(
          ErrorCode.AI_UNAVAILABLE,
          'Asisten sedang ramai dipakai. Coba kirim ulang sebentar lagi, atau tanyakan langsung ke mutawif.',
          HttpStatus.SERVICE_UNAVAILABLE,
          savedQuestion,
        );
      }

      this.logger.error(`Chat answer failed: ${(error as Error).message}`);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Asisten sedang tidak dapat menjawab. Coba lagi sebentar lagi.',
        HttpStatus.BAD_GATEWAY,
        savedQuestion,
      );
    }
  }

  private async requireSession(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw AppError.notFound('ChatSession', sessionId);
    return session;
  }

  /**
   * The whole curated library fits comfortably in one prompt at this size, so
   * there is no retrieval step: the model simply cannot cite anything outside
   * what we hand it. Cached briefly because it is identical for every user.
   */
  private async guidanceContext(): Promise<{ text: string; slugs: Set<string> }> {
    if (this.contextCache && Date.now() - this.contextCache.builtAt < CONTEXT_TTL_MS) {
      return this.contextCache;
    }

    const topics = await this.prisma.guidanceTopic.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        steps: { orderBy: { orderIndex: 'asc' } },
        prohibitions: { orderBy: { orderIndex: 'asc' } },
        prayers: { orderBy: { orderIndex: 'asc' } },
        references: { orderBy: { orderIndex: 'asc' } },
      },
    });

    const shaped: TopicContext[] = topics.map((topic) => ({
      slug: topic.slug,
      title: topic.title,
      summary: topic.summary,
      obligation: topic.obligation,
      steps: topic.steps.map((s) => s.text),
      prohibitions: topic.prohibitions.map((p) =>
        p.consequence ? `${p.text} (${p.consequence})` : p.text,
      ),
      prayers: topic.prayers.map((p) => ({ title: p.title, translation: p.translation })),
      references: topic.references.map((r) => ({ citation: r.citation, gloss: r.gloss })),
    }));

    this.contextCache = {
      text: renderContext(shaped),
      slugs: new Set(shaped.map((t) => t.slug)),
      builtAt: Date.now(),
    };

    return this.contextCache;
  }
}
