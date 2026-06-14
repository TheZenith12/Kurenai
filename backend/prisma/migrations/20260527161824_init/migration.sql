-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "MasteryTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateEnum
CREATE TYPE "SkillEffect" AS ENUM ('FIRE', 'WATER', 'LIGHTNING', 'WIND', 'DARK', 'LIGHT', 'EARTH', 'VOID', 'RASENGAN', 'SHARINGAN', 'SPIRIT', 'ICE');

-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('ALL', 'ANIME', 'PRIVATE', 'GUILD');

-- CreateEnum
CREATE TYPE "WinnerType" AS ENUM ('MOST_HP', 'LAST_ALIVE', 'MOST_KILLS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('QPAY', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MiniGameType" AS ENUM ('REACTION', 'MEMORY', 'CLICK_SPEED', 'PATTERN', 'DODGE');

-- CreateEnum
CREATE TYPE "GuildRole" AS ENUM ('LEADER', 'OFFICER', 'MEMBER');

-- CreateEnum
CREATE TYPE "CosmeticType" AS ENUM ('AVATAR_FRAME', 'CHAT_ANIMATION', 'KILL_EFFECT', 'PROFILE_BACKGROUND');

-- CreateEnum
CREATE TYPE "WarningSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReputationReason" AS ENUM ('LIKE_RECEIVED', 'REPORT_CONFIRMED', 'SPAM_DETECTED', 'PROFANITY_DETECTED', 'FAIR_PLAY_BONUS', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LeaderboardType" AS ENUM ('WEEKLY_ATTACK', 'MINI_GAME_DAILY', 'CHARACTER_MASTERY', 'ANIME_SPECIFIC', 'GUILD_RANKING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banUntil" TIMESTAMP(3),
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "muteUntil" TIMESTAMP(3),
    "reputation" INTEGER NOT NULL DEFAULT 100,
    "ipAddress" TEXT,
    "deviceHash" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "activeCharacterId" TEXT,
    "characterPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anime" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shardKey" TEXT,

    CONSTRAINT "Anime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimeCharacter" (
    "id" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "fullImageUrl" TEXT,
    "isBaseForm" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "characterPoints" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimeCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCharacter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "masteryTier" "MasteryTier" NOT NULL DEFAULT 'BRONZE',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "damageMin" INTEGER NOT NULL,
    "damageMax" INTEGER NOT NULL,
    "energyCost" INTEGER NOT NULL,
    "cooldownSeconds" INTEGER NOT NULL,
    "animationUrl" TEXT NOT NULL,
    "effectType" "SkillEffect" NOT NULL,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "requiredTier" "MasteryTier" NOT NULL DEFAULT 'BRONZE',
    "isUltimate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL,
    "type" "ChatType" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimeChat" (
    "id" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,

    CONSTRAINT "AnimeChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateChat" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isFiltered" BOOLEAN NOT NULL DEFAULT false,
    "filterReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "winnerId" TEXT,
    "winnerType" "WinnerType" NOT NULL DEFAULT 'MOST_HP',
    "rewardPoints" INTEGER NOT NULL DEFAULT 500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonStat" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hp" INTEGER NOT NULL DEFAULT 1000,
    "maxHp" INTEGER NOT NULL DEFAULT 1000,
    "attackPoint" INTEGER NOT NULL DEFAULT 100,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "maxEnergy" INTEGER NOT NULL DEFAULT 100,
    "energyLastRefill" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "isEliminated" BOOLEAN NOT NULL DEFAULT false,
    "eliminatedAt" TIMESTAMP(3),
    "characterPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SeasonStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttackLog" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "skillId" TEXT,
    "damageDealt" INTEGER NOT NULL,
    "attackerHpBefore" INTEGER NOT NULL,
    "defenderHpBefore" INTEGER NOT NULL,
    "attackerHpAfter" INTEGER NOT NULL,
    "defenderHpAfter" INTEGER NOT NULL,
    "isKill" BOOLEAN NOT NULL DEFAULT false,
    "replayData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttackLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT,
    "cosmeticItemId" TEXT,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "qpayInvoiceId" TEXT,
    "qpayQrCode" TEXT,
    "qpayDeepLink" TEXT,
    "bankTransferRef" TEXT,
    "adminNotes" TEXT,
    "adminVerifiedBy" TEXT,
    "adminVerifiedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiniGame" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "MiniGameType" NOT NULL,
    "maxReward" INTEGER NOT NULL,
    "minReward" INTEGER NOT NULL,
    "cooldownMin" INTEGER NOT NULL DEFAULT 60,
    "dailyCap" INTEGER NOT NULL DEFAULT 500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiniGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiniGameSession" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reward" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "cheatFlags" JSONB,
    "serverSeed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiniGameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "description" TEXT,
    "badgeUrl" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "chatRoomId" TEXT,
    "maxMembers" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildMember" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GuildRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CosmeticItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "CosmeticType" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "effectUrl" TEXT,
    "animationCss" TEXT,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CosmeticItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCosmetic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "slot" "CosmeticType" NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationWarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "messageId" TEXT,
    "adminId" TEXT,
    "isAuto" BOOLEAN NOT NULL DEFAULT true,
    "severity" "WarningSeverity" NOT NULL DEFAULT 'LOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "messageId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminId" TEXT,
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "change" INTEGER NOT NULL,
    "reason" "ReputationReason" NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "type" "LeaderboardType" NOT NULL,
    "seasonId" TEXT,
    "animeId" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankConfig" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_systemId_key" ON "User"("systemId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_systemId_idx" ON "User"("systemId");

-- CreateIndex
CREATE INDEX "User_isBanned_isActive_idx" ON "User"("isBanned", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Anime_name_key" ON "Anime"("name");

-- CreateIndex
CREATE INDEX "Anime_isActive_idx" ON "Anime"("isActive");

-- CreateIndex
CREATE INDEX "AnimeCharacter_animeId_idx" ON "AnimeCharacter"("animeId");

-- CreateIndex
CREATE INDEX "AnimeCharacter_isBaseForm_isActive_idx" ON "AnimeCharacter"("isBaseForm", "isActive");

-- CreateIndex
CREATE INDEX "UserCharacter_userId_isActive_idx" ON "UserCharacter"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserCharacter_userId_characterId_key" ON "UserCharacter"("userId", "characterId");

-- CreateIndex
CREATE INDEX "Skill_characterId_idx" ON "Skill"("characterId");

-- CreateIndex
CREATE INDEX "ChatRoom_type_isActive_idx" ON "ChatRoom"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeChat_animeId_key" ON "AnimeChat"("animeId");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeChat_chatRoomId_key" ON "AnimeChat"("chatRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateChat_chatRoomId_key" ON "PrivateChat"("chatRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateChat_user1Id_user2Id_key" ON "PrivateChat"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "Message_roomId_createdAt_idx" ON "Message"("roomId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Season_number_key" ON "Season"("number");

-- CreateIndex
CREATE INDEX "Season_isActive_idx" ON "Season"("isActive");

-- CreateIndex
CREATE INDEX "Season_startDate_endDate_idx" ON "Season"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "SeasonStat_seasonId_hp_idx" ON "SeasonStat"("seasonId", "hp" DESC);

-- CreateIndex
CREATE INDEX "SeasonStat_seasonId_kills_idx" ON "SeasonStat"("seasonId", "kills" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SeasonStat_seasonId_userId_key" ON "SeasonStat"("seasonId", "userId");

-- CreateIndex
CREATE INDEX "AttackLog_seasonId_createdAt_idx" ON "AttackLog"("seasonId", "createdAt");

-- CreateIndex
CREATE INDEX "AttackLog_attackerId_seasonId_idx" ON "AttackLog"("attackerId", "seasonId");

-- CreateIndex
CREATE INDEX "AttackLog_defenderId_seasonId_idx" ON "AttackLog"("defenderId", "seasonId");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_status_method_idx" ON "Payment"("status", "method");

-- CreateIndex
CREATE INDEX "Payment_qpayInvoiceId_idx" ON "Payment"("qpayInvoiceId");

-- CreateIndex
CREATE INDEX "MiniGameSession_userId_createdAt_idx" ON "MiniGameSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MiniGameSession_gameId_userId_idx" ON "MiniGameSession"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Guild_name_key" ON "Guild"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Guild_animeId_key" ON "Guild"("animeId");

-- CreateIndex
CREATE UNIQUE INDEX "Guild_chatRoomId_key" ON "Guild"("chatRoomId");

-- CreateIndex
CREATE INDEX "Guild_animeId_idx" ON "Guild"("animeId");

-- CreateIndex
CREATE UNIQUE INDEX "GuildMember_userId_key" ON "GuildMember"("userId");

-- CreateIndex
CREATE INDEX "GuildMember_guildId_role_idx" ON "GuildMember"("guildId", "role");

-- CreateIndex
CREATE INDEX "UserCosmetic_userId_isEquipped_idx" ON "UserCosmetic"("userId", "isEquipped");

-- CreateIndex
CREATE UNIQUE INDEX "UserCosmetic_userId_itemId_key" ON "UserCosmetic"("userId", "itemId");

-- CreateIndex
CREATE INDEX "ModerationWarning_userId_createdAt_idx" ON "ModerationWarning"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_reportedId_idx" ON "Report"("reportedId");

-- CreateIndex
CREATE INDEX "ReputationLog_userId_createdAt_idx" ON "ReputationLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_type_seasonId_idx" ON "LeaderboardSnapshot"("type", "seasonId");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_createdAt_idx" ON "LeaderboardSnapshot"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AnimeCharacter" ADD CONSTRAINT "AnimeCharacter_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeCharacter" ADD CONSTRAINT "AnimeCharacter_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AnimeCharacter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCharacter" ADD CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCharacter" ADD CONSTRAINT "UserCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "AnimeCharacter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "AnimeCharacter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeChat" ADD CONSTRAINT "AnimeChat_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeChat" ADD CONSTRAINT "AnimeChat_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateChat" ADD CONSTRAINT "PrivateChat_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateChat" ADD CONSTRAINT "PrivateChat_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateChat" ADD CONSTRAINT "PrivateChat_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonStat" ADD CONSTRAINT "SeasonStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonStat" ADD CONSTRAINT "SeasonStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttackLog" ADD CONSTRAINT "AttackLog_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttackLog" ADD CONSTRAINT "AttackLog_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttackLog" ADD CONSTRAINT "AttackLog_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiniGameSession" ADD CONSTRAINT "MiniGameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "MiniGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiniGameSession" ADD CONSTRAINT "MiniGameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild" ADD CONSTRAINT "Guild_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guild" ADD CONSTRAINT "Guild_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildMember" ADD CONSTRAINT "GuildMember_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildMember" ADD CONSTRAINT "GuildMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CosmeticItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationWarning" ADD CONSTRAINT "ModerationWarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationLog" ADD CONSTRAINT "ReputationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
