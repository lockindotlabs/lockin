-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('IDLE', 'STREAMING', 'ERROR');

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New chat',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "status" "ChatStatus" NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
