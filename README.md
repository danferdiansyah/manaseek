# Manaseek

Platform pendamping ibadah haji dan umrah untuk jamaah Indonesia. Tiga lapisan
layanan: panduan ibadah mandiri, asisten AI, dan mutawif on-demand.

| | |
| --- | --- |
| Aplikasi | https://manaseek.vercel.app |
| API | https://manaseek.vercel.app/api |
| Health | https://manaseek.vercel.app/api/health/ready |

## Isi repo

```
manaseek-ui/       aplikasi web (React + Vite)
manaseek-api/      backend (NestJS + Prisma + PostgreSQL)
docs/              proposal, materi marketing, ringkasan produk
assets/            logo, background, QR code
vercel.json        konfigurasi project web, termasuk proxy /api ke backend
```

Dua project Vercel dideploy dari repo yang sama: `manaseek` (root repo, aplikasi
web) dan `manaseek-api` (root directory `manaseek-api`). Aplikasi web
mem-proxy `/api/*` ke backend, jadi browser hanya mengenal satu origin dan tidak
ada CORS yang perlu diurus.

## Menjalankan secara lokal

Backend lebih dulu:

```bash
cd manaseek-api
cp .env.example .env          # isi JWT_ACCESS_SECRET dan GOOGLE_CLIENT_IDS
npm install
docker compose up -d          # PostgreSQL di port 5434
npm run db:deploy && npm run db:seed
npm run dev                   # http://localhost:3000/api
```

Lalu aplikasi web di terminal terpisah:

```bash
cd manaseek-ui
cp .env.example .env.local    # isi VITE_GOOGLE_CLIENT_ID
npm install
npm run dev                   # http://localhost:5173
```

Vite mem-proxy `/api` ke `localhost:3000`, sama seperti perilaku produksi.

Detail lengkap backend — kontrak error, siklus booking, deployment, jebakan
koneksi Supabase — ada di [`manaseek-api/README.md`](manaseek-api/README.md).

### Masuk tanpa akun Google

Untuk pengembangan, set `AUTH_DEV_LOGIN=true` lalu:

```bash
curl -X POST http://localhost:3000/api/auth/dev-login \
  -H 'content-type: application/json' \
  -d '{"email":"ahmad@manaseek.test"}'
```

Akun hasil seed: `admin@manaseek.test` (admin), `hasan@` `yusuf@`
`maryam@manaseek.test` (mutawif terverifikasi), `ahmad@manaseek.test` (jamaah).
Config validator menolak start bila flag ini menyala di produksi.

## Status fitur

| Fitur | Status |
| --- | --- |
| Login Google | jalan |
| Profil jamaah, dokumen, rencana perjalanan | jalan |
| Pendaftaran & verifikasi mutawif | jalan |
| Pencarian mutawif terdekat | jalan |
| Pemesanan mutawif dan siklus statusnya | jalan |
| Rating dan ulasan | jalan |
| Panduan ibadah, doa, larangan | jalan, konten masih draf |
| Checklist persiapan | jalan |
| Riwayat notifikasi | jalan |
| Chatbot AI | belum, menunggu Gemini API key |
| Push notification (FCM) | belum, menunggu kredensial Firebase |
| Upload dokumen verifikasi mutawif | belum, API baru menerima URL |
| Pembayaran | di luar cakupan; booking diselesaikan di luar aplikasi |
| Mitra B2B travel dan KBIHU | ditunda |

Seluruh konten panduan berstatus `DRAFT` dan **belum ditinjau pembimbing**.
Aplikasi menyatakan hal itu secara terbuka kepada jamaah. Tidak ada konten yang
boleh dipublikasikan sebelum ditinjau pihak yang kompeten di bidang fikih haji
dan umrah.

## Dokumen

| Berkas | Isi |
| --- | --- |
| [`docs/proposal/proposal.md`](docs/proposal/proposal.md) | proposal lengkap, BAB I sampai VIII |
| [`docs/proposal/proposal-ringkas.md`](docs/proposal/proposal-ringkas.md) | versi ringkas |
| [`docs/proposal/bab-2-aspek-produk-dan-produksi.md`](docs/proposal/bab-2-aspek-produk-dan-produksi.md) | bab produk dan produksi |
| [`docs/proposal/bab-6-analisis-risiko-dan-mitigasi.md`](docs/proposal/bab-6-analisis-risiko-dan-mitigasi.md) | bab risiko dan mitigasi |
| [`docs/marketing/`](docs/marketing) | prompt banner, prompt brosur, naskah video |
| [`docs/product-summary/`](docs/product-summary) | ringkasan produk satu halaman |

Draf proposal paling awal disimpan di `docs/proposal/arsip/` sebagai riwayat.

Merender ringkasan produk menjadi gambar (butuh dependensi `manaseek-ui`):

```bash
cd manaseek-ui && node screenshot-summary.mjs
```

Hasilnya ditulis ke `docs/product-summary/out/`.
