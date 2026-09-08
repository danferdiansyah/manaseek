import { ContentCategory, RitualPhase } from '@prisma/client';
import { z } from 'zod';

export const listTopicsSchema = z.object({
  category: z.nativeEnum(ContentCategory).optional(),
  phase: z.nativeEnum(RitualPhase).optional(),
  search: z.string().min(2).max(80).optional(),
});

export const toggleChecklistSchema = z.object({
  completed: z.boolean(),
});

export type ListTopicsDto = z.infer<typeof listTopicsSchema>;
export type ToggleChecklistDto = z.infer<typeof toggleChecklistSchema>;
