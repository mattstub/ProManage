# Session Context — Quick Reference

**Purpose**: Single file to read at the start of each session. Summarizes project state, key decisions, and file locations.

**Last Updated**: 2026-03-14 (Session 16)

---

## Project Summary

**ProManage** — open-source (AGPL-3.0) construction management platform. Desktop-first web app (90%) + mobile companion (10%).

- **Repo**: https://github.com/mattstub/ProManage
- **Author**: Matt Stubenhofer
- **Version**: 0.1.0-dev

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Next.js 14+, React 18+, TailwindCSS, Radix UI, Zustand, TanStack Query |
| Mobile | React Native + Expo (deferred) |
| API server | Node.js 20+, Fastify, TypeScript |
| Database | PostgreSQL 15+ via Prisma ORM |
| File storage | MinIO (local), AWS S3 (prod) |
| Auth | JWT 15min + refresh token rotation 7d (httpOnly cookie) |
| Monorepo | pnpm workspaces + Turborepo |

**Deferred**: Redis, WatermelonDB

---

## Code Style Conventions

- No semicolons, single quotes, 2-space indent
- camelCase vars/functions, PascalCase components/classes, snake_case DB columns (Prisma @map)
- ESLint import order: external -> @promanage/* -> relative -> type

---

## Key Decisions

| ID | Decision | Status |
|---|---|---|
| DD-001 | Desktop-first (90/10 split) | Accepted |
| DD-002 | pnpm + Turborepo monorepo | Accepted |
| DD-004 | TypeScript everywhere | Accepted |
| DD-005 | Prisma ORM | Accepted |
| DD-006 | AGPL-3.0 | Accepted |
| DD-007 | Radix UI + TailwindCSS | Proposed |
| DD-009 | JWT + refresh token rotation | Accepted |
| DD-011 | PostgreSQL only, defer Redis/WatermelonDB | Accepted |

---

## Directory Map (Current State)

```
ProManage/
apps/api/              COMPLETE through Phase 3.1
  prisma/schema.prisma   23 models (+ Contact, ContactProject)
  prisma/seed.ts         demo org, 6 roles, 64 perms, 3 users, 2 projects, 2 channels, 3 contacts
  src/config/            Zod env validation
  src/lib/               errors, response helpers, pino logger, rate-limit, sse
  src/middleware/        authenticate, authorize, error-handler
  src/plugins/           prisma, swagger, sse, minio, socket-io
  src/routes/            health, auth, users, organizations, projects, dashboard, tasks, procedures,
                         notifications, messages, calendar-events, channels, contacts
  src/services/          auth, user, org, token, password, project, dashboard, task, procedure,
                         notification, messaging, calendar-event, channel, contact
  src/types/             fastify.d.ts (augmented with io, minio, sseClients)
  src/__tests__/         162 tests passing
apps/web/              COMPLETE through Phase 2.3B
  src/app/               App Router: dashboard, projects, tasks, procedures, calendar, messages, channels, contacts
  src/components/        layout (sidebar, header, nav-item, notification-bell),
                         dashboard (stats-card, project-summary-list),
                         channels (chat-panel, thread-panel, attachment-uploader, create-dialog, settings-panel)
  src/hooks/             use-auth, use-dashboard-stats, use-organization, use-procedures, use-projects,
                         use-tasks, use-users, use-notifications, use-messaging, use-calendar-events,
                         use-channels, use-socket, use-contacts
  src/lib/               api-client singleton (with resetSocket on auth error), query-client
apps/mobile/           DEFERRED

packages/core/         COMPLETE through Phase 2.3B
  src/types/             api, auth, user, role, org, project, task, dashboard, procedure,
                         notification, messaging, calendar-event, channel, socket-events
  src/schemas/           auth, user, org, project, task, procedure, messaging, calendar-event, channel
  src/constants/         roles, permissions, project-status, task-status, api, procedure-status,
                         notification, calendar-event, channel
  src/utils/             pagination, format-date, format-currency
  src/__tests__/         97 tests
packages/api-client/   COMPLETE through Phase 3.1
  src/resources/         auth, users, organizations, health, projects, dashboard, tasks,
                         procedures, notifications, messaging, calendar-events, channels, contacts
  src/index.ts           createApiClient() factory + all exports (contacts resource added)
packages/ui-components/ COMPLETE (Sub-phase F - 30 files, 26 components)

Root tooling:          COMPLETE (Sub-phase A)
  tsconfig.base.json, .eslintrc.json, .prettierrc, docker-compose.yml
```

---

## Current State (2026-03-12)

- **Phase 1, Sub-phases A-G**: COMPLETE (~150 source files)
- **Phase 2.1 Dashboard**: COMPLETE — real data, projects list, stats widgets, role-aware sidebar
- **Phase 2.2 Notifications**: COMPLETE — SSE real-time push, bell component, auto-notify on task assignment
- **Phase 2.3A Async Messaging**: COMPLETE — DMs (thread model) + Announcements (role-targeted, scheduled)
- **Phase 2.3B Channel Chat**: COMPLETE — Socket.io channels, per-role permissions, file uploads via MinIO, message threading, real-time delivery
- **Phase 2.4 Calendar**: COMPLETE — custom month-view calendar, full CRUD with RBAC
- **Phase 2.5 Task Management**: COMPLETE — full CRUD with RBAC
- **Phase 2.6 Procedures**: COMPLETE — full CRUD with RBAC
- **Phase 3.1 Contact Management**: COMPLETE — 8-type contact directory, search/filter, project associations, org-scoped email uniqueness
- **API**: Runs on http://localhost:3001 | Routes: /auth, /calendar-events, /channels, /contacts, /dashboard, /messages, /notifications, /organizations, /procedures, /projects, /tasks, /users
- **DB**: PostgreSQL in Docker. 23 models. Contact + ContactProject added. `prisma db push` applied.
- **api-client**: Built — all resource namespaces including ContactsResource
- **ui-components**: Built (tsc --build, zero errors), 26 Radix+Tailwind components
- **Sidebar**: Dashboard, Projects, Tasks, Procedures, Calendar, Channels, Contacts, Messages, Organization, Settings
- **Header**: NotificationBell with live badge + dropdown (SSE-powered)
- **packages/core**: CommonJS output (fixed ESM seed issue; web/bundler still works fine)
- **Tests**: 259 API tests passing, web type-check clean
- **Infrastructure (chore/infrastructure)**: COMPLETE — Dockerfiles, CI/CD, structured logging, Sentry scaffold done; PR merged
- **Next**: Phase 3.2 — Licensing (license tracking, renewal reminders, document uploads)

### Seed Credentials

| Email | Password | Role |
|---|---|---|
| admin@demo.com | password123 | Admin |
| pm@demo.com | password123 | ProjectManager |
| field@demo.com | password123 | FieldUser |

---

## Infrastructure (COMPLETE — Session 16)

All items shipped on `chore/infrastructure` branch. See Session 16 log for full details.

**Deployment**: `docker compose up -d` starts all 4 services (postgres, minio, api, web). `JWT_SECRET` must be set. Images pushed to GHCR on every merge to main.

**Sentry**: Env var scaffolded (`SENTRY_DSN`). Install `@sentry/node` / `@sentry/nextjs` to activate — see `.env.example` for instructions.

**Log aggregation** (still deferred): Self-hosted: Loki + Grafana. Managed: any platform log drain. App logs JSON to stdout — no app changes needed.

---

## Branch Protection (as of Session 10)

**`main` is branch-protected on GitHub** — direct pushes are blocked.

- Run `/new-branch` at the start of every session before any coding begins
- All work ships via PR; never commit directly to `main`

---

## Claude Code Workflow Commands

Three slash commands live in `.claude/commands/` — invoke them in any Claude Code session:

| Command | Purpose |
|---|---|
| `/startup` | Full session startup checklist (infra, builds, git state) |
| `/new-branch` | Create a properly-named branch for a sub-phase or feature |
| `/commit-pr` | Stage, commit, and prepare a PR with correct format |

---

## How to Restart

```bash
source ~/.nvm/nvm.sh && nvm use 20
docker compose up -d
cd apps/api && pnpm dev
# Build packages if dist/ is missing (must clean tsbuildinfo first):
pnpm --filter @promanage/core build
pnpm --filter @promanage/api-client build
# Optional DB reset:
npx prisma db push --force-reset && npx ts-node prisma/seed.ts
```

---

## TypeScript Build Notes

- packages/core, packages/api-client, packages/ui-components all use tsc --build (composite:true)
- Clean must remove tsconfig.tsbuildinfo alongside dist/ or incremental build skips emit
- Build order: core first, then api-client / ui-components (parallel)
- ui-components requires "jsx": "react-jsx" and "include": ["src/**/*.ts", "src/**/*.tsx"] in tsconfig
- React is a peerDependency in ui-components — do NOT add as a direct dep

