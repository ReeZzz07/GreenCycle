import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
    const smtpSecure = this.configService.get<boolean>('SMTP_SECURE', false);

    if (!smtpHost || !smtpUser || !smtpPassword) {
      this.logger.warn(
        'SMTP настройки не заданы. Email-уведомления отключены.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    this.logger.log('SMTP транспортер инициализирован');
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('SMTP транспортер не инициализирован. Email не отправлен.');
      return;
    }

    const fromEmail =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@greencycle.ru';

    try {
      const info = await this.transporter.sendMail({
        from: `GreenCycle <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      });

      this.logger.log(`Email отправлен: ${info.messageId} -> ${options.to}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Ошибка отправки email: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async sendBuybackReminder(
    to: string,
    clientName: string,
    plannedDate: string,
    daysUntil: number,
  ): Promise<void> {
    const subject = `Напоминание о выкупе через ${daysUntil} ${this.getDaysWord(daysUntil)}`;
    const html = this.generateBuybackReminderTemplate(
      clientName,
      plannedDate,
      daysUntil,
    );

    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  private generateBuybackReminderTemplate(
    clientName: string,
    plannedDate: string,
    daysUntil: number,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2e7d32;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
          }
          .highlight {
            background-color: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GreenCycle</h1>
            <p>Напоминание о выкупе</p>
          </div>
          <div class="content">
            <p>Здравствуйте!</p>
            <p>Напоминаем, что до выкупа у клиента <strong>${clientName}</strong> осталось <strong>${daysUntil} ${this.getDaysWord(daysUntil)}</strong>.</p>
            <div class="highlight">
              <p><strong>Планируемая дата выкупа:</strong> ${plannedDate}</p>
            </div>
            <p>Пожалуйста, свяжитесь с клиентом для подтверждения выкупа.</p>
            <p>С уважением,<br>Команда GreenCycle</p>
          </div>
          <div class="footer">
            <p>Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDaysWord(days: number): string {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}
