# Незавершенные задачи проекта GreenCycle

**Дата проверки:** 17 ноября 2025  
**Статус проекта:** Основная функциональность реализована, остались доработки

## Критические задачи (требуют реализации)

### 1. Смена пароля пользователя ⚠️ КРИТИЧНО
**Статус:** ✅ РЕАЛИЗОВАНО  
**Описание:** Функция смены пароля полностью реализована  
**Выполнено:**
- [x] Добавлен endpoint `PATCH /api/v1/users/me/password` в `UsersController`
- [x] Реализован метод `changePassword` в `UsersService` с проверкой текущего пароля
- [x] Подключен API в `ProfilePage.tsx` для реальной смены пароля
- [x] Добавлена валидация: минимальная длина пароля (6 символов), проверка текущего пароля, проверка что новый пароль отличается от текущего

**Реализованные файлы:**
- ✅ `apps/backend/src/users/dto/change-password.dto.ts` - создан
- ✅ `apps/backend/src/users/users.service.ts` - добавлен метод `changePassword`
- ✅ `apps/backend/src/users/users.controller.ts` - добавлен endpoint `PATCH /users/me/password`
- ✅ `apps/frontend/src/services/users.service.ts` - добавлен метод `changePassword`
- ✅ `apps/frontend/src/pages/ProfilePage.tsx` - интегрирован API для смены пароля

### 2. Двухфакторная аутентификация (2FA)
**Статус:** ❌ Не реализовано  
**Описание:** Упоминается в roadmap как опциональная функция, но не реализована  
**Требуется:**
- [ ] Добавить поле `twoFactorEnabled` и `twoFactorSecret` в `User` entity
- [ ] Создать миграцию для добавления полей 2FA
- [ ] Реализовать генерацию QR-кода для настройки 2FA
- [ ] Добавить endpoint для включения/отключения 2FA
- [ ] Добавить проверку 2FA при входе (если включена)
- [ ] Добавить UI для управления 2FA в `ProfilePage.tsx`

**Файлы для изменения:**
- `apps/backend/src/users/entities/user.entity.ts`
- `apps/backend/src/users/users.controller.ts`
- `apps/backend/src/users/users.service.ts`
- `apps/backend/src/auth/auth.service.ts`
- `apps/frontend/src/pages/ProfilePage.tsx`
- Создать миграцию для 2FA полей

## Важные задачи (рекомендуется реализовать)

### 3. Тестирование
**Статус:** ⚠️ Частично реализовано  
**Описание:** Добавлены базовые unit тесты для backend и frontend, требуется расширение покрытия  
**Выполнено:**
- [x] Настроен Jest для backend (`jest.config.cjs`)
- [x] Добавлены скрипты `test`, `test:watch`, `test:cov` в backend
- [x] Реализованы unit тесты для `AuthService` (валидация пользователя, login/refresh)
- [x] Реализованы unit тесты для `SalesService` (findAll, findOne с проверкой транзакций)
- [x] Настроен Vitest + Testing Library + jsdom для frontend
- [x] Добавлен пример компонетного теста (`DataViewToggle`) с поддержкой MantineProvider
- [x] Добавлены скрипты `test`, `test:watch` в frontend

**Требуется (следующие шаги):**
- [x] Расширить покрытие unit тестами критических сервисов (sales, finance, shipments) - **НАЧАТО** (добавлены тесты для SalesService)
- [ ] Добавить integration тесты API (e2e через Supertest / pactum)
- [ ] Добавить frontend unit/интеграционные тесты для страниц и хуков
- [ ] Настроить e2e (Playwright / Cypress) для ключевых пользовательских сценариев
- [x] Интегрировать тесты в CI/CD pipeline - **ВЫПОЛНЕНО** (тесты запускаются в GitHub Actions)

**Реализованные файлы:**
- ✅ `apps/backend/src/auth/auth.service.spec.ts` - unit тесты для AuthService
- ✅ `apps/backend/src/sales/sales.service.spec.ts` - unit тесты для SalesService (findAll, findOne)
- ✅ `apps/backend/src/shipments/shipments.service.spec.ts` - unit тесты для ShipmentsService (findAll, findOne)

**Команды:**
- Backend unit tests: `cd apps/backend && pnpm test` (или `pnpm test:cov`)
- Frontend unit tests: `cd apps/frontend && pnpm test`

