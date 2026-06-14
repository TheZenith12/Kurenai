-- CreateEnum
CREATE TYPE "AchievCategory" AS ENUM ('COMBAT', 'SOCIAL', 'COLLECTION', 'MASTERY', 'SEASONAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "AchievRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ATTACK_RECEIVED', 'ACHIEVEMENT_UNLOCKED', 'QUEST_COMPLETED', 'GUILD_INVITE', 'SEASON_START', 'SEASON_END', 'PAYMENT_CONFIRMED', 'SYSTEM', 'GUILD_WAR');

-- CreateEnum
CREATE TYPE "GuildWarStatus" AS ENUM ('PENDING', 'ACCEPTED', 'ACTIVE', 'FINISHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "AchievCategory" NOT NULL,
    "rarity" "AchievRarity" NOT NULL DEFAULT 'COMMON',
    "rewardCp" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 1,
    "longestStreak" INTEGER NOT NULL DEFAULT 1,
    "lastLoginDate" TEXT NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildWar" (
    "id" TEXT NOT NULL,
    "attackerGuildId" TEXT NOT NULL,
    "defenderGuildId" TEXT NOT NULL,
    "status" "GuildWarStatus" NOT NULL DEFAULT 'PENDING',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "attackerScore" INTEGER NOT NULL DEFAULT 0,
    "defenderScore" INTEGER NOT NULL DEFAULT 0,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildWar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildWarAttack" (
    "id" TEXT NOT NULL,
    "warId" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "damage" INTEGER NOT NULL,
    "guildId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildWarAttack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GachaPool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "costCp" INTEGER NOT NULL DEFAULT 100,
    "costType" TEXT NOT NULL DEFAULT 'CP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bannerUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GachaPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GachaPoolItem" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',

    CONSTRAINT "GachaPoolItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GachaRoll" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "pityCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GachaRoll_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_unlockedAt_idx" ON "UserAchievement"("userId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoginStreak_userId_key" ON "LoginStreak"("userId");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginStreak" ADD CONSTRAINT "LoginStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildWar" ADD CONSTRAINT "GuildWar_attackerGuildId_fkey" FOREIGN KEY ("attackerGuildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildWar" ADD CONSTRAINT "GuildWar_defenderGuildId_fkey" FOREIGN KEY ("defenderGuildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildWarAttack" ADD CONSTRAINT "GuildWarAttack_warId_fkey" FOREIGN KEY ("warId") REFERENCES "GuildWar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GachaPoolItem" ADD CONSTRAINT "GachaPoolItem_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "GachaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GachaPoolItem" ADD CONSTRAINT "GachaPoolItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "AnimeCharacter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GachaRoll" ADD CONSTRAINT "GachaRoll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GachaRoll" ADD CONSTRAINT "GachaRoll_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "GachaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
