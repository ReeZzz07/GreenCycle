import { BeforeInsert, BeforeUpdate, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RequestContextService } from '../services/request-context.service';

export abstract class AuditableEntity extends BaseEntity {
  @Column({ type: 'int', nullable: true, name: 'created_by_id' })
  createdById: number | null = null;

  @Column({ type: 'int', nullable: true, name: 'updated_by_id' })
  updatedById: number | null = null;

  protected setCreatorAndUpdater(): void {
    const currentUserId = RequestContextService.getCurrentUserId();
    if (currentUserId !== undefined && currentUserId !== null) {
      if (!this.createdById) {
        this.createdById = currentUserId;
      }
      this.updatedById = currentUserId;
    }
  }

  @BeforeInsert()
  auditBeforeInsert(): void {
    this.setCreatorAndUpdater();
  }

  @BeforeUpdate()
  auditBeforeUpdate(): void {
    this.setCreatorAndUpdater();
  }
}

