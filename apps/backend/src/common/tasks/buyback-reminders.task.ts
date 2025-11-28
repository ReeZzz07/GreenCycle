import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyback, BuybackStatus } from '../../buybacks/entities/buyback.entity';
import { User } from '../../users/entities/user.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { EmailService } from '../services/email.service';

@Injectable()
export class BuybackRemindersTask {
  private readonly logger = new Logger(BuybackRemindersTask.name);

  constructor(
    @InjectRepository(Buyback)
    private readonly buybackRepository: Repository<Buyback>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleBuybackReminders(): Promise<void> {
    this.logger.log('Запуск задачи отправки напоминаний о выкупе');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Находим выкупы, которые должны быть уведомлены сегодня (60, 30, 7 дней до plannedDate)
    const reminderDays = [60, 30, 7];
    const buybacksToNotify: Array<{ buyback: Buyback; daysUntil: number }> =
      [];

    for (const days of reminderDays) {
      const reminderDate = new Date(today);
      reminderDate.setDate(reminderDate.getDate() + days);
      const reminderDateStr = reminderDate.toISOString().split('T')[0];

      const buybacks = await this.buybackRepository.find({
        where: {
          plannedDate: reminderDateStr,
          status: BuybackStatus.PLANNED,
        },
        relations: ['client'],
      });

      for (const buyback of buybacks) {
        buybacksToNotify.push({ buyback, daysUntil: days });
      }
    }

    if (buybacksToNotify.length === 0) {
      this.logger.log('Нет выкупов для уведомления');
      return;
    }

    // Получаем всех админов и менеджеров
    const adminUsers = await this.userRepository.find({
      where: {},
      relations: ['role'],
    });

    const usersToNotify = adminUsers.filter(
      (user) =>
        user.role.name === 'admin' ||
        user.role.name === 'super_admin' ||
        user.role.name === 'manager',
    );

    if (usersToNotify.length === 0) {
      this.logger.warn('Нет пользователей для уведомления');
      return;
    }

    // Создаём уведомления и отправляем email
    for (const { buyback, daysUntil } of buybacksToNotify) {
      for (const user of usersToNotify) {
        const todayStr = today.toISOString().split('T')[0];

        // Проверяем, не создано ли уже уведомление
        const existingNotification =
          await this.notificationRepository.findOne({
            where: {
              userId: user.id,
              buybackId: buyback.id,
              dueDate: todayStr,
            },
          });

        if (!existingNotification) {
          // Создаём in-app уведомление
          const notification = this.notificationRepository.create({
            userId: user.id,
            clientId: buyback.clientId,
            buybackId: buyback.id,
            message: `Выкуп у клиента "${buyback.client.fullName}" через ${daysUntil} ${this.getDaysWord(daysUntil)} (${buyback.plannedDate})`,
            isRead: false,
            dueDate: todayStr,
          });

          await this.notificationRepository.save(notification);

          // Отправляем email, если у пользователя есть email
          if (user.email) {
            try {
              await this.emailService.sendBuybackReminder(
                user.email,
                buyback.client.fullName,
                buyback.plannedDate,
                daysUntil,
              );
              this.logger.log(
                `Email отправлен пользователю ${user.email} о выкупе #${buyback.id}`,
              );
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              this.logger.error(
                `Ошибка отправки email пользователю ${user.email}: ${errorMessage}`,
              );
            }
          }
        }
      }
    }

    this.logger.log(
      `Обработано ${buybacksToNotify.length} выкупов для уведомления`,
    );
  }

  private getDaysWord(days: number): string {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  }
}
