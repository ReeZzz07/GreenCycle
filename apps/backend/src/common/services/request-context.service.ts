import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type RequestContextStore = {
  userId: number | null;
};

@Injectable()
export class RequestContextService implements NestMiddleware {
  private static readonly storage = new AsyncLocalStorage<RequestContextStore>();

  use(req: Request, _: Response, next: NextFunction): void {
    RequestContextService.storage.run({ userId: null }, () => {
      next();
    });
  }

  static setCurrentUserId(userId: number | null): void {
    const store = RequestContextService.storage.getStore();
    if (store) {
      store.userId = userId;
    }
  }

  static getCurrentUserId(): number | null {
    return RequestContextService.storage.getStore()?.userId ?? null;
  }
}

