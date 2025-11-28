import { IsInt, IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShipmentInvestmentDto {
  @IsInt()
  @Min(1)
  userId!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  amount!: number; // Сумма вложения
}

