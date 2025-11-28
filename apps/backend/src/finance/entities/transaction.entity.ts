import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Account } from './account.entity';

export enum TransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  BUYBACK = 'buyback',
  WRITE_OFF = 'write_off',
  PARTNER_WITHDRAWAL = 'partner_withdrawal',
}

export enum LinkedEntityType {
  SHIPMENT = 'shipment',
  SALE = 'sale',
  BUYBACK = 'buyback',
  WRITE_OFF = 'write_off',
  PARTNER_WITHDRAWAL = 'partner_withdrawal',
}

@Entity({ name: 'transactions' })
export class Transaction extends AuditableEntity {
  @ManyToOne(() => Account, { eager: true })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column({ name: 'account_id' })
  accountId!: number;

  @Index('IDX_transactions_account_date')
  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
  })
  amount!: string;

  @Index('IDX_transactions_type')
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type!: TransactionType;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'linked_entity_id', type: 'int', nullable: true })
  linkedEntityId!: number | null;

  @Index('IDX_transactions_linked_entity')
  @Column({
    name: 'linked_entity_type',
    type: 'enum',
    enum: LinkedEntityType,
    nullable: true,
  })
  linkedEntityType!: LinkedEntityType | null;

  @Index('IDX_transactions_is_cancelled')
  @Column({ name: 'is_cancelled', type: 'boolean', default: false })
  isCancelled!: boolean;
}
