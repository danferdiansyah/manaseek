import type { AnswerDetails } from './chat.evidence';

export type ChatAnswerRequest = {
  system: string;
  turns: Array<{ role: 'user' | 'assistant'; text: string }>;
};
export type ChatAnswerResult = {
  object: { answer: string; citedSlugs: string[]; needsHuman: boolean; answerDetails: AnswerDetails };
  model: string;
  promptTokens: number;
  completionTokens: number;
};

export class AiProviderError extends Error {
  constructor(
    readonly reason: 'quota' | 'rate' | 'configuration' | 'unavailable',
    message = `AI provider failed: ${reason}`,
  ) { super(message); }
}

/** Application port. Model credentials, HTTP, and vendor retries stay outside. */
export abstract class ChatAnswerProvider {
  abstract ensureConfigured(): void;
  abstract generate(request: ChatAnswerRequest): Promise<ChatAnswerResult>;
}
