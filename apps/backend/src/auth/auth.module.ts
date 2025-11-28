import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PasswordService } from '../common/services/password.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';
import { AuthController } from './auth.controller';
import { AppConfig } from '../config/configuration';
import { RefreshJwtGuard } from '../common/guards/refresh-jwt.guard';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        secret: configService.get('auth.jwtSecret', { infer: true })
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtStrategy, RefreshJwtStrategy, RefreshJwtGuard],
  exports: [AuthService]
})
export class AuthModule {}

