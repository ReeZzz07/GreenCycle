import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfService } from './services/pdf.service';
import { EmailService } from './services/email.service';
import { BuybackRemindersTask } from './tasks/buyback-reminders.task';
import { Buyback } from '../buybacks/entities/buyback.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Buyback, User, Notification]),
  ],
  providers: [PdfService, EmailService, BuybackRemindersTask],
  exports: [PdfService, EmailService],
})
export class CommonModule {}
