import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { AppError } from '@/common/errors/app-error';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { ListTopicsDto } from './dto/content.dto';

/**
 * Read-only guidance content for jamaah.
 *
 * Only PUBLISHED rows are ever served. Everything currently seeded is DRAFT,
 * so the client is told plainly that the content still awaits review rather
 * than being shown religious instruction nobody has signed off on.
 */
@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async listTopics(dto: ListTopicsDto) {
    const where: Prisma.GuidanceTopicWhereInput = {
      phase: dto.phase,
      categories: dto.category ? { has: dto.category } : undefined,
      ...(dto.search
        ? {
            OR: [
              { title: { contains: dto.search, mode: 'insensitive' } },
              { summary: { contains: dto.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [topics, publishedCount] = await this.prisma.$transaction([
      this.prisma.guidanceTopic.findMany({
        where,
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          phase: true,
          categories: true,
          obligation: true,
          readingMinutes: true,
          icon: true,
          status: true,
        },
      }),
      this.prisma.guidanceTopic.count({ where: { status: ContentStatus.PUBLISHED } }),
    ]);

    return {
      items: topics,
      // Lets the client show an honest banner while the library is unreviewed.
      meta: { total: topics.length, publishedCount },
    };
  }

  async getTopic(slug: string) {
    const topic = await this.prisma.guidanceTopic.findUnique({
      where: { slug },
      include: {
        steps: { orderBy: { orderIndex: 'asc' } },
        prayers: { orderBy: { orderIndex: 'asc' } },
        prohibitions: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!topic) throw AppError.notFound('GuidanceTopic', slug);

    const next = await this.prisma.guidanceTopic.findFirst({
      where: { orderIndex: { gt: topic.orderIndex } },
      orderBy: { orderIndex: 'asc' },
      select: { slug: true, title: true },
    });

    return { ...topic, next };
  }

  listPrayers() {
    return this.prisma.prayer.findMany({
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        arabic: true,
        transliteration: true,
        translation: true,
        context: true,
      },
    });
  }

  /** Checklist template joined with what this jamaah has already ticked. */
  async getChecklist(userId: string) {
    const [items, done] = await this.prisma.$transaction([
      this.prisma.checklistItem.findMany({ orderBy: { orderIndex: 'asc' } }),
      this.prisma.checklistProgress.findMany({
        where: { userId },
        select: { itemId: true, completedAt: true },
      }),
    ]);

    const completedAt = new Map(done.map((row) => [row.itemId, row.completedAt]));

    return {
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        description: item.description,
        category: item.category,
        completed: completedAt.has(item.id),
        completedAt: completedAt.get(item.id) ?? null,
      })),
      meta: { total: items.length, completed: done.length },
    };
  }

  /** Idempotent per direction: ticking a done item leaves it done. */
  async setChecklistItem(userId: string, itemId: string, completed: boolean) {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
    if (!item) throw AppError.notFound('ChecklistItem', itemId);

    if (completed) {
      await this.prisma.checklistProgress.upsert({
        where: { userId_itemId: { userId, itemId } },
        create: { userId, itemId },
        update: {},
      });
    } else {
      await this.prisma.checklistProgress.deleteMany({ where: { userId, itemId } });
    }

    return this.getChecklist(userId);
  }
}
