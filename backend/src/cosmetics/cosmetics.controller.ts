import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CosmeticsService } from './cosmetics.service';

@ApiTags('Cosmetics - Тохируулга')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cosmetics')
export class CosmeticsController {
  constructor(private readonly cosmeticsService: CosmeticsService) {}

  @Get()
  getAll() { return this.cosmeticsService.getAllItems(); }

  @Get('my')
  getMy(@Req() req: any) { return this.cosmeticsService.getMyCosmetics(req.user.id); }

  @Get('equipped')
  getEquipped(@Req() req: any) { return this.cosmeticsService.getEquippedCosmetics(req.user.id); }

  @Post('buy/:itemId')
  buy(@Req() req: any, @Param('itemId') itemId: string) {
    return this.cosmeticsService.buyItem(req.user.id, itemId);
  }

  @Post('equip/:itemId')
  equip(@Req() req: any, @Param('itemId') itemId: string) {
    return this.cosmeticsService.equipItem(req.user.id, itemId);
  }

  @Post('unequip/:itemId')
  unequip(@Req() req: any, @Param('itemId') itemId: string) {
    return this.cosmeticsService.unequipItem(req.user.id, itemId);
  }
}
