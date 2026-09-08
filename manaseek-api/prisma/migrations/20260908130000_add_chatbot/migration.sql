-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "citedSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_sessions_userId_updatedAt_idx" ON "chat_sessions"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_createdAt_idx" ON "chat_messages"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

