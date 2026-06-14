import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ModerationModule } from '../moderation/moderation.module';
import { EnergyModule } from '../energy/energy.module';
import { AuthModule } from '../auth/auth.module';
import { QuestsModule } from '../quests/quests.module';

@Module({
  imports: [ModerationModule, EnergyModule, AuthModule, QuestsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
