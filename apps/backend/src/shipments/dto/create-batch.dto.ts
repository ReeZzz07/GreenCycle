import {
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  plantType!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  sizeCmMin!: number;

  @IsInt()
  @Min(1)
  @Max(1500)
  sizeCmMax!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  potType!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  pricePerUnit!: number;
}

