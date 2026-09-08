import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ChatRole } from '@prisma/client';
import { AppConfigService } from '@/common/config/config.service';
import { AppError, ErrorCode } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SYSTEM_PROMPT, renderContext, type TopicContext } from './chat.prompt';
import { GeminiClient, GeminiUnavailableError } from './gemini.client';
import type { SendMessageDto } from './dto/chat.dto';

/** How much of the conversation is replayed to the model. */
const HISTORY_TURNS = 8;
const CONTEXT_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private contextCache: { text: string; slugs: Set<string>; builtAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async listSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { id: true, title: true, updatedAt: true },
    });
  }

  async getMessages(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });
    if (!session) throw AppError.notFound('ChatSession', sessionId);

    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        citedSlugs: true,
        escalated: true,
        createdAt: true,
      },
    });
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

    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: ChatRole.USER, content: dto.text },
    });

    const history = await this.prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_TURNS,
      select: { role: true, content: true },
    });

    const context = await this.guidanceContext();
    const models = [this.config.get('GEMINI_MODEL'), ...this.config.get('GEMINI_FALLBACK_MODELS')];

    let result;
    try {
      result = await GeminiClient.generateAnswer({
        apiKey,
        models,
        system: `${SYSTEM_PROMPT}\n\n${context.text}`,
        turns: history.reverse().map((m) => ({
          role: m.role === ChatRole.USER ? ('user' as const) : ('model' as const),
          text: m.content,
        })),
      });
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
          );
        }

        throw new AppError(
          ErrorCode.AI_UNAVAILABLE,
          'Asisten sedang ramai dipakai. Coba kirim ulang sebentar lagi, atau tanyakan langsung ke mutawif.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      this.logger.error(`Gemini call failed: ${(error as Error).message}`);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Asisten sedang tidak dapat menjawab. Coba lagi sebentar lagi.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Drop any slug the model invented; a citation that goes nowhere is worse
    // than no citation.
    const citedSlugs = result.object.citedSlugs.filter((slug) => context.slugs.has(slug));

    const reply = await this.prisma.chatMessage.create({
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
    });

    await this.prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    this.logger.log(
      `chat ${session.id} model=${result.model} in=${result.promptTokens ?? '?'} out=${result.completionTokens ?? '?'}`,
    );

    return {
      sessionId: session.id,
      message: {
        id: reply.id,
        role: reply.role,
        content: reply.content,
        citedSlugs: reply.citedSlugs,
        escalated: reply.escalated,
        createdAt: reply.createdAt,
      },
    };
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
    }));

    this.contextCache = {
      text: renderContext(shaped),
      slugs: new Set(shaped.map((t) => t.slug)),
      builtAt: Date.now(),
    };

    return this.contextCache;
  }
}
