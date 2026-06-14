import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SeasonsService } from './seasons.service';
import { SeasonsController } from './seasons.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'season' })],
  controllers: [SeasonsController],
  providers: [SeasonsService],
  exports: [SeasonsService],
})
export class SeasonsModule {}
