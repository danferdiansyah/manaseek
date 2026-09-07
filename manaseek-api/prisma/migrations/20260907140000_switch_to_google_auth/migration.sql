-- AlterTable
ALTER TABLE "users" DROP COLUMN "phoneVerifiedAt",
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- DropTable
DROP TABLE "otp_requests";

-- DropEnum
DROP TYPE "OtpPurpose";

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

