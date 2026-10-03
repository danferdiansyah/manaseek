import { z } from 'zod';

export const TRUSTED_DOMAINS = ['kemenag.go.id', 'nu.or.id', 'mui.or.id', 'muhammadiyah.or.id', 'quran.com', 'sunnah.com', 'dar-alifta.org'];
export type SearchSource = { url: string; title: string; content: string };
export type AnswerDetails = {
  version: 1;
  status: 'sourced' | 'unverified' | 'off_topic' | 'greeting' | 'clarify';
  references: Array<{ id: number; url: string; title: string; publisher: string }>;
  prayers: Array<{ title: string; arabic: string; translation: string; evidence: string; sourceId: number }>;
};
export const draftSchema = z.object({
  answer: z.string().trim().min(1).max(12000),
  citedSlugs: z.array(z.string().max(160)).max(20),
  needsHuman: z.boolean(),
  references: z.array(z.object({ url: z.string().max(2000), quote: z.string().trim().min(24).max(600) })).max(5),
  prayers: z.array(z.object({
    title: z.string().trim().min(1).max(160), arabic: z.string().trim().min(10).max(3000),
    translation: z.string().trim().min(5).max(2000), evidence: z.string().trim().min(5).max(500),
    sourceUrl: z.string().max(2000),
  })).max(3),
});
export type DraftAnswer = z.infer<typeof draftSchema>;

/** A request for the recitation alone is a prayer card, not unsolicited legal advice. */
export function focusPrayerDraft(draft: DraftAnswer): DraftAnswer {
  if (!draft.prayers.length) return draft;
  const urls = new Set(draft.prayers.map(p => trustedUrl(p.sourceUrl)));
  const references = draft.references.filter(r => urls.has(trustedUrl(r.url)));
  return { ...draft, references, citedSlugs: [],
    answer: `Berikut bacaan doa, arti, dan sumbernya. ${references.map((_, i) => `[${i + 1}]`).join('')}`,
  };
}

/** Resolve a misplaced prayer link only when another retrieved page has its exact wording. */
export function resolvePrayerSources(draft: DraftAnswer, sources: SearchSource[]): DraftAnswer {
  const references = [...draft.references];
  const prayers = draft.prayers.map(prayer => {
    const contains = (source: SearchSource) => !!trustedUrl(source.url) && normalizeArabic(source.content).includes(normalizeArabic(prayer.arabic));
    if (sources.some(s => trustedUrl(s.url) === trustedUrl(prayer.sourceUrl) && contains(s))) return prayer;
    const match = sources.find(contains);
    if (!match) return prayer; // Still rejected later; never fill in missing words.
    if (!references.some(r => trustedUrl(r.url) === trustedUrl(match.url))) {
      const arabicStart = match.content.search(/[\u0620-\u064a]/u);
      const quote = match.content.slice(Math.max(0, arabicStart), Math.max(0, arabicStart) + 180).trim();
      if (quote.length < 24) return prayer;
      references.push({ url: match.url, quote });
    }
    return { ...prayer, sourceUrl: match.url };
  });
  return { ...draft, references, prayers };
}
export const draftJsonSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    answer: { type: 'string' }, citedSlugs: { type: 'array', items: { type: 'string' } }, needsHuman: { type: 'boolean' },
    references: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { url: { type: 'string' }, quote: { type: 'string' } }, required: ['url', 'quote'] } },
    prayers: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
      title: { type: 'string' }, arabic: { type: 'string' }, translation: { type: 'string' }, evidence: { type: 'string' }, sourceUrl: { type: 'string' },
    }, required: ['title', 'arabic', 'translation', 'evidence', 'sourceUrl'] } },
  }, required: ['answer', 'citedSlugs', 'needsHuman', 'references', 'prayers'],
};

