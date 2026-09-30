# Manaseek Android

Aplikasi Android dengan React Native, Expo SDK 57, Expo Router, dan TypeScript.
Menggunakan backend NestJS yang sama dengan web; akun, chat, booking, dan pesanan
tetap disimpan di database yang sama.

## Menjalankan

Gunakan Node.js 24 LTS. Dari **folder ini**:

```bash
npm ci
cp .env.example .env
npm start
```

`npm start` melayani JavaScript untuk **development build** yang sudah terpasang.
Expo Go tidak memuat modul native Google Sign-In yang digunakan aplikasi ini.

Untuk membuat development build di komputer dengan Android Studio, Android SDK,
dan JDK yang sesuai dengan versi Gradle/React Native:

```bash
npm run android
```

Alternatif build cloud, setelah masuk ke akun Expo dan menghubungkan project:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile development
```

Perintah build cloud menggunakan akun dan kuota EAS milikmu. Inisialisasi EAS akan
menambahkan project ID yang harus disimpan di `app.config.ts`.

APK untuk pemasangan internal dan AAB untuk Google Play:

```bash
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform android --profile production
```

Build belum berarti publikasi ke Google Play. Signing dan akun store perlu
disiapkan sebelum distribusi produksi. Simpan signing key untuk seluruh pembaruan.
`android/` dan `ios/` dihasilkan Expo, diabaikan Git, dan tidak diedit manual.

## Konfigurasi backend

`EXPO_PUBLIC_API_URL` harus URL lengkap, termasuk `/api`. Default:
`https://manaseek-api.vercel.app/api`. Production mewajibkan HTTPS.

Untuk Android Emulator gunakan `http://10.0.2.2:3000/api`; untuk perangkat fisik
gunakan alamat LAN komputer, atau `adb reverse tcp:3000 tcp:3000` dengan
`http://127.0.0.1:3000/api`. HTTP hanya diizinkan oleh client saat development;
sesuaikan konfigurasi jaringan debug jika perangkat memblokir cleartext.

Login development hanya muncul jika `__DEV__` dan
`EXPO_PUBLIC_DEV_LOGIN=true`. Backend lokal juga harus memakai
`AUTH_DEV_LOGIN=true`. Backend production tetap menolak login development.

Nilai `EXPO_PUBLIC_*` dapat dibaca dari aplikasi: hanya URL dan OAuth client ID,
bukan client secret, credential database, JWT secret, atau service account.

## Login Google Android

Package awal: **`id.manaseek.app`**, diatur di `app.config.ts`.

1. Buat OAuth client **Android** di project Google Cloud yang dipakai backend.
   Daftarkan package tersebut dan SHA-1 sertifikat signing development.
2. Untuk build internal/production, daftarkan SHA-1 signing key terkait. Jika
   memakai Play App Signing, daftarkan juga SHA-1 **app signing** dari Play Console.
3. Isi `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` dengan OAuth client bertipe **Web** yang
   menjadi server client ID. Ini adalah audience ID token yang dikirim Android.
4. Pastikan client ID pada langkah 3 termasuk `GOOGLE_CLIENT_IDS` di backend.
   Android OAuth client mengidentifikasi package/signature; jangan menganggap
   audience token selalu merupakan Android client ID.
5. Build ulang aplikasi setelah perubahan konfigurasi native/signing.

Aplikasi menukar Google ID token melalui `POST /auth/google`. Sesi Manaseek
disimpan dengan Expo SecureStore. Refresh yang bersamaan digabung menjadi satu;
respons dari sesi lama ditolak setelah logout/pergantian akun. Kegagalan jaringan
tidak menghapus sesi yang masih dapat dipulihkan.

## Push notification

Backend sudah memiliki provider FCM HTTP v1. Gunakan Firebase project yang sama
untuk perangkat dan service account backend:

1. Daftarkan aplikasi Android `id.manaseek.app` di Firebase.
2. Simpan `google-services.json` di luar Git, lalu set `GOOGLE_SERVICES_JSON` ke
   path absolutnya. Untuk EAS gunakan environment variable bertipe **file**.
3. Konfigurasikan backend: `PUSH_PROVIDER=fcm`, `FCM_PROJECT_ID`,
   `FCM_CLIENT_EMAIL`, dan `FCM_PRIVATE_KEY` sesuai README API.
4. Build ulang, masuk ke aplikasi, buka **Profil → Notifikasi → Aktifkan**.

Client mendaftarkan **native FCM device token**, bukan ExpoPushToken, ke
`POST /notifications/devices`, memperbaruinya saat rotasi, dan berupaya
menghapusnya ketika logout. Tap notifikasi booking membuka detail melalui ID
yang divalidasi; backend tetap memeriksa pemilik booking. Tanpa konfigurasi
Firebase, riwayat notifikasi tetap bekerja dan registrasi push menjelaskan
bahwa fitur belum tersedia.

