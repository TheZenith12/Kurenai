import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard - Леадерборд')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('attack')
  getAttack(@Query('limit') limit = 50) { return this.leaderboardService.getAttackLeaderboard(+limit); }

  @Get('mini-game')
  getMiniGame(@Query('period') period: 'daily' | 'weekly' = 'daily', @Query('limit') limit = 50) {
    return this.leaderboardService.getMiniGameLeaderboard(period, +limit);
  }

  @Get('mastery')
  getMastery() { return this.leaderboardService.getCharacterMasteryLeaderboard(); }

  @Get('anime/:animeId')
  getAnime(@Param('animeId') animeId: string) { return this.leaderboardService.getAnimeLeaderboard(animeId); }

  @Get('guild')
  getGuild() { return this.leaderboardService.getGuildLeaderboard(); }

  @Get('my-ranks')
  getMyRanks(@Req() req: any) { return this.leaderboardService.getUserRanks(req.user.id); }
}
