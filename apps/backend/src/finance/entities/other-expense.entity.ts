import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Account } from './account.entity';

@Entity({ name: 'other_expenses' })
export class OtherExpense extends AuditableEntity {
  @ManyToOne(() => Account, { eager: true })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Index('IDX_other_expenses_account_date')
  @Column({ name: 'account_id' })
  accountId!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
  })
  amount!: string;

  @Column({ type: 'varchar', length: 255 })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'date', nullable: true, name: 'expense_date' })
  expenseDate!: Date | null;
}

