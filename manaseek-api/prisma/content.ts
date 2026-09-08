/**
 * Guidance content seed.
 *
 * Everything here is written as DRAFT on purpose. The product commits to
 * content curated by qualified pembimbing, so nothing gets ContentStatus
 * PUBLISHED until a reviewer signs it off. The client reads that status and
 * tells the jamaah the library is still under review.
 */
import {
  ContentCategory,
  ContentStatus,
  PrismaClient,
  ReferenceKind,
  RitualPhase,
} from '@prisma/client';

interface TopicSeed {
  slug: string;
  title: string;
  summary: string;
  phase: RitualPhase;
  categories: ContentCategory[];
  obligation?: string;
  readingMinutes: number;
  icon: string;
  steps: string[];
  prohibitions?: Array<{ text: string; consequence?: string }>;
  /**
   * Dalil. Deliberately limited to the most widely cited references, recorded
   * as citations rather than transcribed Arabic, so a reviewer verifies
   * attribution rather than proofreading a transcription. None is verified
   * until a pembimbing clears it.
   */
  references?: Array<{ kind: ReferenceKind; citation: string; gloss?: string }>;
  prayers?: Array<{
    slug: string;
    title: string;
    arabic: string;
    transliteration: string;
    translation: string;
    context?: string;
  }>;
}

