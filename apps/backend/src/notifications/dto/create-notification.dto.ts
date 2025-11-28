import {
  IsInt,
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  @Min(1)
  userId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  clientId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  buybackId?: number;

  @IsString()
  message!: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
