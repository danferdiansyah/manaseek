-- CreateEnum
CREATE TYPE "ReferenceKind" AS ENUM ('QURAN', 'HADITH', 'OTHER');

-- CreateTable
CREATE TABLE "guidance_references" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "kind" "ReferenceKind" NOT NULL,
    "citation" TEXT NOT NULL,
    "gloss" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "guidance_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guidance_references_topicId_orderIndex_key" ON "guidance_references"("topicId", "orderIndex");

-- AddForeignKey
ALTER TABLE "guidance_references" ADD CONSTRAINT "guidance_references_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "guidance_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

