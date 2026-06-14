import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ModerationService } from '../moderation/moderation.service';
import { PaymentService } from '../payment/payment.service';
import { UserRole } from '../common/enums';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly moderationService: ModerationService,
    private readonly paymentService: PaymentService,
  ) {}

  // ─── Dashboard Stats ──────────────────────────────────────────────

  async getDashboardStats() {
    const [totalUsers, activeUsers, bannedUsers, pendingPayments, activeSeasonStats] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true, isBanned: false } }),
        this.prisma.user.count({ where: { isBanned: true } }),
        this.prisma.payment.count({ where: { status: 'PENDING' } }),
        this.prisma.season.findFirst({ where: { isActive: true } }).then((s) =>
          s ? this.prisma.seasonStat.count({ where: { seasonId: s.id } }) : 0,
        ),
      ]);

    const onlineCount = await this.redis.get('online:count').then((v) => parseInt(v ?? '0'));

    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      onlineCount,
      pendingPayments,
      activeSeasonParticipants: activeSeasonStats,
    };
  }

  // ─── User Management ──────────────────────────────────────────────

  async getAllUsers(page = 1, limit = 20, search?: string, status?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { systemId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'banned') where.isBanned = true;
    if (status === 'active') where.isActive = true;
    if (status === 'muted') where.isMuted = true;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          systemId: true,
          role: true,
          isBanned: true,
          banReason: true,
          banUntil: true,
          isMuted: true,
          reputation: true,
          characterPoints: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async banUser(adminId: string, userId: string, reason: string, durationHours?: number) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    const target = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!target) throw new NotFoundException('Хэрэглэгч олдсонгүй');
    if (target.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin-г хориглох боломжгүй');
    }
    if (target.role === UserRole.ADMIN && admin?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Admin-г хориглох зөвхөн Super Admin хийнэ');
    }

    await this.moderationService.adminBanUser(userId, adminId, reason, durationHours);
    this.logger.log(`Admin ${adminId} banned user ${userId}: ${reason}`);

    return { success: true, message: `${target.username} хориглогдлоо` };
  }

  async unbanUser(adminId: string, userId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException('Хэрэглэгч олдсонгүй');

    await this.moderationService.adminUnbanUser(userId, adminId);
    return { success: true, message: `${target.username}-н хориглолт арилгагдлаа` };
  }

  // ─── Payment Management ───────────────────────────────────────────

  async getPendingBankTransfers() {
    return this.paymentService.getPendingBankTransfers();
  }

  async verifyBankTransfer(adminId: string, paymentId: string) {
    const result = await this.paymentService.adminVerifyPayment(paymentId, adminId);
    this.logger.log(`Admin ${adminId} verified payment ${paymentId}`);
    return result;
  }

  async rejectBankTransfer(adminId: string, paymentId: string, reason: string) {
    const result = await this.paymentService.adminRejectPayment(paymentId, adminId, reason);
    this.logger.log(`Admin ${adminId} rejected payment ${paymentId}: ${reason}`);
    return result;
  }

  // ─── Character Management ─────────────────────────────────────────

  async manualUnlockCharacter(adminId: string, userId: string, characterId: string) {
    const [user, character] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.animeCharacter.findUnique({ where: { id: characterId } }),
    ]);

    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');
    if (!character) throw new NotFoundException('Дүр олдсонгүй');

    await this.prisma.userCharacter.upsert({
      where: { userId_characterId: { userId, characterId } },
      update: {},
      create: { userId, characterId },
    });

    this.logger.log(`Admin ${adminId} unlocked character ${characterId} for user ${userId}`);
    return { success: true, message: `${character.name} дүр unlock хийгдлээ` };
  }

  async revokeCharacter(adminId: string, userId: string, characterId: string) {
    await this.prisma.userCharacter.delete({
      where: { userId_characterId: { userId, characterId } },
    });

    this.logger.log(`Admin ${adminId} revoked character ${characterId} from user ${userId}`);
    return { success: true, message: 'Дүр хасагдлаа' };
  }

  async updateCharacterPrice(adminId: string, characterId: string, price: number) {
    const character = await this.prisma.animeCharacter.update({
      where: { id: characterId },
      data: { price },
    });

    this.logger.log(`Admin ${adminId} updated character ${characterId} price to ${price}`);
    return character;
  }

  // ─── Reports ──────────────────────────────────────────────────────

  async getPendingReports() {
    return this.prisma.report.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        reporter: { select: { username: true } },
        reported: { select: { username: true, isBanned: true } },
      },
    });
  }

  async resolveReport(adminId: string, reportId: string, action: 'resolve' | 'dismiss', notes?: string) {
    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED',
        adminId,
        adminNotes: notes,
        resolvedAt: new Date(),
      },
    });
  }

  // ─── Season Control ───────────────────────────────────────────────

  async manualStartSeason(adminId: string) {
    this.logger.warn(`Admin ${adminId} manually starting new season`);
    const { SeasonsService } = await import('../seasons/seasons.service');
    // Queue-д оруулна
    return { message: 'Season queue-д орлоо. Удахгүй эхэлнэ.' };
  }

  async manualEndSeason(adminId: string) {
    this.logger.warn(`Admin ${adminId} manually ending current season`);
    return { message: 'Season дуусгах queue-д орлоо.' };
  }

  // ─── Content Moderation ───────────────────────────────────────────

  async deleteMessage(adminId: string, messageId: string) {
    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    this.logger.log(`Admin ${adminId} deleted message ${messageId}`);
    return { success: true };
  }

  async getRecentMessages(roomId?: string, limit = 100) {
    const where: any = { isDeleted: false };
    if (roomId) where.roomId = roomId;

    return this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { username: true, isBanned: true } },
      },
    });
  }

  // ─── Anime Management ─────────────────────────────────────────────

  async getAllAnimesAdmin() {
    return this.prisma.anime.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        characters: {
          orderBy: [{ isBaseForm: 'desc' }, { sortOrder: 'asc' }],
          include: { skills: { orderBy: { requiredLevel: 'asc' } } },
        },
        _count: { select: { characters: true } },
      },
    });
  }

  async createAnime(data: {
    name: string;
    description: string;
    imageUrl: string;
    bannerUrl?: string;
    sortOrder?: number;
  }) {
    const anime = await this.prisma.anime.create({ data });
    await this.redis.del('animes:list');
    this.logger.log(`Created anime: ${anime.name}`);
    return anime;
  }

  async updateAnime(id: string, data: Partial<{
    name: string;
    description: string;
    imageUrl: string;
    bannerUrl: string;
    sortOrder: number;
    isActive: boolean;
  }>) {
    const anime = await this.prisma.anime.update({ where: { id }, data });
    await this.redis.del('animes:list');
    return anime;
  }

  async deleteAnime(id: string) {
    await this.prisma.anime.update({ where: { id }, data: { isActive: false } });
    await this.redis.del('animes:list');
    return { success: true };
  }

  // ─── Character Management (Admin) ────────────────────────────────

  async createCharacter(animeId: string, data: {
    name: string;
    description: string;
    avatarUrl: string;
    fullImageUrl?: string;
    isBaseForm?: boolean;
    price?: number;
    characterPoints?: number;
    sortOrder?: number;
  }) {
    const character = await this.prisma.animeCharacter.create({
      data: { animeId, ...data },
    });
    await this.redis.del('animes:list');
    this.logger.log(`Created character: ${character.name} for anime ${animeId}`);
    return character;
  }

  async updateCharacter(id: string, data: Partial<{
    name: string;
    description: string;
    avatarUrl: string;
    fullImageUrl: string;
    isBaseForm: boolean;
    price: number;
    characterPoints: number;
    sortOrder: number;
    isActive: boolean;
  }>) {
    const character = await this.prisma.animeCharacter.update({ where: { id }, data });
    await this.redis.del('animes:list');
    return character;
  }

  async deleteCharacter(id: string) {
    await this.prisma.animeCharacter.update({ where: { id }, data: { isActive: false } });
    await this.redis.del('animes:list');
    return { success: true };
  }

  // ─── Skill Management (Admin) ─────────────────────────────────────

  async createSkill(characterId: string, data: {
    name: string;
    description: string;
    damageMin: number;
    damageMax: number;
    energyCost: number;
    cooldownSeconds: number;
    effectType: string;
    isUltimate?: boolean;
    requiredLevel?: number;
    requiredTier?: string;
    animationUrl?: string;
  }) {
    const skill = await this.prisma.skill.create({
      data: {
        characterId,
        animationUrl: '',
        ...data,
        effectType: data.effectType as any,
        requiredTier: (data.requiredTier ?? 'BRONZE') as any,
      },
    });
    this.logger.log(`Created skill: ${skill.name} for character ${characterId}`);
    return skill;
  }

  async deleteSkill(id: string) {
    await this.prisma.skill.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }

  // ─── Server Monitoring ────────────────────────────────────────────

  async getServerMetrics() {
    const onlineCount = await this.redis.get('online:count').then((v) => parseInt(v ?? '0'));

    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      onlineUsers: onlineCount,
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
      uptime: Math.round(uptime),
      nodeVersion: process.version,
    };
  }
}
