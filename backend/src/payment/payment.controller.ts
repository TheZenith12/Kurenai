import { Controller, Post, Get, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Payment - Төлбөр')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('qpay/create')
  createQpayInvoice(@Req() req: any, @Body() body: { characterId: string }) {
    return this.paymentService.createQPayInvoice(req.user.id, body.characterId);
  }

  @Post('qpay/webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  qpayWebhook(@Body() body: { invoice_id: string; payment_status: string }) {
    return this.paymentService.handleQPayWebhook(body.invoice_id, body.payment_status);
  }

  @Get('qpay/status/:paymentId')
  checkQpayStatus(@Param('paymentId') paymentId: string) {
    return this.paymentService.checkQPayStatus(paymentId);
  }

  @Post('bank-transfer')
  submitBankTransfer(@Req() req: any, @Body() body: { characterId: string; transferRef?: string }) {
    return this.paymentService.submitBankTransfer(req.user.id, body.characterId, body.transferRef);
  }

  @Get('my')
  getMyPayments(@Req() req: any) {
    return this.paymentService.getUserPayments(req.user.id);
  }
}
