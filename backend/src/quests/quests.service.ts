import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_QUESTS = [
  { title: '3 дайсан дайрах', description: 'PvP горимд 3 дайсан дайр', type: 'ATTACK_ENEMIES', target: 3, rewardAp: 30, rewardCp: 0, rewardXp: 50 },
  { title: '2 тоглоом тоглох', description: 'Мини тоглоомд 2 удаа тоглох', type: 'PLAY_GAMES', target: 2, rewardAp: 20, rewardCp: 0, rewardXp: 40 },
  { title: '10 мессеж илгээх', description: 'Чатаар 10 мессеж илгээх', type: 'SEND_MESSAGES', target: 10, rewardAp: 15, rewardCp: 0, rewardXp: 30 },
  { title: '5 дайсан дайрах', description: 'PvP горимд 5 дайсан дайр', type: 'ATTACK_ENEMIES', target: 5, rewardAp: 50, rewardCp: 5, rewardXp: 100 },
  { title: 'Тоглоомд хожих', description: 'Хамгийн өндөр оноогоор тоглоом дуусгах', type: 'WIN_GAMES', target: 1, rewardAp: 40, rewardCp: 0, rewardXp: 60 },
];

@Injectable()
export class QuestsService {
  constructor(private readonly prisma: PrismaService) {}

  private today() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  async ensureDefaultQuests() {
    const count = await this.prisma.dailyQuest.count();
    if (count === 0) {
      await this.prisma.dailyQuest.createMany({ data: DEFAULT_QUESTS as any });
    }
  }

  async getTodayQuests(userId: string) {
    await this.ensureDefaultQuests();
    const date = this.today();
    const quests = await this.prisma.dailyQuest.findMany({ where: { isActive: true } });

    const userQuests = await this.prisma.userDailyQuest.findMany({
      where: { userId, date },
    });

    return quests.map((q) => {
      const uq = userQuests.find((u) => u.questId === q.id);
      return {
        ...q,
        progress: uq?.progress ?? 0,
        completed: uq?.completed ?? false,
        claimed: !!uq?.claimedAt,
        userQuestId: uq?.id ?? null,
      };
    });
  }

  async claimReward(userId: string, questId: string) {
    const date = this.today();
    const uq = await this.prisma.userDailyQuest.findUnique({
      where: { userId_questId_date: { userId, questId, date } },
      include: { quest: true },
    });

    if (!uq) throw new Error('Даалгавар олдсонгүй');
    if (!uq.completed) throw new Error('Даалгавар дуусаагүй байна');
    if (uq.claimedAt) throw new Error('Шагнал аль хэдийн авсан байна');

    await this.prisma.userDailyQuest.update({
      where: { id: uq.id },
      data: { claimedAt: new Date() },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        characterPoints: { increment: uq.quest.rewardCp },
      },
    });

    return { rewardAp: uq.quest.rewardAp, rewardCp: uq.quest.rewardCp, rewardXp: uq.quest.rewardXp };
  }

  async incrementProgress(userId: string, type: string, amount = 1) {
    const date = this.today();
    const quests = await this.prisma.dailyQuest.findMany({
      where: { isActive: true, type: type as any },
    });

    for (const quest of quests) {
      const existing = await this.prisma.userDailyQuest.findUnique({
        where: { userId_questId_date: { userId, questId: quest.id, date } },
      });

      if (existing?.completed) continue;

      const newProgress = Math.min((existing?.progress ?? 0) + amount, quest.target);
      const completed = newProgress >= quest.target;

      if (existing) {
        await this.prisma.userDailyQuest.update({
          where: { id: existing.id },
          data: { progress: newProgress, completed },
        });
      } else {
        await this.prisma.userDailyQuest.create({
          data: { userId, questId: quest.id, date, progress: newProgress, completed },
        });
      }
    }
  }

  // Midnight reset cron — optional, auto-resets by date key
  @Cron('0 0 * * *', { timeZone: 'Asia/Ulaanbaatar' })
  async dailyReset() {
    // Date-based keys auto-expire, no cleanup needed
  }
}
