import { describe, expect, it } from 'vitest';
import { draftSchema, focusPrayerDraft, groundDraft, resolvePrayerSources, trustedUrl, type SearchSource } from './chat.evidence';
const url = 'https://nu.or.id/doa/doa-sapu-jagat-9vfRn';
const arabic = 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ';
const source: SearchSource = { url, title: 'Doa Sapu Jagat', content: `Doa ini tercantum dalam Surat Al-Baqarah ayat 201. ${arabic}` };
export const exampleDraft = {
  answer: 'Doa ini tercantum dalam Al-Baqarah ayat 201. [1]', citedSlugs: [], needsHuman: false,
  references: [{ url, quote: 'Doa ini tercantum dalam Surat Al-Baqarah ayat 201.' }],
  prayers: [{ title: 'Doa Sapu Jagat', arabic, translation: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan akhirat serta lindungilah kami dari azab neraka.', evidence: 'QS Al-Baqarah: 201', sourceUrl: url }],
};
describe('source provenance and prayer grounding', () => {
  it('focuses a recitation-only request on its card without bypassing evidence checks', () => {
    const focused = focusPrayerDraft({ ...exampleDraft, answer: 'Unsolicited claims [2].', references: [...exampleDraft.references, { url: 'https://nu.or.id/other', quote: 'Unused commentary from a separate page.' }] });
    expect(focused.references).toHaveLength(1);
    expect(focused.answer).not.toContain('Unsolicited');
    expect(groundDraft(focused, [source])?.details.prayers).toHaveLength(1);
    expect(groundDraft(focusPrayerDraft({ ...exampleDraft, prayers: [{ ...exampleDraft.prayers[0], arabic: 'اللهم ' + arabic }] }), [source])).toBeNull();
  });
  it('resolves a misplaced prayer URL only to a retrieved page containing the same Arabic', () => {
    const candidate = { ...exampleDraft, prayers: [{ ...exampleDraft.prayers[0], sourceUrl: 'https://nu.or.id/other' }] };
    const resolved = resolvePrayerSources(candidate, [source]);
    expect(resolved.prayers[0].sourceUrl).toBe(url);
    expect(groundDraft(resolved, [source])?.details.status).toBe('sourced');
    expect(resolvePrayerSources(candidate, []).prayers[0].sourceUrl).toBe(candidate.prayers[0].sourceUrl);
    expect(groundDraft(resolvePrayerSources(candidate, []), [])).toBeNull();
  });
  it('removes unused references without leaving gaps in citation numbering', () => {
    const another = { ...source, url: 'https://nu.or.id/doa/another' };
    const result = groundDraft({ ...exampleDraft, answer: 'Doa yang diminta [2].', references: [{ url: another.url, quote: exampleDraft.references[0].quote }, ...exampleDraft.references] }, [another, source]);
    expect(result?.details.references).toEqual([{ id: 1, url, title: source.title, publisher: 'nu.or.id' }]);
    expect(result?.answer).toBe('Doa yang diminta [1].');
    expect(result?.details.prayers[0].sourceId).toBe(1);
  });
  it('resolves only retrieved references and preserves structured Arabic and attribution', () => {
    const result = groundDraft(exampleDraft, [source]);
    expect(result?.details).toMatchObject({ status: 'sourced', references: [{ id: 1, url, title: source.title }], prayers: [{ arabic, sourceId: 1 }] });
  });
  it.each(['http://nu.or.id/doa/x', 'https://nu.or.id.attacker.test/x', 'javascript:alert(1)', 'https://nu.or.id@attacker.test/x', 'https://user:pass@nu.or.id/x', 'https://nu.or.id:8443/x', 'https://nu.or.id/', 'https://nu.or.id/search?q=doa'])('rejects untrusted or non-evidence URL %s', value => {
    expect(trustedUrl(value)).toBeNull();
  });
  it('accepts a real subdomain and removes tracking parameters', () => {
    expect(trustedUrl('https://islam.nu.or.id/doa/test?utm_source=chat#part')).toBe('https://islam.nu.or.id/doa/test');
  });
  it('does not accept a plausible URL missing from retrieval', () => {
    expect(groundDraft(exampleDraft, [{ ...source, url: 'https://nu.or.id/doa/different-page' }])).toBeNull();
  });
  it('does not accept a fabricated quotation even on a real retrieved page', () => {
    expect(groundDraft({ ...exampleDraft, references: [{ url, quote: 'Kalimat ini dibuat oleh model dan tidak ada di sumber.' }] }, [source])).toBeNull();
  });
  it('rejects missing sources, invalid citation numbers, and model URLs in prose', () => {
    expect(groundDraft({ ...exampleDraft, references: [] }, [source])).toBeNull();
    expect(groundDraft({ ...exampleDraft, answer: 'Jawaban [2]' }, [source])).toBeNull();
    expect(groundDraft({ ...exampleDraft, answer: `Baca https://nu.or.id/doa/test [1]` }, [source])).toBeNull();
  });
  it('rejects modified Arabic and a prayer assigned to a different source', () => {
    expect(groundDraft({ ...exampleDraft, prayers: [{ ...exampleDraft.prayers[0], arabic: 'اللهم ' + arabic }] }, [source])).toBeNull();
    expect(groundDraft({ ...exampleDraft, prayers: [{ ...exampleDraft.prayers[0], sourceUrl: 'https://quran.com/2/201' }] }, [source])).toBeNull();
  });
  it('allows diacritic variation while preserving the Arabic wording', () => {
    const plain = arabic.replace(/[\u064b-\u065f]/g, '');
    expect(groundDraft({ ...exampleDraft, prayers: [{ ...exampleDraft.prayers[0], arabic: plain }] }, [source])?.details.status).toBe('sourced');
  });
  it('accepts Arabic punctuation and direction-mark differences without changing words', () => {
    const punctuated = { ...source, content: source.content.replace('حَسَنَةً وَفِي', 'حَسَنَةً،\u200f وَفِي') };
    expect(groundDraft(exampleDraft, [punctuated])?.details.status).toBe('sourced');
    expect(groundDraft(exampleDraft, [{ ...source, content: source.content.replace('حَسَنَةً وَفِي', 'حَسَنَةً [...] وَفِي') }])).toBeNull();
    expect(groundDraft({ ...exampleDraft, prayers: [{ ...exampleDraft.prayers[0], arabic: arabic.replace('الدُّنْيَا', 'الجنة') }] }, [source])).toBeNull();
  });
  it('treats straight and typographic quotation marks as the same quotation', () => {
    const quoted = { ...source, content: source.content.replace('Doa ini', 'Doa ‘ini’') };
    const candidate = { ...exampleDraft, references: [{ url, quote: exampleDraft.references[0].quote.replace('Doa ini', "Doa 'ini'") }] };
    expect(groundDraft(candidate, [quoted])?.details.status).toBe('sourced');
  });
  it('coalesces repeated pages and remaps every citation and prayer to the unique source', () => {
    const result = groundDraft({ ...exampleDraft, answer: 'Konteks [1]. Penjelasan lain [2].', references: [...exampleDraft.references, ...exampleDraft.references] }, [source]);
    expect(result?.details.references).toHaveLength(1);
    expect(result?.answer).toBe('Konteks [1]. Penjelasan lain [1].');
    expect(result?.details.prayers[0].sourceId).toBe(1);
    expect(groundDraft({ ...exampleDraft, references: [...exampleDraft.references, { url, quote: 'Kutipan palsu tidak boleh lolos karena URL-nya sama.' }] }, [source])).toBeNull();
  });
  it('accepts the official Arabic source but rejects lookalike hosts', () => {
    expect(trustedUrl('https://www.dar-alifta.org/ar/fatwa/details/17241/example')).not.toBeNull();
    expect(trustedUrl('https://dar-alifta.org.attacker.test/ar/fatwa')).toBeNull();
  });
  it('rejects incomplete prayer cards and Arabic outside the dedicated cards', () => {
    expect(draftSchema.safeParse({ ...exampleDraft, prayers: [{ title: 'Incomplete', arabic }] }).success).toBe(false);
    expect(groundDraft({ ...exampleDraft, answer: `${arabic} [1]` }, [source])).toBeNull();
  });
});
