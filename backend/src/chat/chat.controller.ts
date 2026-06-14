import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { RedisService } from '../redis/redis.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly redis: RedisService,
  ) {}

  @Get('rooms/:roomId/messages')
  getMessages(
    @Param('roomId') roomId: string,
    @Query('limit') limit = 50,
    @Query('before') before?: string,
  ) {
    return this.chatService.getRoomMessages(roomId, +limit, before);
  }

  @Get('my-anime-rooms')
  getMyAnimeRooms(@Req() req: any) {
    return this.chatService.getAnimeRooms(req.user.id);
  }

  @Get('my-private-rooms')
  getMyPrivateRooms(@Req() req: any) {
    return this.chatService.getMyPrivateRooms(req.user.id);
  }

  @Post('private')
  createPrivateChat(@Req() req: any, @Body() body: { userId: string }) {
    return this.chatService.createPrivateRoom(req.user.id, body.userId);
  }

  @Delete('messages/:messageId')
  deleteMessage(@Param('messageId') messageId: string, @Req() req: any) {
    return this.chatService.deleteMessage(messageId, req.user.id, req.user.role !== 'USER');
  }

  // ─── Image Upload (chat) ─────────────────────────────────────────────
  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(extname(file.originalname))) {
          return cb(new BadRequestException('Зөвхөн зураг оруулах боломжтой'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadChatImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл олдсонгүй');
    return { url: `/uploads/${file.filename}` };
  }

  // ─── Admin: Chat Room Background ────────────────────────────────────
  @Get('rooms/:roomId/background')
  async getRoomBackground(@Param('roomId') roomId: string) {
    const url = await this.redis.get(`chat:room:bg:${roomId}`);
    return { backgroundUrl: url ?? null };
  }

  @Patch('rooms/:roomId/background')
  async setRoomBackground(
    @Param('roomId') roomId: string,
    @Body() body: { backgroundUrl: string },
    @Req() req: any,
  ) {
    if (req.user.role === 'USER') throw new ForbiddenException('Admin эрх шаардлагатай');
    if (body.backgroundUrl) {
      await this.redis.set(`chat:room:bg:${roomId}`, body.backgroundUrl, 0); // no expiry
    } else {
      await this.redis.del(`chat:room:bg:${roomId}`);
    }
    return { success: true, backgroundUrl: body.backgroundUrl ?? null };
  }

  @Post('rooms/:roomId/upload-background')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const unique = `bg-${Date.now()}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/\.(jpg|jpeg|png|webp)$/i.test(extname(file.originalname))) {
          return cb(new BadRequestException('Зөвхөн зураг оруулах боломжтой'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadRoomBackground(
    @Param('roomId') roomId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (req.user.role === 'USER') throw new ForbiddenException('Admin эрх шаардлагатай');
    if (!file) throw new BadRequestException('Файл олдсонгүй');
    const url = `/uploads/${file.filename}`;
    await this.redis.set(`chat:room:bg:${roomId}`, url, 0);
    return { url };
  }
}
