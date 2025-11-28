import {
  IsInt,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  IsPositive,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOtherExpenseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  accountId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}

