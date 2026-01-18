# MVP Tasks

**Input**: [PRD](specs/010-mvp-prd.md), [Technical Specification](specs/020-mvp-spec.md)  
**Status**: Draft  
**Version**: MVP 1.1

---

## Task Format

Each task includes:
- **Goal**: What this task accomplishes
- **Scope**: What files/components are affected
- **DONE Criteria**: How to verify completion
- **Verification Commands**: Commands to test/verify

**Task Status**:
- **READY**: Task is ready to start (all dependencies met)
- **BLOCKED**: Task is blocked by dependencies
- **IN_PROGRESS**: Task is currently being worked on
- **DONE**: Task is complete and verified

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

### T001: Create Project Structure

**Status**: READY  
**Goal**: Set up monorepo structure with apps (api, web, worker) and packages (shared)  
**Scope**: Root directory structure, package.json files, basic TypeScript configs  
**DONE Criteria**:
- Monorepo structure exists: `apps/api/`, `apps/web/`, `apps/worker/`, `packages/shared/`
- Each app has `package.json` with basic metadata
- Root `package.json` exists with workspace configuration
- Basic `.gitignore` and `.editorconfig` are in place

**Verification Commands**:
```bash
ls -la apps/api apps/web apps/worker packages/shared
cat package.json | grep -A 5 "workspaces"
```

---

### T002: Initialize Backend API Project

**Status**: READY  
**Goal**: Set up NestJS backend with TypeScript, basic dependencies  
**Scope**: `apps/api/` directory  
**DONE Criteria**:
- `apps/api/package.json` has NestJS dependencies
- `apps/api/tsconfig.json` exists and compiles
- `apps/api/src/main.ts` exists with basic NestJS bootstrap
- Project can start with `npm run start:dev` (even if it fails on DB connection)

**Verification Commands**:
```bash
cd apps/api && npm install
npm run build
npm run start:dev  # Should start (may fail on DB, that's OK)
```

---

### T003: Initialize Frontend Web Project

**Status**: READY  
**Goal**: Set up React + Vite frontend with TypeScript  
**Scope**: `apps/web/` directory  
**DONE Criteria**:
- `apps/web/package.json` has React, Vite, TypeScript dependencies
- `apps/web/vite.config.ts` exists
- `apps/web/src/main.tsx` exists with basic React app
- Project can start with `npm run dev`

**Verification Commands**:
```bash
cd apps/web && npm install
npm run build
npm run dev  # Should start dev server
```

---

### T004: Initialize Worker Project

**Status**: READY  
**Goal**: Set up worker project structure for processing pipeline  
**Scope**: `apps/worker/` directory  
**DONE Criteria**:
- `apps/worker/package.json` exists with basic dependencies
- `apps/worker/src/index.ts` exists with basic structure
- Worker can be imported/required without errors

**Verification Commands**:
```bash
cd apps/worker && npm install
npm run build
```

---

### T005: Initialize Shared Package

**Status**: READY  
**Goal**: Set up shared package for common types/utilities  
**Scope**: `packages/shared/` directory  
**DONE Criteria**:
- `packages/shared/package.json` exists
- `packages/shared/src/index.ts` exports at least one type
- Package can be imported by other apps

**Verification Commands**:
```bash
cd packages/shared && npm install
npm run build
```

---

### T006: Configure Linting and Formatting

**Status**: READY  
**Goal**: Set up ESLint and Prettier for code quality  
**Scope**: Root and all apps/packages  
**DONE Criteria**:
- ESLint config exists (`.eslintrc.js` or in `package.json`)
- Prettier config exists (`.prettierrc` or in `package.json`)
- Linting command works: `npm run lint`
- Formatting command works: `npm run format`

**Verification Commands**:
```bash
npm run lint
npm run format
```

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### T007: Setup Database Schema and Migrations

