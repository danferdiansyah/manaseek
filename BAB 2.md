# BAB II
# ASPEK PRODUK DAN PRODUKSI

---

## 2.1 Deskripsi Produk

Manaseek adalah platform pendamping ibadah haji dan umrah berbasis kecerdasan buatan (AI) yang hadir dalam bentuk aplikasi mobile (Android dan iOS) serta website. Platform ini dapat diakses sejak masa persiapan sebelum keberangkatan, selama berada di Tanah Suci, hingga setelah kembali ke tanah air.

Manaseek menyediakan tiga lapisan bantuan yang saling melengkapi:

1. **Guidance Mandiri**, yaitu panduan ibadah lengkap yang dapat diakses secara mandiri, termasuk dalam mode offline.
2. **Chatbot AI**, yaitu asisten virtual berbasis AI yang menjawab pertanyaan jamaah secara cepat, personal, dan kontekstual.
3. **Mutawif On-Demand**, yaitu layanan pemesanan pendamping ibadah terverifikasi secara real-time melalui aplikasi.

Ketiga lapisan ini membentuk ekosistem layanan yang komprehensif, di mana jamaah dapat memilih tingkat bantuan sesuai kebutuhan dan kondisinya, mulai dari kebutuhan informasi dasar, pertanyaan spesifik, hingga pendampingan fisik langsung.

---

## 2.2 Konsep Utama Produk

Manaseek dibangun di atas prinsip **layanan bertingkat berbasis kebutuhan** (*tiered assistance system*): setiap jamaah memiliki tingkat kebutuhan yang berbeda, dan platform yang baik harus mampu melayani seluruh spektrumnya dalam satu ekosistem terpadu.

Empat prinsip desain inti yang melandasi produk ini adalah: **aksesibilitas** (antarmuka intuitif dan ramah lansia), **keterpercayaan** (konten dikurasi oleh pihak kompeten di bidang fikih haji dan umrah), **kemandirian** (jamaah didorong memahami ibadah secara mandiri terlebih dahulu), dan **keterhubungan** (platform secara seamless menghubungkan jamaah ke solusi yang tepat ketika dibutuhkan).

Secara filosofis, AI dalam Manaseek diposisikan sebagai **asisten informasi**, bukan pemberi fatwa atau pengganti pembimbing ibadah manusia. Pertanyaan yang menyangkut hukum syariah secara mendalam akan selalu diarahkan kepada pembimbing yang kompeten.

---

## 2.3 Fitur Produk

### 2.3.1 Guidance Mandiri

Fitur ini menyediakan ensiklopedia ibadah haji dan umrah secara digital, terstruktur, dan dapat diakses secara offline. Konten mencakup:

- Panduan tata cara haji dan umrah (rukun, wajib, sunnah) disertai ilustrasi visual
- Kumpulan bacaan doa lengkap dengan teks Arab, transliterasi, dan terjemahan
- Informasi larangan ihram beserta konsekuensi syariahnya
- Checklist persiapan keberangkatan yang dapat dikustomisasi
- Informasi dan peta lokasi penting di Masjidil Haram, Masjid Nabawi, Mina, Arafah, dan Muzdalifah
- Panduan yang terorganisasi per fase ibadah: ihram, thawaf, sa'i, tahalul, wukuf, mabit, dan melontar jumrah

### 2.3.2 Chatbot AI

Chatbot AI berfungsi sebagai asisten virtual yang menjawab pertanyaan jamaah dalam bahasa sehari-hari secara cepat dan kontekstual. Chatbot mampu menjawab pertanyaan seputar tata cara ibadah, menjelaskan makna doa, memberikan panduan berbasis kondisi jamaah, serta merekomendasikan langkah tindak lanjut yang tepat.

Demi menjaga integritas informasi keagamaan, chatbot dibangun dengan prinsip *retrieval-augmented generation* (RAG) berbasis knowledge base yang dikurasi secara manual, bukan generasi bebas. Chatbot tidak memberikan fatwa syariah secara mandiri, dan pertanyaan yang membutuhkan pendampingan fisik atau hukum Islam yang kompleks akan diarahkan ke mutawif manusia secara otomatis.

### 2.3.3 Mutawif On-Demand

Fitur ini memungkinkan jamaah memesan pendamping ibadah terverifikasi secara real-time, serupa model layanan transportasi on-demand. Alur pemesanan berjalan dari deteksi lokasi otomatis, pemilihan jenis bantuan, hingga tampilan daftar mutawif terverifikasi di sekitar jamaah beserta profil, rating, dan estimasi biaya sebelum pemesanan dikonfirmasi.

Cakupan layanan meliputi: pendampingan pelaksanaan ibadah, bantuan mobilitas bagi jamaah lansia atau penyandang disabilitas, penanganan jamaah tersesat atau terpisah dari rombongan, serta pendampingan pada kondisi darurat.

Setiap mutawif yang bergabung wajib melalui verifikasi identitas, validasi pengalaman, wawancara, pelatihan standar layanan, dan penandatanganan kontrak kerja sama. Setelah layanan selesai, jamaah memberikan rating dan ulasan yang menjadi dasar monitoring kualitas secara berkelanjutan.

---

## 2.4 User Journey

Manaseek melayani tiga skenario utama perjalanan pengguna:

**Jamaah dengan kebutuhan informasi dasar** membuka fitur guidance, memilih fase ibadah yang relevan, mengakses panduan dan doa, lalu mencentang checklist persiapan; semua itu dapat dilakukan secara offline.

