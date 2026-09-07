import { z } from 'zod';
import { paginationSchema } from '@/common/dto/pagination.dto';

export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

export const listReviewsSchema = paginationSchema.extend({
  mutawifId: z.string().uuid(),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
export type UpdateReviewDto = z.infer<typeof updateReviewSchema>;
export type ListReviewsDto = z.infer<typeof listReviewsSchema>;
