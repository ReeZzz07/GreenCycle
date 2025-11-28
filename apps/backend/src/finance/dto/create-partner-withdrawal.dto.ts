import {
  IsInt,
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  Min,
  IsPositive,
  ValidateIf,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartnerWithdrawalType } from '../entities/partner-withdrawal.entity';

export class CreatePartnerWithdrawalDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @IsEnum(PartnerWithdrawalType)
  type!: PartnerWithdrawalType;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  amountOrQuantity!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  costValue?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @ValidateIf((o) => o.type === PartnerWithdrawalType.CASH)
  @IsInt()
  @Min(1)
  accountId?: number;

  @IsOptional()
  @IsDateString()
  withdrawalDate?: string;

  @ValidateIf((o) => o.type === PartnerWithdrawalType.GOODS)
  @IsInt()
  @Min(1)
  shipmentId?: number;
}
