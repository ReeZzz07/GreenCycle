# Модули и интеграции GreenCycle

## Архитектура системы

Система состоит из двух основных частей:
- **Backend** (NestJS) - REST API сервер
- **Frontend** (React + Vite) - Progressive Web Application (PWA)

## Backend модули

### 1. Auth Module (`apps/backend/src/auth/`)
Модуль аутентификации и авторизации.

**Функциональность:**
- JWT-based аутентификация
- Refresh token механизм
- Password hashing (bcrypt)

**Зависимости:**
- `@nestjs/jwt`
- `@nestjs/passport`
- `passport-jwt`
- `bcrypt`

**Endpoints:**
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/refresh` - Обновление токена

### 2. Users Module (`apps/backend/src/users/`)
Модуль управления пользователями.

**Функциональность:**
- Управление пользователями
- Роли и права доступа
- Получение информации о текущем пользователе

**Endpoints:**
- `GET /api/users/me` - Получить информацию о текущем пользователе

### 3. Suppliers Module (`apps/backend/src/suppliers/`)
Модуль управления поставщиками.

**Функциональность:**
- CRUD операции с поставщиками
- Поиск поставщиков
- Управление контактной информацией

**Endpoints:**
- `POST /api/suppliers` - Создать поставщика
- `GET /api/suppliers` - Получить список поставщиков
- `GET /api/suppliers/:id` - Получить поставщика по ID
- `PATCH /api/suppliers/:id` - Обновить поставщика
- `DELETE /api/suppliers/:id` - Удалить поставщика

### 4. Shipments Module (`apps/backend/src/shipments/`)
Модуль управления поставками.

**Функциональность:**
- Создание поставок
- Управление партиями товаров
- Генерация накладных в PDF
- Автоматический расчёт общей стоимости

**Endpoints:**
- `POST /api/shipments` - Создать поставку
- `GET /api/shipments` - Получить список поставок
- `GET /api/shipments/:id` - Получить поставку по ID
- `GET /api/shipments/:id/document` - Скачать накладную в PDF

**Зависимости:**
- `CommonModule` (PdfService)

### 5. Inventory Module (`apps/backend/src/inventory/`)
Модуль управления складом.

**Функциональность:**
- Учёт остатков товаров
- Списание товаров
- Автоматическое обновление остатков
- Сводка по складу

**Endpoints:**
- `GET /api/inventory` - Получить сводку по складу
- `POST /api/inventory/write-offs` - Создать списание
- `GET /api/inventory/write-offs` - Получить список списаний

### 6. Clients Module (`apps/backend/src/clients/`)
Модуль управления клиентами.

**Функциональность:**
- CRUD операции с клиентами
- Поиск клиентов
- Управление контактной информацией
- Хранение ИНН и адресов

**Endpoints:**
- `POST /api/clients` - Создать клиента
- `GET /api/clients` - Получить список клиентов
- `GET /api/clients/:id` - Получить клиента по ID
- `PATCH /api/clients/:id` - Обновить клиента
- `DELETE /api/clients/:id` - Удалить клиента

### 7. Sales Module (`apps/backend/src/sales/`)
Модуль управления продажами.

**Функциональность:**
- Создание продаж
- Управление позициями продаж
- Отмена продаж
- Генерация счетов в PDF
- Автоматическое обновление остатков на складе
- Автоматическое создание транзакций

**Endpoints:**
- `POST /api/sales` - Создать продажу
- `GET /api/sales` - Получить список продаж
- `GET /api/sales/:id` - Получить продажу по ID
- `PATCH /api/sales/:id/cancel` - Отменить продажу
- `GET /api/sales/:id/invoice` - Скачать счёт в PDF

**Зависимости:**
- `CommonModule` (PdfService)
- `InventoryModule`
- `FinanceModule`

### 8. Buybacks Module (`apps/backend/src/buybacks/`)
Модуль управления выкупами.

**Функциональность:**
- Создание выкупов
- Управление статусами выкупов
- Завершение и отклонение выкупов
- Генерация актов выкупа в PDF
- Автоматическое обновление остатков на складе
- Автоматическое создание транзакций
- Автоматическое создание уведомлений

**Endpoints:**
- `POST /api/buybacks` - Создать выкуп
- `GET /api/buybacks` - Получить список выкупов
- `GET /api/buybacks/:id` - Получить выкуп по ID
- `PATCH /api/buybacks/:id` - Обновить выкуп
- `PATCH /api/buybacks/:id/complete` - Завершить выкуп
- `PATCH /api/buybacks/:id/decline` - Отклонить выкуп
- `GET /api/buybacks/:id/act` - Скачать акт выкупа в PDF

**Зависимости:**
- `CommonModule` (PdfService)
- `InventoryModule`
- `FinanceModule`
- `NotificationsModule` (forwardRef)

### 9. Finance Module (`apps/backend/src/finance/`)
Модуль управления финансами.

**Функциональность:**
- Управление счетами
- Управление транзакциями
- Управление изъятиями партнёров
- Автоматический расчёт балансов
- Пересчёт балансов

**Endpoints:**
- `POST /api/finance/accounts` - Создать счёт
- `GET /api/finance/accounts` - Получить список счетов
- `GET /api/finance/accounts/:id` - Получить счёт по ID
- `PATCH /api/finance/accounts/:id` - Обновить счёт
- `DELETE /api/finance/accounts/:id` - Удалить счёт
- `POST /api/finance/accounts/:id/recalculate` - Пересчитать баланс
- `POST /api/finance/transactions` - Создать транзакцию
- `GET /api/finance/transactions` - Получить список транзакций
- `GET /api/finance/transactions/:id` - Получить транзакцию по ID
- `DELETE /api/finance/transactions/:id` - Удалить транзакцию
- `POST /api/finance/partner-withdrawals` - Создать изъятие партнёра
- `GET /api/finance/partner-withdrawals` - Получить список изъятий
- `GET /api/finance/partner-withdrawals/:id` - Получить изъятие по ID

### 10. Reports Module (`apps/backend/src/reports/`)
Модуль генерации отчётов.

**Функциональность:**
- Прибыль по поставкам
- Прибыль по клиентам
- Прогноз выкупа
- Движение средств
- Активность клиентов
- Сводка по складу

**Endpoints:**
- `GET /api/reports/profit-by-shipment` - Прибыль по поставкам
- `GET /api/reports/profit-by-client` - Прибыль по клиентам
- `GET /api/reports/buyback-forecast` - Прогноз выкупа
- `GET /api/reports/cash-flow` - Движение средств
- `GET /api/reports/client-activity` - Активность клиентов
- `GET /api/reports/inventory-summary` - Сводка по складу

### 11. Notifications Module (`apps/backend/src/notifications/`)
Модуль управления уведомлениями.

**Функциональность:**
- Создание уведомлений
- Управление уведомлениями
- Отметка прочитанности
- Автоматическое создание напоминаний о выкупе
- Email уведомления (опционально)

**Endpoints:**
- `POST /api/notifications` - Создать уведомление
- `GET /api/notifications` - Получить список уведомлений
- `GET /api/notifications/my` - Получить мои уведомления
- `GET /api/notifications/upcoming` - Получить предстоящие уведомления
- `GET /api/notifications/unread-count` - Получить количество непрочитанных
- `GET /api/notifications/:id` - Получить уведомление по ID
- `PATCH /api/notifications/:id` - Обновить уведомление
- `PATCH /api/notifications/:id/read` - Отметить как прочитанное
- `PATCH /api/notifications/read-all` - Отметить все как прочитанные
- `DELETE /api/notifications/:id` - Удалить уведомление

**Зависимости:**
- `CommonModule` (EmailService)

### 12. Common Module (`apps/backend/src/common/`)
Общий модуль с общими сервисами и утилитами.

**Сервисы:**
- `PdfService` - Генерация PDF документов (счета, накладные, акты)
- `EmailService` - Отправка email уведомлений (SMTP)
- `PasswordService` - Хеширование паролей
- `RequestContextService` - Контекст запроса (для аудита)

**Задачи:**
- `BuybackRemindersTask` - Фоновая задача для напоминаний о выкупе (cron)

**Зависимости:**
- `pdfmake` - Генерация PDF
- `nodemailer` - Отправка email
- `@nestjs/schedule` - Планировщик задач (cron)

## Frontend модули

### 1. Auth Module (`apps/frontend/src/services/auth.service.ts`)
Сервис аутентификации.

**Функциональность:**
- Вход в систему
- Обновление токена
- Выход из системы
- Проверка аутентификации

### 2. Users Module (`apps/frontend/src/services/users.service.ts`)
Сервис управления пользователями.

**Функциональность:**
- Получение информации о текущем пользователе

### 3. Suppliers Module (`apps/frontend/src/services/suppliers.service.ts`)
Сервис управления поставщиками.

**Функциональность:**
- CRUD операции с поставщиками
- Поиск поставщиков

### 4. Shipments Module (`apps/frontend/src/services/shipments.service.ts`)
Сервис управления поставками.

**Функциональность:**
- Создание поставок
- Получение списка поставок
- Скачивание накладных в PDF

### 5. Inventory Module (`apps/frontend/src/services/inventory.service.ts`)
Сервис управления складом.

**Функциональность:**
- Получение сводки по складу
- Создание списаний
- Получение списка списаний

### 6. Clients Module (`apps/frontend/src/services/clients.service.ts`)
Сервис управления клиентами.

**Функциональность:**
- CRUD операции с клиентами
- Поиск клиентов

### 7. Sales Module (`apps/frontend/src/services/sales.service.ts`)
Сервис управления продажами.

**Функциональность:**
- Создание продаж
- Получение списка продаж
- Отмена продаж
- Скачивание счетов в PDF

### 8. Buybacks Module (`apps/frontend/src/services/buybacks.service.ts`)
Сервис управления выкупами.

**Функциональность:**
- Создание выкупов
- Получение списка выкупов
- Завершение и отклонение выкупов
- Скачивание актов выкупа в PDF

### 9. Finance Module (`apps/frontend/src/services/finance.service.ts`)
Сервис управления финансами.

**Функциональность:**
- Управление счетами
- Управление транзакциями
- Управление изъятиями партнёров

### 10. Reports Module (`apps/frontend/src/services/reports.service.ts`)
Сервис генерации отчётов.

**Функциональность:**
- Получение различных отчётов
- Экспорт отчётов в Excel

### 11. Notifications Module (`apps/frontend/src/services/notifications.service.ts`)
Сервис управления уведомлениями.

**Функциональность:**
- Получение уведомлений
- Отметка прочитанности
- Получение количества непрочитанных

## Интеграции

### 1. PDF Generation (`pdfmake`)
Генерация PDF документов для:
- Счетов продаж
- Накладных поставок
- Актов выкупа

**Конфигурация:**
- Шрифты для поддержки русского языка
- Шаблоны документов
- Автоматическое форматирование

### 2. Email Notifications (`nodemailer`)
Отправка email уведомлений для:
- Напоминаний о выкупе (60, 30, 7 дней до планируемой даты)
- Уведомлений о важных событиях

**Конфигурация:**
- SMTP настройки (опционально)
- HTML шаблоны писем
- Логирование отправок

**Переменные окружения:**
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
SMTP_SECURE=false
SMTP_FROM=noreply@greencycle.ru
```

