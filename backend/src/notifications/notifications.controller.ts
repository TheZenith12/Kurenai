import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(@Req() req: any, @Query('limit') limit?: string) {
    return this.notificationsService.getMyNotifications(req.user.id, limit ? parseInt(limit) : 30);
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) { return this.notificationsService.getUnreadCount(req.user.id); }

  @Post(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.id, id);
  }

  @Post('read-all')
  markAllRead(@Req() req: any) { return this.notificationsService.markAllRead(req.user.id); }
}
