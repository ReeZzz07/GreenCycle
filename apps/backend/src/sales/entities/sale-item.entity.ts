import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Sale } from './sale.entity';
import { Batch } from '../../shipments/entities/batch.entity';

@Entity({ name: 'sale_items' })
export class SaleItem extends BaseEntity {
  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @Column({ name: 'sale_id' })
  saleId!: number;

  @ManyToOne(() => Batch, { eager: true })
  @JoinColumn({ name: 'batch_id' })
  batch!: Batch;

  @Column({ name: 'batch_id' })
  batchId!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    name: 'sale_price_per_unit',
    type: 'numeric',
    precision: 14,
    scale: 2,
  })
  salePricePerUnit!: string;
}
