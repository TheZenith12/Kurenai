import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { createHash } from 'crypto';
import { QuestsService } from '../quests/quests.service';

export interface GameStartResult {
  sessionToken: string;
  gameData: object;
  serverSeed: string;
}

export interface GameEndResult {
  reward: number;
  isValid: boolean;
  totalToday: number;
  message: string;
}

interface QuizQuestion {
  q: string;
  correct: string;
  wrong: [string, string, string];
}

interface IdentifyQuestion {
  hints: [string, string, string];
  emoji: string;
  correct: string;
  wrong: [string, string, string];
}

@Injectable()
export class MiniGamesService {
  private readonly logger = new Logger(MiniGamesService.name);

  private readonly minDurations: Record<string, number> = {
    REACTION: 8000,   // 10 секундын click тоглоом — эрт дуусгаж болохгүй
    QUIZ:     8000,
    DODGE:    5000,
    IDENTIFY: 8000,
  };

  private readonly maxScores: Record<string, number> = {
    REACTION: 250,    // 10 секундэд дарах боломжит дээд тоо
    QUIZ:     1000,   // 5 асуулт × 200
    DODGE:    3000,   // ~16 саад × 100 + нөөц
    IDENTIFY: 1000,   // 5 дүр × 200
  };

  // ─── Quiz question pool ──────────────────────────────────────────────
  private readonly quizPool: QuizQuestion[] = [
    { q: 'Naruto-ийн гол дайснийн дүр хэн вэ?', correct: 'Sasuke Uchiha', wrong: ['Itachi Uchiha', 'Pain', 'Orochimaru'] },
    { q: '"One Piece"-д Luffy-гийн мөрөөдөл юу вэ?', correct: 'Далайн хаан болох', wrong: ['Дэлхийн хамгийн хүчтэй болох', 'Пиратын тогтоол олох', 'Гэрт буцах'] },
    { q: 'Death Note-ийн гол дүрийн нэр хэн вэ?', correct: 'Light Yagami', wrong: ['L Lawliet', 'Ryuk', 'Near'] },
    { q: 'Demon Slayer дээр Tanjiro-ийн эгчийн нэр хэн вэ?', correct: 'Nezuko Kamado', wrong: ['Kanao Tsuyuri', 'Shinobu Kocho', 'Aoi Kanzaki'] },
    { q: 'Dragon Ball Z дээр Goku-ийн уугуул гариг аль вэ?', correct: 'Vegeta гариг', wrong: ['Намек гариг', 'Фриза гариг', 'Дэлхий'] },
    { q: 'My Hero Academia дээр All Might-ийн чадварын нэр юу вэ?', correct: 'One For All', wrong: ['All For One', 'Infinite Power', 'Plus Ultra'] },
    { q: 'Fullmetal Alchemist дээр ах дүүгийн овог нэр юу вэ?', correct: 'Elric', wrong: ['Mustang', 'Armstrong', 'Hughes'] },
    { q: 'Hunter x Hunter дээр Gon-ийн аавын нэр хэн вэ?', correct: 'Ging Freecss', wrong: ['Leorio', 'Killua', 'Hisoka'] },
    { q: 'Attack on Titan дээр хананы нэр юу вэ? (гаднах)', correct: 'Мария', wrong: ['Роза', 'Шина', 'Парадис'] },
    { q: 'Bleach дээр Ichigo-ийн хурц зэвсгийн нэр юу вэ?', correct: 'Zangetsu', wrong: ['Senbonzakura', 'Ryujin Jakka', 'Hyorinmaru'] },
    { q: 'Tokyo Ghoul дээр Ken Kaneki ямар болдог вэ?', correct: 'Ghoul', wrong: ['Vampire', 'Demon', 'Shinigami'] },
    { q: 'Jujutsu Kaisen дээр Yuji ямар curse-ийг залгисан вэ?', correct: 'Ryomen Sukuna', wrong: ['Mahito', 'Jogo', 'Hanami'] },
    { q: 'Evangelion дээр гол баатрын нэр хэн вэ?', correct: 'Shinji Ikari', wrong: ['Rei Ayanami', 'Asuka Langley', 'Gendo Ikari'] },
    { q: 'Fairy Tail дээр Natsu-ийн чадвар юу вэ?', correct: 'Гал шидлэг', wrong: ['Цас шидлэг', 'Ус шидлэг', 'Цахилгаан шидлэг'] },
    { q: 'One Punch Man дээр Saitama яагаад 1 цохилтоор дайсан дардаг вэ?', correct: 'Хэт хүчтэй дасгалжсан', wrong: ['Бурхад тусгасан', 'Тусгай зэвсэг', 'Хуурамч'] },
    { q: 'Re:Zero дээр Subaru ямар онцлог чадвартай вэ?', correct: 'Үхлээс буцах', wrong: ['Цагийг зогсоох', 'Хүн унших', 'Телепорт'] },
    { q: 'Haikyuu!! дээр Hinata ямар спортод тоглодог вэ?', correct: 'Волейбол', wrong: ['Баскетбол', 'Хөлбөмбөг', 'Гар бөмбөг'] },
    { q: 'Black Clover дээр Asta-ийн онцлог юу вэ?', correct: 'Ид шидгүй', wrong: ['Хамгийн хүчтэй ид шид', 'Харанхуй ид шид', 'Цагийн ид шид'] },
    { q: 'No Game No Life дэх "NEET" ах дүүгийн нэр юу вэ?', correct: 'Sora ба Shiro', wrong: ['Kirito ба Asuna', 'Natsu ба Lucy', 'Edward ба Alphonse'] },
    { q: 'Sword Art Online-д Kirito-ийн бодит нэр юу вэ?', correct: 'Kazuto Kirigaya', wrong: ['Kirito Asuna', 'Akihiko Kayaba', 'Klein Ryoutarou'] },
    { q: 'Overlord дэх Ainz Ooal Gown анх ямар нэртэй байсан вэ?', correct: 'Momonga', wrong: ['Albedo', 'Pandora', 'Rubedo'] },
    { q: 'Steins;Gate дэх Okabe-ийн "мад шинжлэх ухааны лаборатори"-ийн товчлол юу вэ?', correct: 'Future Gadget Lab', wrong: ['Time Machine Lab', 'Chaos Theory Lab', 'Time Leap Lab'] },
    { q: 'Violet Evergarden дээр Violet ямар ажил хийдэг вэ?', correct: 'Auto Memory Doll (захидал бичдэг)', wrong: ['Цэргийн офицер', 'Дуучин', 'Эмч'] },
    { q: 'Kuroko no Basket дэх Kuroko-ийн онцлог юу вэ?', correct: 'Орчиндоо нийлдэг харагдахгүй байдал', wrong: ['Хэт хурдан', 'Хэт өндөр', 'Хэт хүчтэй'] },
    { q: 'Cowboy Bebop дэх гол баатрын нэр хэн вэ?', correct: 'Spike Spiegel', wrong: ['Jet Black', 'Faye Valentine', 'Vicious'] },
  ];