### 3. Background Tasks (`@nestjs/schedule`)
Фоновые задачи для:
- Напоминаний о выкупе (ежедневно в 9:00)
- Агрегации метрик (планируется)

**Конфигурация:**
- Cron выражения для планирования задач
- Автоматический запуск при старте приложения

### 4. Excel Export (`xlsx`)
Экспорт отчётов в Excel для:
- Прибыль по поставкам
- Прибыль по клиентам
- Прогноз выкупа
- Движение средств
- Активность клиентов

**Функциональность:**
- Автоматическое форматирование данных
- Поддержка больших объёмов данных
- Оптимизация производительности

### 5. PWA (`vite-plugin-pwa`)
Progressive Web Application функциональность:
- Service Worker для кэширования
- Offline режим
- Установка на домашний экран
- Автоматическое обновление

**Конфигурация:**
- Workbox стратегии кэширования
- Manifest для PWA
- Иконки приложения

### 6. Offline Queue
Очередь запросов для offline режима:
- Сохранение POST/PUT/DELETE запросов
- Автоматическая отправка при восстановлении соединения
- Локальное хранение в localStorage

## Зависимости между модулями

```
AuthModule -> UsersModule
ShipmentsModule -> SuppliersModule, CommonModule
SalesModule -> ClientsModule, InventoryModule, FinanceModule, CommonModule
BuybacksModule -> SalesModule, ClientsModule, InventoryModule, FinanceModule, NotificationsModule, CommonModule
FinanceModule -> (standalone)
ReportsModule -> (standalone, использует все модули через TypeORM)
NotificationsModule -> UsersModule, ClientsModule, BuybacksModule, CommonModule
InventoryModule -> ShipmentsModule
CommonModule -> (standalone, используется всеми модулями)
```