const TOPICS: TopicSeed[] = [
  {
    slug: 'persiapan-keberangkatan',
    title: 'Persiapan Keberangkatan',
    summary: 'Dokumen, kesehatan, dan bekal sebelum berangkat',
    phase: RitualPhase.PREPARATION,
    categories: [ContentCategory.PERSIAPAN],
    readingMinutes: 4,
    icon: 'ClipboardList',
    steps: [
      'Pastikan paspor berlaku minimal enam bulan sejak tanggal keberangkatan',
      'Lengkapi vaksinasi yang diwajibkan dan bawa kartu vaksinasinya',
      'Siapkan obat pribadi beserta salinan resep dokter',
      'Catat nomor kontak darurat ketua rombongan dan pembimbing',
      'Pelajari tata cara ibadah sejak di tanah air agar tidak tergesa di Tanah Suci',
    ],
  },
  {
    slug: 'ihram-dan-niat',
    title: 'Ihram & Niat',
    summary: 'Rukun pertama, dimulai dari miqat',
    phase: RitualPhase.IHRAM,
    categories: [ContentCategory.UMRAH, ContentCategory.HAJJ],
    obligation: 'Rukun',
    readingMinutes: 5,
    icon: 'Layers',
    steps: [
      'Mandi sunnah dan berwudhu sebelum mengenakan pakaian ihram',
      'Kenakan pakaian ihram: dua lembar kain putih tanpa jahitan bagi laki-laki, pakaian menutup aurat bagi perempuan',
      'Shalat sunnah ihram dua rakaat bila memungkinkan',
      'Berniat ihram ketika sampai di miqat',
      'Perbanyak talbiyah sepanjang perjalanan hingga memulai thawaf',
    ],
    prohibitions: [
      { text: 'Memotong kuku dan mencabut atau mencukur rambut', consequence: 'Dikenakan dam bila dilakukan dengan sengaja' },
      { text: 'Memakai wewangian pada badan maupun pakaian', consequence: 'Dikenakan dam bila dilakukan dengan sengaja' },
      { text: 'Menutup kepala bagi laki-laki dan menutup wajah serta telapak tangan bagi perempuan' },
      { text: 'Memakai pakaian berjahit yang membentuk tubuh bagi laki-laki' },
      { text: 'Berburu atau membunuh hewan darat' },
      { text: 'Melakukan akad nikah, menikahkan, atau meminang' },
      { text: 'Berhubungan suami istri dan segala pengantarnya', consequence: 'Membatalkan ibadah bila dilakukan sebelum tahalul' },
    ],
    references: [
      {
        kind: ReferenceKind.QURAN,
        citation: 'QS. Ali Imran: 97',
        gloss: 'Kewajiban haji bagi yang mampu menempuh perjalanan ke Baitullah.',
      },
      {
        kind: ReferenceKind.HADITH,
        citation: 'HR. Bukhari dan Muslim, bab miqat haji',
        gloss: 'Penetapan miqat, yaitu batas tempat memulai ihram bagi jamaah dari tiap arah.',
      },
    ],
    prayers: [
      {
        slug: 'talbiyah',
        title: 'Talbiyah',
        arabic:
          'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
        transliteration:
          'Labbaik Allahumma labbaik, labbaika laa syarika laka labbaik, innal hamda wan ni’mata laka wal mulk, laa syarika lak',
        translation:
          'Aku penuhi panggilan-Mu ya Allah, aku penuhi panggilan-Mu. Tiada sekutu bagi-Mu, aku penuhi panggilan-Mu. Sesungguhnya segala puji, nikmat, dan kerajaan adalah milik-Mu, tiada sekutu bagi-Mu.',
        context: 'Dibaca berulang sejak berihram hingga memulai thawaf',
      },
    ],
  },
  {
    slug: 'tawaf',
    title: 'Thawaf',
    summary: "Tujuh putaran mengelilingi Ka'bah",
    phase: RitualPhase.TAWAF,
    categories: [ContentCategory.UMRAH, ContentCategory.HAJJ],
    obligation: 'Rukun',
    readingMinutes: 5,
    icon: 'RotateCcw',
    steps: [
      'Pastikan dalam keadaan suci dari hadas dan menutup aurat',
      'Mulai dari garis sejajar Hajar Aswad dengan mengangkat tangan seraya bertakbir',
      "Kelilingi Ka'bah tujuh putaran berlawanan arah jarum jam dengan Ka'bah di sebelah kiri",
      'Perbanyak doa dan dzikir selama berputar, tidak ada bacaan wajib yang khusus',
      'Setelah tujuh putaran, shalat sunnah dua rakaat di belakang Maqam Ibrahim bila memungkinkan',
      'Minum air zamzam dan berdoa sesuai hajat',
    ],
    references: [
      {
        kind: ReferenceKind.QURAN,
        citation: 'QS. Al-Hajj: 29',
        gloss: 'Perintah melakukan thawaf di Baitullah.',
      },
    ],
    prayers: [
      {
        slug: 'doa-rukun-yamani-hajar-aswad',
        title: 'Doa antara Rukun Yamani dan Hajar Aswad',
        arabic:
          'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        transliteration:
          'Rabbanaa aatinaa fid dunyaa hasanah, wa fil aakhirati hasanah, wa qinaa ‘adzaaban naar',
        translation:
          'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari azab neraka.',
        context: 'Dibaca pada setiap putaran antara Rukun Yamani dan Hajar Aswad',
      },
    ],
  },
  {
    slug: 'sai',
    title: "Sa'i",
    summary: 'Tujuh perjalanan antara Shafa dan Marwah',
    phase: RitualPhase.SAI,
    categories: [ContentCategory.UMRAH, ContentCategory.HAJJ],
    obligation: 'Rukun',
    readingMinutes: 4,
    icon: 'ArrowRightLeft',
    steps: [
      'Menuju Bukit Shafa setelah menyelesaikan thawaf',
      'Naik ke Shafa menghadap kiblat, bertakbir dan berdoa',
      'Berjalan menuju Marwah; laki-laki disunnahkan berlari kecil di antara dua pilar hijau',
      'Perjalanan Shafa ke Marwah dihitung satu kali, demikian sebaliknya, hingga genap tujuh kali',
      "Sa'i berakhir di Marwah pada hitungan ketujuh",
    ],
    references: [
      {
        kind: ReferenceKind.QURAN,
        citation: 'QS. Al-Baqarah: 158',
        gloss: 'Shafa dan Marwah termasuk syiar Allah.',
      },
    ],
    prayers: [
      {
        slug: 'doa-shafa-marwah',
        title: 'Bacaan saat mendekati Shafa',
        arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
        transliteration: 'Innash shafaa wal marwata min sya’aa’irillaah',
        translation: 'Sesungguhnya Shafa dan Marwah adalah sebagian dari syiar Allah.',
        context: 'Dibaca ketika hendak menaiki Bukit Shafa pada putaran pertama',
      },
    ],
  },
  {
    slug: 'tahalul',
    title: 'Tahalul',
    summary: 'Mencukur atau memendekkan rambut',
    phase: RitualPhase.TAHALLUL,
    categories: [ContentCategory.UMRAH, ContentCategory.HAJJ],
    obligation: 'Wajib',
    readingMinutes: 3,
    icon: 'Scissors',
    steps: [
      "Dilakukan setelah menyelesaikan sa'i",
      'Laki-laki mencukur seluruh rambut atau memendekkannya, mencukur habis lebih utama',
      'Perempuan memotong ujung rambut sepanjang kira-kira satu ruas jari',
      'Setelah tahalul, seluruh larangan ihram kembali dibolehkan',
    ],
    references: [
      {
        kind: ReferenceKind.QURAN,
        citation: 'QS. Al-Fath: 27',
        gloss: 'Penyebutan mencukur rambut dan memendekkannya seusai ibadah.',
      },
    ],
  },
  {
    slug: 'wukuf-di-arafah',
    title: 'Wukuf di Arafah',
    summary: 'Puncak ibadah haji pada 9 Dzulhijjah',
    phase: RitualPhase.WUKUF,
    categories: [ContentCategory.HAJJ],
    obligation: 'Rukun',
    readingMinutes: 5,
    icon: 'Sunrise',
    steps: [
      'Berada di Arafah sejak tergelincirnya matahari pada 9 Dzulhijjah hingga terbit fajar 10 Dzulhijjah',
      'Perbanyak doa, dzikir, istighfar, dan membaca Al-Quran',
      'Dengarkan khutbah wukuf dan laksanakan shalat jamak qashar Zuhur dan Ashar',
      'Jaga kondisi tubuh: cukup minum dan hindari terpapar matahari terlalu lama',
      'Wukuf adalah rukun haji; meninggalkannya membuat haji tidak sah',
    ],
    references: [
      {
        kind: ReferenceKind.HADITH,
        citation: 'HR. Abu Dawud, Tirmidzi, Nasai, dan Ibnu Majah',
        gloss: 'Sabda Nabi bahwa haji adalah Arafah, menegaskan wukuf sebagai rukun.',
      },
    ],
  },
  {
    slug: 'mabit-di-muzdalifah',
    title: 'Mabit di Muzdalifah',
    summary: 'Bermalam dan mengumpulkan batu jumrah',
    phase: RitualPhase.MABIT,
    categories: [ContentCategory.HAJJ],
    obligation: 'Wajib',
    readingMinutes: 3,
    icon: 'Moon',
    steps: [
      'Bertolak dari Arafah menuju Muzdalifah setelah matahari terbenam',
      'Laksanakan shalat Maghrib dan Isya secara jamak di Muzdalifah',
      'Bermalam hingga lewat tengah malam, atau hingga fajar bila memungkinkan',
      'Kumpulkan kerikil untuk melontar jumrah',
      'Jamaah lansia dan yang lemah diberi keringanan berangkat lebih awal ke Mina',
    ],
  },
  {
    slug: 'melontar-jumrah',
    title: 'Melontar Jumrah',
    summary: 'Jumrah Ula, Wustha, dan Aqabah di Mina',
    phase: RitualPhase.JUMRAH,
    categories: [ContentCategory.HAJJ],
    obligation: 'Wajib',
    readingMinutes: 4,
    icon: 'Target',
    steps: [
      'Pada 10 Dzulhijjah, lontar Jumrah Aqabah sebanyak tujuh kerikil',
      'Pada hari tasyriq, lontar ketiga jumrah berurutan: Ula, Wustha, lalu Aqabah',
      'Setiap jumrah dilontar tujuh kali, satu kerikil setiap lontaran, sambil bertakbir',
      'Pilih waktu yang lebih lengang untuk menghindari kepadatan',
      'Jamaah yang uzur boleh mewakilkan lontaran kepada orang lain',
    ],
  },
];

