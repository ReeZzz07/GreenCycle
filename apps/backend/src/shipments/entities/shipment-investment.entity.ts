import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Shipment } from './shipment.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'shipment_investments' })
export class ShipmentInvestment extends AuditableEntity {
  @ManyToOne(() => Shipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment;

  @Index('IDX_shipment_investments_shipment')
  @Column({ name: 'shipment_id' })
  shipmentId!: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index('IDX_shipment_investments_user')
  @Column({ name: 'user_id' })
  userId!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
  })
  amount!: string; // Сумма вложения

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
  })
  percentage!: string; // Процент доли от общей стоимости поставки
}

