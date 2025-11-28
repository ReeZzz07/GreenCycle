# Фаза 3 — Бэкенд: фундамент

## 1. Архитектура и инфраструктура
- Nest-приложение расширено глобальными модулями: `ConfigModule`, `DatabaseModule`, `UsersModule`, `AuthModule`.
- Добавлен `RequestContextService` (AsyncLocalStorage) и global middleware для проставления `created_by` / `updated_by`.
- Подключены глобальные guard'ы (`JwtAuthGuard`, `RolesGuard`) и фильтр `AllExceptionsFilter` с унифицированным ответом `{ data, error }`.

## 2. Аутентификация и безопасность
- Реализован модуль `AuthModule`:
  - JWT-авторизация (access + refresh) c конфигурацией TTL из `configuration.ts`.
  - Стратегии `JwtStrategy` и `RefreshJwtStrategy`, guards для защищённых и refresh-эндпоинтов.
  - Контроллер `POST /auth/login`, `POST /auth/refresh` с валидацией DTO.
- Сервис `PasswordService` обёрнут над `bcrypt`, параметры соли выносены в конфиг + Joi-валидацию.
- Добавлены декораторы `@CurrentUser`, `@Roles`, `@Public` и Guard-логика для RBAC.

## 3. Доменные сущности и миграции
- Созданы сущности `Role`, `User` с связи `ManyToOne`, уникальными индексами и `citext` для email.
- Базовые классы `BaseEntity`/`AuditableEntity` обеспечивают поля `created_at`, `updated_at`, `created_by_id`, `updated_by_id`.
- Миграция `1731400000000-InitRolesAndUsers`:
  - разворачивает расширение `citext`, таблицы `roles` и `users`;
  - наполняет таблицу ролей значениями из ТЗ;
  - создаёт супер-админа `founder@greencycle.local` с паролем `GreenCycle#2025` (можно сменить сразу после запуска).
- CLI-команды TypeORM интегрированы в `package.json` (`migration:generate/run/revert`).

## 4. Контроль качества
- ESLint (flat config) настроен на строгие правила TypeScript, линт проходит (`pnpm --filter backend lint`).
- TypeScript typecheck без ошибок (`pnpm --filter backend typecheck`).

## 5. Следующие шаги (Фаза 4)
- Расширить доменную модель: поставки, партии, клиенты, продажи, выкуп, финансы, уведомления.
- Реализовать аудит операций (middleware уже готов) и бизнес-валидацию в сервисах.
- Подготовить дополнительные миграции и сиды для остальных сущностей, начать построение REST API.

