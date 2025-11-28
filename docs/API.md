# API Документация GreenCycle

## Базовый URL
```
http://localhost:3000/api
```

## Аутентификация

Все запросы (кроме `/auth/login` и `/auth/refresh`) требуют JWT токен в заголовке:
```
Authorization: Bearer <access_token>
```

### Получение токена

#### POST /auth/login
Авторизация пользователя.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/refresh
Обновление access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Роли и права доступа

- **super_admin** - Супер-администратор (полный доступ)
- **admin** - Администратор (полный доступ)
- **manager** - Менеджер (продажи, клиенты, выкупы)
- **accountant** - Бухгалтер (финансы, отчёты)
- **logistic** - Логист (закупки, склад)

## Пользователи

### GET /users/me
Получить информацию о текущем пользователе.

**Требуемые роли:** все авторизованные пользователи

**Response:**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Иван Иванов",
    "role": {
      "id": 1,
      "name": "admin"
    }
  }
}
```

## Поставщики

### POST /suppliers
Создать поставщика.

**Требуемые роли:** admin, super_admin, logistic

**Request Body:**
```json
{
  "name": "ООО Поставщик",
  "contactInfo": "email@example.com, +7 (999) 123-45-67",
  "address": "г. Москва, ул. Примерная, д. 1"
}
```

### GET /suppliers
Получить список поставщиков.

**Требуемые роли:** admin, super_admin, logistic, accountant

**Query Parameters:**
- `search` (optional) - Поиск по имени или контактной информации

### GET /suppliers/:id
Получить поставщика по ID.

**Требуемые роли:** admin, super_admin, logistic, accountant

### PATCH /suppliers/:id
Обновить поставщика.

**Требуемые роли:** admin, super_admin

**Request Body:**
```json
{
  "name": "ООО Поставщик Обновлённый",
  "contactInfo": "new-email@example.com",
  "address": "г. Москва, ул. Новая, д. 2"
}
```

### DELETE /suppliers/:id
Удалить поставщика.

**Требуемые роли:** admin, super_admin

## Поставки

### POST /shipments
Создать поставку.

**Требуемые роли:** admin, super_admin, logistic

**Request Body:**
```json
{
  "supplierId": 1,
  "arrivalDate": "2025-01-15",
  "batches": [
    {
      "plantType": "Туя",
      "sizeCmMin": 30,
      "sizeCmMax": 40,
      "potType": "P9",
      "quantityInitial": 100,
      "purchasePricePerUnit": 150.00
    }
  ]
}
```

### GET /shipments
Получить список поставок.

**Требуемые роли:** admin, super_admin, logistic, accountant

### GET /shipments/:id
Получить поставку по ID.

**Требуемые роли:** admin, super_admin, logistic, accountant

### GET /shipments/:id/document
Скачать накладную в PDF.

**Требуемые роли:** admin, super_admin, logistic, accountant

## Клиенты

### POST /clients
Создать клиента.

**Требуемые роли:** admin, super_admin, manager

**Request Body:**
```json
{
  "fullName": "ИП Петров",
  "contactInfo": "petrov@example.com, +7 (999) 123-45-67",
  "addressFull": "г. Москва, ул. Клиентская, д. 10",
  "taxId": "123456789012",
  "notes": "Постоянный клиент"
}
```

### GET /clients
Получить список клиентов.

**Требуемые роли:** admin, super_admin, manager, accountant

**Query Parameters:**
- `search` (optional) - Поиск по имени или контактной информации

### GET /clients/:id
Получить клиента по ID.

**Требуемые роли:** admin, super_admin, manager, accountant

### PATCH /clients/:id
Обновить клиента.

**Требуемые роли:** admin, super_admin, manager

### DELETE /clients/:id
Удалить клиента.

**Требуемые роли:** admin, super_admin

## Продажи

### POST /sales
Создать продажу.

**Требуемые роли:** admin, super_admin, manager

**Request Body:**
```json
{
  "clientId": 1,
  "saleDate": "2025-01-20",
  "items": [
    {
      "batchId": 1,
      "quantity": 10,
      "salePricePerUnit": 200.00
    }
  ]
}
```

### GET /sales
Получить список продаж.

**Требуемые роли:** admin, super_admin, manager, accountant

### GET /sales/:id
Получить продажу по ID.

**Требуемые роли:** admin, super_admin, manager, accountant

### PATCH /sales/:id/cancel
Отменить продажу.

**Требуемые роли:** admin, super_admin

### GET /sales/:id/invoice
Скачать счёт в PDF.

**Требуемые роли:** admin, super_admin, manager, accountant

## Выкупы

### POST /buybacks
Создать выкуп.

**Требуемые роли:** admin, super_admin, manager

**Request Body:**
```json
{
  "originalSaleId": 1,
  "clientId": 1,
  "plannedDate": "2028-01-20",
  "items": [
    {
      "originalSaleItemId": 1,
      "quantity": 10,
      "buybackPricePerUnit": 180.00,
      "conditionNotes": "Хорошее состояние"
    }
  ]
}
```

### GET /buybacks
Получить список выкупов.

**Требуемые роли:** admin, super_admin, manager, accountant

**Query Parameters:**
- `status` (optional) - Фильтр по статусу (planned, contacted, declined, completed)

### GET /buybacks/:id
Получить выкуп по ID.

**Требуемые роли:** admin, super_admin, manager, accountant

### PATCH /buybacks/:id
Обновить выкуп.

**Требуемые роли:** admin, super_admin, manager

### PATCH /buybacks/:id/complete
Завершить выкуп.

**Требуемые роли:** admin, super_admin, manager

**Request Body:**
```json
{
  "actualDate": "2028-01-20"
}
```

### PATCH /buybacks/:id/decline
Отклонить выкуп.

**Требуемые роли:** admin, super_admin, manager

### GET /buybacks/:id/act
Скачать акт выкупа в PDF.

**Требуемые роли:** admin, super_admin, manager, accountant

## Финансы

### Счета

#### POST /finance/accounts
Создать счёт.

**Требуемые роли:** admin, super_admin

**Request Body:**
```json
{
  "name": "Основной счёт",
  "type": "cash",
  "initialBalance": 100000.00
}
```

#### GET /finance/accounts
Получить список счетов.

**Требуемые роли:** admin, super_admin, accountant, manager

#### GET /finance/accounts/:id
Получить счёт по ID.

**Требуемые роли:** admin, super_admin, accountant, manager

#### PATCH /finance/accounts/:id
Обновить счёт.

**Требуемые роли:** admin, super_admin

#### DELETE /finance/accounts/:id
Удалить счёт.

**Требуемые роли:** admin, super_admin

#### POST /finance/accounts/:id/recalculate
Пересчитать баланс счёта.

**Требуемые роли:** admin, super_admin, accountant

### Транзакции

#### POST /finance/transactions
Создать транзакцию.

**Требуемые роли:** admin, super_admin, accountant, manager

**Request Body:**
```json
{
  "accountId": 1,
  "type": "income",
  "amount": 5000.00,
  "description": "Продажа товара"
}
```

#### GET /finance/transactions
Получить список транзакций.

**Требуемые роли:** admin, super_admin, accountant, manager

**Query Parameters:**
- `accountId` (optional) - Фильтр по счёту

#### GET /finance/transactions/:id
Получить транзакцию по ID.

**Требуемые роли:** admin, super_admin, accountant, manager

#### DELETE /finance/transactions/:id
Удалить транзакцию.

**Требуемые роли:** admin, super_admin

### Изъятия партнёров

#### POST /finance/partner-withdrawals
Создать изъятие партнёра.

**Требуемые роли:** admin, super_admin

**Request Body:**
```json
{
  "accountId": 1,
  "amount": 10000.00,
  "description": "Личное изъятие партнёра"
}
```

#### GET /finance/partner-withdrawals
Получить список изъятий.

**Требуемые роли:** admin, super_admin, accountant

#### GET /finance/partner-withdrawals/:id
Получить изъятие по ID.

**Требуемые роли:** admin, super_admin, accountant

## Склад

### GET /inventory
Получить сводку по складу.

**Требуемые роли:** admin, super_admin, logistic, accountant

**Response:**
```json
{
  "data": [
    {
      "batchId": 1,
      "plantType": "Туя",
      "sizeCmMin": 30,
      "sizeCmMax": 40,
      "potType": "P9",
      "quantityCurrent": 90,
      "quantityInitial": 100,
      "purchasePricePerUnit": "150.00"
    }
  ]
}
```

### POST /inventory/write-offs
Создать списание.

**Требуемые роли:** admin, super_admin, logistic

**Request Body:**
```json
{
  "batchId": 1,
  "quantity": 5,
  "reason": "Брак"
}
```

### GET /inventory/write-offs
Получить список списаний.

**Требуемые роли:** admin, super_admin, logistic, accountant

## Отчёты

### GET /reports/profit-by-shipment
Прибыль по поставкам.

**Требуемые роли:** admin, super_admin, accountant, manager

**Query Parameters:**
- `startDate` (optional) - Дата начала (YYYY-MM-DD)
- `endDate` (optional) - Дата окончания (YYYY-MM-DD)

### GET /reports/profit-by-client
Прибыль по клиентам.

**Требуемые роли:** admin, super_admin, accountant, manager

**Query Parameters:**
- `startDate` (optional) - Дата начала (YYYY-MM-DD)
- `endDate` (optional) - Дата окончания (YYYY-MM-DD)

### GET /reports/buyback-forecast
Прогноз выкупа.

**Требуемые роли:** admin, super_admin, accountant, manager

**Query Parameters:**
- `startDate` (optional) - Дата начала (YYYY-MM-DD)
- `endDate` (optional) - Дата окончания (YYYY-MM-DD)

### GET /reports/cash-flow
Движение средств.

**Требуемые роли:** admin, super_admin, accountant

**Query Parameters:**
- `startDate` (optional) - Дата начала (YYYY-MM-DD)
- `endDate` (optional) - Дата окончания (YYYY-MM-DD)

### GET /reports/client-activity
Активность клиентов.

**Требуемые роли:** admin, super_admin, accountant, manager

**Query Parameters:**
- `startDate` (optional) - Дата начала (YYYY-MM-DD)
- `endDate` (optional) - Дата окончания (YYYY-MM-DD)

### GET /reports/inventory-summary
Сводка по складу.

**Требуемые роли:** admin, super_admin, accountant, logistic

## Уведомления

### POST /notifications
Создать уведомление.

**Требуемые роли:** admin, super_admin, manager

**Request Body:**
```json
{
  "userId": 1,
  "clientId": 1,
  "buybackId": 1,
  "message": "Напоминание о выкупе",
  "isRead": false,
  "dueDate": "2028-01-20"
}
```

### GET /notifications
Получить список уведомлений.

**Требуемые роли:** admin, super_admin, manager, accountant

**Query Parameters:**
- `userId` (optional) - Фильтр по пользователю
- `isRead` (optional) - Фильтр по прочитанности (true/false)

### GET /notifications/my
Получить мои уведомления.

**Требуемые роли:** admin, super_admin, manager, accountant

**Query Parameters:**
- `isRead` (optional) - Фильтр по прочитанности (true/false)

### GET /notifications/upcoming
Получить предстоящие уведомления.

**Требуемые роли:** admin, super_admin, manager, accountant

**Query Parameters:**
- `days` (optional) - Количество дней вперед (по умолчанию: 30)

### GET /notifications/unread-count
Получить количество непрочитанных уведомлений.

**Требуемые роли:** admin, super_admin, manager, accountant

### GET /notifications/:id
Получить уведомление по ID.

**Требуемые роли:** admin, super_admin, manager, accountant

### PATCH /notifications/:id
Обновить уведомление.

**Требуемые роли:** admin, super_admin, manager, accountant

### PATCH /notifications/:id/read
Отметить уведомление как прочитанное.

**Требуемые роли:** admin, super_admin, manager, accountant

### PATCH /notifications/read-all
Отметить все уведомления как прочитанные.

**Требуемые роли:** admin, super_admin, manager, accountant

### DELETE /notifications/:id
Удалить уведомление.

**Требуемые роли:** admin, super_admin

## Коды ошибок

- `400` - Bad Request (неверные данные)
- `401` - Unauthorized (неавторизован)
- `403` - Forbidden (нет доступа)
- `404` - Not Found (ресурс не найден)
- `500` - Internal Server Error (внутренняя ошибка сервера)

## Формат ответа

### Успешный ответ
```json
{
  "data": {
    // Данные ответа
  }
}
```

### Ошибка
```json
{
  "statusCode": 400,
  "message": "Сообщение об ошибке",
  "error": "Bad Request"
}
```

