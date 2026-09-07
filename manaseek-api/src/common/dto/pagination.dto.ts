import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function paginate<T>(items: T[], total: number, { page, limit }: PaginationDto): Paginated<T> {
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export function toSkipTake({ page, limit }: PaginationDto): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}
