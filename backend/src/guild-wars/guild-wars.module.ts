import { Module } from '@nestjs/common';
import { GuildWarsController } from './guild-wars.controller';
import { GuildWarsService } from './guild-wars.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GuildWarsController],
  providers: [GuildWarsService],
  exports: [GuildWarsService],
})
export class GuildWarsModule {}