---

## Module Map (from Obsidian Canvas)

17+ modules in notes/ProManage Suite.canvas.
Core (Ph 1-4): Dashboard, Projects, Contacts, Auth
Parallelizable (Ph 5+): Safety, Scheduling, Daily Reports, Time Tracking, RFIs, Submittals, Change Orders, POs, Estimation, Material DB, Contracts, Permits, Inspections, Pay Applications, Equipment, Licensing

See: docs/ROADMAP.md

---

## Session Log

### Session 1 - 2026-02-02
Created 42 foundation files (docs, config, scripts, templates), monorepo structure.

### Session 2 - 2026-02-03
DD-011: PostgreSQL only, defer Redis/WatermelonDB. Updated tech-stack + design-decisions docs.

### Session 3 - 2026-02-28
- Parsed Obsidian canvas (17+ modules), built ROADMAP.md (10 phases)
- Installed Node 20 + pnpm via nvm, Docker Engine in WSL
- Sub-phase A-D: root tooling, packages/core, database, Fastify API server
- Verified: health check + login returning JWT working

### Session 4 - 2026-03-01
- Sub-phase E: packages/api-client (10 files) - ProManageClient, resources, ApiClientError, createApiClient()
- TypeScript project references wired (composite + tsc --build on both packages)
- Removed .claude/settings.local.json from git tracking
- PR merged by user

