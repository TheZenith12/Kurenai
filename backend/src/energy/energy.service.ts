import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnergyService {
  private readonly logger = new Logger(EnergyService.name);
  private readonly refillRate: number;
  private readonly maxEnergy: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.refillRate = config.get<number>('ENERGY_REFILL_RATE', 10);
    this.maxEnergy = config.get<number>('ENERGY_MAX', 100);
  }

  // 30 минут тутам energy дүүргэх
  @Cron('*/30 * * * *')
  async refillAllEnergy() {
    this.logger.log('⚡ Energy refill running...');

    const season = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!season) return;

    // DB-д batch update
    await this.prisma.seasonStat.updateMany({
      where: {
        seasonId: season.id,
        energy: { lt: 100 },
      },
      data: {
        energy: { increment: this.refillRate },
        energyLastRefill: new Date(),
      },
    });

    // Хэт ихэд заслах
    await this.prisma.$executeRaw`
      UPDATE "SeasonStat"
      SET energy = LEAST(energy, "maxEnergy")
      WHERE "seasonId" = ${season.id}
    `;
  }

  async getEnergy(userId: string): Promise<{ current: number; max: number; nextRefillIn: number }> {
    const season = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!season) return { current: 100, max: 100, nextRefillIn: 0 };

    const stat = await this.prisma.seasonStat.findUnique({
      where: { seasonId_userId: { seasonId: season.id, userId } },
      select: { energy: true, maxEnergy: true, energyLastRefill: true },
    });

    if (!stat) return { current: 100, max: 100, nextRefillIn: 0 };

    const lastRefill = stat.energyLastRefill.getTime();
    const nextRefill = lastRefill + 30 * 60 * 1000;
    const nextRefillIn = Math.max(0, Math.ceil((nextRefill - Date.now()) / 1000));

    return {
      current: Math.min(stat.energy, stat.maxEnergy),
      max: stat.maxEnergy,
      nextRefillIn,
    };
  }

  async deductEnergy(
    userId: string,
    amount: number,
  ): Promise<{ success: boolean; remaining: number }> {
    const season = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!season) return { success: false, remaining: 0 };

    const stat = await this.prisma.seasonStat.findUnique({
      where: { seasonId_userId: { seasonId: season.id, userId } },
    });

    if (!stat || stat.energy < amount) {
      return { success: false, remaining: stat?.energy ?? 0 };
    }

    await this.prisma.seasonStat.update({
      where: { seasonId_userId: { seasonId: season.id, userId } },
      data: { energy: { decrement: amount } },
    });

    return { success: true, remaining: stat.energy - amount };
  }

  async refillEnergyByGame(userId: string, amount: number): Promise<number> {
    const season = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!season) return 0;

    const stat = await this.prisma.seasonStat.findUnique({
      where: { seasonId_userId: { seasonId: season.id, userId } },
    });
    if (!stat) return 0;

    const newEnergy = Math.min(stat.energy + amount, stat.maxEnergy);

    await this.prisma.seasonStat.update({
      where: { seasonId_userId: { seasonId: season.id, userId } },
      data: { energy: newEnergy },
    });

    return newEnergy;
  }
}
