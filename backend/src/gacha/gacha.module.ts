import { Module } from '@nestjs/common';
import { GachaController } from './gacha.controller';
import { GachaService } from './gacha.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GachaController],
  providers: [GachaService],
  exports: [GachaService],
})
export class GachaModule {}
