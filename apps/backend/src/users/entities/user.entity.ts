import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne
} from 'typeorm';
import { AuditableEntity } from '../../common/entities/auditable.entity';
import { Role } from './role.entity';
import { UserNotificationSettings } from './user-notification-settings.entity';

@Entity({ name: 'users' })
export class User extends AuditableEntity {
  @Index('UQ_users_email', { unique: true })
  @Column({ type: 'citext' })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ name: 'role_id' })
  roleId!: number;

  @OneToOne(() => UserNotificationSettings, (settings) => settings.user, {
    cascade: true,
    eager: false,
  })
  notificationSettings?: UserNotificationSettings;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail(): void {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
    this.setCreatorAndUpdater();
  }
}

