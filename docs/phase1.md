# Фаза 1 — Архитектура и проектирование

## 1. Детализация ER-диаграммы

### 1.1 Общие положения
- БД: PostgreSQL 15+, схема `public`.
- Обязательные поля аудита: `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()` (через триггер), `created_by`, `updated_by` (FK → `users.id`).
- Для справочников (`roles`, `accounts`, `suppliers`) используем soft constraints (UNIQUE по значимым полям).

### 1.2 Индексы и ограничения
- `users.email` — `UNIQUE`, B-tree индекс, lowercase constraint (через `citext`).
- `roles.name` — `UNIQUE`, check на фиксированный список.
- `shipments`: `supplier_id`, `arrival_date` — комбинированный индекс.
- `batches`: `shipment_id` FK ON DELETE CASCADE; `plant_type`, `size_cm_min`/`max`, `pot_type` — частичные индексы для фильтрации.
- `sale_items`: FK `sale_id` ON DELETE CASCADE, FK `batch_id` ON UPDATE NO ACTION; check `quantity > 0`.
- `buybacks`: FK `original_sale_id` ON DELETE SET NULL (если продажу удалили — запрещено, но страховка).
- `transactions`: enum `type` через CHECK; индекс по `created_at` и `account_id`; индекс на `linked_entity_type/id`.
- `notifications`: индекс по `user_id, is_read`, частичный индекс по `due_date` (`WHERE status='planned'`).
- Используем `uuid_generate_v4()` для внешних идентификаторов (опционально) — пока оставляем SERIAL, но фиксируем что миграции позволят перейти на UUID.

### 1.3 Представления и триггеры
- `vw_account_balances` — агрегация `transactions` по счетам.
- `vw_inventory_summary` — остатки по партиям (sum `quantity_current`, себестоимость).
- Триггеры:
  - Обновление `batches.quantity_current` при вставке/удалении `sale_items`, `write_offs`, `buyback_items`.
  - Авторасчёт `transactions.amount` для `partner_withdrawals` (товар оценивается по последней себестоимости партии).
  - Автообновление `updated_at` на всех таблицах.

## 2. REST API и OpenAPI 3.1

### 2.1 Структура
- Базовый URL: `/api/v1`.
- Формат ответов:
  ```json
  {
    "data": ...,
    "error": null,
    "meta": { "requestId": "uuid", "timestamp": "2025-11-11T10:00:00Z" }
  }
  ```
- Ошибки:
  ```json
  {
    "data": null,
    "error": { "code": "ENTITY_NOT_FOUND", "message": "..." }
  }
  ```
- Стандартизированные коды ошибок: `VALIDATION_ERROR`, `PERMISSION_DENIED`, `AUTH_REQUIRED`, `CONFLICT`, `INTERNAL_ERROR`.

### 2.2 Категории endpoint'ов
- `Auth`: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/change-password`.
- `Users & Roles`: `GET/POST /users`, `PATCH /users/{id}`, `GET /roles`.
- `Suppliers`: `GET /suppliers`, `POST /suppliers`.
- `Shipments & Batches`: CRUD, поиск, загрузка документов (`POST /shipments/{id}/documents`).
- `Inventory`: `/inventory/summary`, `/write-offs`.
- `Clients`: CRUD, фильтры (`?search=`, `?type=`).
- `Sales`: `POST /sales`, `GET /sales/{id}`, `GET /sales/{id}/documents`, `POST /sales/{id}/tasks/buyback`.
- `Buybacks`: CRUD, изменение статуса, `GET /buybacks/upcoming`.
- `Finance`: `/accounts`, `/transactions` (листинг и создание), `/partner-withdrawals`.
- `Reports`: `GET /reports/{name}`, `POST /reports/custom`.
- `Notifications`: `/notifications`, `/notifications/{id}/read`.

### 2.3 OpenAPI
- Создать `openapi/greencycle.yaml` (3.1).
- Описать компоненты схем:
  - `User`, `Role`, `Supplier`, `Shipment`, `Batch`, `Client`, `Sale`, `SaleItem`, `Buyback`, `BuybackItem`, `Account`, `Transaction`, `Notification`.
  - Общие схемы `PagedResponse`, `ErrorResponse`, `Meta`.
- Безопасность: `bearerAuth` (JWT), описана в разделе `components.securitySchemes`.
- План генерации: использовать `nestjs-swagger` для автогенерации на этапе реализации.

## 3. Ролевая модель (RBAC)

| Ресурс / Действие         | super_admin | admin | manager | accountant | logistic |
|--------------------------|-------------|-------|---------|------------|----------|
| Пользователи             | CRUD        | R     | –       | –          | –        |
| Роли                     | CRUD        | R     | –       | –          | –        |
| Поставщики               | CRUD        | CRUD  | C/R     | R          | R        |
| Поставки/Партии          | CRUD        | CRUD  | C/R     | R          | CRUD     |
| Склад (остатки/списания) | CRUD        | CRUD  | R       | R          | CRUD     |
| Клиенты                  | CRUD        | CRUD  | CRUD    | R          | R        |
| Продажи                  | CRUD        | CRUD  | CRUD    | R          | R        |
| Документы (PDF/Excel)    | CRUD        | CRUD  | CRUD    | CRUD       | R        |
| Выкуп                    | CRUD        | CRUD  | CRUD    | R          | CRUD     |
| Финансы (счета)          | CRUD        | CRUD  | R       | CRUD       | R        |
| Транзакции               | CRUD        | CRUD  | C/R     | CRUD       | C (write-off) |
| Изъятия партнёров        | CRUD        | CRUD  | –       | R          | –        |
| Отчёты                   | CRUD        | CRUD  | R       | CRUD       | R        |
| Уведомления              | CRUD        | CRUD  | CRUD    | CRUD       | CRUD     |

Примечания:
- super_admin имеет доступ к техническим настройкам (логирование, health-check endpoints).
- Возможность конфигурировать 2FA доступна только super_admin/admin для себя и подчинённых ролей.

## 4. UX-потоки и макеты

- Figma-проект «GreenCycle v1».
- Потоки:
  1. **Закупка → Склад**: создание поставки → добавление партий → подтверждение → проверка остатков.
  2. **Продажа → Выкуп**: поиск клиента → оформление продажи → автосоздание задачи выкупа → отслеживание статуса → завершение выкупа.
  3. **Финансы**: фиксация поступления/расхода → обновление балансов → просмотр отчёта.
  4. **Изъятие партнёра**: выбор партнёра → указание суммы/товара → отражение в транзакциях.
  5. **Уведомления**: получение напоминаний → переход к карточке клиента → смена статуса.
- Для каждого потока: отметить основные экраны, состояния (loading, empty, success, error), адаптивную версию.
- Визуальная система из `interfaceTZ.md`: тема Mantine, цвета `#2E7D32`, `#4CAF50`, фон `#F8F9FA`.

## 5. Выходные артефакты
- ER-диаграмма в draw.io или dbdiagram.io, включая индексы и ограничения.
- Черновик `openapi/greencycle.yaml`.
- Матрица прав в `docs/rbac.md`.
- Figma-макеты (ссылка: TODO добавить после подготовки).

