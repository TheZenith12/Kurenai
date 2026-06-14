import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SeasonsService } from './seasons.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Seasons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get('current')
  @Public()
  getCurrent() {
    return this.seasonsService.getCurrentSeason();
  }

  @Get('history')
  getHistory() {
    return this.seasonsService.getSeasonHistory();
  }
}
