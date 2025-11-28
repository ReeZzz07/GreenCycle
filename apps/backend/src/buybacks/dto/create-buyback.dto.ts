import {
  IsInt,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsString,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBuybackItemDto } from './create-buyback-item.dto';
import { BuybackStatus } from '../entities/buyback.entity';

export class CreateBuybackDto {
  @IsInt()
  @Min(1)
  originalSaleId!: number;

  @IsInt()
  @Min(1)
  clientId!: number;

  @IsDateString()
  plannedDate!: string;

  @IsOptional()
  @IsDateString()
  actualDate?: string;

  @IsOptional()
  @IsEnum(BuybackStatus)
  status?: BuybackStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBuybackItemDto)
  items!: CreateBuybackItemDto[];
}
