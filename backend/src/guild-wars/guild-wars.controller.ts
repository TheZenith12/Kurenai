import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GuildWarsService } from './guild-wars.service';

@ApiTags('Guild Wars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('guild-wars')
export class GuildWarsController {
  constructor(private readonly guildWarsService: GuildWarsService) {}

  @Get()
  getActive() { return this.guildWarsService.getActiveWars(); }

  @Get('my')
  getMy(@Req() req: any) { return this.guildWarsService.getMyGuildWars(req.user.id); }

  @Post('challenge')
  challenge(@Req() req: any, @Body() body: { defenderGuildId: string }) {
    return this.guildWarsService.challengeGuild(req.user.id, body.defenderGuildId);
  }

  @Post(':warId/accept')
  accept(@Req() req: any, @Param('warId') warId: string) {
    return this.guildWarsService.acceptWar(req.user.id, warId);
  }
}