### Session 16 — 2026-03-14

- **Infrastructure sub-phase COMPLETE** (`chore/infrastructure` branch):
  - `apps/api/Dockerfile` — single-stage pnpm monorepo build (node:20-alpine, corepack, non-root user, prisma generate, runs `dist/server.js`)
  - `apps/web/Dockerfile` — multi-stage build using Next.js standalone output (`output: 'standalone'` + `outputFileTracingRoot`); runner is minimal node:20-alpine with only `.next/standalone` + static
  - `docker-compose.yml` — added `api` + `web` services with healthchecks, `JWT_SECRET` required via env, `NEXT_PUBLIC_API_URL` as build arg; minio/postgres services unchanged
  - `.dockerignore` — standard monorepo ignores (node_modules, dist, .next, .turbo, secrets)
  - `.github/workflows/ci.yml` — PR gate: lint → type-check → test → build (API + web); pnpm + Turborepo cache
  - `.github/workflows/release.yml` — push to main: build + push API + web Docker images to GHCR; uses GHA cache for layers
  - **Structured logging**: `authenticate.ts` now enriches `request.log` with `userId` + `organizationId` via `request.log.child(...)` after JWT verification; all downstream logs in authenticated requests carry user context automatically
  - **Sentry scaffold**: `SENTRY_DSN` added as optional field to `env.ts` + `.env.example`; install `@sentry/node` / `@sentry/nextjs` to activate (see `.env.example` for instructions)
  - `apps/api/.env.example` + `apps/web/.env.local.example` — created with all env vars documented
  - `README.md` — updated status table (infra complete), added Docker Deployment section, fixed web env setup, updated project structure to reflect contacts/channels
  - **259 tests still passing, API type-check clean, web type-check clean**
- Branch: `chore/infrastructure` — PR pending

### Session 15 - 2026-03-12

