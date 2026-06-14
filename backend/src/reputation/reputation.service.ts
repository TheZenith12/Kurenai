import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReputationReason } from '../common/enums';

@Injectable()
export class ReputationService {
  constructor(private readonly prisma: PrismaService) {}

  async adjustReputation(userId: string, change: number, reason: ReputationReason, details?: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { reputation: { increment: change } },
      }),
      this.prisma.reputationLog.create({
        data: { userId, change, reason, details },
      }),
    ]);
  }

  async getReputation(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { reputation: true },
    });
    return user?.reputation ?? 100;
  }

  getChatLimits(reputation: number): { maxMsgPerMin: number; attackCooldownMultiplier: number } {
    if (reputation < 30) return { maxMsgPerMin: 5, attackCooldownMultiplier: 2.0 };
    if (reputation < 60) return { maxMsgPerMin: 15, attackCooldownMultiplier: 1.5 };
    if (reputation < 80) return { maxMsgPerMin: 25, attackCooldownMultiplier: 1.0 };
    return { maxMsgPerMin: 30, attackCooldownMultiplier: 1.0 };
  }
}
