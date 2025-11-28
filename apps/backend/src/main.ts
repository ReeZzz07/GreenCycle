import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './modules/app.module';
import { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService<AppConfig>);
  const port = configService.get('app.port', { infer: true }) ?? 3000;

  app.setGlobalPrefix('api/v1');
  
  // Настройка CORS для разработки
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      },
      forbidUnknownValues: true
    })
  );

  // Настройка Swagger документации
  const config = new DocumentBuilder()
    .setTitle('GreenCycle API')
    .setDescription('API для системы полного учёта закупок, продаж, выкупа и финансов')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Введите JWT токен',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Аутентификация и авторизация')
    .addTag('users', 'Управление пользователями')
    .addTag('suppliers', 'Поставщики')
    .addTag('shipments', 'Поставки')
    .addTag('inventory', 'Склад')
    .addTag('clients', 'Клиенты')
    .addTag('sales', 'Продажи')
    .addTag('buybacks', 'Выкуп')
    .addTag('finance', 'Финансы')
    .addTag('notifications', 'Уведомления')
    .addTag('reports', 'Отчёты')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  Logger.log('Swagger документация доступна по адресу: http://localhost:3000/api/docs', 'Bootstrap');

  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads',
  });

  await app.listen(port, () => {
    Logger.log(`Backend запущен на порту ${port}`, 'Bootstrap');
  });
}

bootstrap().catch((error) => {
  Logger.error('Не удалось запустить backend', error, 'Bootstrap');
  process.exit(1);
});

