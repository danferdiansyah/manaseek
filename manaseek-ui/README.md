# Manaseek UI

Prototype UI/UX mobile app Manaseek — Pendamping Ibadah Haji & Umrah.

## Menjalankan Dev Server

```bash
cd manaseek-ui
npm install
npm run dev -- --port 5174
```

Buka browser di `http://localhost:5174`

## Memeriksa riwayat AI Chat

```bash
npm run test:chat-history
```

Pengecekan browser ini menjalankan Vite di port lokal yang tersedia dan memakai
API fixture. Mencakup pemulihan chat terakhir, pagination riwayat dan pesan,
melanjutkan chat lama, chat baru, kegagalan pengiriman, pergantian sesi saat
request masih berjalan, serta tampilan layar kecil. Tidak memakai akun atau
layanan AI sungguhan.

## Konverter Riyal ↔ Rupiah

Akses dari kartu **Riyal ↔ Rupiah** di beranda atau `?screen=currency`.
Perhitungan SAR/IDR berlangsung di perangkat, tanpa API kurs. Kurs tetap
**1 SAR = Rp4.803,30**, dibulatkan dari snapshot [XE](https://www.xe.com/en-us/currencyconverter/convert/?Amount=1&From=SAR&To=IDR)
pada **29 September 2026, 00.55 UTC / 07.55 WIB**. Tanggal acuan tetap ditampilkan;
aplikasi tidak memperbarui kurs secara otomatis.

Untuk mengganti acuan, perbarui nilai, timestamp, dan sumber `SAR_IDR_RATE`
di `src/lib/currency.js` bersama-sama. Sesuaikan ekspektasi snapshot di
`scripts/check-currency.mjs` jika kurs berubah.

```bash
npm run test:currency
```

Memeriksa format nominal Indonesia, perhitungan dua arah, tombol tukar,
nominal cepat, input kosong/tidak valid, perhitungan tanpa jaringan,
navigasi beranda, dan tampilan 320–420px dengan API fixture.

## Pembelian paket umroh

Buka tab **Umroh** di navbar bawah atau banner **Paket Umroh** di beranda. Alur lengkap: katalog → detail tiket
pergi–pulang, hotel, fasilitas dan itinerary → pilih jadwal/kamar → data jamaah
→ pembayaran dummy langsung berhasil → bukti pesanan. Riwayat dapat dibuka
melalui katalog atau **Profil → Pesanan Paket Umroh**. URL detail pesanan tetap
dapat dibuka setelah refresh. Tab Umroh tetap aktif saat membuka katalog,
detail paket, riwayat, dan bukti pesanan. Setiap paket memakai banner destinasi
yang berbeda; aset dan prompt imagegen ada di [daftar banner](src/assets/umrah/README.md).

Paket, maskapai, hotel, harga dan pembayaran merupakan simulasi. Katalog berasal
dari API; checkout benar-benar menyimpan pesanan, jamaah dan pembayaran di
PostgreSQL. Tombol **Isi data contoh** menyediakan data dummy untuk mencoba
formulir. Harga final dihitung backend, bukan dipercaya dari browser.

Jalankan migrasi, generate Prisma Client, dan build backend terlebih dahulu
(lihat README API). Lalu:

```bash
npm run test:umrah
```

Pengecekan ini menjalankan Nest dan Vite pada port lokal, memakai PostgreSQL
lokal dari `.env` backend, serta membuat/membersihkan akun dan paket pengujian.
Mencakup checkout dua jamaah, pilihan kamar, pembayaran nyata di tabel database,
refresh bukti pesanan, riwayat, respons pembayaran terputus, otorisasi, kursi
habis, dan layar 320–420px. Tidak menghubungi penyedia pembayaran eksternal.

## Mengambil Screenshot

Pastikan dev server sudah berjalan, lalu di tab terminal lain:

```bash
node screenshot.mjs
```

Screenshot semua screen tersimpan di folder `../out/`.

## Mengambil Screenshot Product Summary

```bash
node screenshot-summary.mjs
```

Output: `../out/product-summary.png`

## Screens yang Tersedia

Akses tiap screen langsung via URL param `?screen=<id>`:

| ID | Screen |
|----|--------|
| `splash` | Splash / onboarding |
| `home` | Beranda |
| `currency` | Konverter Riyal ↔ Rupiah |
| `umrah-packages` | Katalog paket umroh demo |
| `umrah-package&slug=umroh-hemat-9-hari` | Detail paket dan pilihan jadwal/kamar |
| `umrah-checkout&slug=umroh-hemat-9-hari` | Form pemesanan dan pembayaran dummy |
| `umrah-orders` | Riwayat pesanan paket umroh |
| `umrah-order&orderId=<uuid>` | Bukti pesanan, pembayaran dan rincian perjalanan |
| `guidance` | Guidance Mandiri |
| `guidance-detail` | Detail panduan |
| `chatbot` | Chatbot AI |
| `mutawif` | Mutawif On-Demand (list + peta) |
| `mutawif-profile` | Profil mutawif |
| `booking` | Konfirmasi pemesanan |
| `booking-success` | Pemesanan berhasil |
| `profile` | Profil pengguna |

Tambahkan `&capture=1` untuk mode screenshot tanpa frame HP, contoh:
`http://localhost:5174?screen=home&capture=1`
