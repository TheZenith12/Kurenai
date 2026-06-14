-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('ATTACK_ENEMIES', 'PLAY_GAMES', 'SEND_MESSAGES', 'EARN_AP', 'WIN_GAMES');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DailyQuest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "QuestType" NOT NULL,
    "target" INTEGER NOT NULL,
    "rewardAp" INTEGER NOT NULL DEFAULT 0,
    "rewardCp" INTEGER NOT NULL DEFAULT 0,
    "rewardXp" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDailyQuest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "date" TEXT NOT NULL,

    CONSTRAINT "UserDailyQuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDailyQuest_userId_date_idx" ON "UserDailyQuest"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyQuest_userId_questId_date_key" ON "UserDailyQuest"("userId", "questId", "date");

-- AddForeignKey
ALTER TABLE "UserDailyQuest" ADD CONSTRAINT "UserDailyQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyQuest" ADD CONSTRAINT "UserDailyQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "DailyQuest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
