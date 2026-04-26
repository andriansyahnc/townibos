import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('smtp.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('smtp.port'),
        auth: {
          user: this.config.get<string>('smtp.user'),
          pass: this.config.get<string>('smtp.pass'),
        },
      });
    }
  }

  async sendMagicLink(to: string, link: string, name: string): Promise<void> {
    const subject = 'Link Masuk Townibos';
    const html = `
      <p>Halo ${name},</p>
      <p>Klik link di bawah ini untuk masuk ke portal penghuni Townibos. Link berlaku selama 15 menit.</p>
      <p><a href="${link}" style="background:#465fff;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:500;">Masuk Sekarang</a></p>
      <p>Jika Anda tidak meminta link ini, abaikan email ini.</p>
    `;

    if (!this.transporter) {
      this.logger.log(`[DEV] Magic link for ${to}: ${link}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.config.get<string>('smtp.from'),
      to,
      subject,
      html,
    });
  }
}
