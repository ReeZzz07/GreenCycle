import { IsInt, IsNumber, IsString, IsOptional, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBuybackItemDto {
  @IsInt()
  @Min(1)
  originalSaleItemId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  buybackPricePerUnit!: number;

  @IsOptional()
  @IsString()
  conditionNotes?: string;
}
