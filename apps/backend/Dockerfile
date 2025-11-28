# Multi-stage build для бэкенда
FROM node:20-alpine AS builder

# Установка pnpm
RUN npm install -g pnpm

WORKDIR /app

# Копирование файлов зависимостей
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Установка зависимостей (используем --filter для установки только нужных зависимостей)
RUN pnpm install --frozen-lockfile

# Копирование исходного кода бэкенда
COPY apps/backend ./apps/backend

# Сборка приложения
WORKDIR /app
RUN pnpm --filter backend build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Установка pnpm
RUN npm install -g pnpm

# Копирование package.json для установки только production зависимостей
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/

# Установка только production зависимостей бэкенда
RUN pnpm install --frozen-lockfile --prod --filter backend

# Копирование скомпилированного кода из builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Копирование шрифтов для PDF генерации
COPY --from=builder /app/apps/backend/src/common/fonts ./apps/backend/src/common/fonts

# Создание директории для загруженных файлов
RUN mkdir -p /app/apps/backend/uploads/documents

WORKDIR /app/apps/backend

# Открытие порта
EXPOSE 3000

# Запуск приложения
CMD ["pnpm", "start"]

