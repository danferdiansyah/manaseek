# Review arsitektur dan kualitas kode Manaseek

Review 3 Oktober 2026 mencakup struktur API, aplikasi mobile, web, utilitas bersama,
alur autentikasi, chat, booking, pembayaran demo, notifikasi, penyimpanan lokal,
dan pemeriksaan otomatis. Struktur repo sudah berupa monolit modular dengan
lapisan yang cukup jelas. Belum tepat menyebutnya Clean Architecture penuh:
sebagian layanan aplikasi masih mengakses Prisma langsung, dan beberapa
transaksi bisnis memerlukan penguatan konkurensi.

Perbaikan pada review ini berada di working tree lokal. Tidak ada deployment,
migrasi database, atau penggantian APK pada tahap review ini. Perubahan dari
pekerjaan sebelumnya dipertahankan.

## Temuan yang masih perlu ditindaklanjuti

### P1 Penerimaan booking belum mengunci jadwal secara atomik

Di `manaseek-api/src/modules/booking/booking.service.ts`, `transition()` memeriksa
konflik sebelum transaksi pembaruan. Dua permintaan ACCEPT untuk **dua booking
berbeda** dengan mutawif dan jam yang bertumpuk dapat sama-sama membaca kalender
kosong, lalu sama-sama berhasil. Kondisi `where: { id, status }` hanya melindungi
perubahan status booking yang sama. Selain itu, ACCEPT tidak memeriksa kembali
`expiresAt`, sehingga permintaan yang terlambat masih dapat diterima sebelum
proses kedaluwarsa dijalankan.

Tindak lanjut: jadikan penguncian kalender mutawif, pemeriksaan konflik dan batas
waktu, perubahan status, serta penulisan event satu transaksi. Uji dua ACCEPT
bersamaan untuk booking berbeda, ACCEPT melawan expiry, dan kegagalan transaksi
pada PostgreSQL terpisah. Review ini tidak mengubah alur transaksi tersebut.

### P1 Rotasi refresh token belum merupakan satu transaksi

Di `manaseek-api/src/modules/auth/token.service.ts`, `rotate()` membaca token
lama, membuat pengganti, kemudian mencabut token lama melalui operasi terpisah.
Dua permintaan bersamaan dapat melewati pemeriksaan token lama dan menghasilkan
dua pengganti; kegagalan di tengah proses juga dapat meninggalkan pasangan token
yang tidak konsisten. Perbaikan satu refresh bersama pada klien web mengurangi
pemicu normal, tetapi tidak menggantikan jaminan atomik di server.

Tindak lanjut: klaim token lama dengan kondisi belum dipakai, buat pengganti, dan
hubungkan keduanya dalam satu transaksi. Uji penggunaan ulang, rollback, serta
dua koneksi database yang melakukan rotasi bersamaan. Jangan menguji skenario
ini memakai akun atau token produksi.

### P1 Target API web dan aplikasi mobile perlu diselaraskan dengan sengaja

`vercel.json` di root masih meneruskan web ke
`https://manaseek-api.vercel.app/api`, sedangkan konfigurasi mobile dalam workspace
menggunakan `https://manaseek-api-manaseek.vercel.app/api`. Karena host berbeda,
kode dan kebijakan IAM yang dideploy ke backend mobile tidak boleh diasumsikan
sudah berlaku pada backend web. Kesamaan database kedua deployment belum
diverifikasi dalam review ini.

Tindak lanjut: tetapkan backend kanonis setelah memeriksa kepemilikan dan data
masing-masing deployment. Jangan langsung mengganti proxy web sebelum dampak
terhadap akun, pesanan, dan booking lama diketahui.

### P2 Kegagalan penyimpanan notifikasi masih dapat menggagalkan respons bisnis

Di `manaseek-api/src/modules/notifications/notifications.service.ts`, pembuatan
notifikasi terjadi di luar `try`, dan `markFailed()` dapat kembali melempar error.
Booking yang sudah tersimpan dapat terlihat gagal bagi klien jika operasi ini
gagal, meskipun komentar layanan menyatakan kegagalan notifikasi tidak merambat.

Tindak lanjut: bedakan hasil transaksi bisnis dari pengiriman notifikasi.
Untuk keandalan pengiriman, simpan pekerjaan notifikasi secara atomik bersama
transaksi bisnis dan proses ulang secara idempoten. Jangan menutupi kegagalan
penyimpanan tanpa pencatatan dan strategi pengiriman ulang.

