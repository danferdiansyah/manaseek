# Prompt Generate Brosur A5 — Manaseek

Brosur A5 dua sisi (depan dan belakang), untuk dibagikan di booth pameran, travel, majelis taklim, atau manasik.

---

## 1. Spesifikasi Cetak

| Item | Nilai |
|---|---|
| Ukuran jadi | 148 × 210 mm (A5 portrait) |
| Piksel @300 dpi | 1748 × 2480 px |
| Piksel dengan bleed 3 mm | 1819 × 2551 px |
| Rasio untuk AI image generator | 5:7 (paling dekat dengan 148:210) |
| Sisi | Dua sisi, cetak bolak-balik |
| Margin aman | 8 mm dari tiap tepi — jangan ada teks di luar itu |
| Bahan disarankan | Art paper 150 gsm, laminasi doff |
| Mode warna | Kerjakan RGB, konversi CMYK sebelum cetak |

---

## 2. Copy Deck — Teks Final

### SISI DEPAN

**Logo:** manaseek
**Tagline:** Pendamping Ibadah Haji & Umrah

**Headline:**
> Ibadah Tenang,
> Ada yang Menemani

**Sub-headline:**
> Panduan, tanya jawab, dan pendamping terverifikasi — dalam satu aplikasi.

**Tiga fitur:**
1. **Guidance Mandiri** — Panduan ibadah, doa, dan checklist. Bisa dibuka offline.
2. **Chatbot AI** — Jawaban cepat, selalu disertai sumber fikih.
3. **Mutawif On-Demand** — Pendamping terverifikasi, dipanggil kapan saja.

**CTA bawah:**
> Scan dan coba sekarang · manaseek.vercel.app

---

### SISI BELAKANG

**Judul bagian 1:** Cara Kerjanya

1. **Buka panduannya** — Pelajari tiap tahapan ibadah sendiri, kapan saja, bahkan tanpa sinyal.
2. **Tanya kalau bingung** — Asisten AI menjawab dalam hitungan detik, lengkap dengan sumbernya.
3. **Panggil kalau butuh orang** — Mutawif terverifikasi terdekat datang ke lokasi kamu.

**Judul bagian 2:** Kenapa Manaseek

- Semua mutawif melalui verifikasi identitas, wawancara, dan pelatihan standar
- Konten ibadah disusun dan diperiksa tim fikih, bukan hasil karangan mesin
- Mode offline — panduan tetap terbuka walau sinyal hilang di keramaian
- Harga transparan sejak awal, lengkap dengan rating dan ulasan jamaah lain

**Judul bagian 3:** Untuk Siapa

> Jamaah pertama kali · Jamaah lansia · Umrah mandiri · Keluarga yang menunggu di rumah · Travel & KBIHU

**Penutup:**
> Ibadah ke Tanah Suci itu sekali seumur hidup.
> Sayang kalau waktunya habis untuk bingung.

**Footer:** manaseek.vercel.app · @manaseek · QR code

---

## 3. PROMPT SISI DEPAN — AI Image Generator

```
A premium print-ready A5 flyer design, front side, for an Indonesian Hajj and
Umrah companion mobile app called "manaseek". Portrait orientation, aspect ratio
5:7, ultra high resolution, flat vector style.

COLOR PALETTE — use only these:
deep forest green #1B5E35 as the dominant brand color, darker green #0f3d22 for
gradient depth, warm antique gold #B8944A for accents and thin dividers,
off-white #F9FAFB for content panels, pure white for text sitting on green.

LAYOUT — four zones, top to bottom:

TOP ZONE (about 30% of the height): A deep green panel with a soft vertical
gradient and a faint eight-point Islamic geometric lattice at 6% opacity. In the
upper left, a compact logo lockup: a hexagonal Kaaba silhouette in green with a
horizontal gold kiswah band, embraced by two abstract human figures forming a
crescent, one green and one gold; beside it the lowercase wordmark "manaseek" in
a geometric sans-serif, and under that a small gold-letterspaced tagline line.
Filling the rest of this panel, a large two-line headline in bold white
typography, with one key word highlighted in gold, and a single lighter
subheadline line beneath it. The bottom edge of this panel is a smooth concave
curve, like a gentle arch, rather than a straight line.

MIDDLE ZONE (about 28%): A floating smartphone mockup centered and tilted 8
degrees, with a soft realistic drop shadow, its screen showing a clean green and
white Islamic app interface with rounded cards. A second smaller phone peeks
behind it rotated slightly the other way. Background here is off-white with a
very faint radial glow behind the phones.

FEATURE ZONE (about 28%): Three stacked horizontal cards on off-white, evenly
spaced, rounded corners, thin gold rule on the left edge of each, soft low
shadow. Each card carries a circular deep green icon badge on its left side.
Icons, in order: an open book with a bookmark ribbon; a rounded chat bubble with
a small four-point sparkle; a map location pin containing a person silhouette.
Each card has a bold dark green title and one line of medium gray supporting
text.

BOTTOM ZONE (about 14%): A deep green footer band with a rounded white square on
the right holding a QR code placeholder, and on the left a short white
call-to-action line with a thin gold underline beneath it.

TYPOGRAPHY: modern geometric sans-serif, clear hierarchy, generous line spacing,
absolutely no decorative or script fonts for Latin text.

STYLE: modern Islamic corporate design, clean flat vector, calm and premium,
generous white space, crisp geometry, subtle depth through soft shadows only.
Trustworthy and reassuring rather than loud or promotional. Print quality, sharp
edges, no noise, safe margins on every side.
```

