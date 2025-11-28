import { PartialType } from '@nestjs/mapped-types';
import { CreateBuybackDto } from './create-buyback.dto';
import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { BuybackStatus } from '../entities/buyback.entity';

export class UpdateBuybackDto extends PartialType(CreateBuybackDto) {
  @IsOptional()
  @IsDateString()
  actualDate?: string;

  @IsOptional()
  @IsEnum(BuybackStatus)
  status?: BuybackStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
