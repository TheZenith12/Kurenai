import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AttackEventService } from './attack-event.service';
import { AttackEventController } from './attack-event.controller';
import { EnergyModule } from '../energy/energy.module';
import { QuestsModule } from '../quests/quests.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'xp' },
      { name: 'leaderboard' },
    ),
    EnergyModule,
    QuestsModule,
    AchievementsModule,
  ],
  controllers: [AttackEventController],
  providers: [AttackEventService],
  exports: [AttackEventService],
})
export class AttackEventModule {}
