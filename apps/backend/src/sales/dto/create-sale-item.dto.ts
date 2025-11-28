import { IsInt, IsNumber, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsInt()
  @Min(1)
  batchId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  salePricePerUnit!: number;
}
