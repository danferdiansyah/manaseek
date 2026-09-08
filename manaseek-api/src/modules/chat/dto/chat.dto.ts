import { z } from 'zod';

export const sendMessageSchema = z.object({
  text: z.string().trim().min(2).max(1000),
  sessionId: z.string().uuid().optional(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
