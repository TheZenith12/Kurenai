import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PITY_THRESHOLD = 90;   // 90 дахь татуургаар guaranteed SSR
const SOFT_PITY = 75;        // 75-аас эхлэн магадлал нэмэгдэнэ

@Injectable()
export class GachaService {
  constructor(private readonly prisma: PrismaService) {}

  async getPools() {
    return this.prisma.gachaPool.findMany({
      where: { isActive: true },
      include: { items: { include: { character: { include: { anime: { select: { name: true } } } } } } },
    });
  }

  async getMyRolls(userId: string) {
    return this.prisma.gachaRoll.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { pool: { select: { name: true } } },
    });
  }

  async getPityCount(userId: string, poolId: string): Promise<number> {
    const lastSsr = await this.prisma.gachaRoll.findFirst({
      where: { userId, poolId, rarity: 'SSR' },
      orderBy: { createdAt: 'desc' },
    });
    if (!lastSsr) {
      return await this.prisma.gachaRoll.count({ where: { userId, poolId } });
    }
    return await this.prisma.gachaRoll.count({
      where: { userId, poolId, createdAt: { gt: lastSsr.createdAt } },
    });
  }

  async roll(userId: string, poolId: string, count: 1 | 10 = 1): Promise<any[]> {
    const pool = await this.prisma.gachaPool.findUnique({
      where: { id: poolId },
      include: { items: { include: { character: true } } },
    });
    if (!pool || !pool.isActive) throw new NotFoundException('Pool олдсонгүй');
    if (!pool.items.length) throw new BadRequestException('Pool хоосон байна');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');

    const totalCost = pool.costCp * count;
    if (user.characterPoints < totalCost) {
      throw new BadRequestException(`CP хүрэлцэхгүй байна. Шаардлагатай: ${totalCost} CP`);
    }

    await this.prisma.user.update({ where: { id: userId }, data: { characterPoints: { decrement: totalCost } } });

    const pity = await this.getPityCount(userId, poolId);
    const results: any[] = [];

    for (let i = 0; i < count; i++) {
      const currentPity = pity + i;
      const { character, rarity } = this.selectCharacter(pool.items, currentPity);

      const roll = await this.prisma.gachaRoll.create({
        data: { userId, poolId, characterId: character.id, rarity, pityCount: currentPity + 1 },
        include: { pool: { select: { name: true } } },
      });

      // Баатар unlock хийх
      const owned = await this.prisma.userCharacter.findUnique({
        where: { userId_characterId: { userId, characterId: character.id } },
      });
      if (!owned) {
        await this.prisma.userCharacter.create({ data: { userId, characterId: character.id } });
      }

      results.push({ ...roll, character, isNew: !owned });
    }

    return results;
  }

  private selectCharacter(items: any[], pity: number): { character: any; rarity: string } {
    const adjustedPity = pity >= SOFT_PITY ? pity : 0;
    const ssrRate = pity >= PITY_THRESHOLD ? 10000 : Math.min(150 + adjustedPity * 20, 1500);
    const srRate = 1300;

    const roll = Math.random() * 10000;
    let rarity = 'R';
    if (roll < ssrRate) rarity = 'SSR';
    else if (roll < ssrRate + srRate) rarity = 'SR';

    const filteredItems = items.filter((i) => {
      if (rarity === 'SSR') return i.weight >= 150;
      if (rarity === 'SR') return i.weight >= 80 && i.weight < 150;
      return i.weight < 80;
    });

    const pool = filteredItems.length > 0 ? filteredItems : items;
    const totalWeight = pool.reduce((s: number, i: any) => s + i.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of pool) {
      rand -= item.weight;
      if (rand <= 0) return { character: item.character, rarity };
    }
    return { character: pool[0].character, rarity };
  }

  async createPool(data: { name: string; description?: string; costCp: number; bannerUrl?: string; characterIds: string[] }) {
    const pool = await this.prisma.gachaPool.create({
      data: { name: data.name, description: data.description, costCp: data.costCp, bannerUrl: data.bannerUrl },
    });
    if (data.characterIds.length > 0) {
      await this.prisma.gachaPoolItem.createMany({
        data: data.characterIds.map((id, i) => ({ poolId: pool.id, characterId: id, weight: i === 0 ? 200 : 100 })),
      });
    }
    return pool;
  }
}
