# MVP Technical Specification

**Based on**: [PRD](specs/010-mvp-prd.md)  
**Version**: MVP 1.1  
**Status**: Draft

---

## 1. State Machine

### 1.1. GuideJob State Machine

**Главная сущность для отслеживания обработки видео.**

```
created → queued → processing → done
                           ↓
                        failed
```

**Состояния:**

- **`created`**: Задача создана в системе (после POST /api/guides)
- **`queued`**: Задача поставлена в очередь обработки
- **`processing`**: Обработка выполняется (ingest → transcript → guide steps)
- **`done`**: Обработка завершена, гайд готов к просмотру
- **`failed`**: Обработка завершилась с ошибкой

**Переходы:**

- `created` → `queued`: автоматически после создания (валидация прошла)
- `queued` → `processing`: воркер берет задачу из очереди
- `processing` → `done`: все этапы пайплайна завершены успешно
- `processing` → `failed`: ошибка на любом этапе (после всех ретраев)

**Примечание**: В MVP нет промежуточных статусов (`transcribed`, `segmented`, `composed`) — только конечные `done`/`failed`. Прогресс можно отслеживать через поле `progress` (0.0–1.0).

---

## 2. Multi-User Architecture (MVP)

### 2.1. Authentication Approach

**Варианты для MVP:**

#### Option 1: Simple JWT with Hardcoded Users (MVP Default)

**Описание**: Минимальная реализация с JWT токенами и предопределенным списком пользователей.

**Implementation**:
- Список пользователей в конфигурации (env vars или config file)
- JWT токены для аутентификации
- Middleware проверяет токен и извлекает `userId`
- Нет регистрации/логина в MVP — токены выдаются вручную или через простой endpoint

**Pros**:
- Минимальная реализация
- Быстрое развертывание
- Подходит для "я + друзья" сценария

**Cons**:
- Нет самообслуживания (регистрация)
- Требует ручного управления пользователями

#### Option 2: Simple Email/Password Auth

**Описание**: Базовая регистрация и логин с email/password.

**Implementation**:
- POST /api/auth/register — регистрация нового пользователя
- POST /api/auth/login — вход, получение JWT токена
- Хеширование паролей (bcrypt)
- JWT токены для последующих запросов

**Pros**:
- Самообслуживание (пользователи регистрируются сами)
- Более масштабируемо

**Cons**:
- Больше кода для MVP
- Требует управления паролями и безопасностью

**MVP Decision**: **Option 1 (Simple JWT with Hardcoded Users)** — выбран как MVP default для минимальной реализации. Option 2 может быть реализован позже без изменения архитектуры.

**Decision ID**: [TBD - Decision Required: AUTH-001]

### 2.2. User Isolation

**Все запросы изолированы по пользователю:**

- `GET /api/guides` → возвращает только гайды текущего пользователя (`WHERE ownerId = currentUserId`)
- `GET /api/guides/:id` → проверяет, что `guide.ownerId = currentUserId` (иначе 403)
- `POST /api/guides` → автоматически устанавливает `ownerId = currentUserId`
- Все запросы требуют аутентификации (кроме `/api/auth/*` если реализован Option 2)

---

## 3. API Endpoints (MVP)

**Base URL**: `/api`

**Аутентификация**: [TBD - Decision Required: TECH-002, AUTH-001]
- **MVP default**: `Authorization: Bearer <token>` (JWT)
- **Alternative**: Cookie-based sessions (если выбран другой стек)

### 3.1. Authentication Endpoints

#### 3.1.1. POST /api/auth/login (Option 2 only)

**Описание**: Вход пользователя и получение JWT токена.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "tier": "free"
  }
}
```

**Ошибки:**
- `401 UNAUTHORIZED`: неверный email или пароль

**Примечание**: Этот endpoint реализуется только если выбран Option 2 (Simple Email/Password Auth). Для Option 1 токены выдаются вручную или через простой endpoint.

#### 3.1.2. POST /api/auth/register (Option 2 only)

**Описание**: Регистрация нового пользователя.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "tier": "free"
  }
}
```

**Ошибки:**
- `400 VALIDATION_ERROR`: невалидный email или пароль
- `409 CONFLICT`: email уже зарегистрирован