## Конфигурация

### Backend конфигурация
Файл: `apps/backend/src/config/configuration.ts`

**Переменные окружения:**
- `PORT` - Порт сервера (по умолчанию: 3000)
- `DB_HOST` - Хост базы данных
- `DB_PORT` - Порт базы данных (по умолчанию: 5432)
- `DB_USER` - Пользователь базы данных
- `DB_PASSWORD` - Пароль базы данных
- `DB_NAME` - Имя базы данных
- `JWT_SECRET` - Секретный ключ для JWT
- `JWT_ACCESS_TTL` - Время жизни access token (по умолчанию: 900s)
- `JWT_REFRESH_TTL` - Время жизни refresh token (по умолчанию: 7d)
- `SMTP_*` - Настройки SMTP (опционально)

### Frontend конфигурация
Файл: `apps/frontend/vite.config.ts`

**Переменные окружения:**
- `VITE_API_BASE_URL` - URL API сервера (по умолчанию: http://localhost:3000/api)

## Миграции базы данных

Миграции выполняются автоматически при старте приложения в production режиме или вручную через CLI:

```bash
# Генерация миграции
npm run migration:generate -- -n MigrationName

# Выполнение миграций
npm run migration:run

# Откат миграции
npm run migration:revert
```

## Тестирование

### Backend тесты
```bash
cd apps/backend
npm run test
```

### Frontend тесты
```bash
cd apps/frontend
npm run test
```

## Деплой

### Backend
1. Сборка проекта: `npm run build`
2. Запуск миграций: `npm run migration:run`
3. Запуск приложения: `npm run start:prod`

### Frontend
1. Сборка проекта: `npm run build`
2. Деплой статических файлов на сервер (nginx, Apache, etc.)

## Мониторинг и логирование

### Backend логирование
- Используется встроенный логгер NestJS
- Уровни логирования: error, warn, log, debug, verbose
- Логирование всех запросов и ошибок

### Frontend логирование
- Консольное логирование для разработки
- Обработка ошибок через глобальный error handler
- Логирование offline событий

## Безопасность

### Backend
- JWT токены с коротким временем жизни
- Refresh tokens для обновления access tokens
- Password hashing с bcrypt
- RBAC (Role-Based Access Control)
- Валидация всех входных данных
- Защита от SQL инъекций (TypeORM)
- CORS настройки

### Frontend
- Хранение токенов в localStorage
- Автоматическое обновление токенов
- Защита маршрутов (ProtectedRoute)
- Валидация форм
- Обработка ошибок

## Производительность

### Backend
- Кэширование запросов к базе данных
- Индексы на часто используемых полях
- Оптимизация запросов (eager loading, lazy loading)
- Транзакции для критических операций
- Pessimistic locking для обновления остатков

### Frontend
- Кэширование через TanStack Query
- Lazy loading компонентов
- Оптимизация bundle size
- Service Worker для кэширования статических ресурсов
- Offline очередь для запросов