**Status**: BLOCKED (depends on T002)  
**Goal**: Create PostgreSQL schema with User, Guide, GuideStep, Subscription tables  
**Scope**: Database migrations, schema definition  
**DONE Criteria**:
- Migration framework configured (TypeORM/Prisma/etc.)
- Migration file creates: `users`, `guides`, `guide_steps`, `subscriptions` tables
- All fields from spec §4 (Data Model) are present
- Foreign keys are set up correctly
- Migration can be run: `npm run migration:run`

**Verification Commands**:
```bash
cd apps/api && npm run migration:run
psql -d transcript_db -c "\dt"  # Should show all tables
psql -d transcript_db -c "\d users"  # Should show User table structure
```

---

### T008: Implement Authentication Middleware

**Status**: BLOCKED (depends on T002, T007)  
**Goal**: Create JWT authentication middleware for API endpoints  
**Scope**: `apps/api/src/auth/` directory  
**DONE Criteria**:
- JWT strategy configured (using `@nestjs/jwt` or similar)
- Auth guard exists that validates JWT tokens
- Middleware extracts `userId` from token and attaches to request
- Unauthenticated requests return 401
- Authenticated requests have `req.user.id` available

**Verification Commands**:
```bash
# Test without token (should fail)
curl http://localhost:3000/api/guides

# Test with invalid token (should fail)
curl -H "Authorization: Bearer invalid" http://localhost:3000/api/guides

# Test with valid token (should pass, may return empty list)
curl -H "Authorization: Bearer <valid-jwt>" http://localhost:3000/api/guides
```

---

### T009: Implement User Service (Option 1: Hardcoded Users)

**Status**: BLOCKED (depends on T007)  
**Goal**: Create user service with hardcoded user list for MVP  
**Scope**: `apps/api/src/users/` directory  
**DONE Criteria**:
- UserService validates JWT and returns user from hardcoded list
- Hardcoded users defined in config/env (at least 2 users for testing)
- Service method: `getUserById(id: string): User | null`
- Service method: `getUserByEmail(email: string): User | null`

**Verification Commands**:
```bash
# In API, test service directly
npm run test -- users.service.spec.ts
```

---

### T010: Setup Redis and Queue Infrastructure

**Status**: BLOCKED (depends on T002)  
**Goal**: Configure BullMQ and Redis for job processing  
**Scope**: `apps/api/` and `apps/worker/`  
**DONE Criteria**:
- Redis connection configured
- BullMQ queue module set up in NestJS
- Queue can be injected in services
- Worker can connect to same Redis instance
- Test job can be enqueued and processed

**Verification Commands**:
```bash
# Start Redis
docker-compose up redis -d

# Test queue in API
# (manual test: enqueue a test job)

# Test worker processing
cd apps/worker && npm run start
```

---

### T011: Configure Environment Variables

**Status**: READY  
**Goal**: Set up environment variable management for all apps  
**Scope**: `.env.example`, `.env` files, config modules  
**DONE Criteria**:
- `.env.example` exists with all required variables
- Config modules validate required env vars on startup
- Database, Redis, JWT secret configured via env
- Apps fail gracefully with clear error if env vars missing

**Verification Commands**:
```bash
# Test with missing env vars (should fail with clear error)
unset DATABASE_URL && cd apps/api && npm run start:dev

# Test with all env vars (should start)
cd apps/api && npm run start:dev
```

---

### T012: Setup Error Handling and Logging

**Status**: BLOCKED (depends on T002)  
**Goal**: Implement global error handler and structured logging  
**Scope**: `apps/api/src/common/` directory  
**DONE Criteria**:
- Global exception filter catches all errors
- Errors return consistent JSON format: `{ error: { code, message } }`
- Structured logging configured (Winston/Pino/etc.)
- Logs include request ID for tracing
- Different log levels for dev vs prod

