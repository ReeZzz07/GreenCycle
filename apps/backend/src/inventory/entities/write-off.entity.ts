import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Batch } from '../../shipments/entities/batch.entity';

@Entity({ name: 'write_offs' })
export class WriteOff extends AuditableEntity {
  @ManyToOne(() => Batch, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'batch_id' })
  batch!: Batch;

  @Column({ name: 'batch_id' })
  batchId!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'varchar', length: 120 })
  reason!: string;

  @Column({ name: 'write_off_date', type: 'date' })
  writeOffDate!: string;

  @Column({ name: 'total_cost', type: 'numeric', precision: 14, scale: 2 })
  totalCost!: string;

  @Column({ name: 'comment', type: 'varchar', length: 255, nullable: true })
  comment!: string | null;
}