export function trustedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (!TRUSTED_DOMAINS.some(d => url.hostname === d || url.hostname.endsWith(`.${d}`))) return null;
    if (url.pathname === '/' || /\/(search|tag|tags)\b/i.test(url.pathname)) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (key.startsWith('utm_')) url.searchParams.delete(key);
    return url.href;
  } catch { return null; }
}
const normalize = (value: string) => value.normalize('NFKC')
  .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '')
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
export const normalizeArabic = (value: string) => normalize(normalize(value)
  .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '').replace(/\u0671/g, '\u0627')
  // Punctuation/harakat are typography; words and excerpt-gap markers remain exact.
  .replace(/[،,؛;:«»“”"()!?؟]/g, ' '));

type Grounded = { details: AnswerDetails; evidence: SearchSource[]; answer: string };
export type GroundingFailure = 'missing_sources' | 'invalid_body' | 'invalid_reference' | 'quote_not_in_source' | 'invalid_citation' | 'arabic_not_in_source' | 'unused_reference';
type GroundingResult = { ok: true; value: Grounded } | { ok: false; reason: GroundingFailure };

/** URL provenance and quotation checks are independent of the model's opinion. */
export function inspectGrounding(draft: DraftAnswer, sources: SearchSource[]): GroundingResult {
  if (!draft.references.length || !sources.length) return { ok: false, reason: 'missing_sources' };
  if (/https?:\/\//i.test(draft.answer) || /[\u0620-\u064a]{2}/u.test(draft.answer)) return { ok: false, reason: 'invalid_body' };
  const references: AnswerDetails['references'] = [];
  const evidence: SearchSource[] = [];
  const citationIds: number[] = [];
  for (const ref of draft.references) {
    const url = trustedUrl(ref.url);
    const source = url && sources.find(s => trustedUrl(s.url) === url && normalize(s.content).includes(normalize(ref.quote)));
    if (!url) return { ok: false, reason: 'invalid_reference' };
    if (!source) return { ok: false, reason: 'quote_not_in_source' };
    const existing = references.find(r => r.url === url);
    if (existing) {
      citationIds.push(existing.id);
      if (!evidence[existing.id - 1].content.includes(source.content))
        evidence[existing.id - 1] = { ...source, content: `${evidence[existing.id - 1].content}\n[...]\n${source.content}` };
    } else {
      const id = references.length + 1;
      references.push({ id, url, title: source.title.slice(0, 300), publisher: new URL(url).hostname.replace(/^www\./, '') });
      evidence.push(source);
      citationIds.push(id);
    }
  }
  const originalMarkers = [...draft.answer.matchAll(/\[(\d+)\]/g)].map(m => Number(m[1]));
  if (!originalMarkers.length || originalMarkers.some(id => !citationIds[id - 1])) return { ok: false, reason: 'invalid_citation' };
  const markers = originalMarkers.map(id => citationIds[id - 1]);
  const answer = draft.answer.replace(/\[(\d+)\]/g, (_, id: string) => `[${citationIds[Number(id) - 1]}]`);
  const prayers: AnswerDetails['prayers'] = [];
  for (const prayer of draft.prayers) {
    const index = references.findIndex(r => r.url === trustedUrl(prayer.sourceUrl));
    if (index < 0 || !/[\u0620-\u064a]/u.test(prayer.arabic) || !normalizeArabic(evidence[index].content).includes(normalizeArabic(prayer.arabic))) return { ok: false, reason: 'arabic_not_in_source' };
    prayers.push({ title: prayer.title, arabic: prayer.arabic, translation: prayer.translation, evidence: prayer.evidence, sourceId: index + 1 });
  }
  const used = references.filter(r => markers.includes(r.id) || prayers.some(p => p.sourceId === r.id));
  const finalIds = new Map(used.map((r, index) => [r.id, index + 1]));
  return { ok: true, value: { details: { version: 1, status: 'sourced',
    references: used.map(r => ({ ...r, id: finalIds.get(r.id)! })),
    prayers: prayers.map(p => ({ ...p, sourceId: finalIds.get(p.sourceId)! })),
  }, evidence: used.map(r => evidence[r.id - 1]), answer: answer.replace(/\[(\d+)\]/g, (_, id: string) => `[${finalIds.get(Number(id))}]`) } };
}

export function groundDraft(draft: DraftAnswer, sources: SearchSource[]): Grounded | null {
  const result = inspectGrounding(draft, sources);
  return result.ok ? result.value : null;
}

export function fixedAnswer(status: Exclude<AnswerDetails['status'], 'sourced'>) {
  const answer = {
    off_topic: 'Aku khusus membantu pertanyaan seputar Islam, ibadah, doa, serta haji dan umrah. Coba arahkan pertanyaanmu ke salah satu topik tersebut, ya.',
    greeting: 'Assalamu’alaikum. Ada yang ingin kamu pahami tentang Islam, ibadah, atau doa hari ini?',
    clarify: 'Bisa sebutkan pertanyaan atau konteks Islam yang ingin kamu bahas? Dengan topik yang lebih jelas, aku bisa mencari rujukan yang sesuai.',
    unverified: 'Rujukan untuk jawaban ini belum berhasil diverifikasi. Coba tanyakan kembali dalam beberapa saat; ini tidak berarti doa atau dalilnya tidak ada.',
  }[status];
  return { answer, citedSlugs: [] as string[], needsHuman: false, answerDetails: { version: 1, status, references: [], prayers: [] } as AnswerDetails };
}