const CHECKLIST = [
  { slug: 'paspor', title: 'Paspor berlaku minimal 6 bulan', description: 'Periksa masa berlaku dan halaman kosong' },
  { slug: 'visa', title: 'Visa haji atau umrah sudah terbit', description: null },
  { slug: 'vaksin-meningitis', title: 'Vaksin meningitis dan kartu vaksinasi', description: null },
  { slug: 'pemeriksaan-kesehatan', title: 'Pemeriksaan kesehatan dan surat keterangan dokter', description: null },
  { slug: 'obat-pribadi', title: 'Obat pribadi beserta salinan resep', description: 'Bawa dalam tas kabin, bukan bagasi' },
  { slug: 'kain-ihram', title: 'Kain ihram atau pakaian ihram', description: null },
  { slug: 'perlengkapan-shalat', title: 'Perlengkapan shalat', description: null },
  { slug: 'sandal-jepit', title: 'Sandal tanpa jahitan menutup mata kaki', description: null },
  { slug: 'obat-anti-mabuk', title: 'Perlengkapan pribadi tanpa pewangi', description: 'Sabun dan pasta gigi tanpa parfum untuk masa ihram' },
  { slug: 'uang-riyal', title: 'Uang riyal secukupnya', description: null },
  { slug: 'kontak-darurat', title: 'Nomor kontak ketua rombongan dan pembimbing', description: 'Simpan juga di ponsel keluarga di tanah air' },
  { slug: 'manasik', title: 'Ikut bimbingan manasik hingga selesai', description: null },
];