  // ─── Identify question pool ──────────────────────────────────────────
  private readonly identifyPool: IdentifyQuestion[] = [
    { emoji: '🔶🦊', hints: ['Konoha тосгоны дайны өнчин', '9 сүүлт үнэгний хүч', 'Hokage болох мөрөөдөлтэй'], correct: 'Naruto Uzumaki', wrong: ['Sasuke Uchiha', 'Rock Lee', 'Gaara'] },
    { emoji: '⚫👁️', hints: ['Sharingan нүдтэй', 'Бүх бие махбодоо хар галт нум болгодог', '"Дайны Бурхан" гэгддэг'], correct: 'Itachi Uchiha', wrong: ['Sasuke Uchiha', 'Obito Uchiha', 'Madara Uchiha'] },
    { emoji: '🗡️😊', hints: ['Swordsman болохоор мөрөөдсөн', '3 хурцаар тулддаг', 'Pirate crew-ийн хамгийн хүчтэй'], correct: 'Zoro Roronoa', wrong: ['Shanks', 'Mihawk', 'Sanji'] },
    { emoji: '📓✍️', hints: ['Тэнцэлт дэвтэр олсон', '"Бурхан шиг" шүүгч болохыг хүссэн', 'L-тэй зэрэг оюун ухаантай'], correct: 'Light Yagami', wrong: ['L Lawliet', 'Near', 'Mello'] },
    { emoji: '💚🌸', hints: ['Хурц зэвсгийг амиараа хийдэг', 'Ахынхаа хажуугаар явдаг', 'Эхлээдээ хоёр хөлтэй байсан'], correct: 'Nezuko Kamado', wrong: ['Kanao Tsuyuri', 'Mitsuri Kanroji', 'Shinobu Kocho'] },
    { emoji: '⚡💪', hints: ['Plus Ultra гэдэг уриатай', 'Symbol of Peace', '8-р хувь эхэлсний дараа маш хүчтэй'], correct: 'Izuku Midoriya', wrong: ['Katsuki Bakugo', 'Shoto Todoroki', 'Tenya Ida'] },
    { emoji: '🔥💀', hints: ['Ryomen Sukuna-г нь залгисан', 'Каратэ тоглодог', 'Mahito-г устгасан'], correct: 'Yuji Itadori', wrong: ['Megumi Fushiguro', 'Nobara Kugisaki', 'Satoru Gojo'] },
    { emoji: '⚗️🦾', hints: ['Алхими хийдэг', 'Металл гарт', 'Философийн чулуу хайсан'], correct: 'Edward Elric', wrong: ['Roy Mustang', 'Alphonse Elric', 'Alex Armstrong'] },
    { emoji: '🃏🎭', hints: ['Joker-ийн дүр тоглодог', 'Хаан болохыг хүссэн', '"Geass" чадвартай'], correct: 'Lelouch Lamperouge', wrong: ['Suzaku Kururugi', 'Charles zi Britannia', 'CC'] },
    { emoji: '🏐🔥', hints: ['Богино биетэй тул дутуу гэж үздэг', 'Сонгосон хэн нь ч биш', 'Агуу оврын дайчин'], correct: 'Shoyo Hinata', wrong: ['Tobio Kageyama', 'Ryunosuke Tanaka', 'Kei Tsukishima'] },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly questsService: QuestsService,
    @InjectQueue('xp') private readonly xpQueue: Queue,
  ) {}

