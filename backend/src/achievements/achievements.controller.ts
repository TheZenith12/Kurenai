import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AchievementsService } from './achievements.service';

@ApiTags('Achievements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  getAll() { return this.achievementsService.getAll(); }

  @Get('my')
  getMy(@Req() req: any) { return this.achievementsService.getUserAchievements(req.user.id); }

  @Post('claim/:achievementId')
  claim(@Req() req: any, @Param('achievementId') achievementId: string) {
    return this.achievementsService.claimReward(req.user.id, achievementId);
  }
}
