# Pembaruan UI Manaseek

Referensi: [`references/ui-home.png`](references/ui-home.png).

Implementasi akhir memakai permukaan ivory solid, kartu salat hijau pekat, dan
aksen emas terbatas. Header hanya memuat salam, nama, dan notifikasi. Tidak ada
foto dekoratif, glass, medali, atau slogan di beranda. Empat layanan tampil
sebagai grid dua kolom. Panduan dibatasi dua baris editorial dengan judul,
kategori, durasi baca, dan ringkasan. Booking aktif tampil sebelum layanan.
Navigasi bawah memakai permukaan solid dan label aktif yang jelas.

Teks isi memakai 15–16px dan metadata 12–13px. Tombol notifikasi, navigasi,
lihat semua, dan cari lokasi ulang memiliki tinggi minimal 44px. Layout tetap
berorientasi ponsel dengan lebar maksimum 420px; padding berkurang di bawah 360px.

Data salat tetap dihitung di perangkat. Tanggal Masehi dan Hijriah mengikuti
waktu perangkat. Lokasi fallback dinyatakan sebagai acuan Makkah. Booking dan
notifikasi memakai API. Pintasan Doa & Dzikir meneruskan pencarian `doa` ke
halaman panduan. Loading, kegagalan jaringan dengan retry, dan hasil kosong
tersedia di beranda.

## Preview

```sh
cd manaseek-ui
npm run dev
```

Buka URL Vite dengan `?screen=home&capture=1` untuk memeriksa layout tanpa
login. Capture mode sudah ada sebelumnya dan tidak menyediakan otorisasi API;
jalankan backend dan gunakan sesi normal untuk mengecek data sebenarnya.
Parameter capture sekarang mengikuti lebar viewport, maksimal 420px.

Periksa pada 320px, 390px, 420px, dan desktop; uji navigasi layanan dan
panduan, coba ulang saat jaringan gagal, dan tolak izin lokasi. UI layar lain
menerima palet dan navigasi bersama; struktur masing-masing tetap dipertahankan.

Validasi pada sesi implementasi: `npm run build` dan `npm run lint` lolos.
Screenshot dan interaksi browser belum diverifikasi karena sandbox menolak
server lokal (`listen EPERM`) dan proses Chromium gagal dijalankan.

## Aset ilustrasi

Arsip: `docs/ui/references/kaaba-hero.png`.
Dibuat menggunakan built-in image generation tool untuk iterasi pertama.
Aset dipindahkan ke arsip referensi karena desain akhir tidak memakai foto
dekoratif. Aset ini tidak lagi disertakan di folder public frontend.

Prompt yang digunakan:

> Use case: photorealistic-natural. Asset type: background image for an Indonesian Umrah companion app header. Create a wide elegant photograph-style view of the Kaaba at Masjid al Haram, cream marble arcades and slender minarets, soft blue sky, warm daylight, subtle pilgrims in the distance. Kaaba placed on right third, left half mostly dark emerald green atmospheric gradient with ample negative space for white UI text. Premium serene emerald and warm gold palette. No text, no interface, no watermark. Landscape 1536x1024. Save image locally for project use.
