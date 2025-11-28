import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(PinoLogger)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Внутренняя ошибка сервера';

    const errorMessage =
      exception instanceof Error ? exception.message : JSON.stringify(exception);
    const errorStack =
      exception instanceof Error ? exception.stack : JSON.stringify(exception);

    // Структурированное логирование ошибок
    const logContext = {
      status,
      method: request.method,
      url: request.url,
      error: errorMessage,
      stack: errorStack,
      userId: (request as any).user?.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };

    if (status >= 500) {
      // Критические ошибки (5xx)
      this.logger.error(
        {
          ...logContext,
          type: 'INTERNAL_SERVER_ERROR',
        },
        `Ошибка ${status} на ${request.method} ${request.url}`,
      );
    } else {
      // Клиентские ошибки (4xx)
      this.logger.warn(
        {
          ...logContext,
          type: 'CLIENT_ERROR',
        },
        `Ошибка ${status} на ${request.method} ${request.url}`,
      );
    }

    // Логирование SQL ошибок
    if (exception instanceof Error && 'query' in exception) {
      this.logger.error(
        {
          type: 'SQL_ERROR',
          query: (exception as any).query,
          parameters: (exception as any).parameters,
        },
        'SQL Query Error',
      );
    }

    response.status(status).json({
      data: null,
      error:
        typeof message === 'string'
          ? {
              code: exception instanceof HttpException ? exception.name : 'INTERNAL_ERROR',
              message,
            }
          : message,
    });
  }
}

