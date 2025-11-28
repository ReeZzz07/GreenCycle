# Миграции БД (TypeORM)

Используем TypeORM 0.3+ для миграций и синхронизации схемы PostgreSQL.

## Команды

```bash
# генерация новой миграции (указать имя)
pnpm --filter backend migration:generate src/migrations/<migration-name>

# применение миграций
pnpm --filter backend migration:run

# откат последней миграции
pnpm --filter backend migration:revert
```

## Структура

- `src/migrations` — каталог с миграциями.
- `src/database/typeorm.config.ts` — DataSource-конфигурация для CLI и приложения.

