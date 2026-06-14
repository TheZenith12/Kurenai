import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuildRole, ChatType } from '../common/enums';

@Injectable()
export class GuildsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserGuild(userId: string) {
    return this.prisma.guildMember.findUnique({
      where: { userId },
      include: {
        guild: {
          include: {
            anime: { select: { name: true, imageUrl: true } },
            _count: { select: { members: true } },
          },
        },
      },
    });
  }

  async joinGuild(userId: string, guildId: string) {
    const existing = await this.prisma.guildMember.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Та аль хэдийн guild-д байна. Эхлээд гарна уу.');

    const guild = await this.prisma.guild.findUnique({
      where: { id: guildId },
      include: { _count: { select: { members: true } } },
    });
    if (!guild) throw new NotFoundException('Guild олдсонгүй');
    if (guild._count.members >= guild.maxMembers) {
      throw new BadRequestException('Guild дүүрсэн байна');
    }

    // Хэрэглэгч тухайн anime-ийн дүр эзэмшдэг эсэх шалгах
    const hasChar = await this.prisma.userCharacter.findFirst({
      where: { userId, character: { animeId: guild.animeId } },
    });
    if (!hasChar) {
      throw new BadRequestException('Тухайн anime-ийн дүр авсны дараа guild-д нэгдэж болно');
    }

    return this.prisma.guildMember.create({
      data: { userId, guildId },
      include: { guild: true },
    });
  }

  async leaveGuild(userId: string) {
    const member = await this.prisma.guildMember.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Та guild-д байхгүй байна');

    if (member.role === GuildRole.LEADER) {
      throw new BadRequestException('Leader гарахын өмнө шинэ leader томилно уу');
    }

    return this.prisma.guildMember.delete({ where: { userId } });
  }

  async getGuilds() {
    return this.prisma.guild.findMany({
      where: { isActive: true },
      orderBy: [{ level: 'desc' }, { xp: 'desc' }],
      include: {
        anime: { select: { name: true, imageUrl: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async createGuild(userId: string, dto: { name: string; description?: string; animeId: string }) {
    const existing = await this.prisma.guildMember.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Та аль хэдийн guild-д байна. Эхлээд гарна уу.');

    const hasChar = await this.prisma.userCharacter.findFirst({
      where: { userId, character: { animeId: dto.animeId } },
    });
    if (!hasChar) throw new BadRequestException('Тухайн anime-ийн дүр авсны дараа guild үүсгэж болно');

    const existingGuild = await this.prisma.guild.findFirst({ where: { animeId: dto.animeId } });
    if (existingGuild) throw new BadRequestException('Тухайн anime-д guild аль хэдийн байна. Нэгдэх боломжтой.');

    const guild = await this.prisma.guild.create({
      data: {
        name: dto.name,
        description: dto.description,
        animeId: dto.animeId,
        isActive: true,
      },
    });

    await this.prisma.guildMember.create({
      data: { userId, guildId: guild.id, role: GuildRole.LEADER },
    });

    return guild;
  }

  async updateGuild(userId: string, dto: { name?: string; description?: string }) {
    const member = await this.prisma.guildMember.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Та guild-д байхгүй байна');
    if (member.role !== GuildRole.LEADER) throw new BadRequestException('Зөвхөн leader засаж болно');

    return this.prisma.guild.update({
      where: { id: member.guildId },
      data: dto,
    });
  }

  async promoteMember(userId: string, targetUserId: string, role: GuildRole) {
    const leader = await this.prisma.guildMember.findUnique({ where: { userId } });
    if (!leader || leader.role !== GuildRole.LEADER) throw new BadRequestException('Зөвхөн leader гишүүдийг дэвшүүлж болно');

    const target = await this.prisma.guildMember.findUnique({ where: { userId: targetUserId } });
    if (!target || target.guildId !== leader.guildId) throw new NotFoundException('Гишүүн олдсонгүй');

    if (role === GuildRole.LEADER) {
      await this.prisma.guildMember.update({ where: { userId }, data: { role: GuildRole.MEMBER } });
    }

    return this.prisma.guildMember.update({ where: { userId: targetUserId }, data: { role } });
  }
}
