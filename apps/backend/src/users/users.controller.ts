import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@CurrentUser() user: JwtUser | undefined) {
    if (!user || typeof user.id !== 'number') {
      throw new NotFoundException('Пользователь не найден');
    }

    const userEntity = await this.usersService.findById(user.id);
    if (!userEntity) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      data: {
        id: userEntity.id,
        email: userEntity.email,
        fullName: userEntity.fullName,
        role: {
          id: userEntity.role.id,
          name: userEntity.role.name,
        },
      },
    };
  }

  @Roles('admin', 'super_admin')
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return { data: users };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant', 'logistic')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }
    return { data: user };
  }

  @Roles('admin', 'super_admin')
  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtUser) {
    const newUser = await this.usersService.create(dto, user.id);
    return { data: newUser };
  }

  @Patch('me')
  async updateCurrentUser(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateUserDto,
  ) {
    if (!user || typeof user.id !== 'number') {
      throw new NotFoundException('Пользователь не найден');
    }

    // Нельзя изменить роль через этот endpoint
    if (dto.roleName !== undefined) {
      throw new BadRequestException('Нельзя изменить роль через профиль');
    }

    const updatedUser = await this.usersService.update(user.id, dto, user.id);
    return { data: updatedUser };
  }

  @Roles('admin', 'super_admin')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtUser,
  ) {
    // Нельзя изменять самого себя
    if (id === user.id && dto.roleName !== undefined) {
      throw new BadRequestException('Нельзя изменить свою собственную роль');
    }
    const updatedUser = await this.usersService.update(id, dto, user.id);
    return { data: updatedUser };
  }

  @Roles('admin', 'super_admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    // Нельзя удалить самого себя
    if (id === user.id) {
      throw new BadRequestException('Нельзя удалить самого себя');
    }
    await this.usersService.remove(id);
    return { message: 'Пользователь успешно удален' };
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Body() dto: ChangePasswordDto,
  ) {
    if (!user || typeof user.id !== 'number') {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.usersService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );

    return { message: 'Пароль успешно изменен' };
  }

  @Get('me/notification-settings')
  async getNotificationSettings(@CurrentUser() user: JwtUser) {
    if (!user || typeof user.id !== 'number') {
      throw new NotFoundException('Пользователь не найден');
    }

    const settings = await this.usersService.getNotificationSettings(user.id);
    return { data: settings };
  }

  @Patch('me/notification-settings')
  async updateNotificationSettings(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    if (!user || typeof user.id !== 'number') {
      throw new NotFoundException('Пользователь не найден');
    }

    const settings = await this.usersService.updateNotificationSettings(user.id, dto);
    return { data: settings };
  }
}