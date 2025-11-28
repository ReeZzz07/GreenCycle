import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Buyback } from '../buybacks/entities/buyback.entity';
import { UserNotificationSettings } from '../users/entities/user-notification-settings.entity';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Buyback)
    private readonly buybackRepository: Repository<Buyback>,
    @InjectRepository(UserNotificationSettings)
    private readonly notificationSettingsRepository: Repository<UserNotificationSettings>,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь #${dto.userId} не найден`);
    }

    let client: Client | null = null;
    if (dto.clientId) {
      client = await this.clientRepository.findOne({
        where: { id: dto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Клиент #${dto.clientId} не найден`);
      }
    }

    let buyback: Buyback | null = null;
    if (dto.buybackId) {
      buyback = await this.buybackRepository.findOne({
        where: { id: dto.buybackId },
      });

      if (!buyback) {
        throw new NotFoundException(`Выкуп #${dto.buybackId} не найден`);
      }
    }

    const notification = this.notificationRepository.create({
      userId: user.id,
      user,
      clientId: dto.clientId ?? null,
      client: client ?? null,
      buybackId: dto.buybackId ?? null,
      buyback: buyback ?? null,
      message: dto.message.trim(),
      isRead: dto.isRead ?? false,
      dueDate: dto.dueDate ?? null,
    });

    return await this.notificationRepository.save(notification);
  }

  async findAll(
    userId?: number,
    isRead?: boolean,
  ): Promise<Notification[]> {
    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    return await this.notificationRepository.find({
      where,
      relations: ['user', 'client', 'buyback'],
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user', 'client', 'buyback'],
    });

    if (!notification) {
      throw new NotFoundException(`Уведомление #${id} не найдено`);
    }

    return notification;
  }

  async update(id: number, dto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);

    if (dto.message !== undefined) {
      notification.message = dto.message.trim();
    }

    if (dto.isRead !== undefined) {
      notification.isRead = dto.isRead;
    }

    if (dto.dueDate !== undefined) {
      notification.dueDate = dto.dueDate ?? null;
    }

    return await this.notificationRepository.save(notification);
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async remove(id: number): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
  }

  async createBuybackReminders(buyback: Buyback): Promise<void> {
    // Убеждаемся, что клиент загружен
    if (!buyback.client) {
      const buybackWithClient = await this.buybackRepository.findOne({
        where: { id: buyback.id },
        relations: ['client'],
      });

      if (!buybackWithClient || !buybackWithClient.client) {
        console.error(`Клиент не найден для выкупа #${buyback.id}`);
        return;
      }

      buyback.client = buybackWithClient.client;
    }

    const plannedDate = new Date(buyback.plannedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysUntilBuyback = Math.ceil(
      (plannedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilBuyback < 0) {
      return;
    }

    // Получаем всех админов и менеджеров для создания уведомлений
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
      return;
    }

    const reminders = [
      {
        days: 60,
        message: `Выкуп у клиента "${buyback.client.fullName}" через 60 дней (${buyback.plannedDate})`,
      },
      {
        days: 30,
        message: `Выкуп у клиента "${buyback.client.fullName}" через 30 дней (${buyback.plannedDate})`,
      },
      {
        days: 7,
        message: `Выкуп у клиента "${buyback.client.fullName}" через 7 дней (${buyback.plannedDate})`,
      },
    ];

    for (const reminder of reminders) {
      if (daysUntilBuyback <= reminder.days) {
        const reminderDate = new Date(plannedDate);
        reminderDate.setDate(reminderDate.getDate() - reminder.days);

        if (reminderDate >= today) {
          const reminderDateStr = reminderDate.toISOString().split('T')[0];

          for (const user of usersToNotify) {
            const existingNotification =
              await this.notificationRepository.findOne({
                where: {
                  userId: user.id,
                  buybackId: buyback.id,
                  dueDate: reminderDateStr,
                },
              });

            if (!existingNotification) {
              const notification = await this.create({
                userId: user.id,
                clientId: buyback.clientId,
                buybackId: buyback.id,
                message: reminder.message,
                isRead: false,
                dueDate: reminderDateStr,
              });

              // Отправляем email-уведомление, если у пользователя есть email и настройки разрешают
              if (user.email) {
                try {
                  // Проверяем настройки уведомлений пользователя
                  const settings = await this.notificationSettingsRepository.findOne({
                    where: { userId: user.id },
                  });

                  // Проверяем, включены ли email уведомления и уведомления о выкупах
                  if (
                    settings &&
                    settings.emailEnabled &&
                    settings.buybackRemindersEnabled
                  ) {
                    // Проверяем конкретное напоминание (60, 30 или 7 дней)
                    const isReminderEnabled =
                      (reminder.days === 60 && settings.buybackReminder60Days) ||
                      (reminder.days === 30 && settings.buybackReminder30Days) ||
                      (reminder.days === 7 && settings.buybackReminder7Days);

                    if (isReminderEnabled) {
                      await this.emailService.sendBuybackReminder(
                        user.email,
                        buyback.client.fullName,
                        buyback.plannedDate,
                        reminder.days,
                      );
                    }
                  } else if (!settings) {
                    // Если настройки не существуют, используем дефолтные значения (включено)
                    await this.emailService.sendBuybackReminder(
                      user.email,
                      buyback.client.fullName,
                      buyback.plannedDate,
                      reminder.days,
                    );
                  }
                } catch (error) {
                  // Логируем ошибку, но не прерываем создание уведомления
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  console.error(
                    `Ошибка отправки email пользователю ${user.email}:`,
                    errorMessage,
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  async getUpcomingNotifications(
    userId: number,
    days: number = 30,
  ): Promise<Notification[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    return await this.notificationRepository.find({
      where: {
        userId,
        dueDate: Between(todayStr, futureDateStr),
      },
      relations: ['user', 'client', 'buyback'],
      order: { dueDate: 'ASC', id: 'DESC' },
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}
