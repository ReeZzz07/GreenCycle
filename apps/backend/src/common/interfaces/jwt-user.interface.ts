import { RoleName } from '../../users/entities/role.entity';

export interface JwtUser {
  id: number;
  email: string;
  role: {
    name: RoleName;
  };
}

