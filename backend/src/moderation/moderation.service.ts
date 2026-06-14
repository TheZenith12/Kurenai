import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WarningSeverity } from '../common/enums';

export interface ModerationResult {
  filtered: boolean;
  filteredContent?: string;
  reason?: string;
  action?: 'warn' | 'mute' | 'ban';
  warning?: string;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  // Монгол + Англи хориотой үгийн жагсаалт
  private readonly bannedWords: RegExp[] = [
    /\b(fuck|shit|bitch|ass|damn|cunt)\b/gi,
    /\b(хуй|хуйн|ёрд|хий|ёб|пизд)\b/gi,
    // Leet speak bypass
    /\bfu[c@]k\b/gi,
    /\bsh[i!1]t\b/gi,
    /\b[@4]ss\b/gi,
  ];

  // Монгол ёс бус үгс (simplified)
  private readonly mongolBannedWords = [
    'муухай', 'доромж', 'гуйлгач', 'тэнэг', 'идиот', 'мунхаг',
  ];

  private readonly warnThreshold: number;
  private readonly muteDurationHours: number;
  private readonly autoBanDurationHours: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.warnThreshold = config.get<number>('WARN_THRESHOLD', 3);
    this.muteDurationHours = config.get<number>('MUTE_DURATION_HOURS', 1);
    this.autoBanDurationHours = config.get<number>('AUTO_BAN_DURATION_HOURS', 24);
  }

  async checkMessage(content: string, userId: string): Promise<ModerationResult> {
    // 1. Profanity шалгах
    let filtered = false;
    let filteredContent = content;
    let violationType: string | null = null;

    for (const pattern of this.bannedWords) {
      if (pattern.test(content)) {
        filtered = true;
        filteredContent = content.replace(pattern, (match) => '*'.repeat(match.length));
        violationType = 'profanity';
        pattern.lastIndex = 0;
        break;
      }
    }

    // Монгол ёс бус үгс
    if (!filtered) {
      const lowerContent = content.toLowerCase();
      for (const word of this.mongolBannedWords) {
        if (lowerContent.includes(word)) {
          filtered = true;
          filteredContent = lowerContent.replace(
            new RegExp(word, 'gi'),
            '*'.repeat(word.length),
          );
          violationType = 'profanity_mn';
          break;
        }
      }
    }

    // 2. Spam detection
    if (!filtered) {
      const isSpam = await this.detectSpam(userId, content);
      if (isSpam) {
        filtered = true;
        filteredContent = content;
        violationType = 'spam';
      }
    }

    if (!violationType) {
      return { filtered: false };
    }

    // 3. Warning бүртгэх + action тодорхойлох
    const action = await this.recordViolation(userId, violationType);

    return {
      filtered,
      filteredContent,
      reason: violationType,
      action: action.action,
      warning: action.message,
    };
  }

  private async detectSpam(userId: string, content: string): Promise<boolean> {
    const key = `spam:${userId}`;
    const now = Date.now();
    const windowMs = 10000; // 10 секунд

    // Ижил мессежийн тоо
    const contentHash = this.simpleHash(content);
    const recentKey = `spam:recent:${userId}:${contentHash}`;
    const recentCount = await this.redis.incr(recentKey, 30);

    if (recentCount > 3) return true; // 30 секундэд 3 удаа ижил мессеж

    // Хурдан мессеж
    await this.redis.zadd(key, now, `${now}`);
    const windowStart = now - windowMs;
    const client = this.redis.getClient();
    await client.zremrangebyscore(key, '-inf', windowStart);
    const count = await client.zcard(key);
    await client.expire(key, 30);

    return count > 5; // 10 секундэд 5+ мессеж = spam
  }

  private async recordViolation(
    userId: string,
    violationType: string,
  ): Promise<{ action?: 'warn' | 'mute' | 'ban'; message?: string }> {
    // 30 хоногийн дотор warning тоо
    const recentWarnings = await this.prisma.moderationWarning.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        isAuto: true,
      },
    });

    let severity = WarningSeverity.LOW;
    let action: 'warn' | 'mute' | 'ban' | undefined;
    let message: string | undefined;

    if (recentWarnings >= this.warnThreshold * 2) {
      // 6+ зөрчил → auto ban
      severity = WarningSeverity.CRITICAL;
      action = 'ban';
      message = 'Та давтан зөрчил гаргасан тул автоматаар хориглогдлоо';

      const banUntil = new Date();
      banUntil.setHours(banUntil.getHours() + this.autoBanDurationHours);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: true,
          banReason: `Автомат: ${violationType} - ${recentWarnings + 1} удаагийн зөрчил`,
          banUntil,
        },
      });

      this.logger.warn(`User ${userId} auto-banned for ${this.autoBanDurationHours}h`);
    } else if (recentWarnings >= this.warnThreshold) {
      // 3+ зөрчил → mute
      severity = WarningSeverity.HIGH;
      action = 'mute';
      message = `Та ${this.muteDurationHours} цагийн турш чат хориотой боллоо`;

      const muteUntil = new Date();
      muteUntil.setHours(muteUntil.getHours() + this.muteDurationHours);

      await this.prisma.user.update({
        where: { id: userId },
        data: { isMuted: true, muteUntil },
      });
    } else {
      // 1-2 зөрчил → warning
      severity = WarningSeverity.MEDIUM;
      action = 'warn';
      message = `⚠️ Анхааруулга ${recentWarnings + 1}/${this.warnThreshold}: Ёс бус үг ашиглав`;
    }

    await this.prisma.moderationWarning.create({
      data: { userId, reason: violationType, isAuto: true, severity },
    });

    // Reputation бууруулах
    await this.prisma.user.update({
      where: { id: userId },
      data: { reputation: { decrement: 10 } },
    });

    await this.prisma.reputationLog.create({
      data: {
        userId,
        change: -10,
        reason: 'PROFANITY_DETECTED',
        details: violationType,
      },
    });

    return { action, message };
  }

  async adminBanUser(
    userId: string,
    adminId: string,
    reason: string,
    durationHours?: number,
  ) {
    const banUntil = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
      : undefined;

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, banReason: reason, banUntil },
    });

    await this.prisma.moderationWarning.create({
      data: {
        userId,
        reason,
        adminId,
        isAuto: false,
        severity: WarningSeverity.CRITICAL,
      },
    });

    this.logger.log(`Admin ${adminId} banned user ${userId}: ${reason}`);
  }

  async adminUnbanUser(userId: string, adminId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, banReason: null, banUntil: null, isMuted: false, muteUntil: null },
    });

    this.logger.log(`Admin ${adminId} unbanned user ${userId}`);
  }

  async reportUser(reporterId: string, reportedId: string, reason: string, messageId?: string) {
    if (reporterId === reportedId) return;

    // Давхардсан report шалгах (24 цагийн дотор)
    const existing = await this.prisma.report.findFirst({
      where: {
        reporterId,
        reportedId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (existing) return existing;

    return this.prisma.report.create({
      data: { reporterId, reportedId, messageId, reason },
    });
  }

  async getWarningHistory(userId: string) {
    return this.prisma.moderationWarning.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
}
