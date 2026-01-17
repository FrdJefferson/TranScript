# Data Model

## 1. Сущности
**User**
- id
- email
- role

**VideoSource**
- id
- url
- duration
- status
- provider
- ownerId

**Transcript**
- id
- videoId
- language
- segments[] (text + timecodes)

**Guide**
- id
- videoId
- title
- steps[]
- status
- version
- ownerId

**GuideAccess**
- id
- guideId
- userId
- role (`viewer` | `editor`)

**ShareLink**
- id
- guideId
- token
- expiresAt

**GuideStep**
- id
- guideId
- text
- startTime
- endTime

**Frame**
- id
- stepId
- timestamp
- imageUrl
- score

**Export**
- id
- guideId
- type
- fileUrl
- createdAt

## 2. Статусы (черновик)
**VideoSource.status**
- `created`
- `ingested`
- `transcribed`
- `segmented`
- `composed`
- `frames_ready`
- `failed`

**Guide.status**
- `draft`
- `ready`
- `published`

## 3. Связи
- User 1 → n VideoSource
- User 1 → n Guide
- Guide 1 → n GuideAccess
- Guide 1 → 0..1 ShareLink
- VideoSource 1 → 1 Transcript
- VideoSource 1 → 1..n Guide
- Guide 1 → n GuideStep
- GuideStep 1 → n Frame
- Guide 1 → n Export
