# Prompt Generate Standing Banner (Roll-Up) — Manaseek

Berkas ini berisi prompt siap pakai untuk membuat desain standing banner Manaseek, lengkap dengan spesifikasi cetak, teks final, dan variasi gaya.

---

## 1. Spesifikasi Cetak

| Item | Nilai |
|---|---|
| Ukuran jadi | 85 × 200 cm (roll-up standar Indonesia) |
| Alternatif | 60 × 160 cm (booth kecil) |
| Resolusi kerja | 300 dpi ukuran asli, atau 150 dpi kalau file terlalu berat |
| Piksel setara | 10.039 × 23.622 px @300 dpi |
| Rasio untuk AI image generator | 3:7 (paling dekat dengan 85:200) |
| Mode warna | CMYK untuk file cetak final; kerjakan di RGB lalu konversi |
| Bleed | 3 mm tiap sisi |
| Zona aman bawah | 20 cm paling bawah tertutup mekanisme roll dan sering terhalang meja/orang — jangan taruh informasi penting di sini |
| Zona emas | 120–170 cm dari lantai = setinggi mata. Headline dan visual utama wajib di sini |

---

## 2. Copy Deck — Teks Final Banner

Pakai teks ini persis. Jangan biarkan AI mengarang teks sendiri.

**Logo:** manaseek (Ka'bah heksagon hijau dengan pita kiswah emas, dua figur manusia merangkul membentuk bulan sabit)

**Tagline:**
> Pendamping Ibadah Haji & Umrah

**Headline utama:**
> Ibadah Tenang,
> Ada yang Menemani

**Sub-headline:**
> Satu aplikasi untuk panduan, tanya jawab, dan pendamping terverifikasi — dari persiapan sampai kembali ke tanah air.

**Tiga fitur (ikon + judul + satu baris):**

1. **Guidance Mandiri** — Panduan ibadah, doa, dan checklist. Bisa dibuka offline.
2. **Chatbot AI** — Jawaban cepat, selalu disertai sumber fikih.
3. **Mutawif On-Demand** — Pendamping terverifikasi, dipanggil kapan saja.

**Strip angka kredibilitas (opsional, bagian bawah):**
> Mutawif terverifikasi · Konten dikurasi tim fikih · Mode offline · Rating & ulasan transparan

**Call to action:**
> Scan untuk coba aplikasinya

**Footer:**
> manaseek.app · @manaseek

---

## 3. PROMPT A — Untuk AI Image Generator

Gunakan pada model yang kuat merender teks: Ideogram, GPT Image, Nano Banana, atau Firefly. Prompt sengaja ditulis dalam bahasa Inggris karena model umumnya lebih patuh, tapi teks yang muncul di banner tetap bahasa Indonesia.

```
A professional vertical roll-up banner design for an Indonesian Hajj and Umrah
companion mobile app called "manaseek". Portrait orientation, aspect ratio 3:7,
print-ready, extremely high resolution.

COLOR PALETTE — strictly these colors only:
deep forest green #1B5E35 as the dominant brand color, darker green #0f3d22 for
depth and gradients, warm antique gold #B8944A for accents and dividers, soft
off-white #F9FAFB for content areas, pure white for text on green.

OVERALL COMPOSITION — five stacked zones, top to bottom:

ZONE 1 (top 15%): Solid deep green header with a subtle geometric Islamic
pattern at 8% opacity. Centered logo: a hexagonal Kaaba silhouette in green with
a horizontal gold kiswah band across it, embraced by two abstract human figures
forming a crescent — one green, one gold. Below the mark, lowercase wordmark
"manaseek" in a clean geometric sans-serif. Under it, a thin gold divider line
and the small tagline "Pendamping Ibadah Haji & Umrah" in white letterspaced
caps.

ZONE 2 (next 30%, eye level): The hero. On the left, a large bold headline in
two lines, white on green: "Ibadah Tenang," / "Ada yang Menemani" — the word
"Tenang" accented in gold. Below it a lighter one-line subheadline in soft white:
"Satu aplikasi untuk panduan, tanya jawab, dan pendamping terverifikasi." On the
right, a floating smartphone mockup tilted 8 degrees with a soft drop shadow,
screen showing a clean green-and-white Islamic app interface with a card layout.
A second smaller phone peeks behind it, slightly rotated the other way.

ZONE 3 (next 25%): Three horizontal feature cards on an off-white background,
evenly spaced, each with rounded corners, a thin gold left border, and a soft
shadow. Each card has a circular green icon badge on the left. Icons in order:
an open book with a bookmark, a chat bubble with a subtle sparkle, a location pin
with a person silhouette. Card titles in bold dark green, one supporting line in
medium gray beneath each.

ZONE 4 (next 18%): A deep green band containing a white QR code placeholder in a
rounded white square on the right, and on the left a short call-to-action line in
white with a gold underline accent.

ZONE 5 (bottom 12%): Minimal dark green footer strip with small centered white
text and a thin gold rule above it. Keep this zone visually quiet.

STYLE: modern Islamic corporate identity, clean flat vector illustration, generous
white space, crisp geometric shapes, strong typographic hierarchy, premium and
trustworthy, calm rather than loud. Subtle mashrabiya lattice pattern used only
as a faint texture, never busy. Soft long shadows on cards and phones. Balanced
symmetry with a clear top-to-bottom reading flow.

RENDERING: sharp vector-like edges, no photographic noise, no gradient banding,
print quality, all text perfectly legible and correctly spelled, generous margins
on all four sides.
```

**Negative prompt** (kalau modelnya mendukung):

```
photorealistic human faces, crowds of people, actual photographs of Mecca,
distorted or misspelled text, gibberish lettering, cluttered layout, neon colors,
purple, red, orange, cyan, drop shadows that look 3D or plastic, bevel effects,
gradient mesh, watermark, signature, stock photo look, low resolution, cropped
edges, text touching the border, more than three feature cards, busy background
patterns
```

---

## 4. PROMPT B — Untuk Tool Desain / Layout Engine

Pakai versi ini di Canva AI, Figma AI, v0, atau kalau minta AI menulis kode HTML/SVG untuk banner yang nanti diekspor ke PDF cetak. Versi ini lebih tepat karena teks dirender sebagai teks asli, bukan hasil tebakan model gambar.

```
Buatkan desain standing banner roll-up untuk produk Manaseek.

KONTEKS PRODUK
Manaseek adalah platform pendamping ibadah haji dan umrah berbasis teknologi.
Menyediakan tiga lapisan bantuan: panduan ibadah digital yang bisa diakses
offline, chatbot AI berbasis knowledge base fikih terkurasi, dan layanan mutawif
on-demand yang menghubungkan jamaah dengan pendamping terverifikasi secara
real-time berbasis lokasi. Target penggunanya jamaah umrah dan haji Indonesia,
termasuk jamaah pemula dan lansia, serta keluarga mereka.

TUJUAN BANNER
Dipajang di booth pameran atau presentasi. Orang lewat harus paham dalam 3 detik:
ini aplikasi apa, buat siapa, dan kenapa layak dicoba. Lalu scan QR.

SPESIFIKASI
- Ukuran 85 x 200 cm, portrait, 300 dpi, CMYK, bleed 3 mm
- Informasi penting hanya di rentang 120-170 cm dari lantai
- 20 cm paling bawah dianggap tidak terbaca

IDENTITAS VISUAL
- Hijau utama #1B5E35, hijau gelap #0f3d22, emas #B8944A, off-white #F9FAFB
- Logo: heksagon Ka'bah hijau berpita kiswah emas, dikelilingi dua figur manusia
  merangkul membentuk bulan sabit; wordmark "manaseek" huruf kecil
- Tipografi: sans-serif geometris modern. Headline bold, isi regular.
  Hindari font kaligrafi Arab dekoratif untuk teks Latin
- Nuansa: tenang, terpercaya, modern islami. Bukan ramai, bukan norak

STRUKTUR KONTEN (urut dari atas)
1. Header hijau: logo + tagline "Pendamping Ibadah Haji & Umrah"
2. Headline: "Ibadah Tenang, Ada yang Menemani" — kata "Tenang" diberi warna emas
3. Sub-headline satu baris: "Satu aplikasi untuk panduan, tanya jawab, dan
   pendamping terverifikasi — dari persiapan sampai kembali ke tanah air."
4. Visual utama: mockup layar aplikasi, miring 8 derajat, ada bayangan lembut
5. Tiga kartu fitur bersebelahan vertikal, tiap kartu berisi ikon lingkaran,
   judul tebal, dan satu baris penjelas:
   - Guidance Mandiri — Panduan ibadah, doa, dan checklist. Bisa dibuka offline.
   - Chatbot AI — Jawaban cepat, selalu disertai sumber fikih.
   - Mutawif On-Demand — Pendamping terverifikasi, dipanggil kapan saja.
6. Strip kredibilitas satu baris: Mutawif terverifikasi · Konten dikurasi tim
   fikih · Mode offline · Rating & ulasan transparan
7. Blok CTA hijau: kotak QR putih + teks "Scan untuk coba aplikasinya"
8. Footer tipis: manaseek.app · @manaseek

ATURAN LAYOUT
- Maksimal dua tingkat ukuran font di dalam satu blok
- Ruang kosong minimal 5 cm di tiap tepi
- Headline minimal setinggi 8 cm agar terbaca dari jarak 3 meter
- Teks isi minimal 2,5 cm agar terbaca dari jarak 1,5 meter
- Ikon konsisten satu gaya: outline dengan ketebalan garis sama
```

---

## 5. Tiga Variasi Gaya

Jalankan prompt yang sama, ganti bagian STYLE-nya, lalu bandingkan.

**Variasi 1 — Korporat Bersih (paling aman untuk kompetisi bisnis)**
> Dominan off-white, hijau hanya di header dan blok CTA. Kartu fitur putih dengan bayangan tipis. Terasa seperti profil perusahaan teknologi. Emas dipakai sangat hemat, hanya sebagai garis pemisah.

**Variasi 2 — Hijau Penuh Premium (paling menonjol di keramaian booth)**
> Latar hijau tua penuh dari atas ke bawah dengan gradasi halus. Semua teks putih dan emas. Kartu fitur transparan dengan garis tepi tipis emas. Mockup ponsel menyala kontras di tengah. Kesan mewah dan tenang.

**Variasi 3 — Geometris Islami (paling berkarakter)**
> Motif geometri Islam delapan sisi sebagai tekstur latar di opasitas 6 persen, ditambah lengkungan arch sebagai bingkai visual utama. Palet sama, tapi ada elemen lengkung pada pembatas antarzona. Tetap jaga agar motif tidak mengganggu keterbacaan.

---

## 6. Variasi Visual Utama

Kalau mockup ponsel terasa membosankan, ganti bagian hero dengan salah satu ini:

1. **Tiga layar berjajar** — layar Guidance, Chatbot, dan Mutawif ditumpuk miring seperti kartu dibagikan, menunjukkan tiga lapisan bantuan sekaligus.
2. **Ilustrasi alur** — ikon jamaah di kiri, tiga anak panah menuju tiga ikon fitur, bermuara pada ikon Ka'bah di kanan. Menceritakan konsep bantuan tiga lapis secara visual.
3. **Split diagonal** — sisi kiri ilustrasi siluet jamaah dan lengkungan masjid dengan gaya flat, sisi kanan tampilan aplikasi. Dipisah garis diagonal emas.

---

## 7. Catatan Penting Sebelum Cetak

**Soal teks hasil AI.** Model gambar masih sering salah mengeja kata Indonesia, apalagi kata seperti "Mutawif" dan "Manaseek". Cara paling aman: minta AI menghasilkan **layout dan elemen visualnya saja** dengan teks placeholder, lalu tempel teks asli secara manual di Figma, Canva, atau Illustrator. Hasilnya pasti benar dan tajam saat dicetak.

**Logo jangan digambar ulang oleh AI.** Sudah ada berkas asli di `logo.png` (932 × 896 px). Tempel logo asli ke desain, jangan pakai versi tiruan hasil generate — bentuk Ka'bah dan dua figurnya hampir pasti berubah.

**Checklist sebelum kirim ke percetakan:**
- Semua teks sudah dikonversi ke outline atau font disertakan
- Resolusi minimal 150 dpi di ukuran asli
- Warna sudah CMYK, hijau `#1B5E35` kira-kira setara C85 M40 Y85 K35 — minta proof cetak kalau warnanya kritis
- QR code sudah diuji scan dari jarak 1 meter, minimal 8 × 8 cm
- Tidak ada elemen penting di 20 cm paling bawah dan 3 cm dari tiap tepi
- Nama produk dieja "Manaseek", bukan "Manaseek" versi lain seperti "Manasik"