## Fitur dan perilaku

| Area | Implementasi |
| --- | --- |
| Akun | Google Sign-In, onboarding jamaah/mutawif, profil, logout |
| Beranda | Waktu shalat lokal, pilihan kota atau GPS, pintasan layanan |
| Panduan & doa | Daftar, detail, langkah, rujukan, unduh untuk offline |
| Checklist | Progres per akun, perubahan offline, sinkronisasi saat tersambung |
| Kiblat | Bearing lokal, heading perangkat saat tersedia, cadangan arah manual |
| Konverter | Kalkulasi SAR/IDR dan tanggal snapshot yang sama dengan web |
| Chat | Riwayat berhalaman, lanjutkan sesi, chat baru, sitasi, penanganan pertanyaan tersimpan saat jawaban gagal |
| Mutawif | Pencarian jarak sebenarnya, filter layanan, profil, ulasan |
| Booking | Pemesanan dengan waktu Saudi, riwayat, status, pembatalan, rating |
| Dashboard mutawif | Online/offline, lokasi foreground, permintaan, aksi status, tarif, profil dan pengajuan verifikasi |
| Perjalanan | Tambah/edit/hapus dokumen dan rencana perjalanan |
| Umroh | Katalog, detail, jadwal/kamar, 1–6 jamaah, checkout demo, riwayat dan bukti pesanan |
| Notifikasi | Riwayat, FCM opt-in, pembukaan detail booking |

Panduan offline perlu diunduh saat login dan terhubung. Cache dan antrean checklist
dipisahkan per akun, kemudian dihapus saat logout. Jadwal shalat, bearing kiblat,
dan konverter tidak membutuhkan jaringan setelah lokasi tersedia. Pilihan kota
merupakan titik acuan kota, bukan klaim lokasi GPS perangkat.

Checkout menyimpan payload dan `requestId` di SecureStore **sebelum** pengiriman.
Jika respons hilang, form beralih ke pemulihan permintaan yang sama. Setelah app
dibuka ulang, pemulihan bisa dibuka melalui pesanan atau layar checkout.
Booking mutawif tidak memiliki idempotency key di backend: sesudah timeout,
periksa riwayat sebelum mengirim ulang. Tidak ada retry otomatis untuk transaksi.

Lokasi mutawif hanya dipantau ketika dashboard sedang terlihat dan aplikasi
berada di foreground. Background tracking belum diaktifkan. Pencarian menampilkan
jarak dari API; tidak menampilkan marker koordinat mutawif buatan. Lokasi
pertemuan bisa dibuka di aplikasi peta melalui tautan.

Batasan backend yang tetap berlaku: konten masih ditandai draf jika belum
ditinjau, upload dokumen verifikasi menerima URL, pembayaran umroh simulasi,
dan pembayaran mutawif di luar aplikasi. Aplikasi Android tidak mengubahnya
menjadi transaksi riil.

## Struktur dan pemeriksaan

```text
src/app/          rute Expo Router
src/screens/      implementasi layar
src/components/   komponen tampilan dan integrasi notifikasi
src/lib/          API, sesi, model data, cache, lokasi, antrean checklist
tests/            regresi sesi, konkurensi refresh, sinkronisasi, kalkulasi
../packages/shared/  logika murni yang juga dipakai web
```

```bash
npm run check
npm run test:preview
npx expo-doctor
npx expo prebuild --platform android --no-install
```

`check` menjalankan TypeScript, lint, tes, dan ekspor bundel Android. Ekspor Metro
dan prebuild memvalidasi JavaScript/config native; keduanya **bukan kompilasi APK
atau pengujian di perangkat**. Sebelum rilis, periksa login Google dengan signing
yang digunakan, pemulihan sesi, notifikasi foreground/background/cold start,
izin lokasi ditolak, kompas tanpa sensor, rotasi layar/back, jaringan terputus,
dan ukuran font besar pada perangkat fisik.

`test:preview` menjalankan browser dengan API fixture lokal: login development,
unduh/baca panduan offline, checklist, riwayat chat, booking, dan pemulihan checkout
setelah respons hilang. Tidak mengakses akun, AI, atau pembayaran sungguhan.
Gunakan Chrome/Chromium yang terpasang, atau set `CHROME_BIN` ke executable-nya.
Screenshot pemeriksaan ditulis ke `out/` dan tidak masuk Git.

`npm run web` tersedia sebagai preview komponen. Sesi browser preview hanya
disimpan di memori; Google native, FCM, serta sensor Android harus diuji dalam
build Android. Project web produksi tetap berada di `manaseek-ui`.

Dokumentasi resmi: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[development builds](https://docs.expo.dev/develop/development-builds/introduction/),
[Google authentication](https://docs.expo.dev/guides/google-authentication/),
[FCM langsung](https://docs.expo.dev/push-notifications/sending-notifications-custom/).
