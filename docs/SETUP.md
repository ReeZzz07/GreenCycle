# Инструкция по запуску GreenCycle локально

## Предварительные требования

1. **PostgreSQL 15+** установлен и запущен локально
2. **Node.js** (рекомендуется версия 18+)
3. **pnpm** установлен глобально или через npx

## Шаг 1: Настройка базы данных PostgreSQL

### Создание базы данных и пользователя

Подключитесь к PostgreSQL (обычно через пользователя `postgres`):

```sql
-- Создать пользователя
CREATE USER greencycle WITH PASSWORD 'greencycle';

-- Создать базу данных
CREATE DATABASE greencycle OWNER greencycle;

-- Выдать права
GRANT ALL PRIVILEGES ON DATABASE greencycle TO greencycle;
```

Или используйте существующие учетные данные PostgreSQL и обновите `.env` файл соответственно.

## Шаг 2: Настройка переменных окружения

### Backend (.env файл)

Создайте файл `apps/backend/.env`:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=greencycle
DB_PASSWORD=greencycle
DB_NAME=greencycle
DB_LOGGING=false
DB_SSL=false

JWT_SECRET=greencycle-secret-key-change-in-production-min-32-chars
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=7d
BCRYPT_SALT_ROUNDS=12

# SMTP настройки (опционально)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_SECURE=false
SMTP_FROM=noreply@greencycle.local
```

**Важно:** Если у вас другие учетные данные PostgreSQL, обновите `DB_USER`, `DB_PASSWORD` и `DB_NAME` соответственно.

### Frontend (.env файл)

Создайте файл `apps/frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Шаг 3: Установка зависимостей

```bash
# Из корня проекта
pnpm install
```

## Шаг 4: Запуск миграций

```bash
# Из корня проекта
pnpm --filter backend migration:run
```

Это создаст все необходимые таблицы в базе данных и инициализирует роли и первого пользователя.

## Шаг 5: Запуск приложения

### Запуск Backend

В одном терминале:

```bash
pnpm --filter backend start:dev
```

Backend будет доступен по адресу: `http://localhost:3000`

### Запуск Frontend

В другом терминале:

```bash
pnpm --filter frontend dev
```

Frontend будет доступен по адресу: `http://localhost:5173`

## Первый вход

После запуска приложения:

- **Email:** `founder@greencycle.local`
- **Пароль:** `GreenCycle#2025`

**Внимание:** Обязательно измените пароль после первого входа!

## Проверка работы

1. Откройте браузер и перейдите на `http://localhost:5173`
2. Войдите с учетными данными выше
3. Вы должны увидеть дашборд с метриками

## Устранение проблем

### Ошибка подключения к базе данных

1. Убедитесь, что PostgreSQL запущен
2. Проверьте учетные данные в `.env` файле
3. Убедитесь, что база данных и пользователь созданы

### Ошибка миграций

1. Убедитесь, что база данных существует
2. Проверьте права пользователя на базу данных
3. Проверьте подключение к PostgreSQL

### Ошибка портов

Если порты 3000 или 5173 заняты:

1. Измените `PORT` в `apps/backend/.env`
2. Измените порт в `apps/frontend/vite.config.ts` и обновите `VITE_API_BASE_URL` в `.env`

## Остановка приложения

Нажмите `Ctrl+C` в терминалах, где запущены backend и frontend.

## Дополнительная информация

- Backend API доступен по адресу: `http://localhost:3000/api`
- Frontend доступен по адресу: `http://localhost:5173`
- Документация API: см. `docs/API.md`
- Документация по структуре БД: см. `docs/DATABASE.md`