- **Phase 3.1 Contact Management COMPLETE** (all 5 layers):
  - Layer 1: `Contact` + `ContactProject` Prisma models (23 models total); `@@unique([organizationId, email])` for org-scoped email uniqueness; seed updated with 3 demo contacts + 2 project associations; `prisma db push` applied
  - Layer 2: `packages/core` — `types/contact.ts`, `schemas/contact.ts` (Zod: email validation, max lengths, enum type), `constants/contact.ts` (CONTACT_TYPES + CONTACT_TYPE_LIST)
  - Layer 3: `contact.service.ts` (7 functions — listContacts with full-text search, getContact, createContact, updateContact, deleteContact, addContactToProject, removeContactFromProject); `routes/contacts/index.ts` (7 routes with RBAC); `buildContactTestApp()` + mock-prisma updated
  - Layer 4: `packages/api-client/src/resources/contacts.ts` (ContactsResource, 7 methods); wired into ApiClient interface + createApiClient()
  - Layer 5: `use-contacts.ts` (7 hooks), `/contacts/page.tsx` (table + type filter + search + CRUD dialogs), Contacts nav item in sidebar
  - **Security**: multi-agent deployment — security agent identified 10 findings; org-scoped email uniqueness (Finding #10) implemented; CSV import/export sanitization deferred with the feature
  - **Tests**: 259 API tests passing (61 new contact tests: 24 service + 37 route), web type-check clean
- Branch: `feat/phase3-subphase-1-contact-management` — push pending

### Session 14 - 2026-03-11

- **Phase 2.3B Channel Chat COMPLETE** (Layer 4 + Layer 5):
  - Layer 4: `packages/api-client/src/resources/channels.ts` — ChannelsResource (14 methods); added `PUT` to RequestOptions method union; index.ts updated and rebuilt
  - Layer 5: `apps/web` — `hooks/use-socket.ts` (Socket.io singleton, JWT in handshake.auth), `hooks/use-channels.ts` (14 hooks + `useChannelSocketEvents` for real-time cache invalidation), `/channels/page.tsx`, ChannelChatPanel, MessageThreadPanel, AttachmentUploader (3-step presigned upload), CreateChannelDialog, ChannelSettingsPanel (4 tabs), sidebar Channels nav item, `api-client.ts` calls `resetSocket()` on auth error
  - `socket.io-client ^4.8.3` added to apps/web
  - **162 API tests passing**, web type-check clean
- **Documentation updated**: CHANGELOG, ROADMAP, session-context, implementation-progress, CLAUDE.md all brought current; `implementation-progress.md` deprecated (content migrated here)
- Branch: `feat/phase2-subphase-3b-channel-chat` — push pending

### Session 13 - 2026-03-11

- **Phase 2.3B Channel Chat** (Layers 1-3):
  - Layer 1: 5 new Prisma models (Channel, ChannelPermission, ChannelMember, ChatMessage, MessageAttachment) — 21 models total; `prisma db push` applied; seed updated with 2 demo channels
  - Layer 2: packages/core — channel types, socket-event types, channel schemas, channel constants; rebuilt
  - Layer 3a: `plugins/minio.ts` (MinIO client, bucket auto-create), `plugins/socket-io.ts` (JWT auth in handshake.auth.token, org/user rooms), `fastify.d.ts` updated, `app.ts` updated
  - Layer 3b: `mock-prisma.ts` + `build-app.ts` updated with 5 new model mocks + `buildChannelTestApp()` (with `createMockIo()` + `createMockMinio()`)
  - Layer 3c: `channel.service.ts` (15 functions), `routes/channels/index.ts` (15 routes), registered in routes/index.ts
  - **Dependency incident**: `pnpm add` accidentally upgraded Fastify 4→5, Prisma 5→7, Zod 3→4. Pinned back Fastify + Prisma. Zod 4 kept — required two targeted fixes (`.issues` rename, `.default(false)`)
  - **162 tests passing** after Zod 4 compatibility fixes

### Session 12 - 2026-03-10

- **Phase 2.3A Async Messaging COMPLETE** — DMs + Announcements, no Socket.io needed:
  - Prisma: `Conversation`, `DirectMessage`, `Announcement`, `AnnouncementRead` models (16 models total)
  - Canonical participant ordering (participantA < participantB lexicographically) enforced in service layer
  - packages/core: `messaging.ts` types + `messaging.ts` Zod schemas (sendDirectMessage, createAnnouncement, updateAnnouncement)
  - apps/api: `messaging.service.ts` (listConversations, getOrCreateConversation, getConversationMessages, sendDirectMessage, listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementRead, getUnreadCount)
  - apps/api: `routes/messages/index.ts` — full CRUD with RBAC (Announcement create: Admin/PM/OfficeAdmin)
  - packages/api-client: `MessagingResource` with all methods
  - apps/web: `/messages` page — split-panel layout, two tabs (DMs + Announcements), compose dialogs, drafts tab for managers
  - **Bug fixed**: `ZodError instanceof` check in error-handler failing in test env — changed to duck-type check (`error.name === 'ZodError'`) — resolved 10 pre-existing test failures
  - **Build fix**: packages/core tsconfig changed to CommonJS output — fixes `ERR_UNSUPPORTED_DIR_IMPORT` when running seed via ts-node
  - **259 total tests passing** (97 core + 162 API), web type-check clean (13 routes)
- **Phase 2.3B Channel Chat** scoped and documented in ROADMAP.md (Socket.io, per-channel permissions, file uploads, template projects noted as future feature)
- Branch: `feat/phase2-subphase-3-messaging` — push pending

### Session 11 - 2026-03-08

- **Phase 2.4 Calendar COMPLETE** — custom month-view calendar, no external library deps:
  - Prisma: `CalendarEvent` model (11 models total), relations on Organization/User/Project
  - packages/core: `EventType` type, Zod schemas (create + update), `EVENT_TYPES`/`EVENT_TYPE_LIST` constants
  - apps/api: `calendar-event.service.ts` + `routes/calendar-events` with rate limiting + RBAC
  - packages/api-client: `CalendarEventsResource`
  - apps/web: `/calendar` page (custom month grid), `use-calendar-events` hook, Calendar nav in sidebar
  - `prisma db push` applied — DB in sync
- **Phase 2.2 Notifications COMPLETE** — SSE real-time push, no Redis needed:
  - Prisma: `Notification` model (12 models total)
  - API infra: `plugins/sse.ts` (SSE client map), `lib/sse.ts` (`emitToUser()`)
  - apps/api: `notification.service.ts` + `routes/notifications` (REST + SSE stream, token-in-query-param auth)
  - task.service: auto-creates `TASK_ASSIGNED` notification on task create/reassign
  - packages/api-client: `NotificationsResource` with `getStreamUrl()` helper
  - apps/web: `NotificationBell` component (live badge + dropdown), `useSSENotifications` hook (EventSource)
  - `prisma db push` applied — DB in sync
- **230 total tests passing** (97 core + 133 API), web build clean (12 routes)
- Branches: `feat/phase2-subphase-4-calendar` (merged), `feat/phase2-subphase-2-notifications` (PR pending)
- **Next**: Phase 2.3 Messaging (Socket.io)

### Session 10 - 2026-03-08
- **Phase 2.6 Procedures COMPLETE** — full CRUD with RBAC across all layers:
  - Prisma: `Procedure` model (10 models total), relations on Organization/User/Project
  - packages/core: `ProcedureStatus`, `ProcedureCategory` types, Zod schemas, `procedure-status` constants
  - apps/api: `procedure.service.ts` + `routes/procedures` with rate limiting + RBAC (Admin/PM/OfficeAdmin)
  - packages/api-client: `ProceduresResource`, wired into `createApiClient()` + `ApiClient` interface
  - apps/web: `/procedures` page (table + view/create/edit/delete dialogs), `use-procedures` hook
  - sidebar: Added **Tasks** and **Procedures** nav items (Tasks was missing from sidebar)
  - `prisma db push` applied — DB in sync
- All 146 existing tests still passing (66 core + 80 API)
- Branch: `feat/phase2-subphase-6-procedures` — 2 commits staged, push pending
- Logout bug fixed: `POST /api/auth/logout` Next.js route handler clears cookie same-origin; header.tsx catches API errors gracefully
- **TODO next session**: push branch + open PR, then start Phase 2.2 (Notifications) or 2.4 (Calendar)

### Session 9 - 2026-03-06
- CodeQL rate-limiting findings FIXED: refactored to use fastify.rateLimit() preHandler pattern
- Rate limit pattern: local plugin registration with `global: false`, explicit config per route
- **Phase 2.5 Task Management COMPLETE** — multi-agent build:
  - Task model added to Prisma schema (status, priority, assignee, project relations)
  - packages/core: TaskStatus, TaskPriority types, Zod schemas, constants (31 tests)
  - apps/api: task.service.ts + routes/tasks with full RBAC (55 tests)
  - packages/api-client: TasksResource
  - apps/web: /tasks page, use-tasks + use-users hooks
- Security: org scoping, role-based update permissions (Admin/PM/OfficeAdmin or assignee)
- **146 total tests passing** (66 core + 80 API)
- Commit: `09a89ed feat(tasks): add Phase 2.5 Task Management module`
- TODO: run `prisma db push` to apply Task model to database

### Session 8 - 2026-03-04
- Auth redirect loop bug fixed: logout route made unauthenticated; onAuthError calls logout before redirect
- Vitest testing infrastructure added: packages/core (35 tests) + apps/api (25 tests) = 60 total, all passing
- Pre-existing build issues fixed: API tsconfig paths, authenticate.ts jwtVerify typing, error-handler unused param
- scripts/dev.sh rewritten (docker compose v2, WSL-aware); scripts/status.sh added
- CLAUDE.md updated with Testing section and mocking conventions

### Session 7 - 2026-03-03
- Phase 2.1 Dashboard module COMPLETE — multi-agent build (Project Manager, API Builder, API Client Builder, Frontend Builder, Code Review, 2× Security Analyst, Testing)
- API: project.service + dashboard.service, /projects CRUD routes, /dashboard/stats route
- packages/core: DashboardStats type; packages/api-client: ProjectsResource + DashboardResource, rebuilt zero errors
- apps/web: stats-card, project-summary-list, 3 new hooks, dashboard real data, /projects page, sidebar with Heroicons + role-aware nav
- Security reviews: PASS (all 12 checks across API + frontend layers)
- Build: pnpm type-check + pnpm build → zero errors, 6 routes

### Session 6 - 2026-03-02
- Created .claude/commands/ workflow system: /startup, /new-branch, /commit-pr
- Sub-phase G: apps/web Next.js 14 App Router shell -- 30 files, build clean (5 routes)
- Multi-agent: Builder + Security Agent (7 findings) + Testing Agent
- Fixes: React 19 type alignment, ESLint import/order auto-fix, security hardening
- Phase 1 COMPLETE: All sub-phases A through G done

### Session 5 - 2026-03-02
- Sub-phase F: packages/ui-components (30 files) - tsc --build, zero errors
- 26 components: Button, Input, Textarea, Label, Checkbox, RadioGroup, Switch, Select,
  Card, Container, Stack, Grid, Separator, Tabs, Breadcrumbs, Pagination,
  Alert, Toast, Dialog, Tooltip, Progress, Skeleton,
  Table, Badge, Avatar, StatusIndicator
- Pattern: Radix UI primitives + CVA variants + cn() (clsx + tailwind-merge)
- React as peerDependency; Tailwind NOT a dep (apps/web runs Tailwind, scans ui-components src)
- Documentation sweep: wrote ARCHITECTURE.md from scratch (was empty), updated README
  (Node 20, Docker prereq, Quick Start, status table), checked off ROADMAP Phase 1
  items, fixed technology-stack.md (Fastify, api-client description), updated
  CHANGELOG with Sub-phase F entry
- Branch feat/phase1-subphase-f-ui-components created, 2 commits staged and ready
  (push pending — run from terminal due to WSL git push hang)