**Verification Commands**:
```bash
# Trigger an error (invalid endpoint)
curl http://localhost:3000/api/invalid

# Should return: { "error": { "code": "NOT_FOUND", "message": "..." } }
# Check logs for structured output
```

---

## Phase 3: User Story 1 - Multi-User Authentication (Priority: P1) 🎯 MVP

**Goal**: Users can authenticate and access the system with isolated data per user  
**Independent Test**: Create two users, authenticate as each, verify they see only their own data

### T013: Implement Auth Endpoints (Option 1: Token Generation)

**Status**: BLOCKED (depends on T008, T009)  
**Goal**: Create endpoint to generate JWT tokens for hardcoded users  
**Scope**: `apps/api/src/auth/auth.controller.ts`  
**DONE Criteria**:
- POST `/api/auth/token` endpoint exists
- Accepts `{ email: string }` or `{ userId: string }`
- Returns JWT token for that user
- Token includes `userId` and `email` in payload
- Token expires after configured time (e.g., 7 days)

**Verification Commands**:
```bash
# Generate token for user
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com"}'

# Should return: { "token": "eyJ...", "user": { "id": "...", "email": "..." } }
```

---

### T014: Implement User Profile Endpoint

**Status**: BLOCKED (depends on T008, T009)  
**Goal**: Create GET `/api/user/me` endpoint  
**Scope**: `apps/api/src/users/users.controller.ts`  
**DONE Criteria**:
- Endpoint requires authentication
- Returns current user info: `{ id, email, tier, createdAt }`
- Uses `req.user` from auth middleware

**Verification Commands**:
```bash
# Get current user
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/user/me

# Should return: { "id": "...", "email": "...", "tier": "free", "createdAt": "..." }
```

---

### T015: Create User Model with Tier

**Status**: BLOCKED (depends on T007)  
**Goal**: Ensure User model has `tier` field (free/pro)  
**Scope**: Database migration, User entity  
**DONE Criteria**:
- User table has `tier` column (enum: 'free', 'pro')
- Default value is 'free'
- User entity/type includes `tier: 'free' | 'pro'`
- All existing users have `tier = 'free'`

**Verification Commands**:
```bash
psql -d transcript_db -c "SELECT id, email, tier FROM users LIMIT 5;"
# All should show tier = 'free'
```

---

## Phase 4: User Story 2 - Guide Creation (Priority: P1) 🎯 MVP

**Goal**: User can create a guide from YouTube URL, system processes it asynchronously  
**Independent Test**: Authenticate, POST a YouTube URL, verify guide is created and queued

### T016: Implement Guide Model and Migration

