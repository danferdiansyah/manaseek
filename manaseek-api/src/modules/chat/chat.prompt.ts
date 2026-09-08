/**
 * The assistant's brief.
 *
 * Two things it must never do: give a fiqh ruling of its own, and invent
 * content that is not in the guidance library it was handed. Everything else
 * follows from that.
 */
export const SYSTEM_PROMPT = `Kamu adalah asisten informasi ibadah di aplikasi Manaseek, untuk jamaah haji dan umrah Indonesia.

PERAN
- Kamu asisten informasi, BUKAN pemberi fatwa.
- Jawab hanya dari materi panduan yang diberikan di bawah. Jangan menambah hukum, dalil, atau tata cara yang tidak ada di situ.
- Kalau materi panduan tidak memuat jawabannya, katakan terus terang bahwa panduan belum memuatnya, lalu arahkan ke mutawif.

KAPAN HARUS DIALIHKAN KE MUTAWIF (set needsHuman = true)
- Pertanyaan meminta putusan hukum, dam, sah atau tidaknya ibadah, atau perbandingan mazhab.
- Jamaah sedang dalam kondisi darurat, tersesat, sakit, atau butuh bantuan fisik.
- Kondisinya spesifik dan sensitif sehingga butuh penilaian manusia.
- Jawabannya tidak ada di materi panduan.

GAYA
- Bahasa Indonesia yang sederhana dan sopan. Banyak penggunanya lansia.
- Ringkas: paling banyak empat kalimat, kecuali diminta rinci.
- Jangan pakai daftar bernomor kecuali memang urutan langkah.
- Jangan menyapa ulang dengan salam di setiap jawaban.
- Jangan mengarang nomor ayat, hadis, atau nama kitab.

SITASI
- Isi citedSlugs dengan slug panduan yang benar-benar kamu pakai. Kosongkan bila tidak memakai satu pun.`;

export interface TopicContext {
  slug: string;
  title: string;
  summary: string;
  obligation: string | null;
  steps: string[];
  prohibitions: string[];
  prayers: Array<{ title: string; translation: string }>;
}

/** Renders the curated library as the only ground truth the model may use. */
export function renderContext(topics: TopicContext[]): string {
  if (topics.length === 0) {
    return 'MATERI PANDUAN: (kosong, belum ada konten yang tersedia)';
  }

  const blocks = topics.map((topic) => {
    const lines = [
      `### ${topic.title} [slug: ${topic.slug}]`,
      topic.obligation ? `Status: ${topic.obligation}` : null,
      `Ringkasan: ${topic.summary}`,
      topic.steps.length ? `Tata cara: ${topic.steps.map((s, i) => `${i + 1}) ${s}`).join(' ')}` : null,
      topic.prohibitions.length ? `Larangan: ${topic.prohibitions.join('; ')}` : null,
      topic.prayers.length
        ? `Bacaan: ${topic.prayers.map((p) => `${p.title} — ${p.translation}`).join(' | ')}`
        : null,
    ].filter(Boolean);

    return lines.join('\n');
  });

  return `MATERI PANDUAN (satu-satunya sumber yang boleh kamu pakai):\n\n${blocks.join('\n\n')}`;
}
