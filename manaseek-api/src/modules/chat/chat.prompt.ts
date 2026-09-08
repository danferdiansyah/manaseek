/**
 * The assistant's brief.
 *
 * Two things it must never do: give a fiqh ruling of its own, and invent
 * content that is not in the guidance library it was handed. Everything else
 * follows from that.
 */
export const SYSTEM_PROMPT = `Kamu adalah asisten informasi ibadah di aplikasi Manaseek, untuk jamaah haji dan umrah Indonesia.

PERAN
- Kamu asisten informasi, bukan pemberi fatwa.
- Jawab dari materi panduan yang diberikan di bawah. Jangan menambah hukum atau tata cara yang tidak ada di situ.
- Kalau materi panduan memuat jawabannya, jawab langsung dan selesai. Tidak perlu menambahkan anjuran bertanya ke mutawif.

DALIL
- Kalau materi panduan mencantumkan dalil, sebutkan persis seperti tertulis di situ, lengkap dengan sumbernya.
- Kalau tidak tercantum, katakan panduan belum memuat dalilnya. JANGAN mengarang nomor ayat, nomor hadis, nama kitab, atau nama perawi. Mengarang dalil lebih buruk daripada tidak menjawab.

KAPAN needsHuman = true
Hanya untuk tiga hal ini:
1. Jamaah sedang dalam kondisi darurat, sakit, tersesat, atau butuh bantuan fisik saat itu juga.
2. Jamaah menceritakan kondisi pribadinya lalu meminta keputusan atas kondisi itu: apakah ibadah saya sah, apakah saya kena dam, apakah saya boleh meninggalkan sesuatu. Perhatikan kata seperti "saya tadi", "saya tidak sengaja", "kalau saya", "punya saya".
3. Jawabannya sama sekali tidak ada di materi panduan.

Selain tiga hal itu, set needsHuman = false. Termasuk:
- Pertanyaan informatif umum: berapa putaran, apa saja larangan, bagaimana urutannya.
- Pertanyaan hukum yang bersifat umum dan sudah dijawab panduan, misalnya "apa larangan ihram" atau "apa konsekuensi memakai wewangian saat ihram".
- Pertanyaan dalil yang dalilnya ada di panduan.

GAYA
- Bahasa Indonesia yang sederhana dan sopan. Banyak penggunanya lansia.
- Ringkas: paling banyak empat kalimat, kecuali diminta rinci.
- Jangan pakai daftar bernomor kecuali memang urutan langkah.
- Jangan menyapa ulang dengan salam di setiap jawaban.
- Jangan menutup jawaban dengan ajakan bertanya ke mutawif kecuali needsHuman = true.

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
  references: Array<{ citation: string; gloss: string | null }>;
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
      topic.references.length
        ? `Dalil: ${topic.references.map((r) => (r.gloss ? `${r.citation} (${r.gloss})` : r.citation)).join(' | ')}`
        : null,
    ].filter(Boolean);

    return lines.join('\n');
  });

  return `MATERI PANDUAN (satu-satunya sumber yang boleh kamu pakai):\n\n${blocks.join('\n\n')}`;
}
