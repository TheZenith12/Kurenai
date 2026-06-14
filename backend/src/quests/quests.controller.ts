import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuestsService } from './quests.service';

@ApiTags('Quests - Өдрийн даалгавар')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quests')
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  @Get('today')
  getToday(@Req() req: any) {
    return this.questsService.getTodayQuests(req.user.id);
  }

  @Post('claim/:questId')
  claim(@Req() req: any, @Param('questId') questId: string) {
    return this.questsService.claimReward(req.user.id, questId);
  }
}
