-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('JAMAAH', 'MUTAWIF', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'PHONE_CHANGE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MobilityNeed" AS ENUM ('NONE', 'WHEELCHAIR', 'WALKING_AID', 'ELDERLY_ASSISTANCE');

-- CreateEnum
CREATE TYPE "TravelDocumentType" AS ENUM ('PASSPORT', 'VISA', 'ID_CARD', 'VACCINE_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('HAJJ', 'UMRAH');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('OFFLINE', 'ONLINE', 'BUSY');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('IBADAH_GUIDANCE', 'MOBILITY_ASSISTANCE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "MutawifDocumentType" AS ENUM ('ID_CARD', 'PASSPORT', 'CERTIFICATE', 'PORTRAIT', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'REJECTED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'SETTLED_OFFLINE', 'WAIVED');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('ANDROID', 'IOS', 'WEB');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'JAMAAH',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationId" UUID,
    "phoneVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_requests" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'LOGIN',
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" UUID,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jamaah_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "gender" "Gender",
    "birthDate" DATE,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "mobilityNeed" "MobilityNeed" NOT NULL DEFAULT 'NONE',
    "medicalNotes" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'id',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jamaah_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_documents" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "TravelDocumentType" NOT NULL,
    "number" TEXT,
    "issuedAt" DATE,
    "expiresAt" DATE,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "TripType" NOT NULL,
    "packageName" TEXT,
    "agencyName" TEXT,
    "groupCode" TEXT,
    "departureDate" DATE NOT NULL,
    "returnDate" DATE,
    "status" "TripStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutawif_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bio" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "city" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "verificationNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" UUID,
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'OFFLINE',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationUpdatedAt" TIMESTAMP(3),
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "completedBookings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mutawif_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutawif_documents" (
    "id" UUID NOT NULL,
    "mutawifId" UUID NOT NULL,
    "type" "MutawifDocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "DocumentReviewStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mutawif_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutawif_service_rates" (
    "id" UUID NOT NULL,
    "mutawifId" UUID NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "hourlyRate" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mutawif_service_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_slots" (
    "id" UUID NOT NULL,
    "mutawifId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "jamaahId" UUID NOT NULL,
    "mutawifId" UUID NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "hourlyRate" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "meetingPointLabel" TEXT NOT NULL,
    "meetingLatitude" DOUBLE PRECISION,
    "meetingLongitude" DOUBLE PRECISION,
    "notes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" UUID,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_events" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "actorId" UUID,
    "actorRole" "UserRole",
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "jamaahId" UUID NOT NULL,
    "mutawifId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "templateKey" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "otp_requests_phone_purpose_createdAt_idx" ON "otp_requests"("phone", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "otp_requests_expiresAt_idx" ON "otp_requests"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_revokedAt_idx" ON "refresh_tokens"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "jamaah_profiles_userId_key" ON "jamaah_profiles"("userId");

-- CreateIndex
CREATE INDEX "travel_documents_userId_type_idx" ON "travel_documents"("userId", "type");

-- CreateIndex
CREATE INDEX "trips_userId_status_idx" ON "trips"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mutawif_profiles_userId_key" ON "mutawif_profiles"("userId");

-- CreateIndex
CREATE INDEX "mutawif_profiles_latitude_longitude_idx" ON "mutawif_profiles"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "mutawif_profiles_verificationStatus_availabilityStatus_idx" ON "mutawif_profiles"("verificationStatus", "availabilityStatus");

-- CreateIndex
CREATE INDEX "mutawif_documents_mutawifId_status_idx" ON "mutawif_documents"("mutawifId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mutawif_service_rates_mutawifId_serviceType_key" ON "mutawif_service_rates"("mutawifId", "serviceType");

-- CreateIndex
CREATE INDEX "availability_slots_mutawifId_dayOfWeek_idx" ON "availability_slots"("mutawifId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "availability_slots_mutawifId_dayOfWeek_startMinute_key" ON "availability_slots"("mutawifId", "dayOfWeek", "startMinute");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_code_key" ON "bookings"("code");

-- CreateIndex
CREATE INDEX "bookings_jamaahId_status_idx" ON "bookings"("jamaahId", "status");

-- CreateIndex
CREATE INDEX "bookings_mutawifId_status_idx" ON "bookings"("mutawifId", "status");

-- CreateIndex
CREATE INDEX "bookings_status_expiresAt_idx" ON "bookings"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "bookings_mutawifId_scheduledStartAt_idx" ON "bookings"("mutawifId", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "booking_events_bookingId_createdAt_idx" ON "booking_events"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");

-- CreateIndex
CREATE INDEX "reviews_mutawifId_createdAt_idx" ON "reviews"("mutawifId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_status_createdAt_idx" ON "notifications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jamaah_profiles" ADD CONSTRAINT "jamaah_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_documents" ADD CONSTRAINT "travel_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutawif_profiles" ADD CONSTRAINT "mutawif_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutawif_documents" ADD CONSTRAINT "mutawif_documents_mutawifId_fkey" FOREIGN KEY ("mutawifId") REFERENCES "mutawif_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutawif_service_rates" ADD CONSTRAINT "mutawif_service_rates_mutawifId_fkey" FOREIGN KEY ("mutawifId") REFERENCES "mutawif_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_mutawifId_fkey" FOREIGN KEY ("mutawifId") REFERENCES "mutawif_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_jamaahId_fkey" FOREIGN KEY ("jamaahId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_mutawifId_fkey" FOREIGN KEY ("mutawifId") REFERENCES "mutawif_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_jamaahId_fkey" FOREIGN KEY ("jamaahId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_mutawifId_fkey" FOREIGN KEY ("mutawifId") REFERENCES "mutawif_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

