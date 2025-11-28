import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Roles('admin', 'super_admin', 'manager')
  @Post()
  async create(@Body() dto: CreateNotificationDto) {
    const notification = await this.notificationsService.create(dto);
    return { data: notification };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get()
  async findAll(
    @Query('userId') userId?: number,
    @Query('isRead') isRead?: string,
  ) {
    const notifications = await this.notificationsService.findAll(
      userId ? Number(userId) : undefined,
      isRead === 'true' ? true : isRead === 'false' ? false : undefined,
    );
    return { data: notifications };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get('my')
  async getMyNotifications(
    @CurrentUser() user: JwtUser,
    @Query('isRead') isRead?: string,
  ) {
    const notifications = await this.notificationsService.findAll(
      user.id,
      isRead === 'true' ? true : isRead === 'false' ? false : undefined,
    );
    return { data: notifications };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get('upcoming')
  async getUpcomingNotifications(
    @CurrentUser() user: JwtUser,
    @Query('days') days?: number,
  ) {
    const notifications = await this.notificationsService.getUpcomingNotifications(
      user.id,
      days ? Number(days) : 30,
    );
    return { data: notifications };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: JwtUser) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { data: { count } };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const notification = await this.notificationsService.findOne(id);
    return { data: notification };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNotificationDto,
  ) {
    const notification = await this.notificationsService.update(id, dto);
    return { data: notification };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    const notification = await this.notificationsService.markAsRead(id);
    return { data: notification };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: JwtUser) {
    await this.notificationsService.markAllAsRead(user.id);
    return { data: true };
  }

  @Roles('admin', 'super_admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.notificationsService.remove(id);
    return { data: true };
  }
}
