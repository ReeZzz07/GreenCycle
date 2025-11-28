import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_METADATA_KEY } from '../metadata/role.metadata';
import { RoleName } from '../../users/entities/role.entity';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { JwtUser } from '../interfaces/jwt-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLE_METADATA_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest<JwtUser | undefined>>();
    const user = request.user;

    if (!user || !user.role?.name) {
      throw new ForbiddenException('Недостаточно прав');
    }

    if (!requiredRoles.includes(user.role.name)) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return true;
  }
}