**Приоритет:** Средний (можно отложить, но рекомендуется)

### 4. Документация API
**Статус:** ✅ РЕАЛИЗОВАНО  
**Описание:** Swagger/OpenAPI документация настроена и доступна  
**Выполнено:**
- [x] Установлен пакет `@nestjs/swagger`
- [x] Настроен SwaggerModule в `main.ts` с полной конфигурацией
- [x] Добавлены декораторы Swagger к контроллерам (на примере AuthController)
- [x] Добавлены декораторы ApiProperty к DTO для автоматической генерации схем
- [x] Настроена авторизация через Bearer Token в Swagger UI
- [x] Добавлены примеры запросов/ответов через декораторы
- [x] Добавлены описания кодов ошибок через @ApiResponse
- [x] Документация доступна по адресу: `http://localhost:3000/api/docs`

**Реализованные файлы:**
- ✅ `apps/backend/package.json` - добавлен `@nestjs/swagger`
- ✅ `apps/backend/src/main.ts` - настроен SwaggerModule с полной конфигурацией
- ✅ `apps/backend/src/auth/auth.controller.ts` - добавлены декораторы Swagger
- ✅ `apps/backend/src/auth/dto/login.dto.ts` - добавлены ApiProperty декораторы
- ✅ `apps/backend/src/auth/dto/token-pair.dto.ts` - добавлены ApiProperty декораторы
- ✅ `apps/backend/src/auth/dto/refresh-token.dto.ts` - добавлены ApiProperty декораторы

