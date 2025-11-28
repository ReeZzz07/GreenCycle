import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { RequestContextService } from '../services/request-context.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtUser } from '../interfaces/jwt-user.interface';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = JwtUser>(
    err: unknown,
    user: JwtUser | null,
    info: unknown,
    context: ExecutionContext
  ): TUser {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (user?.id && Number.isInteger(user.id)) {
      RequestContextService.setCurrentUserId(user.id);
      if (request) {
        request.user = user;
      }
    } else {
      RequestContextService.setCurrentUserId(null);
      if (request) {
        request.user = undefined;
      }
    }

    const result: TUser = super.handleRequest(err, user, info, context);
    return result;
  }
}