**Jamaah dengan pertanyaan spesifik** mengetik pertanyaan ke chatbot AI dalam bahasa sehari-hari dan mendapat jawaban kontekstual. Apabila pertanyaan memerlukan tindak lanjut lebih jauh, chatbot merekomendasikan fitur atau langkah yang tepat, termasuk opsi pemesanan mutawif.

**Jamaah dengan kondisi kompleks atau darurat**, misalnya jamaah lansia yang terpisah dari rombongan, membuka fitur Mutawif On-Demand, memilih jenis bantuan, dan dalam waktu singkat mutawif terverifikasi terdekat akan menuju lokasi jamaah.

Selain pengguna individu (B2C), agen travel dan KBIHU dapat mendaftar sebagai mitra B2B, mendaftarkan data jamaah dalam paket, dan memantau layanan melalui dashboard mitra yang terintegrasi.

---

## 2.5 Proses Produksi dan Pengembangan Produk

Pengembangan Manaseek mengikuti enam fase utama:

1. **Riset dan Perencanaan**: wawancara dengan jamaah, agen travel, KBIHU, dan mutawif untuk memahami kebutuhan nyata, dilanjutkan analisis kompetitor dan penyusunan *product requirements document* (PRD).
2. **Produksi Konten**: penyusunan konten panduan ibadah bersama tim ahli fikih, pembangunan knowledge base AI, serta produksi aset visual dan audio.
3. **Desain Produk**: perancangan UI/UX yang intuitif dan inklusif (ramah lansia), diikuti prototyping dan user testing dengan calon pengguna nyata.
4. **Pengembangan Teknologi**: pembangunan aplikasi mobile, website, sistem chatbot AI, fitur pemesanan mutawif, serta infrastruktur backend yang aman dan skalabel.
5. **Verifikasi dan Onboarding**: rekrutmen dan verifikasi mutawif angkatan pertama, serta onboarding mitra travel dan KBIHU.
6. **Pengujian dan Peluncuran**: QA, beta testing terbatas dengan jamaah terpilih, evaluasi dan iterasi, hingga peluncuran MVP.

---

## 2.6 Teknologi yang Digunakan

Manaseek dibangun menggunakan tumpukan teknologi modern yang dipilih berdasarkan keandalan dan skalabilitas:

- **Aplikasi mobile**: framework lintas platform (React Native atau Flutter) untuk Android dan iOS dari satu basis kode, dengan dukungan mode offline melalui mekanisme caching.
- **Website**: Next.js untuk performa optimal, mencakup landing page, dashboard pengguna, dashboard admin, dan dashboard mitra B2B.
- **Sistem AI Chatbot**: model LLM dengan arsitektur RAG menggunakan knowledge base ibadah yang dikurasi, dilengkapi pembatas konteks agar respons tidak keluar dari domain haji dan umrah.
- **Layanan berbasis lokasi**: GPS dan geolocation untuk matching mutawif terdekat, peta interaktif lokasi ibadah, dan real-time tracking mutawif setelah pemesanan.
- **Sistem pembayaran**: payment gateway yang mendukung transfer bank, e-wallet, dan kartu, dengan mekanisme escrow untuk melindungi hak jamaah dan mutawif.
- **Infrastruktur backend**: cloud server skalabel (AWS atau setara), database relasional dan non-relasional, RESTful API, enkripsi data, dan autentikasi dua faktor.

---

## 2.7 Standar Kualitas Produk

Manaseek menjaga kualitas melalui empat dimensi utama:

- **Konten**: seluruh panduan ibadah disusun dan diverifikasi oleh tim kompeten di bidang fikih, diperbarui secara berkala, dan divalidasi silang sebelum dipublikasikan.
- **Teknologi**: aplikasi diuji secara fungsional, performa, dan keamanan; infrastruktur dipantau 24/7 dengan standar *uptime* yang ditetapkan.
- **Layanan mutawif**: seleksi berlapis sebelum aktif, SOP pelayanan yang terstandar, pelatihan berkala termasuk penanganan darurat, serta mekanisme penangguhan bagi mutawif bermasalah.
- **Layanan pelanggan**: customer support aktif selama periode ibadah, pengelolaan umpan balik pengguna secara sistematis, dan dokumentasi bantuan yang mudah dipahami.

---

## 2.8 Perencanaan Intellectual Property

Manaseek mengelola kekayaan intelektual secara terstruktur untuk melindungi nilai bisnis jangka panjang:

- **Merek dan identitas visual**: merek "Manaseek" didaftarkan ke DJKI dalam kelas 42 (layanan teknologi informasi); logo, identitas visual, dan domain manaseek.id diamankan sebagai aset perusahaan.
- **Produk digital**: kepemilikan *source code* aplikasi, desain UI/UX, dan konten guidance yang orisinal dilindungi melalui klausul IP dalam kontrak seluruh developer dan kontributor konten.
- **Rahasia dagang**: algoritma matching mutawif dan sistem penilaian reputasi dilindungi sebagai rahasia dagang untuk menjaga keunggulan kompetitif.
- **Lisensi pihak ketiga**: kepatuhan lisensi atas seluruh library, framework, API peta, model AI, dan konten pihak ketiga dikelola secara aktif untuk menghindari risiko hukum.
- **Perjanjian IP**: seluruh pendiri, developer (internal maupun freelancer), mitra konten, dan vendor teknologi menandatangani perjanjian yang menegaskan kepemilikan IP ada pada Manaseek.
