# Структура базы данных GreenCycle

## Обзор

База данных использует PostgreSQL 15+ с TypeORM для управления схемой. Все таблицы имеют поля аудита (`created_at`, `updated_at`, `created_by_id`, `updated_by_id`).

## Таблицы

### roles

Роли пользователей системы.

| Поле        | Тип         | Описание                                                          |
| ----------- | ----------- | ----------------------------------------------------------------- |
| id          | SERIAL      | Первичный ключ                                                    |
| name        | VARCHAR(50) | Название роли (super_admin, admin, manager, accountant, logistic) |
| description | TEXT        | Описание роли                                                     |
| created_at  | TIMESTAMP   | Дата создания                                                     |
| updated_at  | TIMESTAMP   | Дата обновления                                                   |

**Индексы:**

- `UNIQUE(name)`

### users

Пользователи системы.

| Поле          | Тип          | Описание                 |
| ------------- | ------------ | ------------------------ |
| id            | SERIAL       | Первичный ключ           |
| email         | VARCHAR(255) | Email пользователя       |
| password_hash | VARCHAR(255) | Хеш пароля (bcrypt)      |
| full_name     | VARCHAR(255) | Полное имя               |
| role_id       | INTEGER      | Внешний ключ на roles.id |
| created_at    | TIMESTAMP    | Дата создания            |
| updated_at    | TIMESTAMP    | Дата обновления          |
| created_by_id | INTEGER      | ID создателя             |
| updated_by_id | INTEGER      | ID обновителя            |

**Индексы:**

- `UNIQUE(email)`
- `FK(role_id) -> roles(id)`

### suppliers

Поставщики.

| Поле          | Тип          | Описание              |
| ------------- | ------------ | --------------------- |
| id            | SERIAL       | Первичный ключ        |
| name          | VARCHAR(255) | Название поставщика   |
| contact_info  | TEXT         | Контактная информация |
| address       | TEXT         | Адрес                 |
| created_at    | TIMESTAMP    | Дата создания         |
| updated_at    | TIMESTAMP    | Дата обновления       |
| created_by_id | INTEGER      | ID создателя          |
| updated_by_id | INTEGER      | ID обновителя         |

**Индексы:**

- `IDX_suppliers_name` на `name`

### shipments

Поставки.

| Поле          | Тип           | Описание                     |
| ------------- | ------------- | ---------------------------- |
| id            | SERIAL        | Первичный ключ               |
| supplier_id   | INTEGER       | Внешний ключ на suppliers.id |
| arrival_date  | DATE          | Дата прибытия                |
| total_cost    | DECIMAL(15,2) | Общая стоимость              |
| created_at    | TIMESTAMP     | Дата создания                |
| updated_at    | TIMESTAMP     | Дата обновления              |
| created_by_id | INTEGER       | ID создателя                 |
| updated_by_id | INTEGER       | ID обновителя                |

**Индексы:**

- `FK(supplier_id) -> suppliers(id)`
- `IDX_shipments_arrival_date` на `arrival_date`

### batches

Партии товаров.

| Поле                    | Тип           | Описание                     |
| ----------------------- | ------------- | ---------------------------- |
| id                      | SERIAL        | Первичный ключ               |
| shipment_id             | INTEGER       | Внешний ключ на shipments.id |
| plant_type              | VARCHAR(100)  | Тип растения                 |
| size_cm_min             | INTEGER       | Минимальный размер (см)      |
| size_cm_max             | INTEGER       | Максимальный размер (см)     |
| pot_type                | VARCHAR(50)   | Тип горшка                   |
| quantity_initial        | INTEGER       | Начальное количество         |
| quantity_current        | INTEGER       | Текущее количество           |
| purchase_price_per_unit | DECIMAL(10,2) | Закупочная цена за единицу   |
| created_at              | TIMESTAMP     | Дата создания                |
| updated_at              | TIMESTAMP     | Дата обновления              |
| created_by_id           | INTEGER       | ID создателя                 |
| updated_by_id           | INTEGER       | ID обновителя                |

