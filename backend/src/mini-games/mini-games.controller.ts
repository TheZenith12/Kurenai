import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MiniGamesService } from './mini-games.service';

@ApiTags('Mini Games - Мини тоглоом')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('games')
export class MiniGamesController {
  constructor(private readonly miniGamesService: MiniGamesService) {}

  @Get()
  getAll() { return this.miniGamesService.getAllGames(); }

  @Post('start')
  start(@Req() req: any, @Body() body: { gameId: string }) {
    return this.miniGamesService.startGame(req.user.id, body.gameId);
  }

  @Post('end')
  end(@Req() req: any, @Body() body: { sessionToken: string; score: number; duration: number; clientSeed?: string }) {
    return this.miniGamesService.endGame(req.user.id, body.sessionToken, body.score, body.duration, body.clientSeed);
  }

  @Get(':gameId/leaderboard')
  getLeaderboard(@Param('gameId') gameId: string, @Query('period') period: 'daily' | 'weekly' = 'daily') {
    return this.miniGamesService.getLeaderboard(gameId, period);
  }

  @Get('my-stats')
  getMyStats(@Req() req: any) { return this.miniGamesService.getUserStats(req.user.id); }
}
