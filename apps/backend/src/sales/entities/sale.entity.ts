import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Client } from '../../clients/entities/client.entity';
import { SaleItem } from './sale-item.entity';

export enum SaleStatus {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'sales' })
export class Sale extends AuditableEntity {
  @ManyToOne(() => Client, { eager: true })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @Column({ name: 'client_id' })
  clientId!: number;

  @Index('IDX_sales_date')
  @Column({ name: 'sale_date', type: 'date' })
  saleDate!: string;

  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
  })
  totalAmount!: string;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.COMPLETED,
  })
  status!: SaleStatus;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true, eager: true })
  items!: SaleItem[];
}