**Доступ к документации:**
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs-json`

**Примечание:** Для полной документации всех endpoints рекомендуется добавить декораторы Swagger к остальным контроллерам по аналогии с AuthController.

### 5. Настройки уведомлений пользователя
**Статус:** ✅ РЕАЛИЗОВАНО  
**Описание:** Система настроек уведомлений полностью реализована  
**Выполнено:**
- [x] Создана entity `UserNotificationSettings` с настройками для всех типов уведомлений
- [x] Создана миграция для таблицы `user_notification_settings`
- [x] Добавлены endpoints `GET /users/me/notification-settings` и `PATCH /users/me/notification-settings`
- [x] Добавлен UI в `ProfilePage.tsx` для управления настройками уведомлений
- [x] Интегрированы настройки с `NotificationsService` и `EmailService`

**Реализованные файлы:**
- ✅ `apps/backend/src/users/entities/user-notification-settings.entity.ts` - создана entity
- ✅ `apps/backend/src/migrations/1731600000000-CreateUserNotificationSettings.ts` - создана миграция
- ✅ `apps/backend/src/users/dto/update-notification-settings.dto.ts` - создан DTO
- ✅ `apps/backend/src/users/users.service.ts` - добавлены методы `getNotificationSettings` и `updateNotificationSettings`
- ✅ `apps/backend/src/users/users.controller.ts` - добавлены endpoints для работы с настройками
- ✅ `apps/backend/src/notifications/notifications.service.ts` - интегрирована проверка настроек перед отправкой email
- ✅ `apps/frontend/src/services/users.service.ts` - добавлены методы для работы с настройками
- ✅ `apps/frontend/src/pages/ProfilePage.tsx` - добавлен UI для управления настройками

**Доступные настройки:**
- Email уведомления (включить/выключить)
- Уведомления о выкупах (общее и по периодам: 60, 30, 7 дней)
- Уведомления о новых продажах
- Уведомления о новых поставках
- Уведомления о финансовых операциях

**Приоритет:** Низкий - ✅ ВЫПОЛНЕНО

## Задачи по улучшению (можно отложить)

### 6. Импорт данных из Excel
**Статус:** ⚠️ Частично реализовано  
**Описание:** Реализован импорт клиентов из Excel  
**Выполнено:**
- [x] Добавлен endpoint для импорта клиентов из Excel (`POST /clients/import`)
- [x] Добавлен UI для загрузки Excel файлов на странице клиентов
- [x] Добавлена валидация импортируемых данных
- [x] Добавлена обработка ошибок при импорте
- [x] Поддержка гибкого формата колонок (различные варианты названий)
- [x] Проверка дубликатов по email и телефону
- [x] Поддержка данных юридических лиц

**Реализованные файлы:**
- ✅ `apps/backend/src/clients/clients.service.ts` - добавлен метод `importFromExcel`
- ✅ `apps/backend/src/clients/clients.controller.ts` - добавлен endpoint `POST /clients/import`
- ✅ `apps/frontend/src/services/clients.service.ts` - добавлен метод `importFromExcel`
- ✅ `apps/frontend/src/pages/ClientsPage.tsx` - добавлен UI для импорта

**Требуется (следующие шаги):**
- [ ] Добавить endpoint для импорта поставок из Excel
- [ ] Добавить импорт других сущностей (продажи, выкупы)

**Приоритет:** Низкий - ⚠️ ЧАСТИЧНО ВЫПОЛНЕНО

### 7. Массовые операции
**Статус:** ⚠️ Частично реализовано  
**Описание:** Реализовано массовое удаление для клиентов и поставок  
**Выполнено:**
- [x] Добавлено массовое удаление для клиентов
- [x] Добавлено массовое удаление для поставок
- [x] Добавлен UI для выбора нескольких элементов (чекбоксы)
- [x] Добавлено подтверждение массовых операций
- [x] Добавлена обработка ошибок при массовом удалении

**Реализованные файлы:**
- ✅ `apps/backend/src/clients/dto/bulk-delete.dto.ts` - создан DTO для массового удаления
- ✅ `apps/backend/src/clients/clients.service.ts` - добавлен метод `bulkRemove`
- ✅ `apps/backend/src/clients/clients.controller.ts` - добавлен endpoint `POST /clients/bulk/delete`
- ✅ `apps/frontend/src/services/clients.service.ts` - добавлен метод `bulkDelete`
- ✅ `apps/frontend/src/pages/ClientsPage.tsx` - добавлен UI для массового удаления
- ✅ `apps/backend/src/shipments/dto/bulk-delete.dto.ts` - создан DTO для массового удаления поставок
- ✅ `apps/backend/src/shipments/shipments.service.ts` - добавлен метод `bulkRemove`
- ✅ `apps/backend/src/shipments/shipments.controller.ts` - добавлен endpoint `POST /shipments/bulk/delete`
- ✅ `apps/frontend/src/services/shipments.service.ts` - добавлен метод `bulkDelete`
- ✅ `apps/frontend/src/pages/ShipmentsPage.tsx` - добавлен UI для массового удаления

**Требуется (следующие шаги):**
- [ ] Добавить массовое удаление для продаж
- [ ] Добавить массовое изменение статуса для выкупов
- [ ] Добавить массовые операции для других сущностей

**Приоритет:** Низкий - ⚠️ ЧАСТИЧНО ВЫПОЛНЕНО

### 8. Дополнительные отчёты
**Статус:** ⚠️ Частично реализовано  
**Описание:** Есть базовые отчёты, добавлен отчёт по продажам по периодам  
**Выполнено:**
- [x] Добавлен отчёт по продажам по периодам (группировка по дням/неделям/месяцам)
- [x] Добавлена возможность фильтрации по датам и клиентам
- [x] Добавлен экспорт в Excel для нового отчёта
- [x] Добавлен UI для выбора группировки (день/неделя/месяц)

**Реализованные файлы:**
- ✅ `apps/backend/src/reports/reports.service.ts` - добавлен метод `getSalesByPeriod`
- ✅ `apps/backend/src/reports/reports.controller.ts` - добавлен endpoint `GET /reports/sales-by-period`
- ✅ `apps/backend/src/reports/dto/report-params.dto.ts` - добавлен параметр `groupBy`
- ✅ `apps/frontend/src/services/reports.service.ts` - добавлен метод `getSalesByPeriod`
- ✅ `apps/frontend/src/types/reports.ts` - добавлен тип `SalesByPeriodItem`
- ✅ `apps/frontend/src/pages/ReportsPage.tsx` - добавлена вкладка "Продажи по периодам"

**Выполнено:**
- [x] Добавлен отчёт по прибыльности по типам растений
- [x] Добавлена возможность фильтрации по датам и клиентам
- [x] Добавлен экспорт в Excel для нового отчёта

**Реализованные файлы:**
- ✅ `apps/backend/src/reports/reports.service.ts` - добавлен метод `getProfitByPlantType`
- ✅ `apps/backend/src/reports/reports.controller.ts` - добавлен endpoint `GET /reports/profit-by-plant-type`
- ✅ `apps/frontend/src/services/reports.service.ts` - добавлен метод `getProfitByPlantType`
- ✅ `apps/frontend/src/types/reports.ts` - добавлен тип `ProfitByPlantTypeItem`
- ✅ `apps/frontend/src/pages/ReportsPage.tsx` - добавлена вкладка "Прибыльность по типам растений"

**Выполнено:**
- [x] Добавлен отчёт по возвратам и списаниям
- [x] Добавлена возможность фильтрации по датам и клиентам
- [x] Добавлен экспорт в Excel для нового отчёта
- [x] Разделение на возвраты (COMPLETED) и списания (DECLINED)

**Реализованные файлы:**
- ✅ `apps/backend/src/reports/reports.service.ts` - добавлен метод `getReturnsAndWriteoffs`
- ✅ `apps/backend/src/reports/reports.controller.ts` - добавлен endpoint `GET /reports/returns-and-writeoffs`
- ✅ `apps/frontend/src/services/reports.service.ts` - добавлен метод `getReturnsAndWriteoffs`
- ✅ `apps/frontend/src/types/reports.ts` - добавлен тип `ReturnsAndWriteoffsItem`
- ✅ `apps/frontend/src/pages/ReportsPage.tsx` - добавлена вкладка "Возвраты и списания"

**Выполнено:**
- [x] Установлена библиотека Recharts для графиков
- [x] Добавлен график динамики продаж (линейный график) в отчёт "Продажи по периодам"
- [x] Добавлен график движения денежных средств (столбчатый график) в отчёт "Движение средств"
- [x] Добавлен график прибыльности по типам растений (столбчатый график) в соответствующий отчёт

**Реализованные файлы:**
- ✅ `apps/frontend/package.json` - добавлена зависимость `recharts`
- ✅ `apps/frontend/src/pages/ReportsPage.tsx` - добавлены графики в отчёты

**Требуется:**
- [ ] Графики выкупов
- [ ] Прогнозирование на основе исторических данных

**Приоритет:** Низкий

### 9. Аналитика и дашборды
**Статус:** ⚠️ Частично реализовано  
**Описание:** Есть базовый дашборд, добавлены графики в отчёты  
**Выполнено:**
- [x] Установлена библиотека Recharts для графиков
- [x] Добавлен график динамики продаж (линейный график) в отчёт "Продажи по периодам"
- [x] Добавлен график движения денежных средств (столбчатый график) в отчёт "Движение средств"
- [x] Добавлен график прибыльности по типам растений (столбчатый график)

**Реализованные файлы:**
- ✅ `apps/frontend/package.json` - добавлена зависимость `recharts`
- ✅ `apps/frontend/src/pages/ReportsPage.tsx` - добавлены графики в отчёты

**Требуется:**
- [ ] Графики выкупов
- [ ] Прогнозирование на основе исторических данных
- [ ] Дополнительные графики на дашборде

**Приоритет:** Низкий

## Технические улучшения

### 10. Мониторинг и логирование
**Статус:** ⚠️ Частично реализовано  
**Описание:** Базовое структурированное логирование настроено  
**Выполнено:**
- [x] Установлен и настроен Pino logger (nestjs-pino)
- [x] Настроено структурированное логирование HTTP запросов
- [x] Настроено логирование ошибок в AllExceptionsFilter с контекстом
- [x] Добавлена поддержка pretty-printing для development окружения
- [x] Настроено автоматическое логирование запросов (кроме статических файлов)
- [x] Добавлено логирование SQL ошибок с контекстом

**Осталось:**
- [ ] Настроить мониторинг ошибок (Sentry, Rollbar) - опционально
- [ ] Настроить мониторинг производительности - опционально
- [ ] Настроить алерты для критических ошибок - опционально

**Реализованные файлы:**
- ✅ `apps/backend/package.json` - добавлены `nestjs-pino`, `pino-http`, `pino-pretty`
- ✅ `apps/backend/src/modules/app.module.ts` - настроен LoggerModule с Pino
- ✅ `apps/backend/src/common/filters/all-exceptions.filter.ts` - обновлен для использования Pino logger

**Особенности:**
- Структурированное логирование в JSON формате (production)
- Pretty-printing для удобного чтения в development
- Автоматическое логирование всех HTTP запросов
- Логирование ошибок с полным контекстом (status, method, url, userId, ip, userAgent)
- Разделение критических (5xx) и клиентских (4xx) ошибок
- Игнорирование запросов к статическим файлам и документации

**Приоритет:** Средний - ✅ БАЗОВАЯ РЕАЛИЗАЦИЯ ВЫПОЛНЕНА

### 11. Кэширование (Redis)
**Статус:** ⚠️ Частично реализовано  
**Описание:** Настроено базовое кэширование с использованием CacheModule  
**Выполнено:**
- [x] Установлены пакеты для кэширования (`@nestjs/cache-manager`, `cache-manager`)
- [x] Настроен CacheModule в AppModule (используется memory store по умолчанию)
- [x] Добавлено кэширование для списка клиентов (`findAll`)
- [x] Добавлена инвалидация кэша при создании, обновлении и удалении клиентов
- [x] Добавлена инвалидация кэша при массовых операциях и импорте

**Реализованные файлы:**
- ✅ `apps/backend/src/modules/app.module.ts` - настроен CacheModule
- ✅ `apps/backend/src/clients/clients.service.ts` - добавлено кэширование и инвалидация

**Требуется (следующие шаги):**
- [ ] Переключиться на Redis store вместо memory store (для production)
- [ ] Добавить кэширование для других сущностей (поставки, продажи, выкупы)
- [ ] Настроить TTL для разных типов данных
- [ ] Добавить метрики кэширования (hit/miss rate)

**Приоритет:** Низкий - ⚠️ ЧАСТИЧНО ВЫПОЛНЕНО

### 12. Rate Limiting
**Статус:** ✅ РЕАЛИЗОВАНО  
**Описание:** Защита от DDoS и злоупотреблений реализована  
**Выполнено:**
- [x] Установлен пакет `@nestjs/throttler`
- [x] Настроен глобальный ThrottlerGuard для всех API endpoints (100 запросов в 60 секунд по умолчанию)
- [x] Настроен строгий rate limiting для аутентификации (5 запросов в 60 секунд для login и refresh)
- [x] Добавлена защита от brute force атак на endpoints аутентификации
- [x] Настроена конфигурация через переменные окружения

**Реализованные файлы:**
- ✅ `apps/backend/package.json` - добавлен `@nestjs/throttler`
- ✅ `apps/backend/src/config/configuration.ts` - добавлена конфигурация throttler
- ✅ `apps/backend/src/modules/app.module.ts` - настроен ThrottlerModule и глобальный ThrottlerGuard
- ✅ `apps/backend/src/auth/auth.controller.ts` - добавлен строгий rate limiting для login и refresh

**Переменные окружения:**
- `THROTTLER_TTL` - время окна в секундах (по умолчанию: 60)
- `THROTTLER_LIMIT` - лимит запросов для обычных endpoints (по умолчанию: 100)
- `THROTTLER_AUTH_LIMIT` - лимит запросов для аутентификации (по умолчанию: 5)
- `THROTTLER_AUTH_TTL` - время окна для аутентификации в секундах (по умолчанию: 60)

**Приоритет:** Средний - ✅ ВЫПОЛНЕНО

### 13. SSL сертификаты
**Статус:** ❌ Не реализовано (для production)  
**Описание:** Нужно для production окружения  
**Требуется:**
- [ ] Настроить SSL сертификаты для production
- [ ] Настроить HTTPS для API
- [ ] Настроить HTTPS для frontend

**Приоритет:** Высокий (для production)

## Деплой и инфраструктура

### 14. Production окружение
**Статус:** ❌ Не настроено  
**Описание:** Нет конфигурации для production  
**Требуется:**
- [ ] Настроить production переменные окружения
- [ ] Настроить production базу данных
- [ ] Настроить production сборку frontend
- [ ] Настроить production сборку backend
- [ ] Настроить reverse proxy (Nginx)
- [ ] Настроить резервное копирование БД

**Приоритет:** Высокий (для production)

### 15. CI/CD
**Статус:** ✅ РЕАЛИЗОВАНО  
**Описание:** GitHub Actions CI настроен для автоматизации проверок и сборки  
**Выполнено:**
- [x] Настроен GitHub Actions workflow (`.github/workflows/ci.yml`)
- [x] Настроен автоматический запуск тестов для backend и frontend
- [x] Настроена автоматическая проверка линтинга
- [x] Настроена автоматическая проверка типов (TypeScript)
- [x] Настроена автоматическая сборка backend и frontend
- [x] Настроен PostgreSQL сервис для тестов backend
- [x] Workflow запускается на push и pull request в main/develop ветки

**Реализованные файлы:**
- ✅ `.github/workflows/ci.yml` - полный CI workflow с параллельными jobs

**Jobs в workflow:**
1. **lint** - проверка линтинга для backend и frontend
2. **typecheck** - проверка типов TypeScript для обоих проектов
3. **test-backend** - запуск unit тестов backend с PostgreSQL сервисом
4. **test-frontend** - запуск unit тестов frontend
5. **build-backend** - сборка backend проекта
6. **build-frontend** - сборка frontend проекта

**Особенности:**
- Параллельное выполнение jobs для ускорения CI
- Кэширование зависимостей через pnpm
- Использование PostgreSQL сервиса для тестов backend
- Автоматический запуск на push и pull request
- Генерация coverage reports для backend и frontend
- Загрузка coverage reports как артефакты GitHub Actions (хранение 30 дней)
- Интеграция с Codecov для визуализации coverage (опционально, требует токен)

**Coverage Reports:**
- Backend: генерируется через Jest с форматами text, json, html, lcov
- Frontend: генерируется через Vitest с форматами text, json, html
- Отчеты доступны как артефакты в GitHub Actions
- Можно настроить Codecov для визуализации (требует `CODECOV_TOKEN` в secrets)

**Осталось (опционально):**
- [ ] Настроить автоматический деплой (можно добавить отдельный workflow)
- [x] Настроить coverage reports - **ВЫПОЛНЕНО** (добавлена генерация и загрузка coverage reports)
- [ ] Настроить уведомления о статусе CI

**Приоритет:** Средний - ✅ ВЫПОЛНЕНО

## Резюме

### Критические задачи (требуют немедленной реализации)
1. ✅ Смена пароля пользователя - **ВЫПОЛНЕНО**
2. ⚠️ 2FA (опционально, но упоминается в roadmap)

### Важные задачи (рекомендуется реализовать)
3. ⚠️ Тестирование
4. ✅ Документация API - **ВЫПОЛНЕНО** (Swagger настроен)
5. ✅ Настройки уведомлений пользователя - **ВЫПОЛНЕНО**

### Задачи по улучшению (можно отложить)
6. Импорт данных из Excel
7. ⚠️ Массовые операции - **ЧАСТИЧНО ВЫПОЛНЕНО** (реализовано для клиентов)
8. Дополнительные отчёты
9. Аналитика и дашборды

### Технические улучшения
10. ✅ Мониторинг и логирование - **ВЫПОЛНЕНО** (Pino настроен)
11. ⚠️ Кэширование (Redis) - **ЧАСТИЧНО ВЫПОЛНЕНО** (базовая настройка с memory store, кэширование для клиентов)
12. ✅ Rate Limiting - **ВЫПОЛНЕНО**
13. SSL сертификаты

### Деплой и инфраструктура
14. Production окружение
15. CI/CD

## Приоритеты

**Высокий приоритет (для production):**
- Смена пароля
- Production окружение
- SSL сертификаты

**Средний приоритет:**
- ⚠️ Тестирование - **БАЗОВАЯ НАСТРОЙКА ВЫПОЛНЕНА** (Jest + Vitest настроены)
- ⚠️ Мониторинг и логирование - **БАЗОВАЯ РЕАЛИЗАЦИЯ ВЫПОЛНЕНА** (Pino настроен)
- ✅ Rate Limiting - **ВЫПОЛНЕНО**
- ✅ CI/CD - **ВЫПОЛНЕНО** (GitHub Actions настроен)

**Низкий приоритет (можно отложить):**
- 2FA
- Настройки уведомлений
- Импорт данных
- Массовые операции
- Дополнительные отчёты
- Аналитика
- Кэширование

---

**Примечание:** Большинство основных функций реализованы согласно roadmap. Оставшиеся задачи в основном касаются улучшений, тестирования и подготовки к production.

