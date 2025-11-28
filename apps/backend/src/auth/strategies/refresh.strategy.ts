import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AppConfig } from '../../config/configuration';
import { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService<AppConfig>) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwtSecret', { infer: true }),
      passReqToCallback: true
    });
  }

  validate(req: Request, payload: TokenPayload) {
    const refreshToken = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token отсутствует');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: { name: payload.role }
    };
  }
}

