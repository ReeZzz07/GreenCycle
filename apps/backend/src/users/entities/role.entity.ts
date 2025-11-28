import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { User } from './user.entity';

export const ROLE_NAMES = [
  'super_admin',
  'admin',
  'manager',
  'accountant',
  'logistic'
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

@Entity({ name: 'roles' })
@Unique('UQ_roles_name', ['name'])
export class Role extends AuditableEntity {
  @Column({ type: 'varchar', length: 50 })
  name!: RoleName;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}

