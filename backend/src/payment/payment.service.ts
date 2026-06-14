import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PaymentStatus, PaymentMethod } from '../common/enums';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private qpayToken: string | null = null;
  private qpayTokenExpiry: Date | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    @InjectQueue('payment') private readonly paymentQueue: Queue,
  ) {}

  // ─── QPay ─────────────────────────────────────────────────────────

  async createQPayInvoice(userId: string, characterId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, systemId: true, username: true },
    });
    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');

    const character = await this.prisma.animeCharacter.findUnique({
      where: { id: characterId },
      select: { id: true, name: true, price: true, anime: { select: { name: true } } },
    });
    if (!character) throw new NotFoundException('Дүр олдсонгүй');
    if (character.price === 0) throw new BadRequestException('Энэ дүр үнэгүй байна');

    // Аль хэдийн авсан эсэх шалгах
    const existing = await this.prisma.userCharacter.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });
    if (existing) throw new BadRequestException('Та энэ дүрийг аль хэдийн эзэмшиж байна');

    // Хэлтэрхий invoice шалгах
    const pendingPayment = await this.prisma.payment.findFirst({
      where: { userId, characterId, status: PaymentStatus.PENDING },
    });
    if (pendingPayment) {
      // Existing invoice буцаах
      return {
        paymentId: pendingPayment.id,
        qrCode: pendingPayment.qpayQrCode,
        deepLink: pendingPayment.qpayDeepLink,
        amount: pendingPayment.amount,
        invoiceId: pendingPayment.qpayInvoiceId,
      };
    }

    // QPay token авах
    const token = await this.getQpayToken();

    // Invoice үүсгэх
    const invoiceData = {
      invoice_code: this.config.get<string>('QPAY_INVOICE_CODE'),
      sender_invoice_no: `${user.systemId}-${Date.now()}`,
      invoice_receiver_code: user.systemId,
      invoice_description: `Anime Platform - ${character.name} (${character.anime.name})`,
      amount: character.price,
      callback_url: `${this.config.get<string>('FRONTEND_URL')}/api/payment/qpay/callback`,
    };

    let qpayResponse: any;
    try {
      const response = await axios.post(
        `${this.config.get<string>('QPAY_BASE_URL')}/invoice`,
        invoiceData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      qpayResponse = response.data;
    } catch (err: any) {
      this.logger.error('QPay invoice creation failed:', err.response?.data);
      throw new BadRequestException('QPay invoice үүсгэхэд алдаа гарлаа');
    }

    // Payment record хадгалах
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        characterId,
        amount: character.price,
        method: PaymentMethod.QPAY,
        status: PaymentStatus.PENDING,
        qpayInvoiceId: qpayResponse.invoice_id,
        qpayQrCode: qpayResponse.qr_image,
        qpayDeepLink: qpayResponse.qpay_deeplink?.[0]?.link,
      },
    });

    // Background-д status шалгах job
    await this.paymentQueue.add(
      'check_qpay_status',
      { paymentId: payment.id, invoiceId: qpayResponse.invoice_id },
      { delay: 10000, repeat: { every: 10000, limit: 36 } }, // 6 минутын турш
    );

    return {
      paymentId: payment.id,
      qrCode: qpayResponse.qr_image,
      deepLink: qpayResponse.qpay_deeplink?.[0]?.link,
      amount: character.price,
      invoiceId: qpayResponse.invoice_id,
    };
  }

  async handleQPayWebhook(invoiceId: string, status: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { qpayInvoiceId: invoiceId },
    });
    if (!payment) {
      this.logger.warn(`QPay webhook: payment not found for invoice ${invoiceId}`);
      return;
    }

    if (status === 'PAID' && payment.status === PaymentStatus.PENDING) {
      await this.completePayment(payment.id);
    }
  }

  async checkQPayStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== PaymentStatus.PENDING) return;

    const token = await this.getQpayToken();

    try {
      const response = await axios.get(
        `${this.config.get<string>('QPAY_BASE_URL')}/payment/check/${payment.qpayInvoiceId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data?.payment_status === 'PAID') {
        await this.completePayment(paymentId);
      }
    } catch (err: any) {
      this.logger.error(`QPay status check failed: ${err.message}`);
    }
  }

  // ─── Bank Transfer ────────────────────────────────────────────────

  async submitBankTransfer(userId: string, characterId: string, transferRef?: string) {
    const character = await this.prisma.animeCharacter.findUnique({
      where: { id: characterId },
      select: { id: true, name: true, price: true },
    });
    if (!character) throw new NotFoundException('Дүр олдсонгүй');
    if (character.price === 0) throw new BadRequestException('Энэ дүр үнэгүй байна');

    const existing = await this.prisma.userCharacter.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });
    if (existing) throw new BadRequestException('Та энэ дүрийг аль хэдийн эзэмшиж байна');

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        characterId,
        amount: character.price,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
        bankTransferRef: transferRef,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { systemId: true },
    });

    const bankConfig = await this.prisma.bankConfig.findFirst({ where: { isActive: true } });

    return {
      paymentId: payment.id,
      systemId: user?.systemId,
      bankName: bankConfig?.bankName ?? this.config.get<string>('BANK_NAME'),
      accountName: bankConfig?.accountName ?? this.config.get<string>('BANK_ACCOUNT_NAME'),
      accountNo: bankConfig?.accountNo ?? this.config.get<string>('BANK_ACCOUNT_NO'),
      amount: character.price,
      transferNote: `Гүйлгээний утга: ${user?.systemId} (заавал бичнэ)`,
    };
  }

  // ─── Admin Actions ────────────────────────────────────────────────

  async adminVerifyPayment(paymentId: string, adminId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Төлбөр олдсонгүй');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Зөвхөн PENDING төлвийн төлбөрийг баталгаажуулах боломжтой');
    }

    await this.completePayment(paymentId, adminId);
    return { success: true, message: 'Төлбөр баталгаажлаа. Дүр unlock хийгдлээ.' };
  }

  async adminRejectPayment(paymentId: string, adminId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Төлбөр олдсонгүй');

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        adminVerifiedBy: adminId,
        adminNotes: reason,
        failReason: reason,
      },
    });
  }

  async getPendingBankTransfers() {
    return this.prisma.payment.findMany({
      where: { method: PaymentMethod.BANK_TRANSFER, status: PaymentStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { username: true, systemId: true, email: true } },
      },
    });
  }

  async getUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private async completePayment(paymentId: string, adminId?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || !payment.characterId) return;

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          adminVerifiedBy: adminId,
          adminVerifiedAt: adminId ? new Date() : undefined,
        },
      }),
      this.prisma.userCharacter.upsert({
        where: {
          userId_characterId: { userId: payment.userId, characterId: payment.characterId },
        },
        update: {},
        create: {
          userId: payment.userId,
          characterId: payment.characterId,
        },
      }),
    ]);

    this.logger.log(
      `✅ Payment ${paymentId} completed. Character ${payment.characterId} unlocked for user ${payment.userId}`,
    );
  }

  private async getQpayToken(): Promise<string> {
    if (this.qpayToken && this.qpayTokenExpiry && this.qpayTokenExpiry > new Date()) {
      return this.qpayToken;
    }

    const response = await axios.post(
      `${this.config.get<string>('QPAY_BASE_URL')}/auth/token`,
      {},
      {
        auth: {
          username: this.config.get<string>('QPAY_USERNAME')!,
          password: this.config.get<string>('QPAY_PASSWORD')!,
        },
      },
    );

    this.qpayToken = response.data.access_token;
    this.qpayTokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);
    return this.qpayToken!;
  }
}