  async getAllGames() {
    return this.prisma.miniGame.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async startGame(userId: string, gameId: string): Promise<GameStartResult> {
    const game = await this.prisma.miniGame.findUnique({ where: { id: gameId } });
    if (!game || !game.isActive) throw new NotFoundException('Тоглоом олдсонгүй');

    const dateStr = new Date().toISOString().split('T')[0];
    const playedTodayKey = `game:played_today:${userId}:${gameId}:${dateStr}`;
    const playedToday = await this.redis.exists(playedTodayKey);
    if (playedToday) {
      throw new BadRequestException('Өнөөдөр энэ тоглоомыг аль хэдийн тоглосон байна. Маргааш дахин тоглоорой.');
    }

    const serverSeed = createHash('sha256')
      .update(`${userId}:${gameId}:${Date.now()}`)
      .digest('hex')
      .substring(0, 16);

    const sessionToken = createHash('sha256')
      .update(`${serverSeed}:${userId}:${gameId}`)
      .digest('hex');

    await this.redis.setJson(
      `game:session:${sessionToken}`,
      { userId, gameId, serverSeed, startedAt: Date.now() },
      300,
    );

    const gameData = this.generateGameData(game.type, serverSeed);
    return { sessionToken, gameData, serverSeed };
  }

  async endGame(
    userId: string,
    sessionToken: string,
    clientScore: number,
    duration: number,
    clientSeed?: string,
  ): Promise<GameEndResult> {
    const session = await this.redis.getJson<{
      userId: string;
      gameId: string;
      serverSeed: string;
      startedAt: number;
    }>(`game:session:${sessionToken}`);

    if (!session || session.userId !== userId) {
      throw new BadRequestException('Тоглоомын session хүчингүй байна');
    }

    await this.redis.del(`game:session:${sessionToken}`);

    const game = await this.prisma.miniGame.findUnique({ where: { id: session.gameId } });
    if (!game) throw new NotFoundException('Тоглоом олдсонгүй');

    const cheatFlags: Record<string, boolean> = {};

    const minDuration = this.minDurations[game.type] ?? 1000;
    if (duration < minDuration) cheatFlags.tooFast = true;

    const actualElapsed = Date.now() - session.startedAt;
    if (Math.abs(actualElapsed - duration) > 5000) cheatFlags.durationMismatch = true;

    const maxScore = this.maxScores[game.type] ?? 10000;
    if (clientScore > maxScore) cheatFlags.impossibleScore = true;

    const recentKey = `game:recent:${userId}:${session.gameId}`;
    const recentScores = await this.redis.getJson<number[]>(recentKey) ?? [];
    if (recentScores.length >= 5) {
      const variance = this.calculateVariance(recentScores);
      if (variance < 10) cheatFlags.botPattern = true;
    }

    const isValid = Object.keys(cheatFlags).length === 0;
    const score = isValid ? clientScore : 0;

    let reward = 0;
    if (isValid && score > 0) {
      const ratio = Math.min(score / maxScore, 1);
      reward = Math.floor(5 + ratio * 5);
    }

    await this.prisma.miniGameSession.create({
      data: {
        gameId: session.gameId,
        userId,
        score,
        reward,
        duration,
        isValid,
        cheatFlags: Object.keys(cheatFlags).length > 0 ? cheatFlags : undefined,
        serverSeed: session.serverSeed,
      },
    });

    if (isValid && reward > 0) {
      await this.prisma.seasonStat.updateMany({
        where: { userId, season: { isActive: true } },
        data: { attackPoint: { increment: reward }, hp: { increment: reward } },
      });

      const updatedScores = [...recentScores.slice(-4), score];
      await this.redis.setJson(recentKey, updatedScores, 3600);

      const dateStr = new Date().toISOString().split('T')[0];
      const playedTodayKey = `game:played_today:${userId}:${session.gameId}:${dateStr}`;
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const secsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);
      await this.redis.set(playedTodayKey, '1', secsUntilMidnight);

      await this.xpQueue.add('grant_game_xp', { userId, score, gameType: game.type });
    }

    if (isValid && reward > 0) {
      this.questsService.incrementProgress(userId, 'PLAY_GAMES').catch(() => {});
    }

    return {
      reward,
      isValid,
      totalToday: reward,
      message: !isValid
        ? '⚠️ Тоглоомын үр дүн хүчингүй болсон байна (cheat detected)'
        : reward > 0
        ? `🎮 +${reward} AP олслоо! Маргааш дахин тоглоорой.`
        : 'Тоглоомын оноо хэтэрхий бага байна.',
    };
  }