**Примечание**: Этот endpoint реализуется только если выбран Option 2. Для Option 1 пользователи создаются вручную в конфигурации.

### 3.2. POST /api/guides

**Описание**: Создать задачу обработки YouTube-видео.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=..."
}
```

**Response (201 Created):**
```json
{
  "id": "guide-uuid",
  "status": "created",
  "sourceUrl": "https://www.youtube.com/watch?v=...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Валидация:**
- URL должен быть валидным YouTube URL
- Проверка лимитов: длина видео ≤ [TBD - Decision Required: L-001] минут
- Проверка квот: количество активных задач < [TBD - Decision Required: L-003]

**Ошибки:**
- `400 VALIDATION_ERROR`: невалидный URL
- `403 LIMIT_EXCEEDED`: превышен лимит длительности или квот

### 3.3. GET /api/guides

**Описание**: Получить список гайдов текущего пользователя.

**Query Parameters:**
- `status` (optional): фильтр по статусу (`done`, `processing`, `failed`)
- `limit` (optional): количество записей (default: 20)
- `offset` (optional): пагинация (default: 0)

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "guide-uuid",
      "title": "Guide Title",
      "status": "done",
      "sourceUrl": "https://www.youtube.com/watch?v=...",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T01:00:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

### 3.4. GET /api/guides/:id

**Описание**: Получить детали гайда со всеми шагами.

**Response (200 OK):**
```json
{
  "id": "guide-uuid",
  "title": "Guide Title",
  "status": "done",
  "sourceUrl": "https://www.youtube.com/watch?v=...",
  "steps": [
    {
      "id": "step-uuid-1",
      "order": 1,
      "title": "Step 1 Title",
      "body": "Step 1 description...",
      "startTime": 0.0,
      "endTime": 120.0
    },
    {
      "id": "step-uuid-2",
      "order": 2,
      "title": "Step 2 Title",
      "body": "Step 2 description...",
      "startTime": 120.0,
      "endTime": 240.0
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T01:00:00Z"
}
```

**Ошибки:**
- `404 NOT_FOUND`: гайд не найден
- `403 FORBIDDEN`: нет доступа к гайду

**Примечание**: В MVP кадры (`Frame`) не включены — только шаги с текстом.

---

### 3.5. GET /api/user/me

**Описание**: Получить информацию о текущем пользователе.

**Response (200 OK):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "tier": "free",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Примечание**: Используется для отображения информации о пользователе и проверки тарифа.

---

## 4. Data Model (MVP)

**Минимальная модель данных для MVP.** Дополнительные поля добавляются только при необходимости.

### 4.1. User

**Сущность пользователя.**

| Field | Type | Description | Constraints |
|---|---|---|---|
| `id` | UUID | Уникальный идентификатор | PK |
| `email` | String | Email пользователя | NOT NULL, unique |
| `passwordHash` | String | Хеш пароля (bcrypt) | NOT NULL (только для Option 2) |
| `tier` | Enum | Тарифный план | `free`, `pro` (default: `free`) |
| `createdAt` | Timestamp | Время создания | NOT NULL |
| `updatedAt` | Timestamp | Время последнего обновления | NOT NULL |

**Примечания:**
- `tier` используется для проверки лимитов и ограничений — [TBD - Decision Required: TIER-001]
- `passwordHash` используется только если выбран Option 2 (Simple Email/Password Auth)
- Для Option 1 пользователи хранятся в конфигурации, не в БД

### 4.2. Guide

**Главная сущность гайда.**

| Field | Type | Description | Constraints |
|---|---|---|---|
| `id` | UUID | Уникальный идентификатор | PK |
| `sourceUrl` | String | URL исходного YouTube-видео | NOT NULL, unique per user |
| `title` | String | Заголовок гайда | NOT NULL, generated from URL |
| `status` | Enum | Статус обработки | `created`, `queued`, `processing`, `done`, `failed` |
| `createdAt` | Timestamp | Время создания | NOT NULL |
| `updatedAt` | Timestamp | Время последнего обновления | NOT NULL |
| `ownerId` | UUID | ID владельца (User) | FK, NOT NULL |

**Примечания:**
- `title` генерируется из метаданных YouTube-видео на этапе ingest
- `status` отслеживается через state machine (§1.1)

### 4.3. GuideStep

**Шаг гайда (структурированная инструкция).**

| Field | Type | Description | Constraints |
|---|---|---|---|
| `id` | UUID | Уникальный идентификатор | PK |
| `guideId` | UUID | ID гайда | FK → Guide.id, NOT NULL |
| `order` | Integer | Порядок шага (1-based) | NOT NULL, unique per guide |
| `title` | String | Заголовок шага | NOT NULL |
| `body` | Text | Текст шага (описание) | NOT NULL |
| `startTime` | Float | Начало шага (секунды от начала видео) | NOT NULL, ≥ 0 |
| `endTime` | Float | Конец шага (секунды от начала видео) | NOT NULL, > startTime |

**Примечания:**
- В MVP не включаются кадры (`Frame`) — только текст
- `startTime`/`endTime` генерируются в stub pipeline (§4)

---

### 4.4. Subscription (Payment Readiness)

**Сущность для будущей интеграции платежей (не используется в MVP, но структура готова).**

| Field | Type | Description | Constraints |
|---|---|---|---|
| `id` | UUID | Уникальный идентификатор | PK |
| `userId` | UUID | ID пользователя | FK → User.id, NOT NULL |
| `tier` | Enum | Тарифный план | `free`, `pro` |
| `status` | Enum | Статус подписки | `active`, `cancelled`, `expired` |
| `provider` | String | Платежный провайдер | NULL (для будущей интеграции) |
| `providerSubscriptionId` | String | ID подписки у провайдера | NULL (для будущей интеграции) |
| `startedAt` | Timestamp | Начало подписки | NOT NULL |
| `expiresAt` | Timestamp | Окончание подписки | NULL (для бессрочных) |
| `createdAt` | Timestamp | Время создания | NOT NULL |
| `updatedAt` | Timestamp | Время последнего обновления | NOT NULL |

**Примечания:**
- Эта таблица создается в MVP для payment readiness, но не используется
- `User.tier` синхронизируется с активной подпиской (в будущем)
- Структура поддерживает множественные провайдеры через поле `provider` — [TBD - Decision Required: PAY-001, PAY-002]

---

## 5. Processing Pipeline (MVP - Stub Implementation)

**Для MVP используется детерминированный stub без реальных ML-моделей.**

### 5.1. Pipeline Stages

**Последовательность этапов обработки:**

1. **ingest**: Загрузка метаданных YouTube-видео
2. **transcript** (stub): Генерация фиктивного транскрипта
3. **guide steps** (stub): Генерация фиктивных шагов гайда

### 5.2. Stage 1: Ingest

**Вход**: `sourceUrl` (YouTube URL)

**Действия:**
- Валидация URL (формат YouTube)
- Загрузка метаданных через YouTube API или yt-dlp:
  - `title`: заголовок видео → используется как `Guide.title`
  - `duration`: длительность видео → проверка лимита [TBD - L-001]
- Сохранение `Guide` со статусом `created`
- Постановка задачи в очередь обработки → статус `queued`

**Выход**: `Guide.id`, `duration`, `title`

### 5.3. Stage 2: Transcript (Stub)

**Вход**: `Guide.id`, `duration`

**Действия (stub):**
- Генерация детерминированного "транскрипта":
  - Разбить видео на сегменты по [TBD - P-001] минут
  - Для каждого сегмента создать текст: `"Segment {i} of video about {title}"`
- Сохранить транскрипт в памяти (не в БД для MVP)

**Выход**: Список сегментов транскрипта (текст + таймкоды)

**Примечание**: В MVP транскрипт не сохраняется в БД (`Transcript` сущность не используется).

### 5.4. Stage 3: Guide Steps (Stub)

**Вход**: Список сегментов транскрипта

**Действия (stub):**
- Генерация фиктивных шагов:
  - Для каждого сегмента транскрипта создать `GuideStep`:
    - `title`: `"Step {order}"`
    - `body`: `"This is step {order}. {segment.text}"`
    - `startTime`: начало сегмента
    - `endTime`: конец сегмента
    - `order`: порядковый номер
- Сохранение всех `GuideStep` в БД
- Обновление `Guide.status` → `done`

**Выход**: Список `GuideStep` (сохранен в БД)

**Ошибки:**
- Если на любом этапе ошибка → `Guide.status` → `failed`
- Ошибка логируется с причиной

### 5.5. Pipeline Orchestration

**Очередь задач**: [TBD - TECH-001: NestJS/Fastify определяет выбор очереди]

- **MVP default**: BullMQ + Redis (если NestJS выбран)
- **Alternative**: Встроенная очередь (если Fastify выбран)

**Ретраи:**
- Максимум 3 попытки (соответствует `docs/pipeline.md` §3)
- Экспоненциальная задержка: 1s, 2s, 4s

---

## 6. UX Flow (MVP)

**Пользовательский сценарий от ввода URL до просмотра результата.**

### 6.1. Screen 0: Authentication (Option 2 only)

**Экран входа/регистрации (только если выбран Option 2).**

**Элементы UI:**
- Поле ввода email
- Поле ввода password
- Кнопка "Войти" / "Зарегистрироваться"
- Переключение между режимами входа и регистрации

**Поведение:**
- POST /api/auth/login или POST /api/auth/register
- Получение JWT токена
- Сохранение токена (localStorage или cookie)
- Редирект на Screen 1 (URL Input)

**Примечание**: Для Option 1 этот экран не нужен — токены выдаются вручную.

### 6.2. Screen 1: URL Input

**Экран импорта видео.**

**Элементы UI:**
- Поле ввода URL (placeholder: "Введите URL YouTube-видео")
- Кнопка "Создать гайд"
- Подсказка: "Максимальная длительность: [TBD - L-001] минут"

**Поведение:**
- Пользователь вводит URL
- Нажимает "Создать гайд"
- POST /api/guides → получает `guideId`
- Редирект на Screen 2 (список)

### 6.3. Screen 2: Guide List

**Список гайдов пользователя.**

**Элементы UI:**
- Список гайдов (таблица или карточки):
  - Заголовок (`title`)
  - Статус (`status`): badge с цветом
  - Дата создания
  - Ссылка на видео (`sourceUrl`)
- Кнопка "Обновить" (polling статуса)

**Поведение:**
- GET /api/guides → отображение списка
- Автообновление статуса каждые 5 секунд (для `processing`)
- Клик на гайд → переход на Screen 3

**Статусы:**
- `processing`: "Обработка..." (желтый badge)
- `done`: "Готов" (зеленый badge)
- `failed`: "Ошибка" (красный badge)

### 6.4. Screen 3: Guide View

**Просмотр готового гайда.**

**Элементы UI:**
- Заголовок гайда (`title`)
- Ссылка на исходное видео (`sourceUrl`)
- Список шагов (`steps`):
  - Номер шага (`order`)
  - Заголовок шага (`title`)
  - Текст шага (`body`)
  - Таймкоды (`startTime`–`endTime`) — опционально

**Поведение:**
- GET /api/guides/:id → отображение гайда
- Если статус `processing` → показать "Обработка..."
- Если статус `failed` → показать "Ошибка обработки"

**Примечание**: В MVP редактор шагов и экспорт не включены (§7).

### 6.5. Screen 4: Plans Page (Payment Readiness)

**Страница с описанием тарифных планов.**

**Элементы UI:**
- Заголовок страницы: "Тарифные планы" / "Pricing"
- Карточка Free tier:
  - Название: "Free"
  - Описание возможностей и лимитов
  - Текущий план (если пользователь на free) или неактивная кнопка
- Карточка Pro tier:
  - Название: "Pro"
  - Описание возможностей и лимитов
  - Кнопка "Upgrade to Pro" (неактивная в MVP, визуально готова к интеграции)
- Современный минималистичный дизайн (соответствует PRD §5)

**Поведение:**
- Статическая страница (не требует API в MVP)
- Кнопки "Upgrade" неактивны (готовы к будущей интеграции платежей)
- Отображение текущего тарифа пользователя (GET /api/user/me)

**Extension Points:**
- Компонент планов изолирован и готов к подключению платежного провайдера
- Структура данных позволяет легко добавить новые тарифы
- Визуальное оформление соответствует современному UI (PRD §5.1-5.3)

**Примечание**: Эта страница обязательна для MVP согласно PRD §4.2.2 (Payment Readiness).

**Просмотр готового гайда.**

**Элементы UI:**
- Заголовок гайда (`title`)
- Ссылка на исходное видео (`sourceUrl`)
- Список шагов (`steps`):
  - Номер шага (`order`)
  - Заголовок шага (`title`)
  - Текст шага (`body`)
  - Таймкоды (`startTime`–`endTime`) — опционально

**Поведение:**
- GET /api/guides/:id → отображение гайда
- Если статус `processing` → показать "Обработка..."
- Если статус `failed` → показать "Ошибка обработки"

**Примечание**: В MVP редактор шагов и экспорт не включены (§6).

---

## 7. Scope Limitations (MVP)

**Что НЕ включено в MVP (из PRD §4):**

### 7.1. Функциональность, вынесенная за рамки MVP

- **Редактирование шагов**: Редактор текста шагов (PATCH /api/guides/:id) — не в MVP
- **Кадры**: Выбор и замена кадров (`Frame` сущность) — не в MVP
- **Экспорт**: Экспорт в Markdown/PDF (POST /api/guides/:id/export) — не в MVP
- **Шаринг**: Публичные ссылки (POST /api/guides/:id/share) — не в MVP
- **Реальные ML-модели**: Whisper/Vosk, Ollama — не в MVP (используются stubs)

### 7.2. Причины исключения для MVP

**Цель MVP**: Валидировать пайплайн обработки и базовый UX без зависимости от ML-моделей и сложной логики.

**MVP фокус:**
- Создание задачи обработки
- Асинхронная обработка через очереди
- Генерация структурированного гайда (stub)
- Просмотр результата

**Пост-MVP** (согласно PRD §4.2):
- Редактор и экспорт — Q2+
- Реальные ML-модели — после валидации пайплайна

---

## 8. Technology Stack (MVP)

**Выбор технологий зависит от Decision Log [TBD - TECH-001, TECH-002].**

### 8.1. Backend Framework [TBD - TECH-001]

**Варианты:**

1. **NestJS** (MVP default для реализации)
   - TypeScript-first
   - Встроенная поддержка BullMQ
   - Dependency Injection
   - Структура проекта: modules, controllers, services

2. **Fastify**
   - Более легковесный
   - Выше производительность
   - Меньше boilerplate
   - Требует дополнительной настройки очередей

**Примечание**: Выбор не блокирует MVP — можно начать с MVP default и изменить позже.

### 8.2. Authentication [TBD - TECH-002, AUTH-001]

**Варианты:**

1. **JWT** (MVP default)
   - Stateless
   - Легко интегрируется с любым фреймворком
   - Требует хранения секрета

2. **Cookie-based Sessions**
   - Stateful (сессии в Redis/DB)
   - Более безопасно (CSRF protection)
   - Требует дополнительной инфраструктуры

**Примечание**: Для MVP достаточно одного сервисного токена (hardcoded) для упрощения.

### 8.3. Определенные технологии

**Не зависят от Decision Log:**

- **Frontend**: React + Vite (подтверждено PRD §3.2)
- **Queue**: BullMQ + Redis (подтверждено PRD §3.2)
- **Database**: PostgreSQL (подтверждено PRD §3.2)
- **Storage**: S3-compatible (для будущих видео/кадров, не используется в MVP)

---

## 9. Decision Dependencies (TBD)

**Все TBD из PRD §7 (Decision Log) применяются к этой спецификации.**

### 9.1. Лимиты (влияют на валидацию API)

- **L-001**: `limits.video_duration_minutes` → валидация POST /api/guides
- **L-003**: `limits.concurrent_jobs_per_user` → валидация POST /api/guides

### 9.2. Метрики качества (не применимы к stub MVP)

- **Q-001, Q-002, Q-003**: Не используются в MVP (stub не оценивается по качеству)

### 9.3. Производительность (влияют на SLA пайплайна)

- **P-001**: Максимальная длительность и время обработки → не критично для stub (stub быстрый)
- **P-002, P-003**: SLA экспорта → не применимо (экспорт не в MVP)

### 9.4. Технологии (влияют на выбор стека)

- **TECH-001**: Backend framework → влияет на структуру проекта и очереди
- **TECH-002**: Authentication → влияет на реализацию middleware

### 9.5. Payment Readiness (влияют на архитектуру)

- **TIER-001**: Лимиты для free vs pro tiers → логика ограничений по тарифам
- **PAY-001**: Структура абстракции платежного провайдера → архитектура для будущей интеграции
- **PAY-002**: Структура данных для подписок (Subscription model) → хранение информации о подписках
- **AUTH-001**: Выбор подхода к аутентификации (Option 1 vs Option 2) → определяет наличие endpoints регистрации/логина

### 9.6. Допущения (не блокируют MVP)

- **D-002–D-006**: Недокументированные допущения не влияют на MVP спецификацию

---

## 10. Blocking vs Non-blocking Decisions for MVP

**Критичность решений для начала реализации MVP.**

### 10.1. Blocking Decisions (требуются перед реализацией)

**Решения, без которых нельзя начать разработку:**

| ID | Решение | Почему блокирует | Когда нужно |
|---|---|---|---|
| **TECH-001** | Выбор backend framework (NestJS/Fastify) | Определяет структуру проекта, типы, DI | До начала backend разработки |
| **TECH-002** | Выбор authentication (JWT/sessions) | Определяет middleware и защиту API | До реализации аутентификации |
| **AUTH-001** | Выбор подхода к аутентификации (Option 1 vs Option 2 | Определяет наличие endpoints регистрации/логина | До реализации аутентификации |

**Примечание**: Можно использовать MVP default (NestJS + JWT) и изменить позже, если решение изменится.

### 10.2. Non-blocking Decisions (можно отложить)

**Решения, которые не блокируют начало разработки:**

| ID | Решение | Почему не блокирует | Когда нужно |
|---|---|---|---|
| **L-001** | Максимальная длительность видео | Можно использовать placeholder (например, 60 мин) | До тестирования с реальными видео |
| **L-003** | Количество параллельных задач | Можно использовать placeholder (например, 3) | До нагрузочного тестирования |
| **TIER-001** | Лимиты для free vs pro tiers | Можно использовать одинаковые лимиты для всех в MVP | До интеграции платежей |
| **PAY-001, PAY-002** | Структура платежного провайдера и подписок | Структура данных создается, но не используется в MVP | До интеграции платежей |
| **Q-001, Q-002, Q-003** | Метрики качества | Не применимы к stub MVP | Только для пост-MVP (реальные ML) |
| **P-001, P-002, P-003** | SLA производительности | Stub быстрый; SLA не критичны для валидации | До продакшн-развертывания |
| **D-002–D-006** | Недокументированные допущения | Не влияют на техническую реализацию | Для планирования пост-MVP |

### 10.3. Рекомендация по приоритетам

**Фаза 1 (MVP default values):**
1. Использовать MVP default для TECH-001, TECH-002, AUTH-001 (Option 1)
2. Использовать разумные placeholder для L-001, L-003 (например, 60 мин, 3 задачи)
3. Использовать одинаковые лимиты для всех пользователей (TIER-001 отложен)

**Фаза 2 (перед тестированием):**
1. Определить L-001, L-003 на основе требований/ограничений
2. При необходимости пересмотреть TECH-001, TECH-002

**Фаза 3 (пост-MVP):**
1. Определить Q-001, Q-002, Q-003 для реальных ML-моделей
2. Определить P-001, P-002, P-003 для продакшн SLA
3. Документировать D-002–D-006

---

## Связанные документы

- [PRD](specs/010-mvp-prd.md) — Product Requirements Document
- [Data Model](docs/data-model.md) — Полная модель данных (пост-MVP)
- [Pipeline](docs/pipeline.md) — Архитектура пайплайна (пост-MVP)
- [API](docs/api.md) — Полный API контракт (пост-MVP)
- [UI Flow](docs/ui-flow.md) — UX flow (включая редактор/экспорт)