---

## 4. PROMPT SISI BELAKANG — AI Image Generator

```
A premium print-ready A5 flyer design, BACK side, matching a front side that uses
deep forest green #1B5E35, dark green #0f3d22, antique gold #B8944A, and
off-white #F9FAFB. Portrait, aspect ratio 5:7, ultra high resolution, flat vector
style, information-dense but calm and airy.

LAYOUT — four sections separated by thin gold hairline rules:

SECTION 1 — "How it works" (top 32%): A slim deep green header bar with a short
white section title on the left. Below it, three numbered steps arranged
vertically. Each step has a large outlined numeral in gold on the left, a bold
dark green step title, and two lines of gray body text. A thin vertical dotted
gold line connects the three numerals, suggesting a sequence flowing downward.

SECTION 2 — "Why us" (next 26%): Four short benefit lines on off-white, each
prefixed with a small gold circular checkmark badge. Set in two columns of two on
wider layouts, or a single column if space is tight. Dark gray text, comfortable
line spacing.

SECTION 3 — "Who it's for" (next 18%): A soft light green tinted panel with
rounded corners containing five small pill-shaped tags in a flowing row, each
pill outlined in green with dark green text inside. Above the pills, a small
section label in gold uppercase letterspacing.

SECTION 4 — Closing and footer (bottom 24%): A deep green block with a smooth
convex arch along its top edge. Inside it, a short two-line closing statement in
white serif-free type, centered, with the second line slightly dimmer. Beneath
that, a horizontal row containing on the left the small manaseek logo lockup in
white and gold, and on the right a rounded white square holding a QR code
placeholder. A hairline gold rule sits above a small centered footer line of
white text at the very bottom.

DECORATION: a very faint mashrabiya lattice texture at 5% opacity only inside the
green blocks, never over body text. One subtle abstract arch silhouette may echo
in the background of section 3 at low opacity.

STYLE: identical visual language to the front side so both read as one set. Flat
vector, clean, modern Islamic corporate, generous negative space, strict
alignment to a single grid, print quality, safe margins on all four sides.
```

---

## 5. Negative Prompt

```
photorealistic faces, real photographs of Mecca or crowds, misspelled or garbled
text, gibberish lettering, cluttered layout, walls of text, neon colors, purple,
red, orange, cyan, teal, 3D bevel or emboss, plastic gloss, heavy drop shadows,
lens flare, gradient banding, watermark, signature, stock photo aesthetic, low
resolution, text touching or crossing the edges, more than three feature cards on
the front, background patterns that reduce readability, mixed unrelated fonts
```

---

## 6. Variasi Bentuk

**Varian A — Flyer A5 dua sisi (default di atas).** Paling murah, paling cepat dibagikan, cocok untuk booth.

**Varian B — Bi-fold A4 dilipat jadi A5.** Ukuran terbuka 297 × 210 mm, empat panel. Pembagiannya: panel 1 sampul depan, panel 2 dan 3 isi (cara kerja, keunggulan, tangkapan layar aplikasi), panel 4 sampul belakang berisi CTA dan QR. Untuk prompt-nya, jalankan prompt sisi depan untuk panel 1, lalu minta gambar terpisah rasio 10:7 untuk dua panel dalam.

**Varian C — Dua target audiens.** Cetak dua versi berbeda dengan sisi belakang berbeda:
- Versi jamaah: menekankan ketenangan, mode offline, dan mutawif
- Versi mitra travel dan KBIHU: menekankan dashboard mitra, pengurangan beban pendampingan manual, dan kepercayaan jamaah

---

## 7. Cara Pakai Prompt Ini

**Langkah kerja yang paling aman:**

1. Jalankan prompt ke model gambar untuk mendapatkan **komposisi, warna, dan elemen visualnya**
2. Abaikan teks yang muncul di hasil generate — anggap semuanya placeholder
3. Bawa hasilnya ke Figma, Canva, atau Illustrator
4. Tempel teks asli dari Copy Deck di bagian 2, pakai font yang bisa dikontrol
5. Tempel logo asli dari `assets/logo.png`, jangan pakai logo hasil generate
6. Tempel QR asli dari `qr/manaseek-qr-plat-putih.png` untuk area hijau, atau `qr/manaseek-qr-hijau.png` untuk area putih

**Kenapa begitu:** model gambar sampai sekarang masih sering salah mengeja kata Indonesia, terutama "Mutawif", "Manaseek", dan "fikih". Untuk barang cetak, satu huruf salah berarti cetak ulang.

**Model yang cocok:** Ideogram dan GPT Image paling kuat untuk tata letak poster. Nano Banana bagus untuk kombinasi visual dan teks pendek. Midjourney paling indah secara estetika tapi paling buruk untuk teks — pakai hanya kalau kamu memang berencana menempel semua teks secara manual.

---

## 8. Checklist Sebelum Cetak

- Ukuran file 1819 × 2551 px sudah termasuk bleed 3 mm
- Tidak ada teks di luar margin aman 8 mm
- Semua teks sudah dikonversi ke outline, atau font ikut dikirim ke percetakan
- Warna sudah CMYK; hijau `#1B5E35` kira-kira setara C85 M40 Y85 K35
- QR sudah diuji scan dari jarak 30 cm, ukuran minimal 2,5 × 2,5 cm
- URL tertulis benar: `manaseek.vercel.app`
- Ejaan diperiksa manual: Manaseek, mutawif, manasik, KBIHU
- Sisi depan dan belakang punya orientasi sama supaya cetak bolak-baliknya tidak terbalik
