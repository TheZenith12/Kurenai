import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GachaService } from './gacha.service';

@ApiTags('Gacha - Гача систем')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gacha')
export class GachaController {
  constructor(private readonly gachaService: GachaService) {}

  @Get('pools')
  getPools() { return this.gachaService.getPools(); }

  @Get('my-rolls')
  getMyRolls(@Req() req: any) { return this.gachaService.getMyRolls(req.user.id); }

  @Get('pity/:poolId')
  getPity(@Req() req: any, @Param('poolId') poolId: string) {
    return this.gachaService.getPityCount(req.user.id, poolId).then((count) => ({ pity: count }));
  }

  @Post('roll/:poolId')
  roll(@Req() req: any, @Param('poolId') poolId: string, @Body() body: { count?: 1 | 10 }) {
    return this.gachaService.roll(req.user.id, poolId, body.count ?? 1);
  }
}
