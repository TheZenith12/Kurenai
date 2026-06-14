import { Module } from '@nestjs/common';
import { CosmeticsController } from './cosmetics.controller';
import { CosmeticsService } from './cosmetics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CosmeticsController],
  providers: [CosmeticsService],
  exports: [CosmeticsService],
})
export class CosmeticsModule {}
