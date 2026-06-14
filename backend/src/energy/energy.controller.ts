import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnergyService } from './energy.service';

@ApiTags('Energy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('energy')
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  @Get('my')
  getMyEnergy(@Req() req: any) {
    return this.energyService.getEnergy(req.user.id);
  }
}
