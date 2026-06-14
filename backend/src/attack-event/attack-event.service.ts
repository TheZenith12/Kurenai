import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EnergyService } from '../energy/energy.service';
import { QuestsService } from '../quests/quests.service';
import { AchievementsService } from '../achievements/achievements.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface AttackResult {
  success: boolean;
  damageDealt: number;
  defenderHpAfter: number;
  attackerHpAfter: number;
  isKill: boolean;
  xpGained: number;
  message: string;
  replayData: object;
}

@Injectable()
export class AttackEventService {
  private readonly logger = new Logger(AttackEventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly energyService: EnergyService,
    private readonly questsService: QuestsService,
    private readonly achievementsService: AchievementsService,
    @InjectQueue('xp') private readonly xpQueue: Queue,
    @InjectQueue('leaderboard') private readonly leaderboardQueue: Queue,
  ) {}

  async performAttack(
    attackerId: string,
    defenderId: string,
    skillId: string,
  ): Promise<AttackResult> {
    // 1. Season идэвхтэй эсэх шалгах
    const season = await this.getActiveSeason();
    if (!season) {
      throw new BadRequestException('Одоогоор идэвхтэй Season байхгүй байна. Даваа гарагт эхэлнэ.');
    }

    // 2. Өөрийгөө дайрахгүй
    if (attackerId === defenderId) {
      throw new BadRequestException('Өөрийгөө дайрах боломжгүй байна');
    }

    // 3. Skill шалгах + хэрэглэгч тухайн skill-тэй эсэх
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
      include: { character: true },
    });
    if (!skill) throw new NotFoundException('Skill олдсонгүй');

    const ownership = await this.prisma.userCharacter.findFirst({
      where: { userId: attackerId, characterId: skill.characterId, isActive: true },
    });
    if (!ownership) {
      throw new ForbiddenException('Та энэ skill ашиглах эрхгүй байна');
    }

    // 4. Level шаардлага шалгах
    if (ownership.level < skill.requiredLevel || ownership.masteryTier < skill.requiredTier) {
      throw new ForbiddenException(
        `Энэ skill Level ${skill.requiredLevel}+ шаардлагатай байна`,
      );
    }

    // 5. Skill cooldown шалгах
    const onCooldown = await this.redis.isSkillOnCooldown(attackerId, skillId);
    if (onCooldown) {
      const remaining = await this.redis.getSkillCooldown(attackerId, skillId);
      throw new BadRequestException(
        `Skill дахин ашиглах хүртэл ${remaining} секунд хүлээнэ үү`,
      );
    }

    // 6. Attacker-ийн AP шалгах (AP = HP, дайрахад зарцуулагдана)
    const [attackerStat, defenderStat] = await Promise.all([
      this.getOrCreateSeasonStat(season.id, attackerId),
      this.getOrCreateSeasonStat(season.id, defenderId),
    ]);

    if (attackerStat.isEliminated) {
      throw new ForbiddenException('Та тухайн season-д eliminated болсон байна');
    }
    if (defenderStat.isEliminated) {
      throw new BadRequestException('Тухайн хэрэглэгч аль хэдийн eliminated болсон байна');
    }

    const AP_ATTACK_COST = 5; // нэг халдлагын AP зардал
    if (attackerStat.attackPoint < AP_ATTACK_COST) {
      throw new BadRequestException(
        `Халдлага хийхэд ${AP_ATTACK_COST} AP хэрэгтэй. Одоогийн: ${attackerStat.attackPoint}. Тоглоом тоглож AP цуглуулаарай!`,
      );
    }

    // 7. Damage = AP × Level bonus × Tier bonus
    const attackerApBefore = attackerStat.attackPoint;
    const damage = this.calculateDamage(
      { damageMin: attackerApBefore, damageMax: attackerApBefore },
      ownership.level,
      ownership.masteryTier,
    );

    // 8. Damage → defender HP-г хасна
    const defenderHpBefore = defenderStat.hp;
    const attackerHpBefore = attackerStat.hp;

    const defenderHpAfter = Math.max(0, defenderHpBefore - damage);
    const attackerApAfter = Math.max(0, attackerApBefore - AP_ATTACK_COST);
    const isKill = defenderHpAfter === 0;

    // Redis cache update
    await this.redis.setHp(season.id, defenderId, defenderHpAfter);

    // 9. DB update + Attack log үүсгэх
    const replayData = {
      skill: { id: skill.id, name: skill.name, effectType: skill.effectType },
      animationSequence: [
        { t: 0, event: 'attack_start' },
        { t: 500, event: 'skill_animation', effect: skill.effectType },
        { t: 1200, event: 'damage_hit', damage },
        { t: 1500, event: 'attack_end' },
      ],
    };

    await this.prisma.$transaction([
      // Defender HP хасах
      this.prisma.seasonStat.update({
        where: { seasonId_userId: { seasonId: season.id, userId: defenderId } },
        data: {
          hp: defenderHpAfter,
          deaths: isKill ? { increment: 1 } : undefined,
          isEliminated: isKill ? true : undefined,
          eliminatedAt: isKill ? new Date() : undefined,
        },
      }),
      // Attacker: AP зарцуулах + kills update
      this.prisma.seasonStat.update({
        where: { seasonId_userId: { seasonId: season.id, userId: attackerId } },
        data: {
          attackPoint: attackerApAfter,
          kills: isKill ? { increment: 1 } : undefined,
        },
      }),
      // Attack log
      this.prisma.attackLog.create({
        data: {
          seasonId: season.id,
          attackerId,
          defenderId,
          skillId,
          damageDealt: damage,
          attackerHpBefore,
          defenderHpBefore,
          attackerHpAfter: attackerHpBefore, // attacker HP өөрчлөгдөхгүй
          defenderHpAfter,
          isKill,
          replayData,
        },
      }),
    ]);

    // 11. Skill cooldown тавих
    await this.redis.setSkillCooldown(attackerId, skillId, skill.cooldownSeconds);

    // 12. XP queue-д оруулах
    await this.xpQueue.add('grant_attack_xp', {
      attackerId,
      defenderId,
      isKill,
      characterId: ownership.characterId,
    });

    // 13. Leaderboard update
    await this.leaderboardQueue.add('update_attack_leaderboard', {
      seasonId: season.id,
      attackerId,
      isKill,
    });

    // 14. Kill reward (defender-т character point)
    if (isKill) {
      await this.prisma.user.update({
        where: { id: defenderId },
        data: { characterPoints: { increment: 50 } },
      });
    }

    // Quest + Achievement progress (fire-and-forget)
    this.questsService.incrementProgress(attackerId, 'ATTACK_ENEMIES').catch(() => {});
    this.achievementsService.increment(attackerId, 'attacker_10').catch(() => {});
    this.achievementsService.increment(attackerId, 'attacker_100').catch(() => {});
    if (isKill) {
      this.achievementsService.increment(attackerId, 'first_blood').catch(() => {});
      this.achievementsService.increment(attackerId, 'killer_5').catch(() => {});
      this.achievementsService.increment(attackerId, 'killer_25').catch(() => {});
      this.achievementsService.increment(attackerId, 'killer_100').catch(() => {});
    }

    return {
      success: true,
      damageDealt: damage,
      defenderHpAfter,
      attackerHpAfter: attackerHpBefore,
      isKill,
      xpGained: isKill ? 20 : 10,
      message: isKill
        ? `🎯 KILL! ${damage} damage хийлаа. (-${AP_ATTACK_COST} AP)`
        : `⚔️ ${damage} damage хийлаа! Defender HP: ${defenderHpAfter} | Таны AP: ${attackerApAfter}`,
      replayData,
    };
  }

  async getSeasonLeaderboard(seasonId?: string) {
    const season = seasonId
      ? await this.prisma.season.findUnique({ where: { id: seasonId } })
      : await this.getActiveSeason();

    if (!season) return [];

    const cacheKey = `leaderboard:season:${season.id}`;
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached) return cached;

    const stats = await this.prisma.seasonStat.findMany({
      where: { seasonId: season.id },
      orderBy: [{ hp: 'desc' }, { kills: 'desc' }],
      take: 100,
      include: {
        user: {
          select: { username: true, displayName: true, activeCharacterId: true },
        },
      },
    });

    const leaderboard = stats.map((stat, index) => ({
      rank: index + 1,
      userId: stat.userId,
      username: stat.user.username,
      displayName: stat.user.displayName,
      hp: stat.hp,
      kills: stat.kills,
      deaths: stat.deaths,
      isEliminated: stat.isEliminated,
    }));

    await this.redis.setJson(cacheKey, leaderboard, 30); // 30 second cache
    return leaderboard;
  }

  async getUserSeasonStats(userId: string, seasonId?: string) {
    const season = seasonId
      ? await this.prisma.season.findUnique({ where: { id: seasonId } })
      : await this.getActiveSeason();

    if (!season) return null;

    return this.prisma.seasonStat.findUnique({
      where: { seasonId_userId: { seasonId: season.id, userId } },
      include: { season: { select: { number: true, startDate: true, endDate: true, isActive: true } } },
    });
  }

  async getAttackHistory(userId: string, seasonId?: string) {
    const season = seasonId
      ? await this.prisma.season.findUnique({ where: { id: seasonId } })
      : await this.getActiveSeason();

    if (!season) return [];

    return this.prisma.attackLog.findMany({
      where: {
        seasonId: season.id,
        OR: [{ attackerId: userId }, { defenderId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        attacker: { select: { username: true } },
        defender: { select: { username: true } },
      },
    });
  }

  async getReplay(attackLogId: string) {
    const log = await this.prisma.attackLog.findUnique({
      where: { id: attackLogId },
      include: {
        attacker: { select: { username: true, displayName: true } },
        defender: { select: { username: true, displayName: true } },
      },
    });
    if (!log) throw new NotFoundException('Replay олдсонгүй');
    return log;
  }

  private calculateDamage(skill: any, level: number, tier: string): number {
    const base = Math.floor(
      Math.random() * (skill.damageMax - skill.damageMin + 1) + skill.damageMin,
    );

    // Level multiplier
    const levelMultiplier = 1 + (level - 1) * 0.05; // Level бүрт 5% нэмэгдэнэ

    // Mastery tier multiplier
    const tierMultipliers: Record<string, number> = {
      BRONZE: 1.0,
      SILVER: 1.15,
      GOLD: 1.30,
      PLATINUM: 1.50,
      DIAMOND: 1.75,
    };

    const tierMult = tierMultipliers[tier] ?? 1.0;

    return Math.floor(base * levelMultiplier * tierMult);
  }

  private async getActiveSeason() {
    return this.prisma.season.findFirst({ where: { isActive: true } });
  }

  private async getOrCreateSeasonStat(seasonId: string, userId: string) {
    return this.prisma.seasonStat.upsert({
      where: { seasonId_userId: { seasonId, userId } },
      update: {},
      create: { seasonId, userId }, // schema default-г ашиглана
    });
  }
}
