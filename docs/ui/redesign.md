# Pembaruan UI Manaseek

Referensi: `public/ui-home.png` di root repository.

Implementasi berfokus pada beranda, palet bersama, dan navigasi bawah: hijau
zamrud, permukaan ivory, aksen emas, header Ka'bah, kartu salat besar, kartu
kiblat terpisah, empat layanan, carousel panduan, dan checklist persiapan.
Ikon layanan menggunakan Lucide yang sudah dipakai aplikasi, bukan ilustrasi
3D persis pada referensi. Layout aplikasi tetap berorientasi ponsel dengan
lebar maksimum 420px. Pada layar di bawah 360px, layanan menjadi dua kolom.

Data salat tetap dihitung di perangkat. Tanggal Masehi dan Hijriah mengikuti
waktu perangkat. Lokasi fallback dinyatakan sebagai acuan Makkah, bukan
mengklaim pengguna berada di sana. Booking dan notifikasi memakai API.
Pintasan Doa & Dzikir meneruskan pencarian `doa` ke halaman panduan.
Loading, kegagalan jaringan dengan retry, dan hasil kosong tersedia di beranda.

## Preview

```sh
cd manaseek-ui
npm run dev
```

Buka URL Vite dengan `?screen=home&capture=1` untuk memeriksa layout tanpa
login. Capture mode sudah ada sebelumnya dan tidak menyediakan otorisasi API;
jalankan backend dan gunakan sesi normal untuk mengecek data sebenarnya.
Parameter capture sekarang mengikuti lebar viewport, maksimal 420px.

Periksa pada 320px, 390px, 420px, dan desktop; uji navigasi layanan, geser
panduan, coba ulang saat jaringan gagal, dan tolak izin lokasi. UI layar lain
menerima palet dan navigasi bersama; struktur masing-masing tetap dipertahankan.

Validasi pada sesi implementasi: `npm run build` dan `npm run lint` lolos.
Screenshot dan interaksi browser belum diverifikasi karena sandbox menolak
server lokal (`listen EPERM`) dan proses Chromium gagal dijalankan.

## Aset ilustrasi

Path: `manaseek-ui/public/images/kaaba-hero.png`.
Dibuat menggunakan built-in image generation tool; disimpan lokal dan dipakai
sebagai latar dekoratif header serta thumbnail panduan (bukan foto dokumentasi).
Tidak memerlukan layanan gambar eksternal saat aplikasi berjalan.

Prompt yang digunakan:

> Use case: photorealistic-natural. Asset type: background image for an Indonesian Umrah companion app header. Create a wide elegant photograph-style view of the Kaaba at Masjid al Haram, cream marble arcades and slender minarets, soft blue sky, warm daylight, subtle pilgrims in the distance. Kaaba placed on right third, left half mostly dark emerald green atmospheric gradient with ample negative space for white UI text. Premium serene emerald and warm gold palette. No text, no interface, no watermark. Landscape 1536x1024. Save image locally for project use.
