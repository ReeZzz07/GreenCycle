import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Transaction } from './transaction.entity';

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
  OTHER = 'other',
}

@Entity({ name: 'accounts' })
export class Account extends BaseEntity {
  @Index('UQ_accounts_name', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type!: AccountType;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: '0.00',
  })
  balance!: string;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions!: Transaction[];
}
