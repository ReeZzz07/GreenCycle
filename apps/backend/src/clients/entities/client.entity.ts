import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';

export enum ClientType {
  INDIVIDUAL = 'individual',
  LEGAL_ENTITY = 'legal_entity',
  WHOLESALER = 'wholesaler',
}

@Entity({ name: 'clients' })
export class Client extends AuditableEntity {
  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Index('IDX_clients_phone')
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Index('IDX_clients_email')
  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ name: 'address_full', type: 'text', nullable: true })
  addressFull!: string | null;

  @Column({
    name: 'client_type',
    type: 'enum',
    enum: ClientType,
    default: ClientType.INDIVIDUAL,
  })
  clientType!: ClientType;

  @Column({
    name: 'first_purchase_date',
    type: 'timestamptz',
    nullable: true,
  })
  firstPurchaseDate!: Date | null;

  // Поля для юридического лица
  @Column({ name: 'legal_entity_name', type: 'varchar', length: 255, nullable: true })
  legalEntityName!: string | null;

  @Column({ type: 'varchar', length: 12, nullable: true })
  inn!: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  kpp!: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  ogrn!: string | null;

  // Банковские реквизиты
  @Column({ name: 'bank_name', type: 'varchar', length: 255, nullable: true })
  bankName!: string | null;

  @Column({ name: 'bank_account', type: 'varchar', length: 20, nullable: true })
  bankAccount!: string | null;

  @Column({ name: 'correspondent_account', type: 'varchar', length: 20, nullable: true })
  correspondentAccount!: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  bik!: string | null;
}
