import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MiniGamesService } from './mini-games.service';
import { MiniGamesController } from './mini-games.controller';
import { XpProcessor } from './xp.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestsModule } from '../quests/quests.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'xp' }),
    PrismaModule,
    QuestsModule,
  ],
  controllers: [MiniGamesController],
  providers: [MiniGamesService, XpProcessor],
  exports: [MiniGamesService],
})
export class MiniGamesModule {}
