import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuildWarsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveWars() {
    return this.prisma.guildWar.findMany({
      where: { status: { in: ['PENDING', 'ACTIVE', 'ACCEPTED'] } },
      include: {
        attackerGuild: { select: { id: true, name: true, _count: { select: { members: true } } } },
        defenderGuild: { select: { id: true, name: true, _count: { select: { members: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyGuildWars(userId: string) {
    const member = await this.prisma.guildMember.findUnique({ where: { userId } });
    if (!member) return [];
    return this.prisma.guildWar.findMany({
      where: { OR: [{ attackerGuildId: member.guildId }, { defenderGuildId: member.guildId }] },
      include: {
        attackerGuild: { select: { id: true, name: true } },
        defenderGuild: { select: { id: true, name: true } },
        attacks: { take: 10, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async challengeGuild(userId: string, defenderGuildId: string) {
    const member = await this.prisma.guildMember.findUnique({ where: { userId } });
    if (!member) throw new BadRequestException('Та guild-д байхгүй байна');
    if (member.role !== 'LEADER') throw new BadRequestException('Зөвхөн leader дайн зарлаж болно');
    if (member.guildId === defenderGuildId) throw new BadRequestException('Өөрийн guild-тайгаа тулалдаж болохгүй');

    const existing = await this.prisma.guildWar.findFirst({
      where: {
        OR: [
          { attackerGuildId: member.guildId, defenderGuildId },
          { attackerGuildId: defenderGuildId, defenderGuildId: member.guildId },
        ],
        status: { in: ['PENDING', 'ACTIVE', 'ACCEPTED'] },
      },
    });
    if (existing) throw new BadRequestException('Тухайн guild-тай дайн аль хэдийн байна');

    return this.prisma.guildWar.create({
      data: {
        attackerGuildId: member.guildId,
        defenderGuildId,
        status: 'PENDING',
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: {
        attackerGuild: { select: { name: true } },
        defenderGuild: { select: { name: true } },
      },
    });
  }

  async acceptWar(userId: string, warId: string) {
    const member = await this.prisma.guildMember.findUnique({ where: { userId } });
    if (!member || member.role !== 'LEADER') throw new BadRequestException('Зөвхөн leader хүлээн авч болно');

    const war = await this.prisma.guildWar.findUnique({ where: { id: warId } });
    if (!war) throw new NotFoundException('Дайн олдсонгүй');
    if (war.defenderGuildId !== member.guildId) throw new BadRequestException('Таны guild-ийн дайн биш');
    if (war.status !== 'PENDING') throw new BadRequestException('Дайн хүлээгдэхгүй статустай байна');

    return this.prisma.guildWar.update({
      where: { id: warId },
      data: { status: 'ACTIVE', startTime: new Date() },
    });
  }

  async attackInWar(userId: string, warId: string, defenderId: string, damage: number) {
    const member = await this.prisma.guildMember.findUnique({ where: { userId } });
    if (!member) throw new BadRequestException('Та guild-д байхгүй байна');

    const war = await this.prisma.guildWar.findUnique({ where: { id: warId } });
    if (!war || war.status !== 'ACTIVE') throw new BadRequestException('Дайн идэвхгүй байна');

    const isAttacker = war.attackerGuildId === member.guildId;
    const isDefender = war.defenderGuildId === member.guildId;
    if (!isAttacker && !isDefender) throw new BadRequestException('Та энэ дайнд оролцдоггүй');

    await this.prisma.guildWarAttack.create({ data: { warId, attackerId: userId, defenderId, damage, guildId: member.guildId } });

    if (isAttacker) {
      await this.prisma.guildWar.update({ where: { id: warId }, data: { attackerScore: { increment: damage } } });
    } else {
      await this.prisma.guildWar.update({ where: { id: warId }, data: { defenderScore: { increment: damage } } });
    }

    return { success: true, damage };
  }
}
