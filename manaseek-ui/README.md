# Manaseek UI

Prototype UI/UX mobile app Manaseek — Pendamping Ibadah Haji & Umrah.

## Menjalankan Dev Server

```bash
cd manaseek-ui
npm install
npm run dev -- --port 5174
```

Buka browser di `http://localhost:5174`

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
