import { Controller, Get, Post, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GuildsService } from './guilds.service';

@ApiTags('Guilds - Guild систем')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('guilds')
export class GuildsController {
  constructor(private readonly guildsService: GuildsService) {}

  @Get()
  getAll() { return this.guildsService.getGuilds(); }

  @Get('my')
  getMy(@Req() req: any) { return this.guildsService.getUserGuild(req.user.id); }

  @Post('join')
  join(@Req() req: any, @Body() body: { guildId: string }) {
    return this.guildsService.joinGuild(req.user.id, body.guildId);
  }

  @Post('leave')
  leave(@Req() req: any) { return this.guildsService.leaveGuild(req.user.id); }

  @Post()
  create(@Req() req: any, @Body() body: { name: string; description?: string; animeId: string }) {
    return this.guildsService.createGuild(req.user.id, body);
  }

  @Patch()
  update(@Req() req: any, @Body() body: { name?: string; description?: string }) {
    return this.guildsService.updateGuild(req.user.id, body);
  }

  @Post('promote')
  promote(@Req() req: any, @Body() body: { targetUserId: string; role: string }) {
    return this.guildsService.promoteMember(req.user.id, body.targetUserId, body.role as any);
  }
}
