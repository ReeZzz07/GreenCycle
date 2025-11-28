import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';

@Entity({ name: 'suppliers' })
@Unique('UQ_suppliers_name', ['name'])
export class Supplier extends AuditableEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'contact_info', type: 'varchar', length: 255, nullable: true })
  contactInfo!: string | null;

  @Column({ name: 'contact_person', type: 'varchar', length: 150, nullable: true })
  contactPerson!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'legal_entity_name', type: 'varchar', length: 255, nullable: true })
  legalEntityName!: string | null;

  @Column({ type: 'varchar', length: 12, nullable: true })
  inn!: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  kpp!: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  ogrn!: string | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 255, nullable: true })
  bankName!: string | null;

  @Column({ name: 'bank_account', type: 'varchar', length: 20, nullable: true })
  bankAccount!: string | null;

  @Column({ name: 'correspondent_account', type: 'varchar', length: 20, nullable: true })
  correspondentAccount!: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  bik!: string | null;

  @OneToMany(() => Shipment, (shipment) => shipment.supplier)
  shipments!: Shipment[];
}

