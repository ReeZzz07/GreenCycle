import {
  IsInt,
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, LinkedEntityType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsInt()
  @Min(1)
  accountId!: number;

  @IsNumber()
  @Type(() => Number)
  amount!: number;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  linkedEntityId?: number;

  @IsOptional()
  @IsEnum(LinkedEntityType)
  linkedEntityType?: LinkedEntityType;
}