**Индексы:**

- `FK(shipment_id) -> shipments(id)`
- `IDX_batches_plant_type` на `plant_type`
- `CHECK(quantity_current >= 0)`
- `CHECK(quantity_current <= quantity_initial)`

### write_offs

Списания товаров.

| Поле          | Тип       | Описание                   |
| ------------- | --------- | -------------------------- |
| id            | SERIAL    | Первичный ключ             |
| batch_id      | INTEGER   | Внешний ключ на batches.id |
| quantity      | INTEGER   | Количество                 |
| reason        | TEXT      | Причина списания           |
| created_at    | TIMESTAMP | Дата создания              |
| updated_at    | TIMESTAMP | Дата обновления            |
| created_by_id | INTEGER   | ID создателя               |
| updated_by_id | INTEGER   | ID обновителя              |

**Индексы:**

- `FK(batch_id) -> batches(id)`

### clients

Клиенты.

| Поле          | Тип          | Описание              |
| ------------- | ------------ | --------------------- |
| id            | SERIAL       | Первичный ключ        |
| full_name     | VARCHAR(255) | Полное имя            |
| contact_info  | TEXT         | Контактная информация |
| address_full  | TEXT         | Полный адрес          |
| tax_id        | VARCHAR(20)  | ИНН                   |
| notes         | TEXT         | Заметки               |
| created_at    | TIMESTAMP    | Дата создания         |
| updated_at    | TIMESTAMP    | Дата обновления       |
| created_by_id | INTEGER      | ID создателя          |
| updated_by_id | INTEGER      | ID обновителя         |

**Индексы:**

- `IDX_clients_full_name` на `full_name`
- `IDX_clients_tax_id` на `tax_id`

### sales

Продажи.

| Поле          | Тип           | Описание                   |
| ------------- | ------------- | -------------------------- |
| id            | SERIAL        | Первичный ключ             |
| client_id     | INTEGER       | Внешний ключ на clients.id |
| sale_date     | DATE          | Дата продажи               |
| total_amount  | DECIMAL(15,2) | Общая сумма                |
| is_cancelled  | BOOLEAN       | Отменена ли продажа        |
| cancelled_at  | TIMESTAMP     | Дата отмены                |
| created_at    | TIMESTAMP     | Дата создания              |
| updated_at    | TIMESTAMP     | Дата обновления            |
| created_by_id | INTEGER       | ID создателя               |
| updated_by_id | INTEGER       | ID обновителя              |

**Индексы:**

- `FK(client_id) -> clients(id)`
- `IDX_sales_sale_date` на `sale_date`
- `IDX_sales_is_cancelled` на `is_cancelled`

### sale_items

Позиции продажи.

| Поле                | Тип           | Описание                   |
| ------------------- | ------------- | -------------------------- |
| id                  | SERIAL        | Первичный ключ             |
| sale_id             | INTEGER       | Внешний ключ на sales.id   |
| batch_id            | INTEGER       | Внешний ключ на batches.id |
| quantity            | INTEGER       | Количество                 |
| sale_price_per_unit | DECIMAL(10,2) | Цена продажи за единицу    |
| created_at          | TIMESTAMP     | Дата создания              |
| updated_at          | TIMESTAMP     | Дата обновления            |
| created_by_id       | INTEGER       | ID создателя               |
| updated_by_id       | INTEGER       | ID обновителя              |

**Индексы:**

- `FK(sale_id) -> sales(id)`
- `FK(batch_id) -> batches(id)`

### buybacks

Выкупы.

| Поле             | Тип       | Описание                                         |
| ---------------- | --------- | ------------------------------------------------ |
| id               | SERIAL    | Первичный ключ                                   |
| original_sale_id | INTEGER   | Внешний ключ на sales.id                         |
| client_id        | INTEGER   | Внешний ключ на clients.id                       |
| planned_date     | DATE      | Планируемая дата выкупа                          |
| actual_date      | DATE      | Фактическая дата выкупа                          |
| status           | ENUM      | Статус (planned, contacted, declined, completed) |
| notes            | TEXT      | Заметки                                          |
| created_at       | TIMESTAMP | Дата создания                                    |
| updated_at       | TIMESTAMP | Дата обновления                                  |
| created_by_id    | INTEGER   | ID создателя                                     |
| updated_by_id    | INTEGER   | ID обновителя                                    |

