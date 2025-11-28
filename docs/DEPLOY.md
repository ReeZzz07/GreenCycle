# Инструкция по развертыванию GreenCycle на Ubuntu 24.04.3 (Raspberry Pi 5)

## Требования

- Ubuntu 24.04.3 LTS на Raspberry Pi 5
- Минимум 4GB RAM (рекомендуется 8GB)
- Минимум 32GB свободного места на диске
- Подключение к интернету
- Права sudo пользователя

## 1. Подготовка сервера

### 1.1. Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2. Установка необходимых пакетов

```bash
sudo apt install -y \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    unattended-upgrades
```

### 1.3. Настройка файрвола

```bash
# Включение UFW
sudo ufw enable

# Разрешение SSH
sudo ufw allow 22/tcp

# Разрешение HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Проверка статуса
sudo ufw status
```

### 1.4. Настройка автоматических обновлений безопасности

```bash
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 2. Установка Docker

### 2.1. Установка Docker Engine

```bash
# Добавление официального GPG ключа Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Добавление репозитория Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Обновление индексов пакетов
sudo apt update

# Установка Docker Engine, Docker CLI и Docker Compose
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2.2. Проверка установки Docker

```bash
# Проверка версии Docker
docker --version
docker compose version

# Запуск тестового контейнера
sudo docker run hello-world
```

### 2.3. Настройка прав для пользователя (опционально)

Если вы хотите запускать Docker без sudo:

```bash
# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Применение изменений (требуется перелогин)
newgrp docker

# Проверка (должно работать без sudo)
docker ps
```

**Важно:** После этого потребуется выйти и снова войти в систему для применения изменений.

## 3. Клонирование репозитория

### 3.1. Создание директории для приложения

```bash
# Создание директории
sudo mkdir -p /opt/greencycle
sudo chown $USER:$USER /opt/greencycle
cd /opt/greencycle
```

### 3.2. Клонирование репозитория

```bash
# Клонирование (замените на ваш репозиторий)
git clone https://github.com/ReeZzz07/GreenCycle.git .

# Или если репозиторий приватный, используйте SSH ключ
# git clone git@github.com:ReeZzz07/GreenCycle.git .
```

## 4. Настройка переменных окружения

### 4.1. Создание файла .env

```bash
cd /opt/greencycle
cp .env.example .env
nano .env
```

### 4.2. Конфигурация переменных окружения

Отредактируйте файл `.env` со следующими значениями:

```env
# База данных
DB_USER=greencycle
DB_PASSWORD=ВАШ_НАДЕЖНЫЙ_ПАРОЛЬ
DB_NAME=greencycle

# JWT секреты (используйте генератор случайных строк)
JWT_SECRET=ВАШ_СЛУЧАЙНЫЙ_JWT_СЕКРЕТ_МИНИМУМ_32_СИМВОЛА
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=7d

# Redis (опционально)
REDIS_PASSWORD=

# Frontend
FRONTEND_URL=http://ВАШ_IP_ИЛИ_ДОМЕН
FRONTEND_PORT=80

# Безопасность
BCRYPT_SALT_ROUNDS=12
THROTTLER_TTL=60
THROTTLER_LIMIT=100

# Логирование
DB_LOGGING=false
NODE_ENV=production
```

**Важно:** 
- Замените `ВАШ_НАДЕЖНЫЙ_ПАРОЛЬ` на надежный пароль для базы данных
- Сгенерируйте `JWT_SECRET` с помощью: `openssl rand -base64 32`
- Замените `ВАШ_IP_ИЛИ_ДОМЕН` на IP-адрес вашего сервера или доменное имя

### 4.3. Установка прав на .env файл

```bash
chmod 600 .env
```

## 5. Сборка и запуск приложения

### 5.1. Сборка Docker образов

```bash
cd /opt/greencycle
docker compose -f docker-compose.prod.yml build
```

**Примечание:** На Raspberry Pi 5 сборка может занять 10-20 минут.

### 5.2. Запуск контейнеров

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 5.3. Проверка статуса контейнеров

```bash
docker compose -f docker-compose.prod.yml ps
```

Все контейнеры должны быть в статусе `Up` и `healthy`.

### 5.4. Просмотр логов

```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f postgres
```

## 6. Выполнение миграций базы данных

### 6.1. Подключение к контейнеру бэкенда

```bash
docker compose -f docker-compose.prod.yml exec backend sh
```

### 6.2. Выполнение миграций

```bash
cd /app/apps/backend
pnpm migration:run
```

**Примечание:** Миграции автоматически создадут роли и начальные данные. После выполнения миграций будет создан первый пользователь-супер-администратор:
- Email: `admin@greencycle.local`
- Пароль: `admin123`

**Важно:** Обязательно смените пароль после первого входа!

### 6.3. Выход из контейнера

```bash
exit
```

## 6.1. Создание первого пользователя (если не создан миграцией)

Если первый пользователь не был создан автоматически, вы можете создать его вручную:

```bash
# Подключение к контейнеру
docker compose -f docker-compose.prod.yml exec backend sh

# Выполнение скрипта создания пользователя
cd /app/apps/backend
pnpm check-user
```

Следуйте инструкциям скрипта для создания пользователя.

## 7. Настройка Nginx как обратного прокси (опционально)

Если вы хотите использовать доменное имя и HTTPS, установите Nginx:

### 7.1. Установка Nginx

```bash
sudo apt install -y nginx
```

### 7.2. Настройка конфигурации

