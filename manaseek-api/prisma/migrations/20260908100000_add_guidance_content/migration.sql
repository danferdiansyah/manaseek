-- CreateEnum
CREATE TYPE "RitualPhase" AS ENUM ('PREPARATION', 'IHRAM', 'TAWAF', 'SAI', 'TAHALLUL', 'WUKUF', 'MABIT', 'JUMRAH', 'GENERAL');

-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('UMRAH', 'HAJJ', 'DOA', 'PERSIAPAN');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED');

-- CreateTable
CREATE TABLE "guidance_topics" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "phase" "RitualPhase" NOT NULL,
    "categories" "ContentCategory"[] DEFAULT ARRAY[]::"ContentCategory"[],
    "obligation" TEXT,
    "readingMinutes" INTEGER NOT NULL DEFAULT 3,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "audioUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guidance_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guidance_steps" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "guidance_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayers" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "arabic" TEXT NOT NULL,
    "transliteration" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "context" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "topicId" UUID,

    CONSTRAINT "prayers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prohibitions" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "consequence" TEXT,

    CONSTRAINT "prohibitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ContentCategory" NOT NULL DEFAULT 'PERSIAPAN',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_progress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guidance_topics_slug_key" ON "guidance_topics"("slug");

-- CreateIndex
CREATE INDEX "guidance_topics_status_phase_orderIndex_idx" ON "guidance_topics"("status", "phase", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "guidance_steps_topicId_orderIndex_key" ON "guidance_steps"("topicId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "prayers_slug_key" ON "prayers"("slug");

-- CreateIndex
CREATE INDEX "prayers_topicId_orderIndex_idx" ON "prayers"("topicId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "prohibitions_topicId_orderIndex_key" ON "prohibitions"("topicId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_items_slug_key" ON "checklist_items"("slug");

-- CreateIndex
CREATE INDEX "checklist_items_status_orderIndex_idx" ON "checklist_items"("status", "orderIndex");

-- CreateIndex
CREATE INDEX "checklist_progress_userId_idx" ON "checklist_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_progress_userId_itemId_key" ON "checklist_progress"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "guidance_steps" ADD CONSTRAINT "guidance_steps_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "guidance_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayers" ADD CONSTRAINT "prayers_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "guidance_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prohibitions" ADD CONSTRAINT "prohibitions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "guidance_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_progress" ADD CONSTRAINT "checklist_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_progress" ADD CONSTRAINT "checklist_progress_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

