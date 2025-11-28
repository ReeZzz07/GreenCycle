import { IsString, IsEnum, MaxLength } from 'class-validator';
import { AccountType } from '../entities/account.entity';

export class CreateAccountDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsEnum(AccountType)
  type!: AccountType;
}
