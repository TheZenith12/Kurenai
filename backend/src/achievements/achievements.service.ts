import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const ACHIEVEMENTS = [
  // COMBAT
  { key: 'first_blood',    title: 'Анхны цус',        description: 'Анх удаа дайсан алах',            icon: '🩸', category: 'COMBAT',     rarity: 'COMMON',    rewardCp: 10,  target: 1   },
  { key: 'killer_5',       title: '5 Алалт',           description: '5 дайсан алах',                    icon: '⚔️', category: 'COMBAT',     rarity: 'COMMON',    rewardCp: 20,  target: 5   },
  { key: 'killer_25',      title: 'Аллагын мастер',    description: '25 дайсан алах',                   icon: '💀', category: 'COMBAT',     rarity: 'RARE',      rewardCp: 50,  target: 25  },
  { key: 'killer_100',     title: 'Цуст баатар',       description: '100 дайсан алах',                  icon: '🔱', category: 'COMBAT',     rarity: 'EPIC',      rewardCp: 200, target: 100 },
  { key: 'attacker_10',    title: '10 Дайралт',        description: '10 удаа дайрах',                   icon: '🗡️', category: 'COMBAT',     rarity: 'COMMON',    rewardCp: 15,  target: 10  },
  { key: 'attacker_100',   title: '100 Дайралт',       description: '100 удаа дайрах',                  icon: '⚡', category: 'COMBAT',     rarity: 'RARE',      rewardCp: 100, target: 100 },
  { key: 'survivor',       title: 'Амьд үлдэгч',       description: 'Season-ийг алагдалгүй дуусгах',    icon: '🛡️', category: 'COMBAT',     rarity: 'EPIC',      rewardCp: 150, target: 1   },
  // SOCIAL
  { key: 'chatter_50',     title: 'Яриач',             description: '50 мессеж илгээх',                 icon: '💬', category: 'SOCIAL',     rarity: 'COMMON',    rewardCp: 15,  target: 50  },
  { key: 'chatter_500',    title: 'Яриачин мастер',    description: '500 мессеж илгээх',                icon: '📢', category: 'SOCIAL',     rarity: 'RARE',      rewardCp: 75,  target: 500 },
  { key: 'guild_member',   title: 'Guild гишүүн',      description: 'Guild-д нэгдэх',                   icon: '🏰', category: 'SOCIAL',     rarity: 'COMMON',    rewardCp: 20,  target: 1   },
  { key: 'guild_leader',   title: 'Guild удирдагч',    description: 'Guild үүсгэж leader болох',        icon: '👑', category: 'SOCIAL',     rarity: 'RARE',      rewardCp: 100, target: 1   },
  // COLLECTION
  { key: 'collector_3',    title: 'Цуглуулагч',        description: '3 баатар цуглуулах',               icon: '🎴', category: 'COLLECTION', rarity: 'COMMON',    rewardCp: 25,  target: 3   },
  { key: 'collector_10',   title: 'Их цуглуулагч',     description: '10 баатар цуглуулах',              icon: '🗂️', category: 'COLLECTION', rarity: 'RARE',      rewardCp: 100, target: 10  },
  { key: 'gacha_1',        title: 'Анхны гача',        description: 'Анх удаа gacha татах',             icon: '🎰', category: 'COLLECTION', rarity: 'COMMON',    rewardCp: 20,  target: 1   },
  { key: 'gacha_10',       title: 'Gachаны мастер',    description: '10 удаа gacha татах',              icon: '🎲', category: 'COLLECTION', rarity: 'RARE',      rewardCp: 75,  target: 10  },
  // MASTERY
  { key: 'games_10',       title: 'Тоглогч',           description: '10 тоглоом тоглох',                icon: '🎮', category: 'MASTERY',    rarity: 'COMMON',    rewardCp: 20,  target: 10  },
  { key: 'games_50',       title: 'Тоглоомын мастер',  description: '50 тоглоом тоглох',                icon: '🏅', category: 'MASTERY',    rarity: 'RARE',      rewardCp: 80,  target: 50  },
  { key: 'quest_10',       title: 'Даалгаварч',        description: '10 өдрийн даалгавар дуусгах',      icon: '📋', category: 'MASTERY',    rarity: 'RARE',      rewardCp: 60,  target: 10  },
  { key: 'streak_7',       title: '7 хоногийн streak', description: '7 хоног дараалан нэвтрэх',         icon: '🔥', category: 'MASTERY',    rarity: 'RARE',      rewardCp: 70,  target: 7   },
  { key: 'streak_30',      title: '30 хоногийн streak','description': '30 хоног дараалан нэвтрэх',      icon: '💎', category: 'MASTERY',    rarity: 'EPIC',      rewardCp: 300, target: 30  },
  // SEASONAL
  { key: 'season_top10',   title: 'Top 10',            description: 'Season-ийг Top 10-д дуусгах',      icon: '🏆', category: 'SEASONAL',   rarity: 'EPIC',      rewardCp: 200, target: 1   },
  { key: 'season_winner',  title: 'Season Champion',   description: 'Season-ийг #1-д дуусгах',          icon: '👑', category: 'SEASONAL',   rarity: 'LEGENDARY', rewardCp: 500, target: 1   },
  // SPECIAL
  { key: 'verified',       title: 'Баталгаажсан',      description: 'Имэйл хаягаа баталгаажуулах',      icon: '✅', category: 'SPECIAL',    rarity: 'COMMON',    rewardCp: 30,  target: 1   },
  { key: 'early_adopter',  title: 'Анхдагч',           description: 'Платформын анхны 100 хэрэглэгч',   icon: '⭐', category: 'SPECIAL',    rarity: 'LEGENDARY', rewardCp: 200, target: 1   },
];

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaults() {
    const count = await this.prisma.achievement.count();
    if (count === 0) {
      await this.prisma.achievement.createMany({ data: ACHIEVEMENTS as any, skipDuplicates: true });
    }
  }

  async getAll() {
    await this.ensureDefaults();
    return this.prisma.achievement.findMany({ where: { isActive: true }, orderBy: [{ category: 'asc' }, { rarity: 'asc' }] });
  }

  async getUserAchievements(userId: string) {
    await this.ensureDefaults();
    const all = await this.prisma.achievement.findMany({ where: { isActive: true } });
    const userAchievs = await this.prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true } });
    const map = new Map(userAchievs.map((ua) => [ua.achievementId, ua]));
    return all.map((a) => {
      const ua = map.get(a.id);
      return { ...a, progress: ua?.progress ?? 0, unlockedAt: ua?.unlockedAt ?? null, claimed: !!ua?.claimedAt };
    });
  }

  async claimReward(userId: string, achievementId: string) {
    const ua = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
      include: { achievement: true },
    });
    if (!ua?.unlockedAt) throw new Error('Achievement дуусаагүй байна');
    if (ua.claimedAt) throw new Error('Шагнал аль хэдийн авсан байна');

    await this.prisma.userAchievement.update({ where: { id: ua.id }, data: { claimedAt: new Date() } });
    if (ua.achievement.rewardCp > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: { characterPoints: { increment: ua.achievement.rewardCp } } });
    }
    return { rewardCp: ua.achievement.rewardCp };
  }

  async increment(userId: string, key: string, amount = 1): Promise<{ unlocked: boolean; achievement?: any }> {
    await this.ensureDefaults();
    const achievement = await this.prisma.achievement.findUnique({ where: { key } });
    if (!achievement) return { unlocked: false };

    const existing = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    });

    if (existing?.unlockedAt) return { unlocked: false };

    const newProgress = Math.min((existing?.progress ?? 0) + amount, achievement.target);
    const justUnlocked = newProgress >= achievement.target;

    if (existing) {
      await this.prisma.userAchievement.update({
        where: { id: existing.id },
        data: { progress: newProgress, unlockedAt: justUnlocked ? new Date() : undefined },
      });
    } else {
      await this.prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id, progress: newProgress, unlockedAt: justUnlocked ? new Date() : undefined },
      });
    }

    if (justUnlocked) {
      await this.createNotification(userId, 'ACHIEVEMENT_UNLOCKED', `🏆 Achievement: ${achievement.title}`, achievement.description, achievement.icon);
    }

    return { unlocked: justUnlocked, achievement: justUnlocked ? achievement : undefined };
  }

  async incrementByKey(userId: string, key: string, amount = 1) {
    return this.increment(userId, key, amount);
  }

  private async createNotification(userId: string, type: string, title: string, body: string, icon?: string) {
    await this.prisma.notification.create({ data: { userId, type: type as any, title, body, imageUrl: icon } }).catch(() => {});
  }
}
