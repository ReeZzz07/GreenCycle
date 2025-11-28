import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserNotificationSettings } from './entities/user-notification-settings.entity';
import { PasswordService } from '../common/services/password.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, UserNotificationSettings])],
  controllers: [UsersController],
  providers: [UsersService, PasswordService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}

