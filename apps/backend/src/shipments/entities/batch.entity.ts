import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Shipment } from './shipment.entity';

@Entity({ name: 'batches' })
export class Batch extends AuditableEntity {
  @ManyToOne(() => Shipment, (shipment) => shipment.batches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment;

  @Column({ name: 'shipment_id' })
  shipmentId!: number;

  @Column({ name: 'plant_type', type: 'varchar', length: 150 })
  plantType!: string;

  @Column({ name: 'size_cm_min', type: 'int' })
  sizeCmMin!: number;

  @Column({ name: 'size_cm_max', type: 'int' })
  sizeCmMax!: number;

  @Column({ name: 'pot_type', type: 'varchar', length: 50 })
  potType!: string;

  @Column({ name: 'quantity_initial', type: 'int' })
  quantityInitial!: number;

  @Column({ name: 'quantity_current', type: 'int' })
  quantityCurrent!: number;

  @Column({ name: 'purchase_price_per_unit', type: 'numeric', precision: 12, scale: 2 })
  purchasePricePerUnit!: string;
}