**Status**: BLOCKED (depends on T007)  
**Goal**: Create Guide entity with all required fields  
**Scope**: Database migration, `apps/api/src/guides/entities/guide.entity.ts`  
**DONE Criteria**:
- Guide table has: `id`, `sourceUrl`, `title`, `status`, `ownerId`, `createdAt`, `updatedAt`
- `status` is enum: `created`, `queued`, `processing`, `done`, `failed`
- Foreign key to `users.id` on `ownerId`
- Unique constraint on `(ownerId, sourceUrl)` (same user can't create duplicate)

**Verification Commands**:
```bash
psql -d transcript_db -c "\d guides"
# Should show all columns and constraints
```

---

### T017: Implement GuideStep Model and Migration

**Status**: BLOCKED (depends on T016)  
**Goal**: Create GuideStep entity linked to Guide  
**Scope**: Database migration, `apps/api/src/guides/entities/guide-step.entity.ts`  
**DONE Criteria**:
- GuideStep table has: `id`, `guideId`, `order`, `title`, `body`, `startTime`, `endTime`
- Foreign key to `guides.id` on `guideId`
- Unique constraint on `(guideId, order)`

**Verification Commands**:
```bash
psql -d transcript_db -c "\d guide_steps"
# Should show all columns and foreign key
```

---

### T018: Implement POST /api/guides Endpoint

**Status**: BLOCKED (depends on T008, T016)  
**Goal**: Create endpoint to submit YouTube URL for processing  
**Scope**: `apps/api/src/guides/guides.controller.ts`, `guides.service.ts`  
**DONE Criteria**:
- Endpoint requires authentication
- Validates YouTube URL format
- Checks video duration limit [TBD - L-001] (placeholder: 60 min)
- Checks concurrent jobs limit [TBD - L-003] (placeholder: 3)
- Creates Guide with `status = 'created'`, `ownerId = currentUserId`
- Returns guide ID and status
- Enqueues job for processing

**Verification Commands**:
```bash
# Create guide
curl -X POST http://localhost:3000/api/guides \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Should return: { "id": "...", "status": "created", "sourceUrl": "...", "createdAt": "..." }
```

---

### T019: Implement YouTube Metadata Ingestion

**Status**: BLOCKED (depends on T010, T018)  
**Goal**: Ingest YouTube video metadata (title, duration)  
**Scope**: `apps/worker/src/jobs/ingest.job.ts`  
**DONE Criteria**:
- Worker job processes `ingest` stage
- Uses yt-dlp or YouTube API to fetch metadata
- Extracts `title` and `duration`
- Updates Guide: `title = videoTitle`, validates duration against limit
- Transitions Guide status: `created` → `queued` → `processing`
- On error: sets status to `failed`

**Verification Commands**:
```bash
# Create guide, then check worker logs
# Should see: "Ingesting video: <url>", "Title: <title>", "Duration: <duration>"
# Check DB: SELECT status, title FROM guides WHERE id = '<guide-id>';
```

---

### T020: Implement Stub Transcript Generation

**Status**: BLOCKED (depends on T019)  
**Goal**: Generate stub transcript segments from video duration  
**Scope**: `apps/worker/src/jobs/transcript.job.ts`  
**DONE Criteria**:
- Splits video into segments (e.g., 2-minute segments)
- Generates stub text: `"Segment {i} of video about {title}"`
- Returns list of segments with text and timecodes
- Does not save to DB (in-memory only for MVP)

**Verification Commands**:
```bash
# Check worker logs for transcript generation
# Should see segment generation messages
```

---

### T021: Implement Stub Guide Steps Generation

**Status**: BLOCKED (depends on T020, T017)  
**Goal**: Generate GuideStep entities from stub transcript  
**Scope**: `apps/worker/src/jobs/guide-steps.job.ts`  
**DONE Criteria**:
- Takes transcript segments as input
- Creates GuideStep for each segment:
  - `title = "Step {order}"`
  - `body = "This is step {order}. {segment.text}"`
  - `startTime` and `endTime` from segment
  - `order` is sequential (1, 2, 3...)
- Saves all GuideSteps to DB
- Updates Guide status to `done`

**Verification Commands**:
```bash
# After processing completes
psql -d transcript_db -c "SELECT COUNT(*) FROM guide_steps WHERE guide_id = '<guide-id>';"
# Should show number of steps created

psql -d transcript_db -c "SELECT status FROM guides WHERE id = '<guide-id>';"
# Should show: done
```

---

## Phase 5: User Story 3 - Guide Viewing (Priority: P1) 🎯 MVP

**Goal**: User can view list of their guides and detailed view of a single guide  
**Independent Test**: Authenticate, GET /api/guides returns only user's guides, GET /api/guides/:id shows details

### T022: Implement GET /api/guides Endpoint

**Status**: BLOCKED (depends on T008, T016)  
**Goal**: List all guides for current user with filtering  
**Scope**: `apps/api/src/guides/guides.controller.ts`, `guides.service.ts`  
**DONE Criteria**:
- Endpoint requires authentication
- Returns only guides where `ownerId = currentUserId`
- Supports query params: `status`, `limit`, `offset`
- Returns paginated response: `{ items: [...], total, limit, offset }`
- Each item includes: `id`, `title`, `status`, `sourceUrl`, `createdAt`, `updatedAt`

**Verification Commands**:
```bash
# Get all guides
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/guides

# Filter by status
curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/guides?status=done"

# Test pagination
curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/guides?limit=5&offset=0"
```

---

### T023: Implement GET /api/guides/:id Endpoint

**Status**: BLOCKED (depends on T022, T017)  
**Goal**: Get detailed guide with all steps  
**Scope**: `apps/api/src/guides/guides.controller.ts`, `guides.service.ts`  
**DONE Criteria**:
- Endpoint requires authentication
- Verifies `guide.ownerId = currentUserId` (returns 403 if not)
- Returns guide with nested `steps` array
- Each step includes: `id`, `order`, `title`, `body`, `startTime`, `endTime`
- Returns 404 if guide not found
- Returns 403 if user doesn't own guide

**Verification Commands**:
```bash
# Get guide details
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/guides/<guide-id>

# Should return: { "id": "...", "title": "...", "status": "done", "steps": [...] }

# Test access control (use different user's token)
curl -H "Authorization: Bearer <other-user-token>" http://localhost:3000/api/guides/<guide-id>
# Should return: 403 Forbidden
```

---

## Phase 6: User Story 4 - Plans Page (Payment Readiness) (Priority: P2)

**Goal**: Display pricing plans page with free/pro tiers (UI only, no payment processing)  
**Independent Test**: Navigate to /plans, see plans displayed, buttons are visible but inactive

### T024: Create Plans Page Component

**Status**: BLOCKED (depends on T003)  
**Goal**: Build static plans page with free and pro tier cards  
**Scope**: `apps/web/src/pages/PlansPage.tsx` or similar  
**DONE Criteria**:
- Route `/plans` exists and renders page
- Page shows two tier cards: Free and Pro
- Each card displays:
  - Tier name
  - List of features/limits
  - Current plan indicator (if user is on that tier)
  - "Upgrade" button (inactive/disabled in MVP)
- Modern minimal UI (no YouTube branding, no dated styling)
- Responsive design

**Verification Commands**:
```bash
# Start frontend
cd apps/web && npm run dev

# Navigate to http://localhost:5173/plans
# Should see plans page with two tier cards
# Buttons should be visible but disabled
```

---

### T025: Integrate User Tier Display

**Status**: BLOCKED (depends on T014, T024)  
**Goal**: Show current user's tier on plans page  
**Scope**: `apps/web/src/pages/PlansPage.tsx`  
**DONE Criteria**:
- Page fetches user info via GET `/api/user/me`
- Displays "Current Plan" badge on user's tier card
- Handles loading and error states

**Verification Commands**:
```bash
# With authenticated user, check plans page
# Should show "Current Plan" badge on Free tier (default)
```

---

### T026: Create Subscription Model (Payment Readiness)

**Status**: BLOCKED (depends on T007)  
**Goal**: Create Subscription table structure for future payment integration  
**Scope**: Database migration  
**DONE Criteria**:
- Subscription table created with all fields from spec §4.4
- Fields: `id`, `userId`, `tier`, `status`, `provider`, `providerSubscriptionId`, `startedAt`, `expiresAt`, `createdAt`, `updatedAt`
- Foreign key to `users.id`
- Table is empty in MVP (not used yet)

**Verification Commands**:
```bash
psql -d transcript_db -c "\d subscriptions"
# Should show all columns

psql -d transcript_db -c "SELECT COUNT(*) FROM subscriptions;"
# Should be 0 (not used in MVP)
```

---

## Phase 7: Frontend UI Implementation

**Purpose**: Build frontend screens for MVP user flows

### T027: Create URL Input Screen

**Status**: BLOCKED (depends on T003, T018)  
**Goal**: Build screen for submitting YouTube URL  
**Scope**: `apps/web/src/pages/CreateGuidePage.tsx` or similar  
**DONE Criteria**:
- Input field for YouTube URL
- Submit button "Create Guide"
- Shows duration limit hint: "Maximum duration: [TBD - L-001] minutes"
- On submit: POST to `/api/guides`, redirect to guide list
- Shows loading state during submission
- Shows error message if submission fails
- Modern minimal UI

**Verification Commands**:
```bash
# Navigate to create guide page
# Enter YouTube URL, submit
# Should redirect to guide list
```

---

### T028: Create Guide List Screen

**Status**: BLOCKED (depends on T003, T022)  
**Goal**: Display list of user's guides with status  
**Scope**: `apps/web/src/pages/GuideListPage.tsx`  
**DONE Criteria**:
- Fetches guides via GET `/api/guides`
- Displays list (table or cards) with: title, status badge, date, source URL
- Status badges: processing (yellow), done (green), failed (red)
- Auto-refreshes every 5 seconds for `processing` guides
- Click on guide navigates to guide detail page
- Modern minimal UI

**Verification Commands**:
```bash
# Navigate to guide list
# Should see all user's guides
# Status badges should have correct colors
# Auto-refresh should work for processing guides
```

---

### T029: Create Guide Detail View Screen

**Status**: BLOCKED (depends on T003, T023)  
**Goal**: Display guide with all steps  
**Scope**: `apps/web/src/pages/GuideDetailPage.tsx`  
**DONE Criteria**:
- Fetches guide via GET `/api/guides/:id`
- Displays guide title and source URL
- Lists all steps with: order, title, body, timecodes (optional)
- Shows "Processing..." if status is `processing`
- Shows "Error" message if status is `failed`
- Modern minimal UI

**Verification Commands**:
```bash
# Navigate to guide detail page
# Should see guide title, URL, and all steps
# Steps should be numbered and formatted correctly
```

---

### T030: Setup Frontend Routing

**Status**: BLOCKED (depends on T003)  
**Goal**: Configure React Router with all MVP routes  
**Scope**: `apps/web/src/App.tsx` or router config  
**DONE Criteria**:
- Routes configured: `/`, `/guides`, `/guides/:id`, `/plans`
- Protected routes require authentication (redirect to login if needed)
- Navigation between pages works
- 404 page for unknown routes

**Verification Commands**:
```bash
# Test all routes
# / should redirect or show home
# /guides should show guide list
# /guides/:id should show guide detail
# /plans should show plans page
# /invalid should show 404
```

---

### T031: Implement Frontend Authentication Flow

**Status**: BLOCKED (depends on T003, T013)  
**Goal**: Handle JWT tokens in frontend, protect routes  
**Scope**: `apps/web/src/auth/` directory  
**DONE Criteria**:
- Token stored in localStorage or httpOnly cookie
- Auth context/provider manages authentication state
- Protected routes check for token
- API requests include `Authorization: Bearer <token>` header
- Logout clears token and redirects

**Verification Commands**:
```bash
# Without token: should redirect to login/auth page
# With token: should access protected routes
# API calls should include Authorization header (check Network tab)
```

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

### T032: Add Input Validation and Error Messages

**Status**: BLOCKED (depends on all API endpoints)  
**Goal**: Improve validation and user-friendly error messages  
**Scope**: All API endpoints, frontend forms  
**DONE Criteria**:
- YouTube URL validation shows clear error if invalid
- Limit exceeded errors show what limit was hit
- All API errors return user-friendly messages
- Frontend displays errors clearly to user

**Verification Commands**:
```bash
# Test invalid URL
curl -X POST http://localhost:3000/api/guides \
  -H "Authorization: Bearer <token>" \
  -d '{"url": "invalid"}'
# Should return clear validation error

# Test limit exceeded
# (create guides until limit, then try one more)
# Should return clear limit error
```

---

### T033: Add Logging for Key Operations

**Status**: BLOCKED (depends on T012)  
**Goal**: Log important operations for debugging  
**Scope**: All services and workers  
**DONE Criteria**:
- Guide creation logged with userId and guideId
- Job processing logged with guideId and stage
- Errors logged with context (userId, guideId, error message)
- Logs are structured and searchable

**Verification Commands**:
```bash
# Create a guide, check logs
# Should see: "Guide created: <guide-id> by user <user-id>"

# Process a guide, check worker logs
# Should see: "Processing guide <guide-id>, stage: ingest"
```

---

### T034: Update Documentation

**Status**: READY  
**Goal**: Update README and docs with MVP setup instructions  
**Scope**: `README.md`, `docs/` files  
**DONE Criteria**:
- README explains how to set up and run MVP
- Environment variables documented
- API endpoints documented (or link to spec)
- Known limitations documented

**Verification Commands**:
```bash
# Read README, should be able to follow setup steps
cat README.md
```

---

### T035: Verify Multi-User Isolation

**Status**: BLOCKED (depends on all user stories)  
**Goal**: End-to-end test that users see only their own data  
**DONE Criteria**:
- Create guides as User A
- Authenticate as User B
- User B should see empty guide list (or only their own guides)
- User B cannot access User A's guides (403 on GET /api/guides/:id)

**Verification Commands**:
```bash
# As User A: create guide, get guide-id
# As User B: GET /api/guides (should be empty or only User B's)
# As User B: GET /api/guides/<user-a-guide-id> (should return 403)
```

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - **BLOCKS all user stories**
- **Phase 3-6 (User Stories)**: All depend on Phase 2 completion
  - User Stories can proceed sequentially (P1 → P2)
  - Some tasks within stories can run in parallel (marked with [P] if applicable)
- **Phase 7 (Frontend)**: Depends on Phase 3-6 API endpoints
- **Phase 8 (Polish)**: Depends on all previous phases

### Critical Path

1. **T001-T006** (Setup) → Can start immediately
2. **T007-T012** (Foundational) → Must complete before user stories
3. **T013-T015** (Auth) → Blocks guide creation
4. **T016-T021** (Guide Creation) → Blocks guide viewing
5. **T022-T023** (Guide Viewing) → Blocks frontend implementation
6. **T024-T026** (Plans Page) → Can run in parallel with T027-T031
7. **T027-T031** (Frontend) → Depends on backend APIs
8. **T032-T035** (Polish) → Final validation

### Parallel Opportunities

- **Setup tasks (T001-T006)**: Can run in parallel (different apps)
- **Foundational tasks (T007-T012)**: Some can run in parallel:
  - T009, T010, T011 can run in parallel (different modules)
- **Frontend tasks (T027-T031)**: Some can run in parallel:
  - T027, T028, T029 can start once APIs are ready (different pages)
- **T024 (Plans Page)**: Can run in parallel with backend work (static UI)

---

## Implementation Strategy

### MVP First (Minimum Viable)

1. Complete **Phase 1** (Setup)
2. Complete **Phase 2** (Foundational) - **CRITICAL BLOCKER**
3. Complete **Phase 3** (Auth) - enables multi-user
4. Complete **Phase 4** (Guide Creation) - core functionality
5. Complete **Phase 5** (Guide Viewing) - core functionality
6. Complete **Phase 7** (Frontend) - basic UI
7. **STOP and VALIDATE**: Test end-to-end flow

### Full MVP (Including Payment Readiness)

After MVP First is validated:
8. Complete **Phase 6** (Plans Page) - payment readiness
9. Complete **Phase 8** (Polish) - final touches

---

## Notes

- All tasks are designed to be ≤ 2 hours each
- Tasks marked **READY** can start immediately (dependencies met)
- Tasks marked **BLOCKED** must wait for dependencies
- Verification commands should be run after each task
- Commit after each task or logical group
- Stop at phase checkpoints to validate independently
