import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { configuration } from '../config/configuration';
import { validationSchema } from '../config/validation';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestContextService } from '../common/services/request-context.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { AppConfig } from '../config/configuration';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ClientsModule } from '../clients/clients.module';
import { SalesModule } from '../sales/sales.module';
import { BuybacksModule } from '../buybacks/buybacks.module';
import { FinanceModule } from '../finance/finance.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsModule } from '../reports/reports.module';
import { EquityModule } from '../equity/equity.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        throttlers: [
          {
            ttl: (configService.get('throttler.ttl', { infer: true }) ?? 60) * 1000, // в миллисекундах
            limit: configService.get('throttler.limit', { infer: true }) ?? 100,
          },
        ],
      }),
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const isDevelopment = process.env.NODE_ENV !== 'production';
        return {
          pinoHttp: {
            level: isDevelopment ? 'debug' : 'info',
            transport: isDevelopment
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
            serializers: {
              req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                headers: {
                  host: req.headers.host,
                  'user-agent': req.headers['user-agent'],
                },
              }),
              res: (res) => ({
                statusCode: res.statusCode,
              }),
              err: (err) => ({
                type: err.type,
                message: err.message,
                stack: err.stack,
              }),
            },
            customProps: (req) => ({
              context: 'HTTP',
            }),
            autoLogging: {
              ignore: (req) => {
                // Игнорируем запросы к статическим файлам и документации
                return !!(req.url?.startsWith('/uploads') || req.url?.startsWith('/api/docs'));
              },
            },
          },
        };
      },
    }),
    CacheModule.register({
      ttl: 300, // 5 минут по умолчанию
      max: 100, // максимальное количество элементов в кэше
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    CommonModule,
    UsersModule,
    AuthModule,
    SuppliersModule,
    ShipmentsModule,
    InventoryModule,
    ClientsModule,
    SalesModule,
    BuybacksModule,
    FinanceModule,
    NotificationsModule,
    ReportsModule,
    EquityModule
  ],
  providers: [
    RequestContextService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextService).forRoutes('*');
  }
}

