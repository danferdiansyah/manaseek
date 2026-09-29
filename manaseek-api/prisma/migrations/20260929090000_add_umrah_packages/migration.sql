-- CreateEnum
CREATE TYPE "UmrahRoomType" AS ENUM ('QUAD', 'TRIPLE', 'DOUBLE');

-- CreateEnum
CREATE TYPE "UmrahOrderStatus" AS ENUM ('CONFIRMED');

-- CreateEnum
CREATE TYPE "UmrahPaymentStatus" AS ENUM ('SUCCESS');

-- CreateEnum
CREATE TYPE "UmrahPaymentMethod" AS ENUM ('DUMMY');

-- CreateTable
CREATE TABLE "umrah_packages" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "departureCity" TEXT NOT NULL,
    "basePrice" DECIMAL(14,2) NOT NULL,
    "tripleSupplement" DECIMAL(14,2) NOT NULL,
    "doubleSupplement" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "details" JSONB NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "umrah_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "umrah_departures" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "departureDate" DATE NOT NULL,
    "returnDate" DATE NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "umrah_departures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "umrah_orders" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "departureId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" "UmrahOrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "roomType" "UmrahRoomType" NOT NULL,
    "travelerCount" INTEGER NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "packageSnapshot" JSONB NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "umrah_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "umrah_travelers" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "birthDate" DATE NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "umrah_travelers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "umrah_payments" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "method" "UmrahPaymentMethod" NOT NULL DEFAULT 'DUMMY',
    "status" "UmrahPaymentStatus" NOT NULL DEFAULT 'SUCCESS',
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "umrah_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "umrah_packages_slug_key" ON "umrah_packages"("slug");

