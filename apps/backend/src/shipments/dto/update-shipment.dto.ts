import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBatchDto } from './create-batch.dto';
import { ShipmentDocumentDto } from './create-shipment.dto';
import { CreateShipmentInvestmentDto } from './create-shipment-investment.dto';

export class UpdateShipmentDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  supplierId?: number;

  @IsDateString()
  @IsOptional()
  arrivalDate?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @Type(() => ShipmentDocumentDto)
  documents?: ShipmentDocumentDto[];

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => CreateBatchDto)
  @IsOptional()
  batches?: CreateBatchDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @Type(() => CreateShipmentInvestmentDto)
  investments?: CreateShipmentInvestmentDto[];
}

