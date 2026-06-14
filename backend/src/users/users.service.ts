import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        reputation: true,
        characterPoints: true,
        activeCharacterId: true,
        createdAt: true,
        lastLoginAt: true,
        systemId: true,
        _count: {
          select: { ownedCharacters: true },
        },
      },
    });
    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');
    return user;
  }

  async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, displayName: true, avatarUrl: true },
    });
  }

  async searchUsers(query: string, limit = 20) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
        isBanned: false,
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true, reputation: true },
      take: limit,
    });
  }

  // ─── Watchlist ────────────────────────────────────────────────────────

  async getWatchlist(userId: string) {
    return this.prisma.animeWatchlist.findMany({
      where: { userId },
      include: { anime: { select: { id: true, name: true, imageUrl: true, description: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsertWatchlist(userId: string, animeId: string, status = 'PLANNING') {
    return this.prisma.animeWatchlist.upsert({
      where: { userId_animeId: { userId, animeId } },
      create: { userId, animeId, status: status as any },
      update: { status: status as any },
      include: { anime: { select: { id: true, name: true, imageUrl: true } } },
    });
  }

  async removeFromWatchlist(userId: string, animeId: string) {
    await this.prisma.animeWatchlist.deleteMany({ where: { userId, animeId } });
    return { message: 'Устгагдлаа' };
  }

  // ─── Push tokens ──────────────────────────────────────────────────────

  async savePushToken(userId: string, token: string) {
    await this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token },
      update: { userId },
    });
    return { message: 'Token хадгалагдлаа' };
  }
}
