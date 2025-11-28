import { Transform } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ClientType } from '../entities/client.entity';

// Функция для преобразования пустых строк в null
const emptyStringToNull = ({ value }: any) => {
  if (value === '' || value === undefined) {
    return null;
  }
  return value;
};

// Условие для валидации - применяется только если значение не null и не undefined
const validateIfNotEmpty = (o: any, v: any) => v !== null && v !== undefined && v !== '';


export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @MaxLength(20)
  @Matches(/^[\d\s\-\+\(\)]+$/, { message: 'Некорректный формат телефона' })
  phone?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @MaxLength(500)
  addressFull?: string | null;

  @IsOptional()
  @IsEnum(ClientType)
  clientType?: ClientType;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @MaxLength(255)
  legalEntityName?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @MaxLength(12)
  @Matches(/^\d{10}|\d{12}$/, { message: 'ИНН должен содержать 10 или 12 цифр' })
  inn?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @MaxLength(9)
  @Matches(/^\d{9}$/, { message: 'КПП должен содержать 9 цифр' })
  kpp?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @MaxLength(15)
  @Matches(/^\d{13}|\d{15}$/, { message: 'ОГРН должен содержать 13 или 15 цифр' })
  ogrn?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @MaxLength(255)
  bankName?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @MaxLength(20)
  @Matches(/^\d{20}$/, { message: 'Расчетный счет должен содержать 20 цифр' })
  bankAccount?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @MaxLength(20)
  @Matches(/^\d{20}$/, { message: 'Корреспондентский счет должен содержать 20 цифр' })
  correspondentAccount?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull, { toClassOnly: true })
  @ValidateIf(validateIfNotEmpty)
  @MaxLength(9)
  @Matches(/^\d{9}$/, { message: 'БИК должен содержать 9 цифр' })
  bik?: string | null;
}
