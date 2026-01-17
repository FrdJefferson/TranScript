# Tech Stack

## 1. Базовые технологии (предложение)
- **Backend:** Node.js (NestJS/Fastify)
- **Frontend:** React + Vite
- **Workers/Queue:** BullMQ + Redis
- **DB:** Postgres
- **Storage:** S3-compatible (MinIO/Wasabi)
- **Frames:** ffmpeg

## 2. ASR и LLM
- **ASR local:** Whisper / Vosk
- **LLM local:** Ollama (Llama 3 / Mistral / Gemma)
- **Remote fallback:** внешние API при необходимости

## 3. Открытые решения
- Выбор ASR по умолчанию (Whisper vs Vosk)
- Выбор LLM модели по умолчанию
- Стек бэкенда (NestJS vs Fastify)
