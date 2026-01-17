# Infrastructure

## 1. Локальный запуск (CPU, dev)
- Backend API
- Worker
- Redis (очереди)
- Postgres
- S3-compatible (например MinIO)

## 2. ASR локально
**Whisper (точность выше):**
- Рекомендуется GPU при длительных видео.
- Модель выбирается конфигом (`small`/`medium`/`large`).

**Vosk (легкий режим):**
- CPU-friendly.
- Быстрее, но ниже точность.

## 3. LLM локально (Ollama)
- Ollama запускается как отдельный сервис.
- Модели: Llama 3 / Mistral / Gemma.
- Выбор модели и лимиты контекста задаются конфигом.

## 4. Переключение провайдеров
- `asr.provider=local|remote`
- `llm.provider=local|remote`
- Fallback: local → remote (если разрешено политикой).

## 5. Минимальные требования (ориентир)
- CPU: 4+ ядра
- RAM: 16+ ГБ (Whisper medium/large требует больше)
- Disk: 20+ ГБ для моделей и артефактов

## 6. Наблюдаемость
- Логи API и воркеров.
- Метрики по длительности этапов.
