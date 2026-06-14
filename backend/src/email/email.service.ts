import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
      this.logger.log(`📧 Email service initialized (${host})`);
    } else {
      this.logger.warn('📧 SMTP тохиргоо байхгүй — email console-д хэвлэгдэнэ');
    }
  }

  async sendPasswordReset(to: string, username: string, code: string): Promise<void> {
    const subject = '🔑 Нууц үг шинэчлэх код — Kurenai';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#fff;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#dc2626,#7c3aed);padding:24px;text-align:center">
          <h1 style="margin:0;font-size:24px;letter-spacing:2px">KURENAI 紅</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#f87171;margin-top:0">Нууц үг шинэчлэх</h2>
          <p>Сайн байна уу, <strong>${username}</strong>!</p>
          <p>Нууц үг шинэчлэх хүсэлт ирлээ. Доорх кодыг ашиглана уу:</p>
          <div style="background:#1a1a2e;border:1px solid #dc2626;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#f87171">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:14px">Энэ код 15 минут хүчинтэй. Хэрэв та хүсэлт гаргаагүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
        </div>
      </div>`;
    await this.send(to, subject, html);
  }

  async sendEmailVerification(to: string, username: string, code: string): Promise<void> {
    const subject = '✅ Имэйл баталгаажуулах — Kurenai';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#fff;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#dc2626,#7c3aed);padding:24px;text-align:center">
          <h1 style="margin:0;font-size:24px;letter-spacing:2px">KURENAI 紅</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#10b981;margin-top:0">Имэйл баталгаажуулах</h2>
          <p>Сайн байна уу, <strong>${username}</strong>!</p>
          <p>Имэйл хаягаа баталгаажуулахын тулд доорх кодыг оруулна уу:</p>
          <div style="background:#1a1a2e;border:1px solid #10b981;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#10b981">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:14px">Энэ код 15 минут хүчинтэй.</p>
        </div>
      </div>`;
    await this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }
    try {
      const from = this.config.get<string>('SMTP_FROM', '"Kurenai 紅" <noreply@kurenai.mn>');
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`📧 Sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`📧 Send failed to ${to}: ${err}`);
    }
  }
}