**Индексы:**

- `FK(original_sale_id) -> sales(id)`
- `FK(client_id) -> clients(id)`
- `IDX_buybacks_planned_date` на `planned_date`
- `IDX_buybacks_status` на `status`

### buyback_items

Позиции выкупа.

| Поле                   | Тип           | Описание                      |
| ---------------------- | ------------- | ----------------------------- |
| id                     | SERIAL        | Первичный ключ                |
| buyback_id             | INTEGER       | Внешний ключ на buybacks.id   |
| original_sale_item_id  | INTEGER       | Внешний ключ на sale_items.id |
| quantity               | INTEGER       | Количество                    |
| buyback_price_per_unit | DECIMAL(10,2) | Цена выкупа за единицу        |
| condition_notes        | TEXT          | Заметки о состоянии           |
| created_at             | TIMESTAMP     | Дата создания                 |
| updated_at             | TIMESTAMP     | Дата обновления               |
| created_by_id          | INTEGER       | ID создателя                  |
| updated_by_id          | INTEGER       | ID обновителя                 |

**Индексы:**

- `FK(buyback_id) -> buybacks(id)`
- `FK(original_sale_item_id) -> sale_items(id)`

### accounts

Счета.

| Поле          | Тип           | Описание                     |
| ------------- | ------------- | ---------------------------- |
| id            | SERIAL        | Первичный ключ               |
| name          | VARCHAR(255)  | Название счёта               |
| type          | ENUM          | Тип счёта (cash, bank, card) |
| balance       | DECIMAL(15,2) | Баланс                       |
| created_at    | TIMESTAMP     | Дата создания                |
| updated_at    | TIMESTAMP     | Дата обновления              |
| created_by_id | INTEGER       | ID создателя                 |
| updated_by_id | INTEGER       | ID обновителя                |

**Индексы:**

- `IDX_accounts_type` на `type`

### transactions

Транзакции.

| Поле               | Тип           | Описание                                  |
| ------------------ | ------------- | ----------------------------------------- |
| id                 | SERIAL        | Первичный ключ                            |
| account_id         | INTEGER       | Внешний ключ на accounts.id               |
| type               | ENUM          | Тип транзакции (income, expense)          |
| amount             | DECIMAL(15,2) | Сумма                                     |
| description        | TEXT          | Описание                                  |
| related_sale_id    | INTEGER       | Внешний ключ на sales.id (опционально)    |
| related_buyback_id | INTEGER       | Внешний ключ на buybacks.id (опционально) |
| created_at         | TIMESTAMP     | Дата создания                             |
| updated_at         | TIMESTAMP     | Дата обновления                           |
| created_by_id      | INTEGER       | ID создателя                              |
| updated_by_id      | INTEGER       | ID обновителя                             |

**Индексы:**

- `FK(account_id) -> accounts(id)`
- `FK(related_sale_id) -> sales(id)`
- `FK(related_buyback_id) -> buybacks(id)`
- `IDX_transactions_type` на `type`
- `IDX_transactions_created_at` на `created_at`

### partner_withdrawals

Изъятия партнёров.

| Поле          | Тип           | Описание                    |
| ------------- | ------------- | --------------------------- |
| id            | SERIAL        | Первичный ключ              |
| account_id    | INTEGER       | Внешний ключ на accounts.id |
| amount        | DECIMAL(15,2) | Сумма                       |
| description   | TEXT          | Описание                    |
| created_at    | TIMESTAMP     | Дата создания               |
| updated_at    | TIMESTAMP     | Дата обновления             |
| created_by_id | INTEGER       | ID создателя                |
| updated_by_id | INTEGER       | ID обновителя               |

