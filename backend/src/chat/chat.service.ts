import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ChatType } from '../common/enums';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async canUserJoinRoom(userId: string, roomId: string): Promise<boolean> {
    if (roomId === 'all') return true;

    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { animeChat: true, privateChat: true, guildRoom: true },
    });

    if (!room || !room.isActive) return false;

    if (room.type === ChatType.ANIME && room.animeChat) {
      // Хэрэглэгч тухайн anime-ийн дүр эзэмшсэн эсэхийг шалгах
      const ownership = await this.prisma.userCharacter.findFirst({
        where: {
          userId,
          character: { animeId: room.animeChat.animeId },
        },
      });
      return !!ownership;
    }

    if (room.type === ChatType.PRIVATE && room.privateChat) {
      return room.privateChat.user1Id === userId || room.privateChat.user2Id === userId;
    }

    if (room.type === ChatType.GUILD && room.guildRoom) {
      const member = await this.prisma.guildMember.findFirst({
        where: { userId, guild: { chatRoomId: roomId } },
      });
      return !!member;
    }

    return false;
  }

  async getRoomMessages(roomId: string, limit = 50, before?: string) {
    const cacheKey = `chat:messages:${roomId}:recent`;

    // Redis cache-ээс авах
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached && !before) return cached;

    const where: any = {
      roomId: roomId === 'all' ? undefined : roomId,
      isDeleted: false,
    };

    if (roomId === 'all') {
      const allRoom = await this.prisma.chatRoom.findFirst({
        where: { type: ChatType.ALL },
      });
      if (!allRoom) return [];
      where.roomId = allRoom.id;
    }

    if (before) {
      const beforeMsg = await this.prisma.message.findUnique({ where: { id: before } });
      if (beforeMsg) where.createdAt = { lt: beforeMsg.createdAt };
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        content: true,
        isFiltered: true,
        metadata: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            reputation: true,
          },
        },
      },
    });

    const result = messages.reverse();

    // Cache-д хадгалах (30 секунд)
    if (!before) {
      await this.redis.setJson(cacheKey, result, 30);
    }

    return result;
  }

  async saveMessage(data: {
    roomId: string;
    senderId: string;
    content: string;
    isFiltered: boolean;
    filterReason?: string;
    metadata?: object;
  }) {
    let actualRoomId = data.roomId;

    if (data.roomId === 'all') {
      const allRoom = await this.getOrCreateAllRoom();
      actualRoomId = allRoom.id;
    }

    const message = await this.prisma.message.create({
      data: {
        roomId: actualRoomId,
        senderId: data.senderId,
        content: data.content,
        isFiltered: data.isFiltered,
        filterReason: data.filterReason,
        metadata: data.metadata,
      },
    });

    // Cache invalidate
    await this.redis.del(`chat:messages:${data.roomId}:recent`);

    return message;
  }

  async createPrivateRoom(user1Id: string, user2Id: string) {
    const [sortedUser1, sortedUser2] = [user1Id, user2Id].sort();

    const existing = await this.prisma.privateChat.findUnique({
      where: { user1Id_user2Id: { user1Id: sortedUser1, user2Id: sortedUser2 } },
      include: { chatRoom: true },
    });

    if (existing) return existing;

    const user2 = await this.prisma.user.findUnique({ where: { id: user2Id } });
    if (!user2) throw new NotFoundException('Хэрэглэгч олдсонгүй');

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.chatRoom.create({
        data: { type: ChatType.PRIVATE, name: `private:${sortedUser1}:${sortedUser2}` },
      });

      return tx.privateChat.create({
        data: {
          user1Id: sortedUser1,
          user2Id: sortedUser2,
          chatRoomId: room.id,
        },
        include: { chatRoom: true },
      });
    });
  }

  async getAnimeRooms(userId: string) {
    const ownedCharacters = await this.prisma.userCharacter.findMany({
      where: { userId },
      include: { character: { include: { anime: { include: { chatRoom: true } } } } },
    });

    const rooms = [];
    const seenAnimeIds = new Set<string>();

    for (const uc of ownedCharacters) {
      const animeId = uc.character.animeId;
      if (!seenAnimeIds.has(animeId) && uc.character.anime.chatRoom) {
        seenAnimeIds.add(animeId);
        rooms.push({
          animeId,
          animeName: uc.character.anime.name,
          animeImage: uc.character.anime.imageUrl,
          roomId: uc.character.anime.chatRoom.chatRoomId,
        });
      }
    }

    return rooms;
  }

  async getMyPrivateRooms(userId: string) {
    const privates = await this.prisma.privateChat.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      include: {
        chatRoom: {
          include: {
            messages: {
              where: { isDeleted: false },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        user1: { select: { id: true, username: true, displayName: true, activeCharacterId: true } },
        user2: { select: { id: true, username: true, displayName: true, activeCharacterId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return privates.map((p) => {
      const other = p.user1Id === userId ? p.user2 : p.user1;
      const lastMsg = p.chatRoom.messages[0];
      return {
        roomId: p.chatRoomId,
        userId: other.id,
        username: other.username,
        displayName: other.displayName,
        lastMessage: lastMsg?.content ?? null,
        lastAt: lastMsg?.createdAt ?? p.createdAt,
      };
    });
  }

  async deleteMessage(messageId: string, requesterId: string, isAdmin: boolean) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Мессеж олдсонгүй');

    if (!isAdmin && message.senderId !== requesterId) {
      throw new ForbiddenException('Зөвхөн өөрийнхөө мессежийг устгах боломжтой');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });
  }

  private async getOrCreateAllRoom() {
    const existing = await this.prisma.chatRoom.findFirst({
      where: { type: ChatType.ALL },
    });

    if (existing) return existing;

    return this.prisma.chatRoom.create({
      data: { type: ChatType.ALL, name: 'Нийт чат' },
    });
  }
}
