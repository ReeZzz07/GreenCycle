import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { Buyback } from '../../buybacks/entities/buyback.entity';

@Entity({ name: 'notifications' })
export class Notification extends BaseEntity {
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index('IDX_notifications_user_read')
  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => Client, { nullable: true, eager: true })
  @JoinColumn({ name: 'client_id' })
  client!: Client | null;

  @Column({ name: 'client_id', nullable: true })
  clientId!: number | null;

  @ManyToOne(() => Buyback, { nullable: true, eager: true })
  @JoinColumn({ name: 'buyback_id' })
  buyback!: Buyback | null;

  @Index('IDX_notifications_buyback')
  @Column({ name: 'buyback_id', nullable: true })
  buybackId!: number | null;

  @Column({ type: 'text' })
  message!: string;

  @Index('IDX_notifications_read')
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Index('IDX_notifications_due_date')
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;
}
