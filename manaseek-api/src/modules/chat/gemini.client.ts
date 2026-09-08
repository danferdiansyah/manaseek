import { Logger } from '@nestjs/common';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
/**
 * One budget for the whole attempt chain, not per call. Six sequential calls
 * at 45s each would blow past the function's own 60s ceiling and leave the
 * jamaah watching a spinner.
 */
const TOTAL_BUDGET_MS = 25_000;
/** A healthy answer lands in 2-4s. Anything past this is a model to abandon. */
const PER_CALL_MS = 10_000;
const RETRY_DELAY_MS = 700;

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
  /** Which model actually produced the answer, after any fallback. */
  model: string;
}

export type FailureReason = 'quota' | 'unavailable';

/** No candidate model could answer. `reasons` says why, per model. */
export class GeminiUnavailableError extends Error {
  constructor(readonly reasons: Array<{ model: string; reason: FailureReason }>) {
    super(
      `No Gemini model could answer: ${reasons.map((r) => `${r.model}=${r.reason}`).join(', ')}`,
    );
    this.name = 'GeminiUnavailableError';
  }

  /** True when every model was simply out of its daily allowance. */
  get allQuota(): boolean {
    return this.reasons.length > 0 && this.reasons.every((r) => r.reason === 'quota');
  }
}

/**
 * Talks to Gemini over its REST API rather than through the AI SDK.
 *
 * The SDK ships ESM only, and this service is compiled to CommonJS, which the
 * serverless runtime refuses to load (ERR_REQUIRE_ESM). Structured output is a
 * first-class Gemini feature anyway, so the REST call costs nothing in
 * capability and removes two dependencies.
 */
/** Internal signal to move on; never leaves this file. */
class ModelUnavailable extends Error {
  constructor(
    readonly model: string,
    readonly reason: FailureReason,
  ) {
    super(`${model}: ${reason}`);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiClient {
  private static readonly logger = new Logger(GeminiClient.name);

  /**
   * Tries each model in turn, and moves on when one cannot serve.
   *
   * Two failures are expected in normal operation and neither should take the
   * assistant down. A 429 means that model's daily free-tier allowance of 20
   * requests is spent, so move on immediately. A 503 means Gemini is briefly
   * overloaded, which usually clears within a second, so retry that model once
   * before moving on.
   */
  static async generateAnswer(options: {
    apiKey: string;
    models: string[];
    system: string;
    turns: GeminiTurn[];
  }): Promise<GeminiResult> {
    const failures: Array<{ model: string; reason: FailureReason }> = [];
    const deadline = Date.now() + TOTAL_BUDGET_MS;

    for (const [index, model] of options.models.entries()) {
      const isLastModel = index === options.models.length - 1;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const remaining = deadline - Date.now();
        if (remaining <= 1_000) {
          this.logger.warn('Out of time budget before trying ' + model);
          failures.push({ model, reason: 'unavailable' });
          return this.giveUp(failures);
        }

        try {
          return await this.callModel({
            ...options,
            model,
            timeoutMs: Math.min(PER_CALL_MS, remaining),
          });
        } catch (error) {
          if (!(error instanceof ModelUnavailable)) throw error;

          // Another candidate is cheaper than waiting on this one.
          const worthRetrying = error.reason === 'unavailable' && isLastModel && attempt === 0;
          if (worthRetrying) {
            this.logger.warn(`${model} is busy and is the last option, retrying once`);
            await sleep(RETRY_DELAY_MS);
            continue;
          }

          this.logger.warn(`${model} unusable (${error.reason}), trying the next model`);
          failures.push({ model, reason: error.reason });
          break;
        }
      }
    }

    return this.giveUp(failures);
  }

  private static giveUp(failures: Array<{ model: string; reason: FailureReason }>): never {
    throw new GeminiUnavailableError(failures);
  }

  private static async callModel(options: {
    apiKey: string;
    model: string;
    system: string;
    turns: GeminiTurn[];
    timeoutMs: number;
  }): Promise<GeminiResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);

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

      if (response.status === 429) {
        throw new ModelUnavailable(options.model, 'quota');
      }

      // 500 and 503 are Gemini being briefly overloaded, not our request.
      if (response.status === 503 || response.status === 500) {
        throw new ModelUnavailable(options.model, 'unavailable');
      }

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
        model: options.model,
      };
    } catch (error) {
      if (error instanceof ModelUnavailable) throw error;

      // A hung request is just another reason to move on.
      if (controller.signal.aborted) {
        throw new ModelUnavailable(options.model, 'unavailable');
      }

      throw error;
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
