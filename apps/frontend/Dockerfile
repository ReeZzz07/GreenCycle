# Multi-stage build для фронтенда
FROM node:20-alpine AS builder

# Установка pnpm
RUN npm install -g pnpm

WORKDIR /app

# Копирование файлов зависимостей
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Установка зависимостей
RUN pnpm install --frozen-lockfile

# Копирование исходного кода фронтенда
COPY apps/frontend ./apps/frontend

# Сборка приложения
WORKDIR /app
RUN pnpm --filter frontend build

# Production stage с Nginx
FROM nginx:alpine

# Копирование собранных файлов
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Копирование конфигурации Nginx
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Открытие порта
EXPOSE 80

# Запуск Nginx
CMD ["nginx", "-g", "daemon off;"]

