import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { MasteryTier } from '@prisma/client';

const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 60000];
const TIER_LEVELS: Record<string, number> = {
  BRONZE: 1, SILVER: 5, GOLD: 10, PLATINUM: 20, DIAMOND: 30,
};

function calcLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

function calcTier(level: number): MasteryTier {
  if (level >= TIER_LEVELS.DIAMOND)   return MasteryTier.DIAMOND;
  if (level >= TIER_LEVELS.PLATINUM)  return MasteryTier.PLATINUM;
  if (level >= TIER_LEVELS.GOLD)      return MasteryTier.GOLD;
  if (level >= TIER_LEVELS.SILVER)    return MasteryTier.SILVER;
  return MasteryTier.BRONZE;
}

@Processor('xp')
export class XpProcessor {
  private readonly logger = new Logger(XpProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mini-game → active character-д XP олгоно
   * XP → Level → Tier автоматаар шинэчлэгдэнэ
   */
  @Process('grant_game_xp')
  async handleGameXp(job: Job<{ userId: string; score: number; gameType: string }>) {
    const { userId, score, gameType } = job.data;

    // Game score-оос XP тооцоолно (10~50 XP per game)
    const xpGain = Math.max(10, Math.min(50, Math.floor(score * 0.1)));

    try {
      // Идэвхтэй character олно
      const activeChar = await this.prisma.userCharacter.findFirst({
        where: { userId, isActive: true },
      });

      if (activeChar) {
        const newXp = activeChar.xp + xpGain;
        const newLevel = calcLevel(newXp);
        const newTier = calcTier(newLevel);
        const leveledUp = newLevel > activeChar.level;
        const tieredUp = newTier !== activeChar.masteryTier;

        await this.prisma.userCharacter.update({
          where: { id: activeChar.id },
          data: { xp: newXp, level: newLevel, masteryTier: newTier },
        });

        if (leveledUp || tieredUp) {
          this.logger.log(
            `game_xp: ${userId} → Lv${activeChar.level}→${newLevel}` +
            (tieredUp ? ` [${activeChar.masteryTier}→${newTier}]` : ''),
          );
        }
      }

      this.logger.debug(`game_xp: user=${userId} game=${gameType} score=${score} xp+${xpGain}`);
    } catch (err) {
      this.logger.error(`grant_game_xp failed for user ${userId}`, err);
      throw err;
    }
  }

  /**
   * Халдлага → attacker-ийн active character-д XP + CP олгоно
   */
  @Process('grant_attack_xp')
  async handleAttackXp(
    job: Job<{ attackerId: string; defenderId: string; isKill: boolean; characterId: string }>,
  ) {
    const { attackerId, characterId, isKill } = job.data;

    // Kill = 50 XP, халдлага = 15 XP
    const xpGain = isKill ? 50 : 15;
    // CP шагнал
    const cpGain = isKill ? 20 : 5;

    try {
      const charRecord = await this.prisma.userCharacter.findUnique({
        where: { userId_characterId: { userId: attackerId, characterId } },
      });

      if (charRecord) {
        const newXp = charRecord.xp + xpGain;
        const newLevel = calcLevel(newXp);
        const newTier = calcTier(newLevel);
        const leveledUp = newLevel > charRecord.level;
        const tieredUp = newTier !== charRecord.masteryTier;

        await this.prisma.userCharacter.update({
          where: { id: charRecord.id },
          data: { xp: newXp, level: newLevel, masteryTier: newTier },
        });

        if (leveledUp || tieredUp) {
          this.logger.log(
            `attack_xp: ${attackerId} → Lv${charRecord.level}→${newLevel}` +
            (tieredUp ? ` [${charRecord.masteryTier}→${newTier}]` : ''),
          );
        }
      }

      await this.prisma.user.update({
        where: { id: attackerId },
        data: { characterPoints: { increment: cpGain } },
      });

      this.logger.debug(`attack_xp: attacker=${attackerId} kill=${isKill} xp+${xpGain} cp+${cpGain}`);
    } catch (err) {
      this.logger.error(`grant_attack_xp failed for attacker ${attackerId}`, err);
      throw err;
    }
  }
}
