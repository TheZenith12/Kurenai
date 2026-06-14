import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CosmeticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllItems() {
    return this.prisma.cosmeticItem.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { price: 'asc' }],
    });
  }

  async getMyCosmetics(userId: string) {
    return this.prisma.userCosmetic.findMany({
      where: { userId },
      include: { item: true },
    });
  }

  async buyItem(userId: string, itemId: string) {
    const item = await this.prisma.cosmeticItem.findUnique({ where: { id: itemId } });
    if (!item || !item.isActive) throw new NotFoundException('Бараа олдсонгүй');

    const already = await this.prisma.userCosmetic.findUnique({ where: { userId_itemId: { userId, itemId } } });
    if (already) throw new BadRequestException('Та энэ барааг аль хэдийн худалдан авсан байна');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');
    if (user.characterPoints < item.price) throw new BadRequestException(`CP хүрэлцэхгүй байна. Шаардлагатай: ${item.price} CP`);

    await this.prisma.user.update({ where: { id: userId }, data: { characterPoints: { decrement: item.price } } });

    return this.prisma.userCosmetic.create({
      data: { userId, itemId, slot: item.type },
      include: { item: true },
    });
  }

  async equipItem(userId: string, itemId: string) {
    const owned = await this.prisma.userCosmetic.findUnique({ where: { userId_itemId: { userId, itemId } } });
    if (!owned) throw new BadRequestException('Та энэ барааг эзэмшдэггүй');

    // Ижил slot-ийн өмнөх бараануудыг тайл
    await this.prisma.userCosmetic.updateMany({
      where: { userId, slot: owned.slot, isEquipped: true },
      data: { isEquipped: false },
    });

    return this.prisma.userCosmetic.update({
      where: { userId_itemId: { userId, itemId } },
      data: { isEquipped: true },
      include: { item: true },
    });
  }

  async unequipItem(userId: string, itemId: string) {
    return this.prisma.userCosmetic.update({
      where: { userId_itemId: { userId, itemId } },
      data: { isEquipped: false },
      include: { item: true },
    });
  }

  async getEquippedCosmetics(userId: string) {
    return this.prisma.userCosmetic.findMany({
      where: { userId, isEquipped: true },
      include: { item: true },
    });
  }

  // Admin: Cosmetic item үүсгэх
  async createItem(dto: { name: string; description: string; type: string; imageUrl: string; effectUrl?: string; animationCss?: string; price: number }) {
    return this.prisma.cosmeticItem.create({ data: dto as any });
  }
}
