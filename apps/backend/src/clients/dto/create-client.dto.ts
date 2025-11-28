import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { ClientType } from '../entities/client.entity';

export class CreateClientDto {
  @IsString()
  @MaxLength(255)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[\d\s\-\+\(\)]+$/, { message: 'Некорректный формат телефона' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressFull?: string;

  @IsOptional()
  @IsEnum(ClientType)
  clientType?: ClientType;

  // Поля для юридического лица
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalEntityName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  @Matches(/^\d{10}|\d{12}$/, { message: 'ИНН должен содержать 10 или 12 цифр' })
  inn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  @Matches(/^\d{9}$/, { message: 'КПП должен содержать 9 цифр' })
  kpp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(/^\d{13}|\d{15}$/, { message: 'ОГРН должен содержать 13 или 15 цифр' })
  ogrn?: string;

  // Банковские реквизиты
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\d{20}$/, { message: 'Расчетный счет должен содержать 20 цифр' })
  bankAccount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\d{20}$/, { message: 'Корреспондентский счет должен содержать 20 цифр' })
  correspondentAccount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  @Matches(/^\d{9}$/, { message: 'БИК должен содержать 9 цифр' })
  bik?: string;
}
