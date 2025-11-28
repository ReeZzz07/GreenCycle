import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';

@Entity({ name: 'user_notification_settings' })
export class UserNotificationSettings extends BaseEntity {
  @OneToOne(() => User, (user) => user.notificationSettings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', unique: true })
  userId!: number;

  // Email уведомления
  @Column({ name: 'email_enabled', type: 'boolean', default: true })
  emailEnabled!: boolean;

  // Уведомления о выкупах
  @Column({ name: 'buyback_reminders_enabled', type: 'boolean', default: true })
  buybackRemindersEnabled!: boolean;

  // Уведомления за 60 дней до выкупа
  @Column({ name: 'buyback_reminder_60_days', type: 'boolean', default: true })
  buybackReminder60Days!: boolean;

  // Уведомления за 30 дней до выкупа
  @Column({ name: 'buyback_reminder_30_days', type: 'boolean', default: true })
  buybackReminder30Days!: boolean;

  // Уведомления за 7 дней до выкупа
  @Column({ name: 'buyback_reminder_7_days', type: 'boolean', default: true })
  buybackReminder7Days!: boolean;

  // Уведомления о новых продажах
  @Column({ name: 'sales_notifications_enabled', type: 'boolean', default: true })
  salesNotificationsEnabled!: boolean;

  // Уведомления о новых поставках
  @Column({ name: 'shipment_notifications_enabled', type: 'boolean', default: true })
  shipmentNotificationsEnabled!: boolean;

  // Уведомления о финансовых операциях
  @Column({ name: 'finance_notifications_enabled', type: 'boolean', default: true })
  financeNotificationsEnabled!: boolean;
}

