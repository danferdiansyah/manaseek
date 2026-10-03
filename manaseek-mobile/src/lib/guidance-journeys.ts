/** Bundled reading guide, available without a content API request.
 * Summaries checked against the linked sources on 2026-10-03.
 * Reading marks are not a record or assessment of ritual completion.
 */
export type JourneyId = "umrah" | "tamattu" | "ifrad" | "qiran";
export type GuideSource = { title: string; url: string };
export type GuideStep = {
  id: string;
  title: string;
  phase: string;
  when: string;
  place: string;
  summary: string;
  actions: string[];
  note?: string;
  sources: GuideSource[];
};
export type GuideJourney = {
  id: JourneyId;
  title: string;
  description: string;
  note: string;
  steps: GuideStep[];
};
const source = (title: string, url: string): GuideSource => ({ title, url });
export const guideSources = {
  types: source(
    "Kemenag · Cara pelaksanaan haji",
    "https://sulteng.kemenag.go.id/berita/4d64/02-12-2022-dialog-religi-kasi-phu-h-burhan-munawir-jelaskan-macammacam-haji-dan-cara-pelaksanaannya",
  ),
  miqat: source(
    "Kemenag · Miqat & larangan ihram",
    "https://ntt.kemenag.go.id/opini/808/catat-ini-tempat-miqat-dan-larangan-ihram-bagi-jemaah-haji",
  ),
  umrah: source(
    "Kemenag · Urutan pelaksanaan umrah",
    "https://maluku.kemenag.go.id/artikel/urutan-pelaksanaan-ibadah-umroh",
  ),
  tawaf: source(
    "Kemenag · Tawaf & sa’i",
    "https://sulteng.kemenag.go.id/berita/mgln/dialog-religi-kasi-phu-burhan-munawir-jelaskan-makna-thawaf--sa%E2%80%99i-dalam-pelaksanaan-ibadah-haji",
  ),
  sai: source(
    "NU Online · Tata cara sa’i",
    "https://islam.nu.or.id/syariah/hukum-naik-bukit-shafa-dan-marwah-ketika-sai-hGSPq",
  ),
  wukuf: source(
    "Kemenag · Wukuf di Arafah",
    "https://kalteng.kemenag.go.id/kanwil/cetak/530921/Luar-Biasa-Begini-Keutamaan-Wukuf-di-Arafah-Dalam-Ibadah-Haji",
  ),
  manasik: source(
    "Kemenag · Praktik manasik haji",
    "https://kaltim.kemenag.go.id/berita/read/508064",
  ),
  mina: source(
    "Kemenag · Mabit di Mina",
    "https://jateng.kemenag.go.id/jemaah-haji-rawan-tersesat-di-mina/",
  ),
  jumrah: source(
    "Kemenag · Manasik & lontar jumrah",
    "https://maluku.kemenag.go.id/artikel/kakan-kemenag-berikan-bimbingan-manasik-haji-reguler-tahun-1446-h-2025-m",
  ),
  nafar: source(
    "Kemenag · Nafar & tawaf ifadah",
    "https://jateng.kemenag.go.id/fase-mina-selesai-jemaah-bersiap-tawaf-ifadhah/",
  ),
  wada: source(
    "Kemenag · Tawaf wada’ & keringanannya",
    "https://papuabarat.kemenag.go.id/kanwil/jemaah-perempuan-sedang-haid-tidak-wajib-tawaf-wada-ok1k4",
  ),
  time: source(
    "NU Online · Waktu pelaksanaan manasik",
    "https://islam.nu.or.id/haji-umrah-dan-kurban/jika-musim-haji-ada-3-bulan-mengapa-hanya-dilaksanakan-saat-dzulhijjah-UkB8r",
  ),
};
const preparation: GuideStep = {
  id: "persiapan",
  title: "Siapkan perjalanan",
  phase: "Sebelum berangkat",
  when: "Sebelum keberangkatan",
  place: "Tanah air",
  summary: "Kenali alur ibadah dan sepakati rencana dengan pembimbing.",
  actions: [
    "Pastikan dokumen dan perlengkapan bersama penyelenggara perjalanan.",
    "Simpan kontak pembimbing, lokasi penginapan, dan titik kumpul rombongan.",
    "Pelajari miqat sesuai rute kedatangan serta kebutuhan pendampinganmu.",
  ],
  note: "Rundown ini membantu belajar. Jadwal perjalanan dan keringanan ibadah mengikuti arahan pembimbing rombongan.",
  sources: [guideSources.miqat],
};
const umrahSteps: GuideStep[] = [
  {
    id: "ihram-umrah",
    title: "Ihram & niat umrah",
    phase: "Mulai ibadah",
    when: "Di miqat",
    place: "Miqat sesuai rute",
    summary: "Mulai dengan niat umrah sebelum melewati batas miqat.",
    actions: [
      "Siapkan diri dan pakaian ihram sebelum mencapai miqat.",
      "Berniat umrah di miqat, lalu perbanyak talbiyah menuju Makkah.",
      "Sejak berniat, jaga larangan ihram hingga tahallul.",
    ],
    note: "Miqat bergantung pada rute kedatangan. Pastikan lokasinya dengan pembimbing sebelum perjalanan.",
    sources: [guideSources.miqat],
  },
  {
    id: "tawaf-umrah",
    title: "Tawaf umrah",
    phase: "Di Masjidil Haram",
    when: "Setelah ihram",
    place: "Mengelilingi Ka’bah",
    summary: "Selesaikan tujuh putaran tawaf.",
    actions: [
      "Bersuci dan tutup aurat sebelum tawaf.",
      "Mulai sejajar Hajar Aswad, dengan Ka’bah di sebelah kiri.",
      "Lengkapi tujuh putaran; satu putaran berakhir kembali sejajar Hajar Aswad.",
    ],
    note: "Jaga ruang orang lain. Tidak perlu memaksakan diri mendekati Hajar Aswad ketika padat.",
    sources: [guideSources.tawaf, guideSources.umrah],
  },
  {
    id: "sai-umrah",
    title: "Sa’i Shafa–Marwah",
    phase: "Di Masjidil Haram",
    when: "Setelah tawaf",
    place: "Shafa → Marwah",
    summary: "Tujuh kali perjalanan, berakhir di Marwah.",
    actions: [
      "Mulai dari Shafa menuju Marwah: ini perjalanan pertama.",
      "Marwah menuju Shafa dihitung perjalanan kedua, bukan satu perjalanan pulang-pergi.",
      "Lanjutkan hingga perjalanan ketujuh selesai di Marwah.",
    ],
    note: "Tempuh seluruh jarak sa’i. Tidak perlu mendaki bukit; bantuan kursi roda dapat digunakan sesuai kebutuhan.",
    sources: [guideSources.sai],
  },
  {
    id: "tahallul-umrah",
    title: "Tahallul umrah",
    phase: "Menutup umrah",
    when: "Setelah sa’i",
    place: "Tempat mencukur rambut",
    summary: "Akhiri rangkaian umrah dengan mencukur atau memotong rambut.",
    actions: [
      "Pastikan tawaf dan sa’i sudah lengkap.",
      "Laki-laki mencukur atau memendekkan rambut; perempuan memotong rambut.",
      "Setelah rangkaian selesai dan tahallul, larangan ihram umrah berakhir.",
    ],
    note: "Pada haji Tamattu’, ini baru menyelesaikan umrah. Rangkaian hajinya dilaksanakan setelahnya.",
    sources: [guideSources.umrah, guideSources.types],
  },
];
const wukuf: GuideStep = {
  id: "wukuf",
  title: "Wukuf di Arafah",
  phase: "Puncak haji",
  when: "9 Zulhijah",
  place: "Arafah",
  summary: "Hadir di Arafah pada waktu wukuf adalah rukun haji.",
  actions: [
    "Pastikan berada di wilayah Arafah bersama rombongan.",
    "Rentang waktu wukuf: setelah matahari tergelincir pada 9 Zulhijah sampai fajar 10 Zulhijah.",
    "Isi waktu dengan doa, zikir, dan istigfar; ikuti jadwal ibadah serta keberangkatan rombongan.",
  ],
  note: "Tidak ada satu bacaan khusus yang wajib untuk wukuf. Untuk kondisi sakit, koordinasikan pendampingan dengan petugas.",
  sources: [guideSources.wukuf],
};
const muzdalifah: GuideStep = {
  id: "muzdalifah",
  title: "Mabit di Muzdalifah",
  phase: "Puncak haji",
  when: "Malam 10 Zulhijah",
  place: "Arafah → Muzdalifah",
  summary: "Setelah wukuf, bergerak ke Muzdalifah bersama rombongan.",
  actions: [
    "Berangkat setelah matahari terbenam sesuai arahan petugas.",
    "Laksanakan salat Magrib dan Isya dengan pengaturan rombongan.",
    "Mabit di Muzdalifah, lalu lanjutkan ke Mina pada waktu yang ditetapkan pembimbing.",
  ],
  note: "Ketentuan mabit dan skema keringanan seperti murur perlu dikonfirmasi kepada pembimbing, terutama bagi lansia atau yang sakit.",
  sources: [guideSources.manasik],
};
const aqabah: GuideStep = {
  id: "aqabah",
  title: "Jumrah Aqabah & tahallul awal",
  phase: "Di Mina",
  when: "10 Zulhijah",
  place: "Jamarat · Mina",
  summary: "Lontar Aqabah, lalu mencukur atau memotong rambut.",
  actions: [
    "Ikuti jadwal lontar rombongan menuju Jumrah Aqabah.",
    "Lontarkan tujuh kerikil, satu per satu.",
    "Dalam alur ini, lanjutkan mencukur atau memotong rambut untuk tahallul awal.",
  ],
  note: "Setelah tahallul awal, hubungan suami istri masih dilarang. Rangkaian haji belum selesai.",
  sources: [guideSources.manasik],
};
const mina: GuideStep = {
  id: "mina",
  title: "Mabit & jumrah hari Tasyrik",
  phase: "Di Mina",
  when: "11–12 / 13 Zulhijah",
  place: "Mina · Jamarat",
  summary: "Mabit dan lontar tiga jumrah sesuai pilihan nafar.",
  actions: [
    "Mabit pada malam 11 dan 12 Zulhijah; tambah malam 13 untuk nafar tsani.",
    "Pada hari Tasyrik, lontar Ula → Wustha → Aqabah. Masing-masing tujuh kerikil, satu per satu.",
    "Nafar awal: keluar dari Mina sebelum matahari terbenam tanggal 12. Nafar tsani: lanjutkan hingga lontar tanggal 13.",
  ],
  note: "Pilihan nafar, jam lontar, dan keringanan untuk jemaah uzur mengikuti pembimbing serta pengaturan petugas.",
  sources: [guideSources.mina, guideSources.jumrah, guideSources.nafar],
};
function ifadah(earlySai: boolean): GuideStep {
  return {
    id: "ifadah",
    title: "Tawaf ifadah & sa’i haji",
    phase: "Menyempurnakan haji",
    when: "Mulai 10 Zulhijah · sesuai rombongan",
    place: "Masjidil Haram",
    summary: "Lengkapi rukun haji sebelum meninggalkan Makkah.",
    actions: [
      "Laksanakan tawaf ifadah tujuh putaran dalam keadaan suci dan menutup aurat.",
      earlySai
        ? "Jika sa’i haji sudah dilakukan setelah tawaf qudum, tidak perlu diulang. Jika belum, lakukan sa’i setelah tawaf ifadah."
        : "Laksanakan sa’i haji tujuh perjalanan dari Shafa sampai Marwah; sa’i umrah sebelumnya tidak menggantikannya.",
      "Pastikan rangkaian menuju tahallul tsani lengkap bersama pembimbing.",
    ],
    note: "Tawaf ifadah dapat dijadwalkan sebelum atau sesudah fase Mina. Urutan kartu ini bukan kewajiban menunda tawaf hingga selesai Tasyrik.",
    sources: [guideSources.tawaf, guideSources.time, guideSources.nafar],
  };
}
const wada: GuideStep = {
  id: "wada",
  title: "Tawaf wada’ & kepulangan",
  phase: "Sebelum pulang",
  when: "Menjelang meninggalkan Makkah",
  place: "Masjidil Haram",
  summary: "Tawaf perpisahan sebelum meninggalkan Makkah.",
  actions: [
    "Pastikan seluruh rangkaian haji sudah lengkap bersama pembimbing.",
    "Jadwalkan tawaf wada’ mendekati waktu keberangkatan dari Makkah.",
    "Siapkan barang dan ikuti titik kumpul serta jadwal rombongan.",
  ],
  note: "Perempuan yang haid atau nifas mendapat keringanan tidak melakukan tawaf wada’. Kondisi uzur lainnya dibicarakan dengan pembimbing.",
  sources: [guideSources.wada],
};
function earlyHajj(kind: "ifrad" | "qiran"): GuideStep[] {
  return [
    {
      id: "ihram-haji",
      title: kind === "qiran" ? "Ihram haji & umrah" : "Ihram haji",
      phase: "Mulai ibadah",
      when: "Di miqat",
      place: "Miqat sesuai rute",
      summary:
        kind === "qiran"
          ? "Niatkan haji dan umrah dalam satu ihram."
          : "Niatkan haji terlebih dahulu.",
      actions: [
        "Bersiap dan berniat di miqat sesuai rute.",
        "Perbanyak talbiyah dan jaga larangan ihram.",
        "Tetap dalam ihram hingga tiba waktunya tahallul haji; tidak ada tahallul umrah di awal.",
      ],
      note:
        kind === "qiran"
          ? "Qiran memiliki ketentuan dam nusuk. Atur pelaksanaannya melalui pembimbing atau penyelenggara."
          : "Ifrad tidak mewajibkan dam nusuk karena jenis hajinya. Dam karena pelanggaran adalah pembahasan berbeda.",
      sources: [guideSources.types, guideSources.miqat],
    },
    {
      id: "qudum",
      title: "Tiba di Makkah",
      phase: "Sebelum puncak haji",
      when: "Sebelum wukuf · bila memungkinkan",
      place: "Makkah",
      summary: "Tawaf qudum sebagai penghormatan kedatangan.",
      actions: [
        "Tawaf qudum disunahkan bagi jemaah Ifrad dan Qiran yang tiba sebelum wukuf.",
        "Sa’i haji dapat dilakukan setelah tawaf qudum atau setelah tawaf ifadah. Tentukan bersama pembimbing.",
        "Tetap jaga larangan ihram dan ikuti pergerakan rombongan menuju Arafah.",
      ],
      note: "Tawaf qudum tidak menggantikan tawaf ifadah. Bila datang mendekati wukuf, utamakan arahan pembimbing untuk mencapai Arafah.",
      sources: [guideSources.tawaf, guideSources.time],
    },
  ];
}
const hajjEnd = (earlySai: boolean) => [
  wukuf,
  muzdalifah,
  aqabah,
  mina,
  ifadah(earlySai),
  wada,
];
export const journeys: Record<JourneyId, GuideJourney> = {
  umrah: {
    id: "umrah",
    title: "Umrah",
    description: "Dari miqat hingga tahallul.",
    note: "Ikuti urutan ihram → tawaf → sa’i → tahallul. Persiapan membantu sebelum memulai ibadah.",
    steps: [preparation, ...umrahSteps],
  },
  tamattu: {
    id: "tamattu",
    title: "Haji Tamattu’",
    description: "Umrah dahulu, lalu berihram kembali untuk haji.",
    note: "Ada ketentuan dam nusuk. Jadwal dan pelaksanaannya dibicarakan dengan pembimbing.",
    steps: [
      preparation,
      ...umrahSteps,
      {
        id: "ihram-haji",
        title: "Berihram kembali untuk haji",
        phase: "Menuju puncak haji",
        when: "Menjelang wukuf · sesuai rombongan",
        place: "Makkah → Arafah",
        summary:
          "Setelah umrah selesai, mulai rangkaian haji dengan niat baru.",
        actions: [
          "Bersiap memakai pakaian ihram di tempat tinggal di Makkah.",
          "Niatkan haji, perbanyak talbiyah, dan kembali jaga larangan ihram.",
          "Ikuti jadwal rombongan menuju Mina atau langsung ke Arafah.",
        ],
        note: "Pergerakan pada sekitar 8 Zulhijah mengikuti pengaturan rombongan. Pastikan sudah berihram sebelum wukuf.",
        sources: [guideSources.types, guideSources.manasik],
      },
      ...hajjEnd(false),
    ],
  },
  ifrad: {
    id: "ifrad",
    title: "Haji Ifrad",
    description: "Mulai dengan haji, tanpa umrah di awal.",
    note: "Jika akan berumrah setelah haji, buat rencana terpisah dengan pembimbing. Panduan ini berfokus pada rangkaian hajinya.",
    steps: [preparation, ...earlyHajj("ifrad"), ...hajjEnd(true)],
  },
  qiran: {
    id: "qiran",
    title: "Haji Qiran",
    description: "Haji dan umrah dalam satu ihram.",
    note: "Tidak ada tahallul umrah sebelum puncak haji. Ada ketentuan dam nusuk; koordinasikan dengan pembimbing.",
    steps: [preparation, ...earlyHajj("qiran"), ...hajjEnd(true)],
  },
};
export const journeyIds = Object.keys(journeys) as JourneyId[];
export function matchesGuideStep(step: GuideStep, query: string) {
  const normalize = (text: string) =>
    text
      .toLocaleLowerCase("id")
      .replace(/[’'‘]/g, "")
      .replace(/thawaf/g, "tawaf")
      .replace(/umroh/g, "umrah")
      .replace(/\bsafa\b/g, "shafa")
      .replace(/[–—-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  return normalize(`${step.title} ${step.place} ${step.phase}`).includes(
    normalize(query),
  );
}
export type GuideProgress = {
  version: 1;
  selected: JourneyId | null;
  read: Record<JourneyId, string[]>;
  last: Partial<Record<JourneyId, string>>;
};
export const emptyGuideProgress = (): GuideProgress => ({
  version: 1,
  selected: null,
  read: { umrah: [], tamattu: [], ifrad: [], qiran: [] },
  last: {},
});
export function normalizeGuideProgress(input: unknown): GuideProgress {
  const result = emptyGuideProgress();
  if (!input || typeof input !== "object") return result;
  const value = input as Partial<GuideProgress>;
  if (value.version !== 1) return result;
  if (journeyIds.includes(value.selected as JourneyId))
    result.selected = value.selected!;
  for (const id of journeyIds) {
    const last = value.last?.[id];
    if (journeys[id].steps.some((step) => step.id === last))
      result.last[id] = last;
    const read = value.read?.[id];
    if (Array.isArray(read))
      result.read[id] = [
        ...new Set(
          read.filter((step) => journeys[id].steps.some((s) => s.id === step)),
        ),
      ];
  }
  return result;
}
export function toggleGuideRead(
  progress: GuideProgress,
  journey: JourneyId,
  step: string,
): GuideProgress {
  if (!journeys[journey].steps.some((s) => s.id === step)) return progress;
  const read = progress.read[journey];
  return {
    ...progress,
    read: {
      ...progress.read,
      [journey]: read.includes(step)
        ? read.filter((id) => id !== step)
        : [...read, step],
    },
  };
}
export function nextGuideStep(progress: GuideProgress, journey: JourneyId) {
  const last = journeys[journey].steps.find(
    (step) => step.id === progress.last[journey],
  );
  if (last && !progress.read[journey].includes(last.id)) return last;
  return (
    journeys[journey].steps.find(
      (step) => !progress.read[journey].includes(step.id),
    ) ?? null
  );
}
