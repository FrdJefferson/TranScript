# Ops Metrics

## 1. SLO (черновик)
- Успешные пайплайны: 95%+
- Среднее время обработки: <= 30 мин для видео до лимита MVP
- Доступность API: 99.5%

## 2. Метрики пайплайна
- `pipeline_success_rate`
- `pipeline_failure_rate`
- `stage_duration_seconds{stage}`
- `queue_depth{queue}`

## 3. Метрики ресурсов
- CPU/GPU загрузка воркеров
- Память воркеров и Ollama
- Размеры моделей и storage

## 4. Ошибки
- Топ ошибок ASR/LLM
- `LIMIT_EXCEEDED` по пользователям

## 5. Логи и трассировка
- `traceId` везде
- Корреляция `videoId` и `guideId`
