import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ModerationModule } from '../moderation/moderation.module';
import { PaymentModule } from '../payment/payment.module';
import { SeasonsModule } from '../seasons/seasons.module';
import { RedisModule } from '../redis/redis.module';
import { UploadController } from './upload.controller';

@Module({
  imports: [ModerationModule, PaymentModule, SeasonsModule, RedisModule],
  controllers: [AdminController, UploadController],
  providers: [AdminService],
})
export class AdminModule {}