**Индексы:**

- `FK(account_id) -> accounts(id)`
- `IDX_partner_withdrawals_created_at` на `created_at`

### notifications

Уведомления.

| Поле          | Тип       | Описание                                  |
| ------------- | --------- | ----------------------------------------- |
| id            | SERIAL    | Первичный ключ                            |
| user_id       | INTEGER   | Внешний ключ на users.id                  |
| client_id     | INTEGER   | Внешний ключ на clients.id (опционально)  |
| buyback_id    | INTEGER   | Внешний ключ на buybacks.id (опционально) |
| message       | TEXT      | Сообщение                                 |
| is_read       | BOOLEAN   | Прочитано ли                              |
| due_date      | DATE      | Дата события                              |
| created_at    | TIMESTAMP | Дата создания                             |
| updated_at    | TIMESTAMP | Дата обновления                           |
| created_by_id | INTEGER   | ID создателя                              |
| updated_by_id | INTEGER   | ID обновителя                             |

**Индексы:**

- `FK(user_id) -> users(id)`
- `FK(client_id) -> clients(id)`
- `FK(buyback_id) -> buybacks(id)`
- `IDX_notifications_user_id` на `user_id`
- `IDX_notifications_is_read` на `is_read`
- `IDX_notifications_due_date` на `due_date`

## Связи между таблицами

```
users -> roles (many-to-one)
users -> users (created_by_id, updated_by_id - self-reference)

suppliers -> shipments (one-to-many)
shipments -> batches (one-to-many)
batches -> write_offs (one-to-many)
batches -> sale_items (one-to-many)

clients -> sales (one-to-many)
sales -> sale_items (one-to-many)
sales -> buybacks (one-to-many)
sale_items -> buyback_items (one-to-many)
buybacks -> buyback_items (one-to-many)

accounts -> transactions (one-to-many)
accounts -> partner_withdrawals (one-to-many)
sales -> transactions (one-to-many, optional)
buybacks -> transactions (one-to-many, optional)

users -> notifications (one-to-many)
clients -> notifications (one-to-many, optional)
buybacks -> notifications (one-to-many, optional)
```

## Триггеры и ограничения

### Автоматическое обновление quantity_current

При создании списания (`write_offs`) автоматически уменьшается `quantity_current` в соответствующей партии (`batches`).

### Автоматическое обновление баланса счёта

При создании транзакции автоматически обновляется баланс счёта:

- `income` - увеличивает баланс
- `expense` - уменьшает баланс

### Ограничения

- `quantity_current >= 0` - количество не может быть отрицательным
- `quantity_current <= quantity_initial` - текущее количество не может превышать начальное
- `UNIQUE(email)` - email должен быть уникальным
- `UNIQUE(tax_id)` - ИНН должен быть уникальным (если указан)

## Миграции

Миграции находятся в `apps/backend/src/migrations/`:

1. `1731400000000-InitRolesAndUsers.ts` - Инициализация ролей и пользователей
2. `1731406000000-CreateSuppliersShipmentsBatches.ts` - Создание таблиц поставщиков, поставок и партий
3. `1731407000000-CreateWriteOffs.ts` - Создание таблицы списаний
4. `1731408000000-CreateClients.ts` - Создание таблицы клиентов
5. `1731409000000-CreateSales.ts` - Создание таблиц продаж и позиций продаж
6. `1731410000000-CreateBuybacks.ts` - Создание таблиц выкупов и позиций выкупов
7. `1731411000000-CreateFinance.ts` - Создание таблиц финансов (счета, транзакции, изъятия)
8. `1731412000000-CreateNotifications.ts` - Создание таблицы уведомлений

## Резервное копирование

Рекомендуется настроить автоматическое резервное копирование базы данных PostgreSQL:

```bash
# Пример команды для резервного копирования
pg_dump -U greencycle -d greencycle -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

## Восстановление

```bash
# Пример команды для восстановления
pg_restore -U greencycle -d greencycle -c backup_YYYYMMDD_HHMMSS.dump
```
