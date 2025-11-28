import { Request } from 'express';
import { JwtUser } from './jwt-user.interface';

export type AuthenticatedRequest<User = JwtUser> = Request & {
  user?: User;
};

