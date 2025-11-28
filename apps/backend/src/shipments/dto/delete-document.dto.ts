import { IsString, MaxLength } from 'class-validator';

export class DeleteShipmentDocumentDto {
  @IsString()
  @MaxLength(2048)
  url!: string;
}