export async function seedContent(prisma: PrismaClient): Promise<void> {
  for (const [index, topic] of TOPICS.entries()) {
    const record = await prisma.guidanceTopic.upsert({
      where: { slug: topic.slug },
      create: {
        slug: topic.slug,
        title: topic.title,
        summary: topic.summary,
        phase: topic.phase,
        categories: topic.categories,
        obligation: topic.obligation,
        readingMinutes: topic.readingMinutes,
        icon: topic.icon,
        orderIndex: index,
        status: ContentStatus.DRAFT,
      },
      update: {
        title: topic.title,
        summary: topic.summary,
        orderIndex: index,
        categories: topic.categories,
      },
    });

    // Steps and prohibitions are positional, so replace them wholesale.
    await prisma.guidanceStep.deleteMany({ where: { topicId: record.id } });
    await prisma.guidanceStep.createMany({
      data: topic.steps.map((text, orderIndex) => ({ topicId: record.id, orderIndex, text })),
    });

    await prisma.reference.deleteMany({ where: { topicId: record.id } });
    if (topic.references?.length) {
      await prisma.reference.createMany({
        data: topic.references.map((r, orderIndex) => ({
          topicId: record.id,
          orderIndex,
          kind: r.kind,
          citation: r.citation,
          gloss: r.gloss ?? null,
        })),
      });
    }

    await prisma.prohibition.deleteMany({ where: { topicId: record.id } });
    if (topic.prohibitions?.length) {
      await prisma.prohibition.createMany({
        data: topic.prohibitions.map((p, orderIndex) => ({
          topicId: record.id,
          orderIndex,
          text: p.text,
          consequence: p.consequence ?? null,
        })),
      });
    }

    for (const [orderIndex, prayer] of (topic.prayers ?? []).entries()) {
      await prisma.prayer.upsert({
        where: { slug: prayer.slug },
        create: { ...prayer, topicId: record.id, orderIndex },
        update: { ...prayer, topicId: record.id, orderIndex },
      });
    }
  }

  for (const [orderIndex, item] of CHECKLIST.entries()) {
    await prisma.checklistItem.upsert({
      where: { slug: item.slug },
      create: { ...item, orderIndex, status: ContentStatus.DRAFT },
      update: { title: item.title, description: item.description, orderIndex },
    });
  }

  const references = TOPICS.reduce((sum, t) => sum + (t.references?.length ?? 0), 0);
  console.log(
    `content: ${TOPICS.length} panduan, ${references} dalil, ${CHECKLIST.length} checklist ` +
      '(semua DRAFT, dalil belum diverifikasi pembimbing)',
  );
}
