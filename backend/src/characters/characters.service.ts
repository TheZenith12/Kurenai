import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MasteryTier } from '../common/enums';

const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 60000];
const TIER_LEVELS: Record<MasteryTier, number> = {
  BRONZE: 1,
  SILVER: 5,
  GOLD: 10,
  PLATINUM: 20,
  DIAMOND: 30,
};

@Injectable()
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getAllAnimes(includeCharacters = false) {
    const cacheKey = 'animes:list';
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached) return cached;

    const animes = await this.prisma.anime.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: includeCharacters
        ? {
            characters: {
              where: { isActive: true },
              orderBy: [{ isBaseForm: 'desc' }, { sortOrder: 'asc' }],
              include: { skills: { where: { isActive: true } } },
            },
          }
        : undefined,
    });

    await this.redis.setJson(cacheKey, animes, 300);
    return animes;
  }

  async getAnimeWithCharacters(animeId: string) {
    const anime = await this.prisma.anime.findUnique({
      where: { id: animeId },
      include: {
        characters: {
          where: { isActive: true },
          orderBy: [{ isBaseForm: 'desc' }, { sortOrder: 'asc' }],
          include: { skills: { where: { isActive: true } } },
        },
      },
    });

    if (!anime) throw new NotFoundException('Anime олдсонгүй');
    return anime;
  }

  async getUserCharacters(userId: string) {
    return this.prisma.userCharacter.findMany({
      where: { userId },
      include: {
        character: {
          include: {
            anime: { select: { name: true, imageUrl: true } },
            skills: {
              where: { isActive: true },
              orderBy: [{ isUltimate: 'asc' }, { requiredLevel: 'asc' }],
            },
          },
        },
      },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  async selectFreeCharacter(userId: string, characterId: string) {
    // Аль хэдийн дүр авсан эсэх
    const existing = await this.prisma.userCharacter.findFirst({ where: { userId } });
    if (existing) {
      throw new BadRequestException('Та аль хэдийн эхний дүрийг сонгосон байна');
    }

    const character = await this.prisma.animeCharacter.findUnique({
      where: { id: characterId },
    });

    if (!character) throw new NotFoundException('Дүр олдсонгүй');
    if (!character.isBaseForm) {
      throw new BadRequestException('Зөвхөн үнэгүй үндсэн дүрийг сонгох боломжтой');
    }

    const userChar = await this.prisma.userCharacter.create({
      data: { userId, characterId, isActive: true },
      include: { character: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeCharacterId: characterId },
    });

    return userChar;
  }

  async setActiveCharacter(userId: string, userCharacterId: string) {
    const ownership = await this.prisma.userCharacter.findFirst({
      where: { id: userCharacterId, userId },
    });

    if (!ownership) {
      throw new NotFoundException('Та энэ дүрийг эзэмшихгүй байна');
    }

    // Одоогийн идэвхтэй дүрийг unset
    await this.prisma.userCharacter.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Шинэ идэвхтэй болгох
    await this.prisma.userCharacter.update({
      where: { id: userCharacterId },
      data: { isActive: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeCharacterId: ownership.characterId },
    });

    return { success: true };
  }

  async grantXP(userId: string, characterId: string, amount: number) {
    const userChar = await this.prisma.userCharacter.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });

    if (!userChar) return;

    const newXp = userChar.xp + amount;
    const newLevel = this.calculateLevel(newXp);
    const newTier = this.calculateTier(newLevel);

    await this.prisma.userCharacter.update({
      where: { userId_characterId: { userId, characterId } },
      data: { xp: newXp, level: newLevel, masteryTier: newTier },
    });

    const leveledUp = newLevel > userChar.level;
    const tieredUp = newTier !== userChar.masteryTier;

    if (leveledUp || tieredUp) {
      this.logger.log(
        `User ${userId} character ${characterId}: Level ${userChar.level}→${newLevel}${tieredUp ? `, Tier ${userChar.masteryTier}→${newTier}` : ''}`,
      );
    }

    return { newXp, newLevel, newTier, leveledUp, tieredUp };
  }

  async purchaseWithCharacterPoints(userId: string, characterId: string) {
    const [user, character] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.animeCharacter.findUnique({ where: { id: characterId } }),
    ]);

    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');
    if (!character) throw new NotFoundException('Дүр олдсонгүй');
    if (character.characterPoints === 0) {
      throw new BadRequestException('Энэ дүрийг character point-оор авах боломжгүй');
    }

    if (user.characterPoints < character.characterPoints) {
      throw new BadRequestException(
        `Хангалттай character point байхгүй байна. Шаардлага: ${character.characterPoints}, Одоогийн: ${user.characterPoints}`,
      );
    }

    const existing = await this.prisma.userCharacter.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });
    if (existing) throw new BadRequestException('Та энэ дүрийг аль хэдийн эзэмшиж байна');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { characterPoints: { decrement: character.characterPoints } },
      }),
      this.prisma.userCharacter.create({
        data: { userId, characterId },
      }),
    ]);

    return { success: true, message: `${character.name} дүр амжилттай авлаа!` };
  }

  private calculateLevel(xp: number): number {
    let level = 1;
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      if (xp >= XP_THRESHOLDS[i]) level = i + 1;
      else break;
    }
    return level;
  }

  private calculateTier(level: number): MasteryTier {
    if (level >= TIER_LEVELS.DIAMOND) return MasteryTier.DIAMOND;
    if (level >= TIER_LEVELS.PLATINUM) return MasteryTier.PLATINUM;
    if (level >= TIER_LEVELS.GOLD) return MasteryTier.GOLD;
    if (level >= TIER_LEVELS.SILVER) return MasteryTier.SILVER;
    return MasteryTier.BRONZE;
  }
}
