import { z } from 'zod';
import { paginationSchema } from '@/common/dto/pagination.dto';

export const chatSessionsQuerySchema = paginationSchema;
export const chatMessagesQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const sendMessageSchema = z.object({
  text: z.string().trim().min(2).max(1000),
  sessionId: z.string().uuid().optional(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
