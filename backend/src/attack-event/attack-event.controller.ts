import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttackEventService } from './attack-event.service';

@ApiTags('Attack Event - PvP')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attack')
export class AttackEventController {
  constructor(private readonly attackEventService: AttackEventService) {}

  @Post('perform')
  perform(@Req() req: any, @Body() body: { defenderId: string; skillId: string }) {
    return this.attackEventService.performAttack(req.user.id, body.defenderId, body.skillId);
  }

  @Get('leaderboard')
  getLeaderboard(@Query('seasonId') seasonId?: string) {
    return this.attackEventService.getSeasonLeaderboard(seasonId);
  }

  @Get('my-stats')
  getMyStats(@Req() req: any, @Query('seasonId') seasonId?: string) {
    return this.attackEventService.getUserSeasonStats(req.user.id, seasonId);
  }

  @Get('history')
  getHistory(@Req() req: any, @Query('seasonId') seasonId?: string) {
    return this.attackEventService.getAttackHistory(req.user.id, seasonId);
  }

  @Get('replay/:id')
  getReplay(@Param('id') id: string) {
    return this.attackEventService.getReplay(id);
  }
}
