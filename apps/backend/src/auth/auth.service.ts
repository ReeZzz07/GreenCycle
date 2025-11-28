import {
  Injectable,
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../common/services/password.service';
import { LoginDto } from './dto/login.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { TokenPayload } from './interfaces/token-payload.interface';
import { AppConfig } from '../config/configuration';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>
  ) {}

  async validateUser(loginDto: LoginDto): Promise<User> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const passwordValid = await this.passwordService.compare(
      loginDto.password,
      user.passwordHash
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<TokenPairDto> {
    const user = await this.validateUser(loginDto);
    return this.issueTokens(user);
  }

  async refresh(userPayload: Pick<User, 'id'> | undefined): Promise<TokenPairDto> {
    if (!userPayload) {
      throw new BadRequestException('Пользователь не найден');
    }

    const user = await this.usersService.findById(userPayload.id);
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<TokenPairDto> {
    // Убеждаемся, что роль загружена
    if (!user.role) {
      // Если роль не загружена, загружаем пользователя с ролью
      const userWithRole = await this.usersService.findById(user.id);
      if (!userWithRole || !userWithRole.role) {
        throw new BadRequestException('Роль пользователя не найдена');
      }
      user = userWithRole;
    }

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('auth.accessTokenTtl', { infer: true })
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('auth.refreshTokenTtl', { infer: true })
    });

    return { accessToken, refreshToken };
  }
}

