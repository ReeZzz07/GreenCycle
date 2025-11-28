# Быстрый старт развертывания GreenCycle

## Минимальные требования

- Ubuntu 24.04.3 на Raspberry Pi 5
- 4GB RAM минимум
- 32GB свободного места
- Docker и Docker Compose установлены

## Быстрая установка

### 1. Установка Docker (если не установлен)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Клонирование и настройка

```bash
cd /opt
sudo mkdir -p greencycle
sudo chown $USER:$USER greencycle
cd greencycle
git clone https://github.com/ReeZzz07/GreenCycle.git .
```

### 3. Создание .env файла

```bash
nano .env
```

Минимальная конфигурация:

```env
DB_PASSWORD=ВашНадежныйПароль123
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://$(hostname -I | awk '{print $1}')
```

### 4. Сборка и запуск

```bash
# Сборка образов (10-20 минут на Pi 5)
docker compose -f docker-compose.prod.yml build

# Запуск контейнеров
docker compose -f docker-compose.prod.yml up -d

# Выполнение миграций
docker compose -f docker-compose.prod.yml exec backend sh -c "cd /app/apps/backend && pnpm migration:run"
```

### 5. Проверка

```bash
# Статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Логи
docker compose -f docker-compose.prod.yml logs -f
```

### 6. Доступ к приложению

- Frontend: `http://ВАШ_IP`
- API: `http://ВАШ_IP/api/v1`
- Swagger: `http://ВАШ_IP/api/v1/docs`

### Первый вход

После миграций создан пользователь:
- Email: `admin@greencycle.local`
- Пароль: `admin123`

**Смените пароль сразу после входа!**

---

Для полной инструкции см. [DEPLOY.md](./DEPLOY.md)

