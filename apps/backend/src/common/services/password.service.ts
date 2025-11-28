import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class PasswordService {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  private get saltRounds(): number {
    return this.configService.get('auth.bcryptSaltRounds', { infer: true }) ?? 12;
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  static hashSync(plain: string, saltRounds: number): string {
    return bcrypt.hashSync(plain, saltRounds);
  }
}

