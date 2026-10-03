import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenRouterClient } from './openrouter.client';
const input = { apiKey: 'private-test-key', model: 'xiaomi/mimo-v2.6-pro', system: 'System instructions', turns: [{ role: 'user' as const, text: 'Apa itu ihsan?' }] };
const url = 'https://nu.or.id/akhlak/ihsan-test';
const quote = 'Ihsan adalah beribadah seakan-akan melihat Allah.';
const draft = { answer: 'Ihsan berkaitan dengan kesadaran kepada Allah. [1]', citedSlugs: [], needsHuman: false, references: [{ url, quote }], prayers: [] };
const completion = (value: unknown, annotations: unknown[] = [], finish_reason = 'stop') => new Response(JSON.stringify({ choices: [{ finish_reason, message: { content: JSON.stringify(value), annotations } }], usage: { prompt_tokens: 42, completion_tokens: 20 } }));
const route = { intent: 'islamic', query: 'Apa itu ihsan dalam Islam?' };
const source = { type: 'url_citation', url_citation: { url, title: 'Tentang Ihsan', content: quote } };
function sequence(...responses: Response[]) { const mock = vi.fn(); responses.forEach(r => mock.mockResolvedValueOnce(r)); vi.stubGlobal('fetch', mock); return mock; }
afterEach(() => vi.unstubAllGlobals());
describe('guarded OpenRouter workflow', () => {
  it('classifies, retrieves restricted sources, then independently reviews evidence', async () => {
    const fetch = sequence(completion(route), completion(draft, [source]), completion({ supported: true, withinScope: true }));
    const result = await OpenRouterClient.generateAnswer(input);
    expect(result).toMatchObject({ object: { answer: draft.answer, answerDetails: { status: 'sourced', references: [{ url }] } }, model: input.model, promptTokens: 126, completionTokens: 60 });
    expect(fetch).toHaveBeenCalledTimes(3);
    for (const [endpoint, request] of fetch.mock.calls) {
      expect(endpoint).toBe('https://openrouter.ai/api/v1/chat/completions');
      expect(request.headers.Authorization).toBe('Bearer private-test-key');
      expect(request.body).not.toContain(input.apiKey);
      expect(JSON.parse(request.body).model).toBe(input.model);
    }
    const retrieval = JSON.parse(fetch.mock.calls[1][1].body);
    expect(retrieval.plugins[0]).toMatchObject({ id: 'web', engine: 'exa', max_results: 5 });
    expect(retrieval.plugins[0].include_domains).toContain('nu.or.id');
    expect(JSON.parse(fetch.mock.calls[2][1].body).messages[1].content).toContain(quote);
  });
  it.each(['off_topic', 'greeting', 'clarify'])('returns a fixed response for %s without search or arbitrary model answer', async intent => {
    const fetch = sequence(completion({ intent, query: '' }));
    const result = await OpenRouterClient.generateAnswer(input);
    expect(result.object.answerDetails.status).toBe(intent);
    expect(result.object.answerDetails.references).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('fails closed on an invalid classifier response', async () => {
    const fetch = sequence(completion({ intent: 'anything', query: 'bad' }));
    expect((await OpenRouterClient.generateAnswer(input)).object.answerDetails.status).toBe('clarify');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('suppresses a plausible answer if the search supplies no provenance', async () => {
    const fetch = sequence(completion(route), completion(draft), completion(draft));
    expect((await OpenRouterClient.generateAnswer(input)).object.answerDetails.status).toBe('unverified');
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('repairs a rejected draft using retrieved evidence and independently checks the repair', async () => {
    const corrected = { ...draft, answer: '**Ihsan berarti beribadah seakan melihat Allah.** [1]' };
    const fetch = sequence(completion(route), completion(draft, [source]), completion({ supported: false, withinScope: true, issues: ['Hapus klaim tambahan.'] }), completion(corrected), completion({ supported: true, withinScope: true, issues: [] }));
    const result = await OpenRouterClient.generateAnswer(input);
    expect(result.object.answer).toBe(corrected.answer);
    expect(result.object.answerDetails.status).toBe('sourced');
    const repair = JSON.parse(fetch.mock.calls[3][1].body);
    expect(repair.plugins).toBeUndefined();
    expect(repair.messages[1].content).toContain('Hapus klaim tambahan.');
    expect(repair.messages[1].content).toContain(quote);
    expect(fetch).toHaveBeenCalledTimes(5);
  });
  it('performs one fresh search when the first search has no usable sources', async () => {
    const fetch = sequence(completion({ ...route, arabicQuery: 'معنى الإحسان' }), completion(draft), completion(draft, [source]), completion({ supported: true, withinScope: true, issues: [] }));
    expect((await OpenRouterClient.generateAnswer(input)).object.answerDetails.status).toBe('sourced');
    const retry = JSON.parse(fetch.mock.calls[2][1].body);
    expect(retry.plugins[0]).toMatchObject({ mode: 'deep-lite', max_results: 8 });
    expect(retry.plugins[0].include_domains).toContain('dar-alifta.org');
    expect(retry.messages[1].content).toContain('معنى الإحسان');
    expect(fetch).toHaveBeenCalledTimes(4);
  });
  it('never publishes an unsupported draft after exhausting one repair and one search', async () => {
    const rejected = { supported: false, withinScope: true, issues: ['Klaim tidak didukung.'] };
    const fetch = sequence(completion(route), completion(draft, [source]), completion(rejected), completion(draft), completion(rejected), completion(draft, [source]), completion(rejected));
    const result = await OpenRouterClient.generateAnswer(input);
    expect(result.object.answerDetails.status).toBe('unverified');
    expect(result.object.needsHuman).toBe(false);
    expect(result.object.answer).not.toBe(draft.answer);
    expect(fetch).toHaveBeenCalledTimes(7);
  });
  it('does not repair a scope rejection', async () => {
    const fetch = sequence(completion(route), completion(draft, [source]), completion({ supported: true, withinScope: false, issues: ['Di luar topik.'] }));
    expect((await OpenRouterClient.generateAnswer(input)).object.answerDetails.status).toBe('unverified');
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('can use the remaining search after a transient repair failure without publishing the rejected draft', async () => {
    const rejected = { supported: false, withinScope: true, issues: ['Klaim perlu diperbaiki.'] };
    const fetch = sequence(completion(route), completion(draft, [source]), completion(rejected), new Response('upstream failure', { status: 503 }), completion(draft, [source]), completion({ supported: true, withinScope: true, issues: [] }));
    expect((await OpenRouterClient.generateAnswer(input)).object.answerDetails.status).toBe('sourced');
    expect(fetch).toHaveBeenCalledTimes(6);
    expect(JSON.parse(fetch.mock.calls[4][1].body).plugins[0].mode).toBe('deep-lite');
  });
  it.each([{ supported: false, withinScope: true }, { supported: true, withinScope: false }, {}])('suppresses an unsupported or out-of-scope draft after review', async review => {
    sequence(completion(route), completion(draft, [source]), completion(review));
    const result = await OpenRouterClient.generateAnswer(input);
    expect(result.object.answerDetails.status).toBe('unverified');
    expect(result.object.answer).not.toBe(draft.answer);
  });
  it.each([[402, 'quota'], [429, 'rate'], [401, 'configuration'], [403, 'configuration'], [500, 'unavailable']])('maps HTTP %s without exposing provider errors', async (status, reason) => {
    const fetch = sequence(new Response('sensitive upstream body', { status: status as number }));
    await expect(OpenRouterClient.generateAnswer(input)).rejects.toMatchObject({ reason, message: `OpenRouter request failed: ${reason}` });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('rejects truncated responses and sanitizes network errors', async () => {
    sequence(completion(route, [], 'length'));
    await expect(OpenRouterClient.generateAnswer(input)).rejects.toMatchObject({ reason: 'unavailable' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network private-test-key')));
    await expect(OpenRouterClient.generateAnswer(input)).rejects.toMatchObject({ message: 'OpenRouter request failed: unavailable' });
  });
});
