import { Module } from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { GuildsController } from './guilds.controller';

@Module({
  controllers: [GuildsController],
  providers: [GuildsService],
  exports: [GuildsService],
})
export class GuildsModule {}
