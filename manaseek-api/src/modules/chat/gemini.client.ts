import { Logger } from '@nestjs/common';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 45_000;

/** Gemini's response schema uses the OpenAPI subset, with uppercase types. */
export const ANSWER_SCHEMA = {
  type: 'OBJECT',
  properties: {
    answer: {
      type: 'STRING',
      description: 'Jawaban untuk jamaah, bahasa Indonesia, ringkas, maksimal empat kalimat.',
    },
    citedSlugs: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Slug panduan yang benar-benar dipakai untuk menyusun jawaban.',
    },
    needsHuman: {
      type: 'BOOLEAN',
      description: 'True bila pertanyaan ini harus ditangani mutawif manusia.',
    },
  },
  required: ['answer', 'citedSlugs', 'needsHuman'],
} as const;

export interface GeminiTurn {
  role: 'user' | 'model';
  text: string;
}

export interface GeminiAnswer {
  answer: string;
  citedSlugs: string[];
  needsHuman: boolean;
}

export interface GeminiResult {
  object: GeminiAnswer;
  promptTokens: number | null;
  completionTokens: number | null;
}

/**
 * Talks to Gemini over its REST API rather than through the AI SDK.
 *
 * The SDK ships ESM only, and this service is compiled to CommonJS, which the
 * serverless runtime refuses to load (ERR_REQUIRE_ESM). Structured output is a
 * first-class Gemini feature anyway, so the REST call costs nothing in
 * capability and removes two dependencies.
 */
export class GeminiClient {
  private static readonly logger = new Logger(GeminiClient.name);

  static async generateAnswer(options: {
    apiKey: string;
    model: string;
    system: string;
    turns: GeminiTurn[];
  }): Promise<GeminiResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(
        `${ENDPOINT}/${options.model}:generateContent?key=${encodeURIComponent(options.apiKey)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: options.system }] },
            contents: options.turns.map((turn) => ({
              role: turn.role,
              parts: [{ text: turn.text }],
            })),
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: ANSWER_SCHEMA,
              temperature: 0.3,
              maxOutputTokens: 1024,
            },
          }),
        },
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Gemini responded ${response.status}: ${detail.slice(0, 300)}`);
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };

      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini returned no content');
      }

      return {
        object: this.parse(text),
        promptTokens: payload.usageMetadata?.promptTokenCount ?? null,
        completionTokens: payload.usageMetadata?.candidatesTokenCount ?? null,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private static parse(text: string): GeminiAnswer {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Gemini returned malformed JSON');
    }

    const value = parsed as Partial<GeminiAnswer>;
    if (typeof value.answer !== 'string' || value.answer.trim() === '') {
      throw new Error('Gemini returned no answer field');
    }

    return {
      answer: value.answer.trim(),
      citedSlugs: Array.isArray(value.citedSlugs)
        ? value.citedSlugs.filter((slug): slug is string => typeof slug === 'string')
        : [],
      // A missing flag is treated as needing a human: failing towards a person
      // is the safe direction for religious guidance.
      needsHuman: value.needsHuman !== false,
    };
  }
}
