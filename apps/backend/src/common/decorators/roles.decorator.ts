import { SetMetadata } from '@nestjs/common';
import { RoleName } from '../../users/entities/role.entity';
import { ROLE_METADATA_KEY } from '../metadata/role.metadata';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLE_METADATA_KEY, roles);

