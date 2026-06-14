import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ModerationService } from '../moderation/moderation.service';
import { RedisService } from '../redis/redis.service';
import { EnergyService } from '../energy/energy.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuestsService } from '../quests/quests.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
  role: string;
  activeCharacterId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/ws',
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // Online хэрэглэгчдийн map: userId → socket.id[]
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly chatService: ChatService,
    private readonly moderationService: ModerationService,
    private readonly redis: RedisService,
    private readonly energyService: EnergyService,
    private readonly prisma: PrismaService,
    private readonly questsService: QuestsService,
  ) {}

  // ─── Connection Management ────────────────────────────────────────

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('Token байхгүй байна');

      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, role: true, isBanned: true, isActive: true, activeCharacterId: true },
      });

      if (!user || user.isBanned || !user.isActive) {
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.username = user.username;
      client.role = user.role;
      client.activeCharacterId = user.activeCharacterId ?? undefined;

      // Online map-д нэмэх
      if (!this.onlineUsers.has(user.id)) {
        this.onlineUsers.set(user.id, new Set());
      }
      this.onlineUsers.get(user.id)!.add(client.id);

      // Бүх чатын өрөөнд нэгдэх
      client.join('all-chat');

      // Online тоо broadcast
      this.broadcastOnlineCount();

      this.logger.log(`User connected: ${user.username} (${client.id})`);
    } catch (err) {
      this.logger.warn(`Connection rejected: ${(err as Error).message}`);
      client.emit('auth_error', { message: 'Нэвтрэх шаардлагатай байна' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.onlineUsers.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(client.userId);
        }
      }
      this.broadcastOnlineCount();
      this.logger.log(`User disconnected: ${client.username} (${client.id})`);
    }
  }

  // ─── Chat Events ──────────────────────────────────────────────────

  @SubscribeMessage('chat:join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      // Хэрэглэгч энэ өрөөнд нэвтрэх эрхтэй эсэхийг шалгах
      const canJoin = await this.chatService.canUserJoinRoom(client.userId, data.roomId);
      if (!canJoin) {
        return client.emit('error', { message: 'Энэ чатад нэвтрэх эрх байхгүй байна' });
      }

      client.join(`room:${data.roomId}`);

      // Сүүлийн мессежүүд илгээх
      const messages = await this.chatService.getRoomMessages(data.roomId, 50);
      client.emit('chat:history', { roomId: data.roomId, messages });

      // Өрөөний гишүүдэд мэдэгдэх
      this.server.to(`room:${data.roomId}`).emit('chat:user_joined', {
        userId: client.userId,
        username: client.username,
      });
    } catch (err) {
      client.emit('error', { message: 'Өрөөнд нэгдэхэд алдаа гарлаа' });
    }
  }

  @SubscribeMessage('chat:leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(`room:${data.roomId}`);
    this.server.to(`room:${data.roomId}`).emit('chat:user_left', {
      userId: client.userId,
      username: client.username,
    });
  }

  @SubscribeMessage('chat:send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; content: string; characterId?: string; extraMeta?: Record<string, any> },
  ) {
    try {
      // Rate limit шалгах
      const isLimited = await this.redis.isRateLimited(
        `chat:rate:${client.userId}`,
        30,  // 30 мессеж per minute
        60,
      );
      if (isLimited) {
        return client.emit('error', { message: 'Хэт олон мессеж илгээж байна. Түр хүлээнэ үү.' });
      }

      // Mute шалгах
      const user = await this.prisma.user.findUnique({
        where: { id: client.userId },
        select: { isMuted: true, muteUntil: true, reputation: true },
      });

      if (user?.isMuted) {
        if (!user.muteUntil || user.muteUntil > new Date()) {
          const until = user.muteUntil
            ? `${user.muteUntil.toLocaleTimeString('mn-MN')} хүртэл`
            : 'тодорхойгүй хугацаанд';
          return client.emit('error', { message: `Та ${until} чат хориотой байна` });
        }
        // Mute дууссан бол арилгах
        await this.prisma.user.update({
          where: { id: client.userId },
          data: { isMuted: false, muteUntil: null },
        });
      }

      // Content шалгах — зураг/чадвартай бол хоосон текст зөвшөөрнө
      const content = (data.content ?? '').trim();
      const hasAttachment = !!(data.extraMeta?.imageUrl || data.extraMeta?.skillCast);
      if (content.length > 500) {
        return client.emit('error', { message: 'Мессежийн урт 500 тэмдэгтээс хэтэрсэн байна' });
      }
      if (!content && !hasAttachment) {
        return client.emit('error', { message: 'Хоосон мессеж илгээх боломжгүй' });
      }

      // Auto moderation
      const moderationResult = await this.moderationService.checkMessage(content, client.userId);

      // Идэвхтэй дүрийн мэдээллийг авах
      const charId = data.characterId ?? client.activeCharacterId;
      let charMeta: Record<string, string> = {};
      if (charId) {
        const uc = await this.prisma.userCharacter.findFirst({
          where: { userId: client.userId, characterId: charId, isActive: true },
          select: {
            character: {
              select: {
                name: true,
                avatarUrl: true,
                anime: { select: { name: true } },
              },
            },
          },
        });
        if (uc?.character) {
          // Primary skill-ийн effect авах (name glow-д хэрэглэнэ)
          const primarySkill = await this.prisma.skill.findFirst({
            where: { characterId: charId, isActive: true },
            select: { effectType: true },
            orderBy: [{ isUltimate: 'asc' }, { requiredLevel: 'asc' }],
          });
          charMeta = {
            characterId: charId,
            characterName: uc.character.name,
            animeName: uc.character.anime?.name ?? '',
            avatarUrl: uc.character.avatarUrl ?? '',
            skillEffect: primarySkill?.effectType ?? '',
          };
        }
      }

      // Мессеж хадгалах
      const message = await this.chatService.saveMessage({
        roomId: data.roomId,
        senderId: client.userId,
        content: moderationResult.filtered ? moderationResult.filteredContent! : content,
        isFiltered: moderationResult.filtered,
        filterReason: moderationResult.reason,
        metadata: {
          ...charMeta,
          username: client.username,
          ...(data.extraMeta ?? {}),
        },
      });

      // Quest progress шинэчлэх (fire-and-forget)
      this.questsService.incrementProgress(client.userId, 'SEND_MESSAGES').catch(() => {});

      // Broadcast to room
      const messagePayload = {
        id: message.id,
        roomId: data.roomId,
        senderId: client.userId,
        username: client.username,
        content: message.content,
        isFiltered: message.isFiltered,
        metadata: message.metadata,
        createdAt: message.createdAt,
      };

      // All chat бол бүгдэд, өрөөний чат бол тухайн өрөөнд
      if (data.roomId === 'all') {
        this.server.to('all-chat').emit('chat:message', messagePayload);
      } else {
        this.server.to(`room:${data.roomId}`).emit('chat:message', messagePayload);
      }

      // Moderation action хийх
      if (moderationResult.action) {
        await this.handleModerationAction(client, moderationResult);
      }

      // Chat XP олгох (anti-spam)
      await this.grantChatXp(client.userId);
    } catch (err) {
      this.logger.error(`Message error for ${client.username}:`, err);
      client.emit('error', { message: 'Мессеж илгээхэд алдаа гарлаа' });
    }
  }

  @SubscribeMessage('chat:typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    client.to(`room:${data.roomId}`).emit('chat:typing', {
      userId: client.userId,
      username: client.username,
      isTyping: data.isTyping,
    });
  }

  // ─── Reactions ───────────────────────────────────────────────────

  @SubscribeMessage('chat:react')
  async handleReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; messageId: string; emoji: string },
  ) {
    const key = `chat:reactions:${data.messageId}`;
    const reactions = await this.redis.getJson<Record<string, string[]>>(key) ?? {};

    const emoji = data.emoji;
    if (!reactions[emoji]) reactions[emoji] = [];

    const idx = reactions[emoji].indexOf(client.userId);
    if (idx === -1) {
      // нэмэх
      reactions[emoji].push(client.userId);
    } else {
      // арилгах (toggle)
      reactions[emoji].splice(idx, 1);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    }

    await this.redis.setJson(key, reactions, 86400 * 7); // 7 хоног хадгална

    const payload = { messageId: data.messageId, reactions };
    if (data.roomId === 'all') {
      this.server.to('all-chat').emit('chat:reaction_update', payload);
    } else {
      this.server.to(`room:${data.roomId}`).emit('chat:reaction_update', payload);
    }
  }

  @SubscribeMessage('chat:get_reactions')
  async handleGetReactions(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageIds: string[] },
  ) {
    const result: Record<string, Record<string, string[]>> = {};
    for (const id of data.messageIds) {
      const r = await this.redis.getJson<Record<string, string[]>>(`chat:reactions:${id}`);
      if (r) result[id] = r;
    }
    client.emit('chat:reactions_bulk', result);
  }

  // ─── Admin: Background ───────────────────────────────────────────

  @SubscribeMessage('chat:set_background')
  async handleSetBackground(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; backgroundUrl: string },
  ) {
    if (client.role === 'USER') {
      return client.emit('error', { message: 'Admin эрх шаардлагатай' });
    }

    if (data.backgroundUrl) {
      await this.redis.set(`chat:room:bg:${data.roomId}`, data.backgroundUrl, 0);
    } else {
      await this.redis.del(`chat:room:bg:${data.roomId}`);
    }

    // Өрөөний бүх хэрэглэгчдэд broadcast
    const payload = { roomId: data.roomId, backgroundUrl: data.backgroundUrl ?? null };
    if (data.roomId === 'all') {
      this.server.to('all-chat').emit('chat:background_changed', payload);
    } else {
      this.server.to(`room:${data.roomId}`).emit('chat:background_changed', payload);
    }
  }

  // ─── Attack Events ────────────────────────────────────────────────

  @SubscribeMessage('attack:notification')
  async sendAttackNotification(targetUserId: string, data: object) {
    const sockets = this.onlineUsers.get(targetUserId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit('attack:received', data);
      });
    }
  }

  // ─── Private Methods ──────────────────────────────────────────────

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (!auth) return null;
    return auth.replace('Bearer ', '');
  }

  private broadcastOnlineCount() {
    this.server.emit('online:count', { count: this.onlineUsers.size });
  }

  private async handleModerationAction(
    client: AuthenticatedSocket,
    result: { action?: string; warning?: string },
  ) {
    if (result.action === 'warn') {
      client.emit('moderation:warning', {
        message: result.warning ?? 'Та ёс бус үг ашигласан байна. Анхааруулга!',
      });
    } else if (result.action === 'mute') {
      client.emit('moderation:muted', {
        message: 'Та давтан зөрчил гаргасан тул 1 цагийн турш чат хориотой боллоо.',
      });
    } else if (result.action === 'ban') {
      client.emit('moderation:banned', {
        message: 'Та олон удаа зөрчил гаргасан тул автоматаар хориглогдлоо.',
      });
      client.disconnect();
    }
  }

  private async grantChatXp(userId: string) {
    const key = `chat:xp:${userId}:${new Date().toDateString()}`;
    const count = await this.redis.incr(key, 86400);
    // Өдөрт 50 мессежийн XP олгоно (anti-spam cap)
    if (count <= 50) {
      await this.prisma.userCharacter.updateMany({
        where: { userId, isActive: true },
        data: { xp: { increment: 1 } },
      });
    }
  }

  // ─── Server-side emit helpers (other services-аас дуудах) ─────────

  emitToUser(userId: string, event: string, data: object) {
    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  emitToAll(event: string, data: object) {
    this.server.emit(event, data);
  }

  getOnlineCount(): number {
    return this.onlineUsers.size;
  }
}
