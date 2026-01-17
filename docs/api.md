# API (черновой контракт)

## Общая схема ошибок

**Response (пример):**

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid url" } }
```

## Аутентификация (MVP)

**Header:** `Authorization: Bearer <token>`  
Для MVP допускается один сервисный токен.

## POST /videos/ingest

**Описание:** создать задачу обработки по URL.  
**Request:**

```json
{ "url": "https://youtube.com/..." }
```

**Response:**

```json
{ "videoId": "uuid", "status": "queued" }
```

**Ошибки:** `VALIDATION_ERROR`, `LIMIT_EXCEEDED`.

## GET /videos/:id/status

**Описание:** статус пайплайна.  
**Response:**

```json
{ "status": "segmented", "progress": 0.6 }
```

**Ошибки:** `NOT_FOUND`.

## GET /guides/:id

**Описание:** получить гайд.  
**Response:** объект Guide со шагами и кадрами.

**Ошибки:** `NOT_FOUND`, `FORBIDDEN`.

## PATCH /guides/:id

**Описание:** правка текста, шагов, кадров.  
**Request (пример):**

```json
{
  "title": "Новый заголовок",
  "steps": [
    { "id": "step-1", "text": "Обновленный текст" }
  ]
}
```

**Ошибки:** `NOT_FOUND`, `FORBIDDEN`, `VALIDATION_ERROR`.

## POST /guides/:id/export

**Описание:** экспорт гайда.  
**Request:**

```json
{ "format": "md" }
```

**Response:**

```json
{ "fileUrl": "https://..." }
```

**Ошибки:** `NOT_FOUND`, `FORBIDDEN`, `LIMIT_EXCEEDED`.

## POST /guides/:id/share

**Описание:** создать публичную ссылку (read-only).  
**Response:**

```json
{ "url": "https://.../share/<token>", "expiresAt": "2026-01-01T00:00:00Z" }
```

**Ошибки:** `NOT_FOUND`, `FORBIDDEN`.

## GET /share/:token

**Описание:** получить гайд по публичной ссылке.  
**Response:** объект Guide со шагами и кадрами.

**Ошибки:** `NOT_FOUND`, `EXPIRED`.
