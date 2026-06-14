import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const STREAK_REWARDS = [
  { day: 1,  ap: 10,  cp: 0  },
  { day: 2,  ap: 15,  cp: 0  },
  { day: 3,  ap: 20,  cp: 5  },
  { day: 4,  ap: 25,  cp: 0  },
  { day: 5,  ap: 30,  cp: 10 },
  { day: 6,  ap: 35,  cp: 0  },
  { day: 7,  ap: 50,  cp: 20 },  // 7-р өдөр бонус
  { day: 14, ap: 100, cp: 50 },  // 2 долоо хоног
  { day: 30, ap: 200, cp: 100 }, // 1 сар
];

function getRewardForDay(day: number) {
  const found = [...STREAK_REWARDS].reverse().find((r) => day >= r.day);
  return found ?? STREAK_REWARDS[0];
}

@Injectable()
export class LoginStreakService {
  constructor(private readonly prisma: PrismaService) {}

  async processLogin(userId: string): Promise<{ streak: number; reward: { ap: number; cp: number }; isNewDay: boolean }> {
    const today = new Date().toISOString().slice(0, 10);

    const existing = await this.prisma.loginStreak.findUnique({ where: { userId } });

    if (!existing) {
      await this.prisma.loginStreak.create({ data: { userId, currentStreak: 1, longestStreak: 1, lastLoginDate: today, totalDays: 1 } });
      const reward = getRewardForDay(1);
      await this.grantReward(userId, reward);
      return { streak: 1, reward, isNewDay: true };
    }

    if (existing.lastLoginDate === today) {
      return { streak: existing.currentStreak, reward: { ap: 0, cp: 0 }, isNewDay: false };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const isContinued = existing.lastLoginDate === yesterdayStr;
    const newStreak = isContinued ? existing.currentStreak + 1 : 1;
    const longestStreak = Math.max(existing.longestStreak, newStreak);

    await this.prisma.loginStreak.update({
      where: { userId },
      data: { currentStreak: newStreak, longestStreak, lastLoginDate: today, totalDays: { increment: 1 } },
    });

    const reward = getRewardForDay(newStreak);
    await this.grantReward(userId, reward);
    return { streak: newStreak, reward, isNewDay: true };
  }

  private async grantReward(userId: string, reward: { ap: number; cp: number }) {
    if (reward.cp > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: { characterPoints: { increment: reward.cp } } });
    }
  }

  async getStreak(userId: string) {
    return this.prisma.loginStreak.findUnique({ where: { userId } });
  }

  getStreakRewards() {
    return STREAK_REWARDS;
  }
}
