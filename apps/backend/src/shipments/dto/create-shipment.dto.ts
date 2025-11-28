import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBatchDto } from './create-batch.dto';
import { CreateShipmentInvestmentDto } from './create-shipment-investment.dto';

export class ShipmentDocumentDto {
  @IsString()
  @MaxLength(2048)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  name?: string;
}

export type ShipmentDocument = ShipmentDocumentDto & { persisted?: boolean };

export class CreateShipmentDto {
  @IsInt()
  @IsPositive()
  supplierId!: number;

  @IsDateString()
  arrivalDate!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @Type(() => ShipmentDocumentDto)
  documents?: ShipmentDocumentDto[];

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => CreateBatchDto)
  batches!: CreateBatchDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @Type(() => CreateShipmentInvestmentDto)
  investments?: CreateShipmentInvestmentDto[];
}

