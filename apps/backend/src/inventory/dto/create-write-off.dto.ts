import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength
} from 'class-validator';

export class CreateWriteOffDto {
  @IsInt()
  @IsPositive()
  batchId!: number;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  reason!: string;

  @IsDateString()
  writeOffDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string;
}


