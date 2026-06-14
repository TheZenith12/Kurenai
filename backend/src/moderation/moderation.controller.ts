import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModerationService } from './moderation.service';

@ApiTags('Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('report')
  report(@Req() req: any, @Body() body: { reportedId: string; reason: string; messageId?: string }) {
    return this.moderationService.reportUser(req.user.id, body.reportedId, body.reason, body.messageId);
  }
}
