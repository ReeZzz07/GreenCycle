import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationSettingsDto {
  @ApiProperty({
    description: 'Включить/выключить email уведомления',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiProperty({
    description: 'Включить/выключить уведомления о выкупах',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  buybackRemindersEnabled?: boolean;

  @ApiProperty({
    description: 'Уведомления за 60 дней до выкупа',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  buybackReminder60Days?: boolean;

  @ApiProperty({
    description: 'Уведомления за 30 дней до выкупа',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  buybackReminder30Days?: boolean;

  @ApiProperty({
    description: 'Уведомления за 7 дней до выкупа',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  buybackReminder7Days?: boolean;

  @ApiProperty({
    description: 'Уведомления о новых продажах',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  salesNotificationsEnabled?: boolean;

  @ApiProperty({
    description: 'Уведомления о новых поставках',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  shipmentNotificationsEnabled?: boolean;

  @ApiProperty({
    description: 'Уведомления о финансовых операциях',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  financeNotificationsEnabled?: boolean;
}

