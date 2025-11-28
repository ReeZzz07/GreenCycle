import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { User } from '../../users/entities/user.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { Account } from './account.entity';

export enum PartnerWithdrawalType {
  CASH = 'cash',
  GOODS = 'goods',
}

@Entity({ name: 'partner_withdrawals' })
export class PartnerWithdrawal extends AuditableEntity {
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index('IDX_partner_withdrawals_user_date')
  @Column({ name: 'user_id' })
  userId!: number;

  @Column({
    type: 'enum',
    enum: PartnerWithdrawalType,
  })
  type!: PartnerWithdrawalType;

  @Column({
    name: 'amount_or_quantity',
    type: 'numeric',
    precision: 14,
    scale: 2,
  })
  amountOrQuantity!: string;

  @Column({
    name: 'cost_value',
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  costValue!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'date', nullable: true, name: 'withdrawal_date' })
  withdrawalDate!: Date | null;

  @ManyToOne(() => Shipment, { nullable: true, eager: true })
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment | null;

  @Column({ name: 'shipment_id', nullable: true })
  shipmentId!: number | null;

  @ManyToOne(() => Account, { nullable: true, eager: true })
  @JoinColumn({ name: 'account_id' })
  account!: Account | null;

  @Column({ name: 'account_id', nullable: true })
  accountId!: number | null;
}
