import {
  AfterLoad,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Batch } from './batch.entity';
import { ShipmentInvestment } from './shipment-investment.entity';
import { ShipmentDocument } from '../dto/create-shipment.dto';

@Entity({ name: 'shipments' })
export class Shipment extends AuditableEntity {
  @ManyToOne(() => Supplier, (supplier) => supplier.shipments, { eager: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ name: 'supplier_id' })
  supplierId!: number;

  @Column({ name: 'arrival_date', type: 'date' })
  arrivalDate!: string;

  @Column({ name: 'total_cost', type: 'numeric', precision: 14, scale: 2 })
  totalCost!: string;

  @Column({ name: 'document_url', type: 'text', nullable: true })
  documentUrl!: string | null;

  documents: ShipmentDocument[] = [];

  @OneToMany(() => Batch, (batch) => batch.shipment, { cascade: true })
  batches!: Batch[];

  @OneToMany(() => ShipmentInvestment, (investment) => investment.shipment, { cascade: true })
  investments!: ShipmentInvestment[];

  @AfterLoad()
  hydrateDocuments() {
    if (!this.documentUrl) {
      this.documents = [];
      return;
    }
    try {
      const parsed = JSON.parse(this.documentUrl);
      if (Array.isArray(parsed)) {
        this.documents = parsed
          .map((doc: any) => {
          if (typeof doc === 'string') {
              return { url: doc };
          }
          return {
            url: doc?.url,
            name: doc?.name,
            };
          })
          .filter((doc: ShipmentDocument) => !!doc.url)
          .map((doc) => ({ ...doc, persisted: true }));
        return;
      }
      if (typeof parsed === 'string') {
        this.documents = [{ url: parsed, persisted: true }];
        return;
      }
    } catch {
      // documentUrl хранит одиночную ссылку
    }
    this.documents = [{ url: this.documentUrl, persisted: true }];
  }
}

