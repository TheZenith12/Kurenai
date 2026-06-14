import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // 30 секунд тутам leaderboard refresh
  @Cron('*/30 * * * * *')
  async refreshLeaderboardCache() {
    const season = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!season) return;

    await this.buildAttackLeaderboard(season.id);
    await this.buildMiniGameLeaderboard();
  }

  async getAttackLeaderboard(limit = 50) {
    const cacheKey = 'lb:attack:current';
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached) return cached.slice(0, limit);

    const season = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!season) return [];

    return this.buildAttackLeaderboard(season.id, limit);
  }

  async getMiniGameLeaderboard(period: 'daily' | 'weekly' = 'daily', limit = 50) {
    const cacheKey = `lb:minigame:${period}`;
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached) return cached.slice(0, limit);

    return this.buildMiniGameLeaderboard(period, limit);
  }

  async getCharacterMasteryLeaderboard(limit = 50) {
    const cacheKey = 'lb:mastery:global';
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached) return cached.slice(0, limit);

    const result = await this.prisma.userCharacter.groupBy({
      by: ['userId'],
      _sum: { xp: true, level: true },
      orderBy: { _sum: { xp: 'desc' } },
      take: limit,
    });

    const withUsers = await Promise.all(
      result.map(async (item, index) => {
        const user = await this.prisma.user.findUnique({
          where: { id: item.userId },
          select: { username: true, displayName: true },
        });
        return {
          rank: index + 1,
          userId: item.userId,
          username: user?.username,
          displayName: user?.displayName,
          totalXp: item._sum.xp,
          totalLevel: item._sum.level,
        };
      }),
    );

    await this.redis.setJson(cacheKey, withUsers, 300);
    return withUsers;
  }

  async getAnimeLeaderboard(animeId: string, limit = 50) {
    const season = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!season) return [];

    // Тухайн anime-ийн дүр эзэмшсэн хэрэглэгчдийн stats
    const stats = await this.prisma.seasonStat.findMany({
      where: {
        seasonId: season.id,
        user: {
          ownedCharacters: {
            some: { character: { animeId } },
          },
        },
      },
      orderBy: [{ hp: 'desc' }, { kills: 'desc' }],
      take: limit,
      include: {
        user: { select: { username: true, displayName: true } },
      },
    });

    return stats.map((s, i) => ({
      rank: i + 1,
      userId: s.userId,
      username: s.user.username,
      hp: s.hp,
      kills: s.kills,
    }));
  }

  async getGuildLeaderboard(limit = 20) {
    const guilds = await this.prisma.guild.findMany({
      where: { isActive: true },
      orderBy: [{ level: 'desc' }, { xp: 'desc' }],
      take: limit,
      include: {
        anime: { select: { name: true, imageUrl: true } },
        _count: { select: { members: true } },
      },
    });

    return guilds.map((g, i) => ({
      rank: i + 1,
      guildId: g.id,
      name: g.name,
      animeName: g.anime.name,
      animeImage: g.anime.imageUrl,
      level: g.level,
      xp: g.xp,
      memberCount: g._count.members,
    }));
  }

  async getUserRanks(userId: string) {
    const season = await this.prisma.season.findFirst({ where: { isActive: true } });

    const results: any = {};

    if (season) {
      const stat = await this.prisma.seasonStat.findUnique({
        where: { seasonId_userId: { seasonId: season.id, userId } },
      });

      if (stat) {
        const rank = await this.prisma.seasonStat.count({
          where: {
            seasonId: season.id,
            hp: { gt: stat.hp },
          },
        });
        results.attackRank = rank + 1;
        results.hp = stat.hp;
        results.kills = stat.kills;
      }
    }

    return results;
  }

  // ─── Private builders ─────────────────────────────────────────────

  private async buildAttackLeaderboard(seasonId: string, limit = 100) {
    const stats = await this.prisma.seasonStat.findMany({
      where: { seasonId },
      orderBy: [{ hp: 'desc' }, { kills: 'desc' }],
      take: limit,
      include: {
        user: { select: { username: true, displayName: true, activeCharacterId: true } },
      },
    });

    const leaderboard = stats.map((s, i) => ({
      rank: i + 1,
      userId: s.userId,
      username: s.user.username,
      displayName: s.user.displayName,
      hp: s.hp,
      kills: s.kills,
      deaths: s.deaths,
      isEliminated: s.isEliminated,
    }));

    await this.redis.setJson('lb:attack:current', leaderboard, 30);
    return leaderboard.slice(0, 50);
  }

  private async buildMiniGameLeaderboard(period: 'daily' | 'weekly' = 'daily', limit = 100) {
    const dateFilter = period === 'daily'
      ? new Date(Date.now() - 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const sessions = await this.prisma.miniGameSession.groupBy({
      by: ['userId'],
      where: { isValid: true, createdAt: { gte: dateFilter } },
      _sum: { reward: true, score: true },
      _max: { score: true },
      orderBy: { _sum: { reward: 'desc' } },
      take: limit,
    });

    const withUsers = await Promise.all(
      sessions.map(async (s, i) => {
        const user = await this.prisma.user.findUnique({
          where: { id: s.userId },
          select: { username: true, displayName: true },
        });
        return {
          rank: i + 1,
          userId: s.userId,
          username: user?.username,
          totalReward: s._sum.reward,
          totalScore: s._sum.score,
          bestScore: s._max.score,
        };
      }),
    );

    await this.redis.setJson(`lb:minigame:${period}`, withUsers, 60);
    return withUsers.slice(0, limit);
  }
}
