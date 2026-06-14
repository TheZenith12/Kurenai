import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'payment' })],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
