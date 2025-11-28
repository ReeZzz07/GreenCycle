import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const dbConfig = configService.get('database', { infer: true });

        if (!dbConfig) {
          throw new Error('Database configuration is not defined');
        }

        return {
          type: 'postgres' as const,
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.name,
          autoLoadEntities: true,
          synchronize: false,
          logging: dbConfig.logging,
          ssl: dbConfig.ssl,
          migrationsTableName: 'migrations',
          namingStrategy: undefined, // Используем дефолтную стратегию
          entitySkipColumn: false,
        };
      }
    })
  ]
})
export class DatabaseModule {}

