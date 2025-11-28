# Фаза 2 — Базовая инфраструктура разработки

## 1. Монорепозиторий и общие инструменты
- Настроен `pnpm`-монорепозиторий (`package.json`, `pnpm-workspace.yaml`).
- Общие скрипты: `lint`, `format`, `typecheck`, каскадные вызовы для фронта и бэка.
- Подключены инструменты качества: ESLint (flat config), Prettier, Husky + lint-staged, Turbo (готов к использованию для кэширования задач).
- Добавлены `.editorconfig` и `.gitignore` c базовыми правилами.
- Настроен CI (`.github/workflows/ci.yml`) для lint/typecheck.

## 2. Docker-окружение
- `docker-compose.yml` разворачивает PostgreSQL 15, Mailpit и Redis 7.
- Предусмотрены healthcheck для БД и именованные volume'ы (`postgres_data`, `redis_data`).

## 3. Frontend scaffold
- Каталог `apps/frontend` с базовым Vite + React + Mantine/TanStack Query стеком.
- Добавлены `tsconfig`, `vite.config.ts`, базовые `App.tsx` и `main.tsx` (заглушка текста).
- Настроены скрипты `dev`, `build`, `lint`, `typecheck`, добавлены зависимости.

## 4. Backend scaffold
- Каталог `apps/backend` с NestJS-заглушкой (`AppModule`, `main.ts`).
- Общие конфигурации TypeScript (`tsconfig.json`, `tsconfig.build.json`).
- Скрипты для запуска, сборки и миграций; добавлен `migrations/README.md` и заглушки для генерации/применения миграций.

## 5. Следующие шаги
- Фаза 3: развивать бэкенд — модули конфигурации, аутентификации, аудит, миграции, сиды.
- Решить, какой инструмент миграций выбираем (TypeORM, Prisma, Drizzle) и донастроить `scripts/migrations/*`.

