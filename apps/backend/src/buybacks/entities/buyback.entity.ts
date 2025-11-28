import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Client } from '../../clients/entities/client.entity';
import { BuybackItem } from './buyback-item.entity';

export enum BuybackStatus {
  PLANNED = 'planned',
  CONTACTED = 'contacted',
  DECLINED = 'declined',
  COMPLETED = 'completed',
}

@Entity({ name: 'buybacks' })
export class Buyback extends AuditableEntity {
  @ManyToOne(() => Sale, { eager: true })
  @JoinColumn({ name: 'original_sale_id' })
  originalSale!: Sale;

  @Column({ name: 'original_sale_id' })
  originalSaleId!: number;

  @ManyToOne(() => Client, { eager: true })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @Column({ name: 'client_id' })
  clientId!: number;

  @Index('IDX_buybacks_planned_date')
  @Column({ name: 'planned_date', type: 'date' })
  plannedDate!: string;

  @Column({ name: 'actual_date', type: 'date', nullable: true })
  actualDate!: string | null;

  @Column({
    type: 'enum',
    enum: BuybackStatus,
    default: BuybackStatus.PLANNED,
  })
  status!: BuybackStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => BuybackItem, (item) => item.buyback, {
    cascade: true,
    eager: true,
  })
  items!: BuybackItem[];
}
