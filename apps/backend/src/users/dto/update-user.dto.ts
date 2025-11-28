import { IsEmail, IsOptional, IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { RoleName } from '../entities/role.entity';

const emptyStringToUndefined = ({ value }: { value: any }) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  return value;
};

export class UpdateUserDto {
  @IsOptional()
  @Transform(emptyStringToUndefined, { toClassOnly: true })
  @IsEmail({}, { message: 'Некорректный email' })
  email?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined, { toClassOnly: true })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined, { toClassOnly: true })
  @MaxLength(255, { message: 'ФИО не должно превышать 255 символов' })
  fullName?: string;

  @IsOptional()
  @IsEnum(['super_admin', 'admin', 'manager', 'accountant', 'logistic'], {
    message: 'Некорректная роль',
  })
  roleName?: RoleName;
}

