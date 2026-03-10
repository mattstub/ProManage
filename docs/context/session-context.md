# Session Context — Quick Reference

**Purpose**: Single file to read at the start of each session. Summarizes project state, key decisions, and file locations.

**Last Updated**: 2026-03-10 (Session 12)

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
apps/api/              COMPLETE (Sub-phases C+D + Phase 2.5)
  prisma/schema.prisma   10 models (added Task + Procedure), multi-tenant
  prisma/seed.ts         demo org, 6 roles, 64 perms, 3 users, 2 projects
  src/config/            Zod env validation
  src/lib/               errors, response helpers, pino logger, rate-limit
  src/middleware/        authenticate, authorize, error-handler
  src/plugins/           prisma, swagger
  src/routes/            health, auth, users, organizations, projects, dashboard, tasks, procedures
  src/services/          auth, user, org, token, password, project, dashboard, task, procedure
  src/types/             fastify.d.ts augmentation
  src/app.ts             Fastify builder
  src/server.ts          entry point
  src/__tests__/         80 tests (auth + task services/routes)
apps/web/              COMPLETE Phase 2.1 + 2.5 (Session 9)
  src/app/               App Router: /, /login, /register, /dashboard, /projects, /tasks, /procedures
  src/middleware.ts      Inverted-whitelist route guard
  src/stores/            Zustand auth store
  src/providers/         AuthProvider, QueryProvider
  src/components/        auth forms, layout (sidebar+icons+role-nav, header, nav-item), dashboard (stats-card, project-summary-list)
  src/hooks/             use-auth, use-dashboard-stats, use-organization, use-procedures, use-projects, use-tasks, use-users
  src/lib/               api-client singleton, query-client
apps/mobile/           DEFERRED

packages/core/         COMPLETE (Sub-phase B + Phase 2.5)
  src/types/             api, auth, user, role, org, project, task, dashboard
  src/schemas/           auth, user, org, project, task (Zod)
  src/constants/         roles, permissions, project-status, task-status, api
  src/utils/             pagination, format-date, format-currency
  src/__tests__/         66 tests (schemas + utils)
packages/api-client/   COMPLETE (Sub-phase E + Phase 2.5)
  src/client.ts          ProManageClient (fetch wrapper, auto-refresh on 401)
  src/errors.ts          ApiClientError class
  src/types.ts           ClientConfig, RequestOptions, PaginatedResult
  src/resources/         auth, users, organizations, health, projects, dashboard, tasks
  src/index.ts           createApiClient() factory + all exports
packages/ui-components/ COMPLETE (Sub-phase F - 30 files)
  src/utils/cn.ts        clsx + tailwind-merge utility
  src/components/        26 components (Button, Input, Card, Table, Dialog, Toast, etc.)
  src/index.ts           barrel exports + type re-exports

Root tooling:          COMPLETE (Sub-phase A)
  tsconfig.base.json, .eslintrc.json, .prettierrc, docker-compose.yml
```

---

## Current State (2026-03-09)

- **Phase 1, Sub-phases A-G**: COMPLETE (~150 source files)
- **Phase 2.1 Dashboard**: COMPLETE — real data, projects list, stats widgets, role-aware sidebar
- **Phase 2.2 Notifications**: COMPLETE — SSE real-time push, bell component, auto-notify on task assignment, 230 tests passing
- **Phase 2.3A Async Messaging**: COMPLETE — DMs (thread model) + Announcements (role-targeted, scheduled), 259 tests passing
- **Phase 2.4 Calendar**: COMPLETE — custom month-view calendar, full CRUD with RBAC, 205 tests passing
- **Phase 2.5 Task Management**: COMPLETE — full CRUD with RBAC, 146 tests passing
- **Phase 2.6 Procedures**: COMPLETE — full CRUD with RBAC, sidebar nav, view/edit/delete dialogs
- **API**: Runs on http://localhost:3001 | Routes: /auth, /calendar-events, /dashboard/stats, /messages, /notifications, /organizations, /procedures, /projects, /tasks, /users
- **DB**: PostgreSQL in Docker, seeded. 16 models in sync (`prisma db push` applied — Conversation, DirectMessage, Announcement, AnnouncementRead added)
- **api-client**: Built — includes MessagingResource, NotificationsResource, CalendarEventsResource, ProjectsResource, DashboardResource, TasksResource, ProceduresResource
- **ui-components**: Built (tsc --build, zero errors), 26 Radix+Tailwind components
- **Sidebar**: Dashboard, Projects, Tasks, Procedures, Calendar, Messages, Organization, Settings nav items
- **Header**: NotificationBell with live badge + dropdown panel (SSE-powered)
- **packages/core**: Now compiles to CommonJS (fixed ESM seed issue; web/bundler still works fine)
- **Next**: Phase 2.3B — Channel Chat (Socket.io, Discord-style channels with per-channel permissions)

### Seed Credentials

| Email | Password | Role |
|---|---|---|
| admin@demo.com | password123 | Admin |
| pm@demo.com | password123 | ProjectManager |
| field@demo.com | password123 | FieldUser |

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
