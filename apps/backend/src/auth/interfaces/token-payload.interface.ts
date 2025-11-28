import { RoleName } from '../../users/entities/role.entity';

export interface TokenPayload {
  sub: number;
  email: string;
  role: RoleName;
}

