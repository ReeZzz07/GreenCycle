import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Buyback } from './buyback.entity';
import { SaleItem } from '../../sales/entities/sale-item.entity';

@Entity({ name: 'buyback_items' })
export class BuybackItem extends BaseEntity {
  @ManyToOne(() => Buyback, (buyback) => buyback.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'buyback_id' })
  buyback!: Buyback;

  @Column({ name: 'buyback_id' })
  buybackId!: number;

  @ManyToOne(() => SaleItem, { eager: true })
  @JoinColumn({ name: 'original_sale_item_id' })
  originalSaleItem!: SaleItem;

  @Column({ name: 'original_sale_item_id' })
  originalSaleItemId!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    name: 'buyback_price_per_unit',
    type: 'numeric',
    precision: 14,
    scale: 2,
  })
  buybackPricePerUnit!: string;

  @Column({ name: 'condition_notes', type: 'text', nullable: true })
  conditionNotes!: string | null;
}