-- CreateIndex
CREATE INDEX "umrah_departures_departureDate_idx" ON "umrah_departures"("departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "umrah_departures_packageId_departureDate_key" ON "umrah_departures"("packageId", "departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "umrah_orders_code_key" ON "umrah_orders"("code");

-- CreateIndex
CREATE INDEX "umrah_orders_userId_createdAt_idx" ON "umrah_orders"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "umrah_orders_userId_requestId_key" ON "umrah_orders"("userId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "umrah_travelers_orderId_position_key" ON "umrah_travelers"("orderId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "umrah_payments_orderId_key" ON "umrah_payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "umrah_payments_reference_key" ON "umrah_payments"("reference");

-- AddForeignKey
ALTER TABLE "umrah_departures" ADD CONSTRAINT "umrah_departures_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "umrah_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "umrah_orders" ADD CONSTRAINT "umrah_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "umrah_orders" ADD CONSTRAINT "umrah_orders_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "umrah_departures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "umrah_travelers" ADD CONSTRAINT "umrah_travelers_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "umrah_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "umrah_payments" ADD CONSTRAINT "umrah_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "umrah_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Dummy catalog: deliberately fictional providers; no airline or hotel inventory.
INSERT INTO "umrah_packages" ("id", "slug", "name", "summary", "description", "durationDays", "departureCity", "basePrice", "tripleSupplement", "doubleSupplement", "currency", "details", "isDemo", "active", "updatedAt") VALUES ('2815c588-b7b8-577c-b059-333b2d278742', 'umroh-hemat-9-hari', 'Umroh Hemat 9 Hari', 'Ibadah nyaman, biaya bersahabat.', 'Paket lengkap untuk menemani perjalanan umroh dari keberangkatan hingga kembali ke Indonesia. Seluruh maskapai, hotel, jadwal dan harga dalam paket ini merupakan data simulasi.', '9', 'Jakarta', '24900000', '1200000', '2500000', 'IDR', '{"agency": "Manaseek Travel Demo", "flights": [{"direction": "OUTBOUND", "airline": "Nusantara Amanah Air (Demo)", "flightNumber": "DM 101", "from": "Jakarta · CGK", "to": "Jeddah · JED", "departureTime": "10.00 WIB", "arrivalTime": "15.30 WAS", "day": 1, "arrivalDay": 1, "cabin": "Ekonomi", "baggage": "Bagasi 30 kg + kabin 7 kg", "transit": "Langsung"}, {"direction": "RETURN", "airline": "Nusantara Amanah Air (Demo)", "flightNumber": "DM 102", "from": "Madinah · MED", "to": "Jakarta · CGK", "departureTime": "18.00 WAS", "arrivalTime": "07.00 WIB", "day": 8, "arrivalDay": 9, "cabin": "Ekonomi", "baggage": "Bagasi 30 kg + kabin 7 kg", "transit": "Langsung"}], "hotels": [{"city": "Makkah", "name": "Safar Makkah Residence (Demo)", "stars": 3, "nights": 4, "distanceMeters": 650, "landmark": "Masjidil Haram", "mealPlan": "Makan 3 kali sehari"}, {"city": "Madinah", "name": "Safar Madinah Residence (Demo)", "stars": 3, "nights": 3, "distanceMeters": 450, "landmark": "Masjid Nabawi", "mealPlan": "Makan 3 kali sehari"}], "included": ["Tiket pesawat pergi–pulang kelas ekonomi", "Hotel Makkah dan Madinah sesuai paket", "Visa umroh dan asuransi perjalanan", "Bus AC dan transfer bandara", "Makan 3 kali sehari selama menginap", "Pembimbing ibadah berbahasa Indonesia", "Manasik sebelum berangkat", "Koper, tas kabin, dan perlengkapan ibadah", "Air zamzam 5 liter sesuai ketentuan bagasi", "City tour Makkah dan Madinah"], "excluded": ["Pembuatan atau perpanjangan paspor", "Vaksinasi dan pemeriksaan kesehatan pribadi", "Belanja pribadi, laundry, dan kelebihan bagasi"], "itinerary": [{"days": "Hari 1", "title": "Jakarta → Jeddah → Makkah", "description": "Berkumpul di bandara, penerbangan ke Jeddah, perjalanan bus ke Makkah, dan check-in hotel."}, {"days": "Hari 2", "title": "Rangkaian ibadah umroh", "description": "Pendampingan ihram, thawaf, sai, dan tahallul bersama pembimbing rombongan."}, {"days": "Hari 3–4", "title": "Ibadah dan ziarah Makkah", "description": "Waktu ibadah di Masjidil Haram, city tour, serta sesi bimbingan bersama mutawif."}, {"days": "Hari 5", "title": "Makkah → Madinah", "description": "Perjalanan bus menuju Madinah, check-in hotel, dan ibadah di Masjid Nabawi."}, {"days": "Hari 6–7", "title": "Ibadah dan ziarah Madinah", "description": "Ibadah di Masjid Nabawi, kunjungan Masjid Quba dan Uhud. Kunjungan Raudhah mengikuti izin dan ketersediaan."}, {"days": "Hari 8–9", "title": "Madinah → Jakarta", "description": "Check-out hotel, transfer bandara, penerbangan pulang, dan tiba kembali di Jakarta."}], "roomNote": "Harga per jamaah. Quad: 4 orang/kamar, triple: 3, double: 2. Kamar berbagi dengan jamaah sejenis bila jumlah rombongan belum memenuhi kapasitas kamar. Harga demo sama untuk semua usia."}', 'true', 'true', CURRENT_TIMESTAMP);
INSERT INTO "umrah_departures" ("id", "packageId", "departureDate", "returnDate", "availableSeats") VALUES ('96cd953c-909c-5526-914d-4ad52cc03609', '2815c588-b7b8-577c-b059-333b2d278742', '2026-11-10', '2026-11-18', '24');
INSERT INTO "umrah_departures" ("id", "packageId", "departureDate", "returnDate", "availableSeats") VALUES ('af20c72b-182f-5b66-b17c-a8d824c6bc19', '2815c588-b7b8-577c-b059-333b2d278742', '2026-12-10', '2026-12-18', '40');
INSERT INTO "umrah_departures" ("id", "packageId", "departureDate", "returnDate", "availableSeats") VALUES ('5f5ac3ef-5154-5556-b34f-ca0350df4bd7', '2815c588-b7b8-577c-b059-333b2d278742', '2027-01-09', '2027-01-17', '40');
INSERT INTO "umrah_packages" ("id", "slug", "name", "summary", "description", "durationDays", "departureCity", "basePrice", "tripleSupplement", "doubleSupplement", "currency", "details", "isDemo", "active", "updatedAt") VALUES ('7ca81221-3072-5adc-b4b5-abf8158d9f90', 'umroh-nyaman-12-hari', 'Umroh Nyaman 12 Hari', 'Lebih dekat ke masjid, lebih tenang beribadah.', 'Paket lengkap untuk menemani perjalanan umroh dari keberangkatan hingga kembali ke Indonesia. Seluruh maskapai, hotel, jadwal dan harga dalam paket ini merupakan data simulasi.', '12', 'Jakarta', '32900000', '1800000', '3500000', 'IDR', '{"agency": "Manaseek Travel Demo", "flights": [{"direction": "OUTBOUND", "airline": "Nusantara Amanah Air (Demo)", "flightNumber": "DM 111", "from": "Jakarta · CGK", "to": "Jeddah · JED", "departureTime": "10.00 WIB", "arrivalTime": "15.30 WAS", "day": 1, "arrivalDay": 1, "cabin": "Ekonomi", "baggage": "Bagasi 30 kg + kabin 7 kg", "transit": "Langsung"}, {"direction": "RETURN", "airline": "Nusantara Amanah Air (Demo)", "flightNumber": "DM 112", "from": "Madinah · MED", "to": "Jakarta · CGK", "departureTime": "18.00 WAS", "arrivalTime": "07.00 WIB", "day": 11, "arrivalDay": 12, "cabin": "Ekonomi", "baggage": "Bagasi 30 kg + kabin 7 kg", "transit": "Langsung"}], "hotels": [{"city": "Makkah", "name": "Rawdah Makkah Suites (Demo)", "stars": 4, "nights": 6, "distanceMeters": 300, "landmark": "Masjidil Haram", "mealPlan": "Makan 3 kali sehari"}, {"city": "Madinah", "name": "Rawdah Madinah Suites (Demo)", "stars": 4, "nights": 4, "distanceMeters": 200, "landmark": "Masjid Nabawi", "mealPlan": "Makan 3 kali sehari"}], "included": ["Tiket pesawat pergi–pulang kelas ekonomi", "Hotel Makkah dan Madinah sesuai paket", "Visa umroh dan asuransi perjalanan", "Bus AC dan transfer bandara", "Makan 3 kali sehari selama menginap", "Pembimbing ibadah berbahasa Indonesia", "Manasik sebelum berangkat", "Koper, tas kabin, dan perlengkapan ibadah", "Air zamzam 5 liter sesuai ketentuan bagasi", "City tour Makkah dan Madinah"], "excluded": ["Pembuatan atau perpanjangan paspor", "Vaksinasi dan pemeriksaan kesehatan pribadi", "Belanja pribadi, laundry, dan kelebihan bagasi"], "itinerary": [{"days": "Hari 1", "title": "Jakarta → Jeddah → Makkah", "description": "Berkumpul di bandara, penerbangan ke Jeddah, perjalanan bus ke Makkah, dan check-in hotel."}, {"days": "Hari 2", "title": "Rangkaian ibadah umroh", "description": "Pendampingan ihram, thawaf, sai, dan tahallul bersama pembimbing rombongan."}, {"days": "Hari 3–6", "title": "Ibadah dan ziarah Makkah", "description": "Waktu ibadah di Masjidil Haram, city tour, serta sesi bimbingan bersama mutawif."}, {"days": "Hari 7", "title": "Makkah → Madinah", "description": "Perjalanan bus menuju Madinah, check-in hotel, dan ibadah di Masjid Nabawi."}, {"days": "Hari 8–10", "title": "Ibadah dan ziarah Madinah", "description": "Ibadah di Masjid Nabawi, kunjungan Masjid Quba dan Uhud. Kunjungan Raudhah mengikuti izin dan ketersediaan."}, {"days": "Hari 11–12", "title": "Madinah → Jakarta", "description": "Check-out hotel, transfer bandara, penerbangan pulang, dan tiba kembali di Jakarta."}], "roomNote": "Harga per jamaah. Quad: 4 orang/kamar, triple: 3, double: 2. Kamar berbagi dengan jamaah sejenis bila jumlah rombongan belum memenuhi kapasitas kamar. Harga demo sama untuk semua usia."}', 'true', 'true', CURRENT_TIMESTAMP);
INSERT INTO "umrah_departures" ("id", "packageId", "departureDate", "returnDate", "availableSeats") VALUES ('d3e82741-5877-5683-9a27-8f86697807f0', '7ca81221-3072-5adc-b4b5-abf8158d9f90', '2026-11-15', '2026-11-26', '20');
INSERT INTO "umrah_departures" ("id", "packageId", "departureDate", "returnDate", "availableSeats") VALUES ('5c3639db-1650-53d3-a6ae-3700f417408b', '7ca81221-3072-5adc-b4b5-abf8158d9f90', '2026-12-15', '2026-12-26', '40');
INSERT INTO "umrah_departures" ("id", "packageId", "departureDate", "returnDate", "availableSeats") VALUES ('9753dbd9-2b55-5cc5-9e34-b6f09e4da5f5', '7ca81221-3072-5adc-b4b5-abf8158d9f90', '2027-01-14', '2027-01-25', '40');
INSERT INTO "umrah_packages" ("id", "slug", "name", "summary", "description", "durationDays", "departureCity", "basePrice", "tripleSupplement", "doubleSupplement", "currency", "details", "isDemo", "active", "updatedAt") VALUES ('12c5052f-6054-54d8-ae07-a5238e0bd92b', 'umroh-premium-15-hari', 'Umroh Premium 15 Hari', 'Waktu lebih lapang dengan kenyamanan istimewa.', 'Paket lengkap untuk menemani perjalanan umroh dari keberangkatan hingga kembali ke Indonesia. Seluruh maskapai, hotel, jadwal dan harga dalam paket ini merupakan data simulasi.', '15', 'Jakarta', '44900000', '2500000', '5000000', 'IDR', '{"agency": "Manaseek Travel Demo", "flights": [{"direction": "OUTBOUND", "airline": "Nusantara Amanah Air (Demo)", "flightNumber": "DM 121", "from": "Jakarta · CGK", "to": "Jeddah · JED", "departureTime": "10.00 WIB", "arrivalTime": "15.30 WAS", "day": 1, "arrivalDay": 1, "cabin": "Ekonomi", "baggage": "Bagasi 30 kg + kabin 7 kg", "transit": "Langsung"}, {"direction": "RETURN", "airline": "Nusantara Amanah Air (Demo)", "flightNumber": "DM 122", "from": "Madinah · MED", "to": "Jakarta · CGK", "departureTime": "18.00 WAS", "arrivalTime": "07.00 WIB", "day": 14, "arrivalDay": 15, "cabin": "Ekonomi", "baggage": "Bagasi 30 kg + kabin 7 kg", "transit": "Langsung"}], "hotels": [{"city": "Makkah", "name": "Sakinah Makkah Grand (Demo)", "stars": 5, "nights": 8, "distanceMeters": 150, "landmark": "Masjidil Haram", "mealPlan": "Makan 3 kali sehari"}, {"city": "Madinah", "name": "Sakinah Madinah Grand (Demo)", "stars": 5, "nights": 5, "distanceMeters": 100, "landmark": "Masjid Nabawi", "mealPlan": "Makan 3 kali sehari"}], "included": ["Tiket pesawat pergi–pulang kelas ekonomi", "Hotel Makkah dan Madinah sesuai paket", "Visa umroh dan asuransi perjalanan", "Bus AC dan transfer bandara", "Makan 3 kali sehari selama menginap", "Pembimbing ibadah berbahasa Indonesia", "Manasik sebelum berangkat", "Koper, tas kabin, dan perlengkapan ibadah", "Air zamzam 5 liter sesuai ketentuan bagasi", "City tour Makkah dan Madinah"], "excluded": ["Pembuatan atau perpanjangan paspor", "Vaksinasi dan pemeriksaan kesehatan pribadi", "Belanja pribadi, laundry, dan kelebihan bagasi"], "itinerary": [{"days": "Hari 1", "title": "Jakarta → Jeddah → Makkah", "description": "Berkumpul di bandara, penerbangan ke Jeddah, perjalanan bus ke Makkah, dan check-in hotel."}, {"days": "Hari 2", "title": "Rangkaian ibadah umroh", "description": "Pendampingan ihram, thawaf, sai, dan tahallul bersama pembimbing rombongan."}, {"days": "Hari 3–8", "title": "Ibadah dan ziarah Makkah", "description": "Waktu ibadah di Masjidil Haram, city tour, serta sesi bimbingan bersama mutawif."}, {"days": "Hari 9", "title": "Makkah → Madinah", "description": "Perjalanan bus menuju Madinah, check-in hotel, dan ibadah di Masjid Nabawi."}, {"days": "Hari 10–13", "title": "Ibadah dan ziarah Madinah", "description": "Ibadah di Masjid Nabawi, kunjungan Masjid Quba dan Uhud. Kunjungan Raudhah mengikuti izin dan ketersediaan."}, {"days": "Hari 14–15", "title": "Madinah → Jakarta", "description": "Check-out hotel, transfer bandara, penerbangan pulang, dan tiba kembali di Jakarta."}], "roomNote": "Harga per jamaah. Quad: 4 orang/kamar, triple: 3, double: 2. Kamar berbagi dengan jamaah sejenis bila jumlah rombongan belum memenuhi kapasitas kamar. Harga demo sama untuk semua usia."}', 'true', 'true', CURRENT_TIMESTAMP);
INSERT INTO "umrah_departures" ("id", "packageId", "departureDate", "returnDate", "availableSeats") VALUES ('5d7e00ad-4924-5c49-b0dc-05738461e13d', '12c5052f-6054-54d8-ae07-a5238e0bd92b', '2026-12-01', '2026-12-15', '16');
INSERT INTO "umrah_departures" ("id", "packageId", "departureDate", "returnDate", "availableSeats") VALUES ('6f529a23-f317-59ad-abb8-6fde363efdce', '12c5052f-6054-54d8-ae07-a5238e0bd92b', '2026-12-31', '2027-01-14', '40');
INSERT INTO "umrah_departures" ("id", "packageId", "departureDate", "returnDate", "availableSeats") VALUES ('5bca71ed-df97-5fc8-9d5d-7a8407e72b0f', '12c5052f-6054-54d8-ae07-a5238e0bd92b', '2027-01-30', '2027-02-13', '40');

ALTER TABLE "umrah_departures" ADD CONSTRAINT "umrah_departures_seats_nonnegative" CHECK ("availableSeats" >= 0);
ALTER TABLE "umrah_orders" ADD CONSTRAINT "umrah_orders_amounts_valid" CHECK ("travelerCount" BETWEEN 1 AND 6 AND "unitPrice" > 0 AND "totalAmount" = "unitPrice" * "travelerCount");