## Perbaikan yang sudah dilakukan

| Area | Perubahan dan alasan |
| --- | --- |
| Identitas server | JWT hanya membuktikan identitas. Guard membaca status dan peran terbaru sekali per permintaan, sehingga akun tersuspend langsung ditolak dan peran lama dalam token tidak menjadi izin permanen. Gangguan database tidak disamarkan sebagai token invalid. |
| Izin AI | Kebijakan tujuh email tetap sama. Perhitungan izin terpusat di batas autentikasi; guard chat memakai izin server dan tidak lagi membaca tabel pengguna sendiri. Kebijakan email tidak bergantung pada Prisma atau Nest. |
| Integrasi AI | `ChatService` bergantung pada kontrak `ChatAnswerProvider`. Kredensial, model, dan pemanggilan OpenRouter berada di adapter. Tes use case memakai implementasi tiruan kontrak tersebut, bukan memata-matai metode statis vendor. |
| Chat mobile | `ChatScreen` mengurus tampilan; `features/chat/useChatConversation.ts` mengurus state dan alur percakapan; `chat-api.ts` mengurus URL, payload, pagination, dan timeout; stylesheet terpisah. Tampilan dan kontrak API dipertahankan. |
| Sesi web | Permintaan bersamaan berbagi satu proses refresh. Respons dari sesi lama ditolak setelah logout atau pergantian akun. Kegagalan sementara saat refresh tidak menghapus sesi. Penolakan izin AI bukan logout. |
| CI | Pengujian IAM masuk workflow API; web mendapat lint, tes sesi, dan build. Pemeriksaan batas dependensi dan siklus impor ditambahkan. Fixture chat mobile mengikuti kontrak izin server yang baru. |

## Batas arsitektur yang dijaga

Alur mobile untuk chat: **screen → hook fitur → adapter API → API client**.
Alur API untuk jawaban AI: **controller → service → kontrak provider → adapter
OpenRouter**. Perakitan implementasi dilakukan di modul Nest. Kebijakan akses
email tetap merupakan fungsi murni; otorisasi sebenarnya selalu berada di server.

Jalankan `node scripts/check-architecture.mjs` dari root. Pemeriksaan mencakup
graf impor statis pada 214 file sumber, larangan dependensi framework pada
`packages/shared`, larangan `common` API mengimpor modul fitur, batas vendor pada
layanan chat, serta batas I/O pada layar chat. Pemeriksaan ini bukan pembuktian
arsitektur penuh: impor dinamis yang dihitung, perilaku runtime, dan internals
paket pihak ketiga tidak dicakup.

Untuk pengembangan berikutnya, pisahkan aturan domain yang berubah secara
mandiri dari orkestrasi Nest/Prisma. Tambahkan port repository pada batas yang
memang perlu diganti atau diuji terpisah. Hindari membuat interface satu banding
satu untuk setiap pemanggilan Prisma tanpa manfaat yang jelas. Layar besar lain
seperti panduan, profil, dan checkout dapat dipecah berdasarkan tanggung jawab
saat fiturnya berubah; jumlah baris saja bukan alasan untuk menambah lapisan.

## Hasil verifikasi dan batasnya

- API: build dan lint lolos; 121 unit test lolos.
- IAM: 106 pemeriksaan HTTP lokal lolos untuk seluruh lima endpoint chat,
  termasuk ketujuh email, akun di luar daftar, spoofing, alias, token invalid,
  akun dihapus, akun tersuspend, dan perubahan izin dengan token yang sama.
- Mobile: typecheck, lint, 27 unit test, dan ekspor bundle Android lolos.
- Web: lint, enam tes regresi sesi, dan build produksi lolos.
- Pemeriksaan arsitektur: tidak ditemukan siklus impor statis atau pelanggaran
  batas yang secara eksplisit diperiksa.

Tes backend menggunakan mock untuk operasi database dan provider, kecuali
pemeriksaan HTTP lokal yang memakai controller serta guard JWT sebenarnya
dengan identitas di memori. Tidak ada pemanggilan AI berbayar dalam tes tersebut.
Konkurensi database nyata, browser end-to-end, dan uji APK di perangkat belum
dijalankan pada tahap review ini. Docker tersedia tetapi daemon lokal tidak
aktif; tidak ada database atau dependensi berat baru yang dipasang di luar repo.