  async getLeaderboard(gameId: string, period: 'daily' | 'weekly' = 'daily') {
    const dateFilter =
      period === 'daily'
        ? new Date(Date.now() - 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return this.prisma.miniGameSession.groupBy({
      by: ['userId'],
      where: { gameId, isValid: true, createdAt: { gte: dateFilter } },
      _max: { score: true },
      _sum: { reward: true },
      orderBy: { _max: { score: 'desc' } },
      take: 50,
    });
  }

  async getUserStats(userId: string) {
    const today = new Date().toDateString();
    const dailyKey = `game:daily:${userId}:${today}`;
    const dailyTotal = parseInt((await this.redis.get(dailyKey)) ?? '0');

    const sessions = await this.prisma.miniGameSession.findMany({
      where: { userId, isValid: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { game: { select: { name: true, type: true } } },
    });

    return { dailyTotal, recentSessions: sessions };
  }

  private generateGameData(gameType: string, seed: string): object {
    const rng = this.seededRandom(seed);

    switch (gameType) {
      case 'REACTION':
        // 10 секундэд аль болох олон дарах тоглоом
        return { duration: 10000 };

      case 'QUIZ': {
        const shuffled = [...this.quizPool].sort(() => rng() - 0.5);
        return {
          questions: shuffled.slice(0, 5).map((q) => ({
            q: q.q,
            choices: this.shuffleChoices([q.correct, ...q.wrong], rng),
            correct: q.correct,
          })),
        };
      }

      case 'DODGE':
        return {
          seed: seed,
          obstacles: Array.from({ length: 40 }, () => ({
            lane: Math.floor(rng() * 3),
            at: Math.floor(rng() * 13000) + 1000,
          })),
        };

      case 'IDENTIFY': {
        const shuffled = [...this.identifyPool].sort(() => rng() - 0.5);
        return {
          questions: shuffled.slice(0, 5).map((q) => ({
            emoji: q.emoji,
            hints: q.hints,
            choices: this.shuffleChoices([q.correct, ...q.wrong], rng),
            correct: q.correct,
          })),
        };
      }

      default:
        return {};
    }
  }

  private shuffleChoices(choices: string[], rng: () => number): string[] {
    return [...choices].sort(() => rng() - 0.5);
  }

  private seededRandom(seed: string): () => number {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s + seed.charCodeAt(i)) & 0xffffffff;
    return () => {
      s = (s ^ (s << 13)) & 0xffffffff;
      s = (s ^ (s >> 17)) & 0xffffffff;
      s = (s ^ (s << 5)) & 0xffffffff;
      return (s >>> 0) / 0x100000000;
    };
  }

  private calculateVariance(nums: number[]): number {
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    return nums.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / nums.length;
  }
}
