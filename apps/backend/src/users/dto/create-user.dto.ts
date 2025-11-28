import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { RoleName } from '../entities/role.entity';

export class CreateUserDto {
  @IsEmail({}, { message: 'Некорректный email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'ФИО обязательно' })
  @MaxLength(255, { message: 'ФИО не должно превышать 255 символов' })
  fullName!: string;

  @IsEnum(['super_admin', 'admin', 'manager', 'accountant', 'logistic'], {
    message: 'Некорректная роль',
  })
  @IsNotEmpty({ message: 'Роль обязательна' })
  roleName!: RoleName;
}