Создайте файл конфигурации:

```bash
sudo nano /etc/nginx/sites-available/greencycle
```

Добавьте следующую конфигурацию:

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН_ИЛИ_IP;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.3. Активация конфигурации

```bash
sudo ln -s /etc/nginx/sites-available/greencycle /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7.4. Настройка HTTPS с Let's Encrypt (опционально)

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d ВАШ_ДОМЕН
```

## 8. Управление приложением

### 8.1. Остановка приложения

```bash
cd /opt/greencycle
docker compose -f docker-compose.prod.yml down
```

### 8.2. Перезапуск приложения

```bash
docker compose -f docker-compose.prod.yml restart
```

### 8.3. Обновление приложения

```bash
cd /opt/greencycle

# Получение последних изменений
git pull

# Пересборка образов
docker compose -f docker-compose.prod.yml build

# Перезапуск с новыми образами
docker compose -f docker-compose.prod.yml up -d

# Выполнение миграций (если есть новые)
docker compose -f docker-compose.prod.yml exec backend sh -c "cd /app/apps/backend && pnpm migration:run"
```

### 8.4. Очистка неиспользуемых образов и контейнеров

```bash
# Удаление остановленных контейнеров
docker container prune -f

# Удаление неиспользуемых образов
docker image prune -a -f

# Полная очистка (осторожно!)
docker system prune -a -f
```

## 9. Резервное копирование

### 9.1. Создание резервной копии базы данных

```bash
# Создание директории для бэкапов
mkdir -p /opt/greencycle/backups

# Создание бэкапа
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U greencycle greencycle > /opt/greencycle/backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### 9.2. Автоматическое резервное копирование (cron)

Создайте скрипт для автоматического резервного копирования:

```bash
nano /opt/greencycle/backup.sh
```

Добавьте:

```bash
#!/bin/bash
BACKUP_DIR="/opt/greencycle/backups"
DATE=$(date +%Y%m%d_%H%M%S)
cd /opt/greencycle

docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U greencycle greencycle > "$BACKUP_DIR/backup_$DATE.sql"

# Удаление бэкапов старше 7 дней
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

Сделайте скрипт исполняемым:

```bash
chmod +x /opt/greencycle/backup.sh
```

Добавьте в crontab (ежедневно в 2:00):

```bash
crontab -e
```

Добавьте строку:

```
0 2 * * * /opt/greencycle/backup.sh >> /opt/greencycle/backups/backup.log 2>&1
```

### 9.3. Восстановление из резервной копии

```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U greencycle greencycle < /opt/greencycle/backups/backup_YYYYMMDD_HHMMSS.sql
```

## 10. Мониторинг и логирование

### 10.1. Мониторинг использования ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Использование дискового пространства
docker system df
```

### 10.2. Настройка логирования

Логи по умолчанию сохраняются в Docker. Для ротации логов настройте docker-compose:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 11. Устранение неполадок

### 11.1. Контейнер не запускается

```bash
# Проверка логов
docker compose -f docker-compose.prod.yml logs [service_name]

# Проверка статуса
docker compose -f docker-compose.prod.yml ps
```

### 11.2. Проблемы с подключением к базе данных

```bash
# Проверка статуса PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U greencycle

# Подключение к базе данных
docker compose -f docker-compose.prod.yml exec postgres psql -U greencycle -d greencycle
```

### 11.3. Очистка и пересборка

```bash
# Остановка всех контейнеров
docker compose -f docker-compose.prod.yml down

# Удаление томов (осторожно - удалит данные!)
docker compose -f docker-compose.prod.yml down -v

# Пересборка с нуля
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## 12. Безопасность

### 12.1. Рекомендации по безопасности

1. **Измените все пароли по умолчанию**
2. **Используйте сильные пароли** (минимум 16 символов)
3. **Настройте fail2ban** для защиты от брутфорса
4. **Регулярно обновляйте систему и Docker**
5. **Используйте HTTPS** в production
6. **Ограничьте доступ к серверу** по SSH
7. **Настройте регулярные резервные копии**

### 12.2. Настройка fail2ban

```bash
# Создание конфигурации для SSH
sudo nano /etc/fail2ban/jail.local
```

Добавьте:

```ini
[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

Перезапустите fail2ban:

```bash
sudo systemctl restart fail2ban
```

## 13. Проверка работоспособности

После развертывания проверьте:

1. **Frontend доступен:** `http://ВАШ_IP_ИЛИ_ДОМЕН`
2. **API доступен:** `http://ВАШ_IP_ИЛИ_ДОМЕН/api/v1`
3. **Swagger документация:** `http://ВАШ_IP_ИЛИ_ДОМЕН/api/v1/docs`
4. **База данных работает:** все миграции выполнены
5. **Все контейнеры работают:** `docker compose -f docker-compose.prod.yml ps`

## 14. Поддержка

При возникновении проблем:

1. Проверьте логи: `docker compose -f docker-compose.prod.yml logs`
2. Проверьте статус контейнеров: `docker compose -f docker-compose.prod.yml ps`
3. Проверьте использование ресурсов: `docker stats`
4. Убедитесь, что все переменные окружения настроены правильно

## 15. Автоматический запуск при перезагрузке

Docker Compose автоматически настраивает автозапуск контейнеров благодаря `restart: unless-stopped`. 

Для проверки автозапуска Docker при перезагрузке системы:

```bash
sudo systemctl enable docker
```

---

**Готово!** Приложение развернуто и готово к работе.

