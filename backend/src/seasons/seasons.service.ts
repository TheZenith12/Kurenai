import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SeasonsService {
  private readonly logger = new Logger(SeasonsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue('season') private readonly seasonQueue: Queue,
  ) {}

  // ─── Cron Jobs ────────────────────────────────────────────────────

  // Даваа гараг 00:00-д season эхлэх
  @Cron('0 0 * * 1', { timeZone: 'Asia/Ulaanbaatar' })
  async startNewSeason() {
    this.logger.log('🗓️ Season эхлэх cron ажиллаж байна...');
    await this.seasonQueue.add('start_season', {}, { priority: 1 });
  }

  // Баасан гараг 23:59-д season дуусах
  @Cron('59 23 * * 5', { timeZone: 'Asia/Ulaanbaatar' })
  async endCurrentSeason() {
    this.logger.log('🏁 Season дуусах cron ажиллаж байна...');
    await this.seasonQueue.add('end_season', {}, { priority: 1 });
  }

  // ─── Season Operations ────────────────────────────────────────────

  async createAndActivateSeason() {
    const existingSeason = await this.prisma.season.findFirst({ where: { isActive: true } });

    if (existingSeason) {
      this.logger.warn('Аль хэдийн идэвхтэй season байна');
      return existingSeason;
    }

    const lastSeason = await this.prisma.season.findFirst({
      orderBy: { number: 'desc' },
    });

    const newNumber = (lastSeason?.number ?? 0) + 1;
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 5); // 5 хоног (Даваа → Баасан)
    endDate.setHours(23, 59, 59, 999);

    const season = await this.prisma.season.create({
      data: {
        number: newNumber,
        startDate: now,
        endDate,
        isActive: true,
        rewardPoints: 500 + newNumber * 50, // Season дугаар ихсэх тусам шагнал ихсэнэ
      },
    });

    // Бүх хэрэглэгчийн season stat reset
    const users = await this.prisma.user.findMany({
      where: { isActive: true, isBanned: false },
      select: { id: true },
    });

    if (users.length > 0) {
      await this.prisma.seasonStat.createMany({
        data: users.map((u) => ({
          seasonId: season.id,
          userId: u.id,
          hp: 1000,
          maxHp: 1000,
          attackPoint: 100,
          energy: 100,
          maxEnergy: 100,
        })),
        skipDuplicates: true,
      });
    }

    this.logger.log(`✅ Season #${newNumber} эхэллээ. ${users.length} хэрэглэгч`);
    return season;
  }

  async finalizeCurrentSeason() {
    const season = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!season) {
      this.logger.warn('Дуусгах идэвхтэй season байхгүй');
      return;
    }

    // Leaderboard авах
    const stats = await this.prisma.seasonStat.findMany({
      where: { seasonId: season.id },
      orderBy: [{ hp: 'desc' }, { kills: 'desc' }],
      include: { user: { select: { username: true } } },
    });

    // Ялагчийг тодорхойлох
    const winner = stats.find((s) => !s.isEliminated) ?? stats[0];
    const winnerId = winner?.userId;

    // Дээд 10 хэрэглэгчид шагнах
    const rewardTiers = [
      { rank: 1, points: season.rewardPoints },
      { rank: 2, points: Math.floor(season.rewardPoints * 0.7) },
      { rank: 3, points: Math.floor(season.rewardPoints * 0.5) },
      { rank: 4, points: Math.floor(season.rewardPoints * 0.3) },
      { rank: 5, points: Math.floor(season.rewardPoints * 0.2) },
    ];

    for (const { rank, points } of rewardTiers) {
      const stat = stats[rank - 1];
      if (stat) {
        await this.prisma.user.update({
          where: { id: stat.userId },
          data: { characterPoints: { increment: points } },
        });
        this.logger.log(
          `🏅 Rank #${rank}: ${stat.user.username} - ${points} character point авлаа`,
        );
      }
    }

    // Rank-уудыг хадгалах
    await Promise.all(
      stats.map((stat, index) =>
        this.prisma.seasonStat.update({
          where: { id: stat.id },
          data: { rank: index + 1 },
        }),
      ),
    );

    // Leaderboard snapshot хадгалах
    await this.prisma.leaderboardSnapshot.create({
      data: {
        type: 'WEEKLY_ATTACK',
        seasonId: season.id,
        data: stats.slice(0, 100).map((s, i) => ({
          rank: i + 1,
          userId: s.userId,
          username: s.user.username,
          hp: s.hp,
          kills: s.kills,
          deaths: s.deaths,
        })),
      },
    });

    // Season archive хийх
    await this.prisma.season.update({
      where: { id: season.id },
      data: { isActive: false, isArchived: true, winnerId },
    });

    // Redis cache цэвэрлэх
    await this.redis.del(`leaderboard:season:${season.id}`);
    await this.redis.del('season:active');

    this.logger.log(
      `✅ Season #${season.number} дуусгалаа. Ялагч: ${winner?.user?.username ?? 'байхгүй'}`,
    );
  }

  async getCurrentSeason() {
    const cacheKey = 'season:active';
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const season = await this.prisma.season.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        number: true,
        startDate: true,
        endDate: true,
        isActive: true,
        rewardPoints: true,
      },
    });

    if (season) {
      await this.redis.setJson(cacheKey, season, 300);
    }

    return season;
  }

  async getSeasonHistory() {
    return this.prisma.season.findMany({
      where: { isArchived: true },
      orderBy: { number: 'desc' },
      take: 20,
      select: {
        id: true,
        number: true,
        startDate: true,
        endDate: true,
        rewardPoints: true,
        winnerId: true,
      },
    });
  }
}
