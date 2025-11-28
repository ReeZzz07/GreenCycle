import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Текущий пароль обязателен' })
  @IsString()
  currentPassword: string;

  @IsNotEmpty({ message: 'Новый пароль обязателен' })
  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать не менее 6 символов' })
  newPassword: string;
}

