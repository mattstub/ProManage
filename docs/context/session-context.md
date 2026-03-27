# Session Context — Quick Reference

**Purpose**: Single file to read at the start of each session. Summarizes project state, key decisions, and file locations.

**Last Updated**: 2026-03-27 (Session 33 — Fix cross-origin refresh token cookie: SameSite=None in production for Railway cross-subdomain auth)

---

## Project Summary

**ProManage** — open-source (AGPL-3.0) construction management platform. Desktop-first web app (90%) + mobile companion (10%).

- **Repo**: `https://github.com/mattstub/ProManage`
- **Author**: Matt Stubenhofer
- **Version**: 0.1.0-dev

---

## Tech Stack

| **Layer**     | **Technology**                                                          |
| ------------- | ----------------------------------------------------------------------- |
| Web frontend  | Next.js 14+, React 18+, TailwindCSS, Radix UI, Zustand, TanStack Query  |
| Mobile        | React Native + Expo (deferred)                                          |
| API server    | Node.js 20+, Fastify, TypeScript                                        |
| Database      | PostgreSQL 15+ via Prisma ORM                                           |
| File storage  | MinIO (local), AWS S3 (prod)                                            |
| Auth          | JWT 15min + refresh token rotation 7d (httpOnly cookie)                 |
| Monorepo      | pnpm workspaces + Turborepo                                             |

**Deferred**: Redis, WatermelonDB

---

## Code Style Conventions

- No semicolons, single quotes, 2-space indent
- camelCase vars/functions, PascalCase components/classes, snake_case DB columns (Prisma @map)
- ESLint import order: external -> @promanage/* -> relative -> type

---

## Key Decisions

| **ID** | **Decision**                               | **Status**  |
| ------ | ------------------------------------------ | ----------- |
| DD-001 | Desktop-first (90/10 split)                | Accepted    |
| DD-002 | pnpm + Turborepo monorepo                  | Accepted    |
| DD-004 | TypeScript everywhere                      | Accepted    |
| DD-005 | Prisma ORM                                 | Accepted    |
| DD-006 | AGPL-3.0                                   | Accepted    |
| DD-007 | Radix UI + TailwindCSS                     | Proposed    |
| DD-009 | JWT + refresh token rotation               | Accepted    |
| DD-011 | PostgreSQL only, defer Redis/WatermelonDB  | Accepted    |

---

## Directory Map (Current State)

```bash
ProManage/
apps/api/              COMPLETE through Phase 6.2
  prisma/schema.prisma   57 models (+ Submittal, SubmittalDocument + 2 enums)
  prisma/seed.ts         demo org, 6 roles, 64 perms, 3 users, 2 projects, 2 channels, 3 contacts, 2 licenses, safety demo data, 6 disciplines
  src/config/            Zod env validation
  src/lib/               errors, response helpers, pino logger, rate-limit, sse
  src/middleware/        authenticate, authorize, error-handler
  src/plugins/           prisma, swagger, sse, minio, socket-io, license-reminder
  src/routes/            health, auth, users, organizations, projects, dashboard, tasks, procedures,
                         notifications, messages, calendar-events, channels, contacts, licenses, safety,
                         construction-documents, job-safety (under /projects/:projectId/safety/...),
                         estimation (/api/v1/estimation), materials (/api/v1/materials),
                         proposals (/api/v1/proposals), contracts (/api/v1/contracts),
                         submittals (/api/v1/submittals) (NEW)
  src/services/          auth, user, org, token, password, project, dashboard, task, procedure,
                         notification, messaging, calendar-event, channel, contact, license, safety,
                         construction-documents, job-safety, estimation, material, proposal, contract,
                         submittal (NEW)
  src/types/             fastify.d.ts (augmented with io, minio, sseClients)
  src/__tests__/         618 tests passing (28 test files)
apps/web/              COMPLETE through Phase 6.2
  src/app/               App Router: dashboard, projects (+ detail tabs: overview, team, channels, scopes,
                         estimates, contracts, submittals (NEW), documents, safety, settings), tasks, procedures, calendar,
                         messages, channels, contacts, licenses, safety, materials, proposals
  src/components/        layout (sidebar, header, nav-item, notification-bell),
                         dashboard (stats-card, project-summary-list),
                         channels (chat-panel, thread-panel, attachment-uploader, create-dialog, settings-panel)
  src/hooks/             use-auth, use-dashboard-stats, use-organization, use-procedures, use-projects,
                         use-tasks, use-users, use-notifications, use-messaging, use-calendar-events,
                         use-channels, use-socket, use-contacts, use-licenses, use-safety,
                         use-construction-documents, use-job-safety, use-materials,
                         use-estimation, use-proposals, use-contracts, use-submittals (NEW)
  src/lib/               api-client singleton (with resetSocket on auth error), query-client
apps/mobile/           DEFERRED

packages/core/         COMPLETE through Phase 6.2
  src/types/             api, auth, user, role, org, project, task, dashboard, procedure,
                         notification, messaging, calendar-event, channel, socket-events, license, safety,
                         construction-documents, material, estimation, proposal, contract, submittal (NEW)
  src/schemas/           auth, user, org, project, task, procedure, messaging, calendar-event, channel, license, safety,
                         construction-documents, material, estimation, proposal, contract, submittal (NEW)
  src/constants/         roles, permissions, project-status, task-status, api, procedure-status,
                         notification, calendar-event, channel, license, safety, construction-documents,
                         material, estimation, proposal, contract, submittal (NEW)
  src/utils/             pagination, format-date, format-currency
  src/__tests__/         97 tests
packages/api-client/   COMPLETE through Phase 6.2
  src/resources/         auth, users, organizations, health, projects, dashboard, tasks,
                         procedures, notifications, messaging, calendar-events, channels, contacts, licenses, safety,
                         construction-documents, job-safety, materials, estimation, proposals, contracts,
                         submittals (NEW)
  src/index.ts           createApiClient() factory + all exports (submittals added)
packages/ui-components/ COMPLETE (Sub-phase F - 30 files, 26 components)

Root tooling:          COMPLETE (Sub-phase A)
  tsconfig.base.json, .eslintrc.json, .prettierrc, docker-compose.yml
```

---

## Current State (2026-03-25)

- **Phase 1–5**: COMPLETE
- **Phase 6.1 Contracts**: COMPLETE — Contract + ContractDocument models; 11 API routes; 22 new tests (594 total); ContractsResource in api-client; Contracts tab on project detail with split-panel UI, document management + file upload/download
- **Phase 6.2 Submittals**: COMPLETE — Submittal + SubmittalDocument models; 11 API routes; 24 new tests (618 total); SubmittalsResource in api-client; Submittals tab on project detail (split-panel Submittal Log, Details + Attachments tabs, file upload/download)
- **API**: Runs on `http://localhost:3001`
- **DB**: PostgreSQL in Docker. 57 models. `prisma db push` applied.
- **api-client**: Built — all resource namespaces; submittals added
- **ui-components**: Built (tsc --build, zero errors), 26 Radix+Tailwind components
- **Sidebar**: Dashboard, Projects, Tasks, Procedures, Calendar, Channels, Contacts, Licenses, Safety, Messages, Materials, Proposals, Organization, Settings
- **Project Detail Tabs**: Overview, Team, Channels, Scopes, Estimates, Contracts, Submittals (new), Documents, Safety, Settings
- **Header**: NotificationBell with live badge + dropdown (SSE-powered)
- **packages/core**: CommonJS output (fixed ESM seed issue; web/bundler still works fine)
- **Tests**: 618 API tests, 97 core tests, web type-check clean, lint 0 errors
- **Infrastructure**: COMPLETE and merged — Dockerfiles, CI/CD, structured logging, Sentry scaffold, Fastify 5 upgrade
- **Branch**: `chore/fix-cross-origin-cookie-samesite`
- **Next**: Phase 6.3 RFIs

### Seed Credentials

| **Email**       | **Password**  | **Role**        |
| --------------- | ------------- | --------------- |
| `admin@demo.com`| password123   | Admin           |
| `pm@demo.com`   | password123   | Project Manager |
| `field@demo.com`| password123   | Field User      |

---

## Infrastructure (COMPLETE — Session 16)

- All items shipped on `chore/infrastructure` branch. See Session 16 log for full details.
- **Deployment**: `docker compose up -d` starts all 4 services (postgres, minio, api, web). `JWT_SECRET` must be set. Images pushed to GHCR on every merge to main.
- **Sentry**: Env var scaffolded (`SENTRY_DSN`). Install `@sentry/node` / `@sentry/nextjs` to activate — see `.env.example` for instructions.
- **Log aggregation** (still deferred): Self-hosted: Loki + Grafana. Managed: any platform log drain. App logs JSON to stdout — no app changes needed.

---

## Branch Protection (as of Session 10)

- **`main` is branch-protected on GitHub** — direct pushes are blocked.
  - Run `/new-branch` at the start of every session before any coding begins
  - All work ships via PR; never commit directly to `main`

---

## Claude Code Workflow Commands

Three slash commands live in `.claude/commands/` — invoke them in any Claude Code session:

| **Command**   | **Purpose**                                               |
| ------------- | --------------------------------------------------------- |
| `/startup`    | Full session startup checklist (infra, builds, git state) |
| `/new-branch` | Create a properly-named branch for a sub-phase or feature |
| `/commit-pr`  | Stage, commit, and prepare a PR with correct format       |

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

### Session 32 — 2026-03-26

- **Railway CI/CD deployment setup** (`chore/railway-cicd-deployment` branch):
  - **Web Dockerfile fix** — `outputFileTracingRoot` set to monorepo root causes Next.js standalone to mirror the directory structure, placing `server.js` at `apps/web/server.js` within the standalone output (not at the root). Fixed 3 issues: `CMD` updated from `node server.js` → `node apps/web/server.js`; static files copy target updated from `./.next/static` → `./apps/web/.next/static`; public directory removed from top-level copy (now inline after standalone copy, at `./apps/web/public`). Verified: all 4 Docker containers now healthy (api, web, postgres, minio).
  - **`release.yml` update** — Added `Trigger Railway deploys` step after image push. Reads `RAILWAY_WEBHOOK_API` + `RAILWAY_WEBHOOK_WEB` from GitHub Secrets; skips silently if not set (graceful before Railway is configured). Ensures Railway redeploys from GHCR images on every merge to main.
  - **`docs/deployment/railway.md`** — New file: step-by-step Railway setup guide covering project creation, PostgreSQL plugin, Cloudflare R2 (recommended) vs MinIO-on-Railway for file storage, API + web service Dockerfile config, environment variables, database seeding, deploy webhook setup, custom domains, and self-hosted GHCR pull alternative.
  - **618 tests passing, no code changes** — infrastructure/config only

### Session 31 — 2026-03-25

- **Phase 6.2 Submittals COMPLETE** (`feat/phase6-subphase-6.2-submittals` branch):
  - **Prisma**: 2 new models — `Submittal` (SubmittalType: 9 values, SubmittalStatus: 8 values; specSection, title, revision, submittedDate, requiredByDate, returnedDate, ballInCourt, approver; @@unique[organizationId, submittalNumber]) + `SubmittalDocument` (MinIO fileKey/fileName/fileSize). 57 models total. Back-relations on Organization, Project, User.
  - **packages/core**: New `types/submittal.ts`, `schemas/submittal.ts`, `constants/submittal.ts` — `SUBMITTAL_TYPE_LIST`/`SUBMITTAL_TYPES`, `SUBMITTAL_STATUS_LIST`/`SUBMITTAL_STATUSES`, `BALL_IN_COURT_OPTIONS`. All exported from index files.
  - **API service** (`submittal.service.ts`): 12 functions — full CRUD for Submittal + SubmittalDocument; P2002 → 409 on duplicate submittalNumber; MinIO presigned PUT/GET for document file upload/download.
  - **API routes** (`routes/submittals/index.ts`): 11 routes under `/api/v1/submittals`. WRITE_ROLES = Admin, ProjectManager, OfficeAdmin.
  - **Tests**: 24 new route tests (618 total, 28 test files). `submittal`/`submittalDocument` mocks added to `mock-prisma.ts`. `buildSubmittalTestApp` added to `build-app.ts`.
  - **api-client**: `SubmittalsResource` (11 methods) added; registered in `createApiClient()` factory.
  - **Web**: `use-submittals.ts` (12 TanStack Query hooks). `projects/[id]/submittals/page.tsx` — split-panel Submittal Log (list with type/spec section/status badge, Details + Attachments tabs). Submittals tab added between Contracts and Documents in project layout.

### Session 30 — 2026-03-25

- **Phase 6.1 Contracts COMPLETE** (PR #141 merged into `main`):
  - Full Contract + ContractDocument stack: 2 new Prisma models (4 enums), 55 models total; core types/schemas/constants; `contract.service.ts` (12 functions including presigned MinIO upload/download); 11 API routes; 22 route tests (594 total); `ContractsResource` in api-client; `use-contracts.ts` (12 hooks); `projects/[id]/contracts/page.tsx` split-panel UI with Details + Documents tabs; Contracts tab added to project layout.

### Session 29 — 2026-03-24

- **Dependabot maintenance** — assessed all merged security/upgrade PRs, verified operational health:
  - **Fastify 5, Next 16, Tailwind 4, TanStack Query 5.95, react-hook-form 7.72, bcrypt 6, dotenv 17, pino 10, vitest 4**: All already installed via lockfile; type-check clean; 572 tests passing — no code changes needed
  - **Prisma 7 (BLOCKED)**: Requires removing `url = env("DATABASE_URL")` from `schema.prisma` and creating `prisma.config.ts`; pinned back to `^5.22.0` in `apps/api/package.json`. Deferred as a dedicated migration task.
  - **Vulnerabilities**: Added `pnpm.overrides` in root `package.json` — `socket.io-parser >=4.2.6` + `fast-xml-parser >=5.5.9`. Audit: **0 vulnerabilities** (was 15: 5 high, 9 moderate, 1 low)
  - **Docker health checks**: Fixed API + web health check to use `127.0.0.1` instead of `localhost` — busybox wget couldn't resolve `localhost`, causing `promanage-api` to report unhealthy despite server responding correctly

### Session 28 — 2026-03-23

- **Phase 5 Pre-Construction & Estimation COMPLETE** (`feat/phase5-pre-construction-estimation` branch):
  - **Phase 5.1 Estimation**: Estimate → EstimateItem → EstimateItemVendorQuote (@@unique[estimateItemId, vendorId]); BidResult; denormalized `totalCost` on both EstimateItem and Estimate (recomputed via `estimateItem.aggregate` after every item mutation). 22 API routes under `/api/v1/estimation`. Prisma Decimal fields serialize as strings; services use `new Prisma.Decimal(value)` on write. Project Estimates sub-tab with split-panel (list + detail with line items and bid results tabs).
  - **Phase 5.2 Material Database**: CostCode (@@unique[code, organizationId]), Material (with `lastPricedAt`), MaterialPriceHistory (cascade from Material; 6-month auto-prune on unit cost change). `createMaterial` seeds initial price history entry in `$transaction`. 11 API routes under `/api/v1/materials`. Standalone Materials page with paginated table + filter bar + price history dialog + Cost Codes sub-tab.
  - **Phase 5.3 Proposals**: Proposal (@@unique[organizationId, proposalNumber]; auto-increment proposalNumber per org), ProposalLineItem (sortOrder), ProposalTemplate (status auto-sets submittedAt on SENT). `createFromEstimate` stub returns 501. 13 API routes under `/api/v1/proposals`. Standalone Proposals page with status filter + Templates sub-tab.
  - **Prisma**: 10 new models added; 53 models total. Back-relations added to Organization (8 new), User (4 new), Project (2 new), Contact (2 new). Pushed with `db push --force-reset`.
  - **packages/core**: New files: `types/material.ts`, `types/estimation.ts`, `types/proposal.ts`; `schemas/material.ts`, `schemas/estimation.ts`, `schemas/proposal.ts`; `constants/material.ts`, `constants/estimation.ts`, `constants/proposal.ts`. All exported from index files.
  - **Tests**: 572 total (up from 519), 26 test files. New: `material.routes.test.ts`, `estimation.routes.test.ts`, `proposal.routes.test.ts`. All passing.
  - **api-client**: `MaterialsResource` (9 methods), `EstimationResource` (18 methods), `ProposalsResource` (11 methods) added.
  - **Web**: 3 new hooks files (`use-materials.ts`, `use-estimation.ts`, `use-proposals.ts`). 3 new pages (`materials/page.tsx`, `proposals/page.tsx`, `projects/[id]/estimates/page.tsx`). Estimates tab added to project detail layout. Materials + Proposals added to sidebar.

### Session 26 — 2026-03-21

- **Phase 4.3 Safety (Job-Specific) COMPLETE** (`feat/phase4-subphase-4.3-safety-job-specific` branch):
  - **Design decisions**: JHAs are freeform (title + description + optional file upload, no structured rows); emergency contacts are inline in Safety tab (no sub-section); SDS binder = PM associates org catalog entries to project (join table); Safety tab inserted between Documents and Settings.
  - **Prisma**: 3 new models — `JobHazardAnalysis` (freeform JHA, optional MinIO file), `ProjectEmergencyContact` (name/role/phone/address/notes/sortOrder), `ProjectSdsEntry` (join table linking org `SdsEntry` to project, @@unique on [projectId, sdsEntryId]). `SafetyDocument` gained optional `projectId`. 43 models total.
  - **packages/core**: New types/schemas/constants added to existing `safety.ts` files. Types: `JhaStatus`, `EmergencyContactRole`, `JobHazardAnalysis`, `ProjectEmergencyContact`, `ProjectSdsEntry` + input types. Schemas: create/update for JHA, emergency contact, project SDS entry. Constants: `JHA_STATUSES`, `JHA_STATUS_LIST`, `EMERGENCY_CONTACT_ROLES`, `EMERGENCY_CONTACT_ROLE_LIST`, `ALLOWED_JHA_MIME_TYPES`, `MAX_JHA_FILE_SIZE_BYTES`.
  - **API service** (`job-safety.service.ts`): Full CRUD for JHAs, emergency contacts, project SDS binder. Read-only project-scoped views for SafetyDocument, ToolboxTalk, IncidentReport (already had projectId). MinIO presigned URLs for JHA file upload/download. `assertProjectAccess()` helper. Conflict detection for duplicate SDS binder entries.
  - **API routes** (`routes/job-safety/index.ts`): 24 routes registered under `/projects` prefix, paths like `/:projectId/safety/jhas`. WRITE_ROLES = Admin+PM+Super+OfficeAdmin; MANAGE_ROLES = Admin+PM+OfficeAdmin.
  - **Tests**: 24 new route tests (519 total, 23 test files). Covers CRUD happy-paths, 401/403/404/409 error cases, schema validation.
  - **api-client**: `JobSafetyResource` (17 methods) added; registered in `createApiClient()` factory as `jobSafety`.
  - **Web**: `use-job-safety.ts` (13 TanStack Query hooks). `safety/page.tsx` — 6-tab UI (Emergency Contacts, JHAs, SDS Binder, Safety Documents, Toolbox Talks, Incidents). Safety tab added to project detail layout between Documents and Settings.

### Session 25 — 2026-03-21

- **Phase 4.2 Construction Documents COMPLETE** (`feat/phase4-subphase-4.2-construction-documents` branch):
  - **Design decisions**: Overlay/comparison deferred to optimization phase; user-defined drawing disciplines (org-scoped lookup table, not enum); freeform spec section numbering (no CSI MasterFormat enforcement).
  - **Prisma**: 6 new models — `DrawingDiscipline`, `DrawingSet`, `DrawingSheet`, `DrawingRevision`, `SpecificationSection`, `SpecificationRevision`. Back-relations on Organization (6), Project (3: drawingSets, drawingSheets, specificationSections), User (4 named). 40 models total.
  - **packages/core**: New `construction-documents.ts` in types (9 interfaces), schemas (10 Zod schemas), constants (`DRAWING_PHASES`, `ALLOWED_DRAWING_MIME_TYPES`, `MAX_DRAWING_FILE_SIZE_BYTES`).
  - **API service** (`construction-documents.service.ts`): Full CRUD for all 6 entities. `$transaction` for `isCurrent` flag management (drawing + spec revisions). Auto-increment spec `revisionNumber`. MinIO presigned PUT URL generation (`drawings/{projectId}/{sheetId}/{ts}-{fileName}`). Best-effort MinIO cleanup on delete. `assertProjectAccess()` helper guards all project-scoped ops.
  - **API routes** (`routes/construction-documents/index.ts`): 21 routes. WRITE_ROLES = Admin+ProjectManager; UPLOAD_ROLES = Admin+ProjectManager+Superintendent. Route prefixes: `/disciplines`, `/:projectId/drawing-sets`, `/:projectId/drawing-sheets`, `/:projectId/spec-sections`.
  - **Tests**: 14 service tests + 14 route tests = 28 new tests (495 total). `mockRole()` pattern from safety routes used throughout.
  - **api-client**: `ConstructionDocumentsResource` (20 methods) added; registered in `createApiClient()` factory.
  - **Web**: `use-construction-documents.ts` (20 TanStack Query hooks). `documents/page.tsx` — two-tab UI (Drawing Log + Specifications) with Add Sheet/Section dialogs. Documents tab added to project detail layout.
  - **Seed**: 6 default drawing disciplines added for demo org (upserted by `@@unique` key).

### Session 24 — 2026-03-19

- **Housekeeping + state sync** (on `main`):
  - Phase 4.1 (`feat/phase4-subphase-1-project-entity`) merged as PR #111
  - PR #112 (`docs/lint-cleanup`): lint fixes in AI-generated docs and `.claude/commands/`; Copilot review fixes for API route error handling; `apps/api/README.md` updated
  - PR #113 (`docs/license`): `LICENSE` file added (AGPL-3.0)
  - Updated session-context, CHANGELOG, and persistent memory to reflect clean main state
  - Documentation overhaul: rewrote all 11 README files + 4 central docs in `docs/development/` to match actual codebase state; eliminated stale AI-generated scaffolding (wrong commands, wrong features, wrong tools); centralized testing/standards/setup guidance; trimmed deferred packages to placeholders
  - Next: discussing Phase 4.2 / 4.3 planning before starting new branch

### Session 23 — 2026-03-18

- **Phase 4.1 follow-up fixes** (continuing on `feat/phase4-subphase-1-project-entity`):
  - **Tailwind CSS broken** — all styles dropped due to mismatch: CI commit 9169fa8 switched PostCSS to `@tailwindcss/postcss` (v4 plugin) but `globals.css` still used v3 `@tailwind base/components/utilities` directives which v4 ignores. Fixed by updating globals.css to `@import "tailwindcss"` + `@source "../../packages/ui-components/src"`.
  - **Next.js 15 `params` warning** — all 5 project detail pages (`[id]/layout.tsx`, `[id]/page.tsx`, `[id]/team/page.tsx`, `[id]/scopes/page.tsx`, `[id]/settings/page.tsx`) used `params.id` directly. Fixed by typing `params` as `Promise<{ id: string }>` and unwrapping with `React.use(params)`.
  - **Radix `SelectItem value=""` crash** — projects/page.tsx filter selects used `value=""` which Radix forbids. Changed to `"ALL"` sentinel; updated filter logic accordingly.
  - **UI styling regression** — filter/search bar used icon-inside-input pattern and raw `<button>`; rewrote to match `contacts/page.tsx` pattern exactly (Label + plain Input, fixed-width selects, Button component, 300ms debounced search).
  - **ROADMAP.md** — added Project Channels tab to Phase 4.1; cross-linked from Phase 2.3B deferred item; updated status + date.

### Session 22 — 2026-03-18

- **Phase 4.1 Project Entity Expansion COMPLETE** (`feat/phase4-subphase-1-project-entity` branch):
  - Layer 1 — Prisma: Extended `Project` model with 8 new optional fields (ownerName, ownerPhone, ownerEmail, architectName, contractorLicense, permitNumber, budget, squareFootage). Added `role String?` to `ContactProject`. Added `ProjectScope` and `ProjectSettings` models (34 models total). `prisma db push` applied; seed updated with demo project settings + scopes.
  - Layer 2 — packages/core: Extended `CreateProjectInput` (added optional `status`), `UpdateProjectInput`. New types: `ProjectScope`, `ProjectSettings`, `ProjectContactAssignment`, `ProjectWithRelations`, `ProjectDashboardMetrics`, `ProjectDashboard`, `ProjectScopeStatus`. New schemas: `createProjectScopeSchema`, `updateProjectScopeSchema`, `updateProjectSettingsSchema`, `assignContactToProjectSchema`. New constants: `PROJECT_SCOPE_STATUSES`, `PROJECT_SCOPE_STATUS_LIST`.
  - Layer 3 — API (service + routes + tests): `project.service.ts` rewritten with 14 functions (listProjects with search/type filter, getProject with relations, createProject via `$transaction`, getProjectDashboard with 6 parallel queries, listProjectContacts, assignContact, removeContact, listScopes, createScope, updateScope, deleteScope, getSettings upsert-defaults, updateSettings). `routes/projects/index.ts` rewritten with 18 routes across 4 groups. Fixed `requireRole`/`mockRole` pattern in tests (was missing throughout — safety routes had it, project routes didn't). 63 new tests (30 service + 33 route), 463 total. Fixed `projectSettings.create` mock.
  - Layer 4 — api-client: `ProjectsResource` extended with 11 new methods (getDashboard, listContacts, assignContact, updateContactAssignment, removeContact, listScopes, createScope, updateScope, deleteScope, getSettings, updateSettings). `ListProjectsParams` extended with `type` and `search`. New type exports from core added to api-client index.
  - Layer 5 — Web: `use-projects.ts` extended with 12 new hooks (useProjectDashboard, useProjectContacts, useProjectScopes, useProjectSettings, useCreateProject, useUpdateProject, useArchiveProject, useAssignContact, useRemoveProjectContact, useCreateProjectScope, useUpdateProjectScope, useDeleteProjectScope, useUpdateProjectSettings). Projects list page: clickable rows → detail, search input, status+type filters, working create form. New project detail pages: `[id]/layout.tsx` (tab nav: Overview, Team, Scopes, Settings), `[id]/page.tsx` (metrics cards + project details + scope progress), `[id]/team/page.tsx` (assign/remove contacts with roles), `[id]/scopes/page.tsx` (CRUD scope list), `[id]/settings/page.tsx` (toggle-based settings panel).
  - Docker fix (from previous session): API Dockerfile CMD fixed (`node apps/api/dist/server.js`), OpenSSL 3 added for Alpine Prisma.

### Session 21 — 2026-03-17

- **CI/Lint fixes for Phase 3.3 Safety** (`feat/phase3-subphase-3-safety` branch):
  - `eslint-plugin-import` → `eslint-plugin-import-x@4.16.2`: `eslint-plugin-import@2.x` incompatible with ESLint 10 (`getTokenOrCommentBefore` removed). Replaced in `package.json`, `eslint.config.mjs`, `.eslintrc.json`.
  - `apps/api/src/routes/safety/index.ts`: Fixed duplicate `randomUUID` import (removed `crypto`, kept `node:crypto`); fixed import group ordering (built-in first); removed dead `safeFileName`/`fileKey` lines from SDS download-url handler; fixed `const expectedPrefix` erroneously placed inside TypeScript type annotation in SDS upload-url handler; replaced `uuidv4()` with `randomUUID()`.
  - `packages/api-client/src/resources/safety.ts`: Removed duplicate `getDocumentDownloadUrl` implementation; added `getSdsDownloadUrl`.
  - `apps/web/src/hooks/use-safety.ts`: Restored `useDownloadSafetyDocument` to call `getApiClient().safety.getDocumentDownloadUrl(id)`; restored `useDownloadSds` to call `getApiClient().safety.getSdsDownloadUrl(id)`.
  - `apps/web/src/app/(dashboard)/safety/page.tsx`: Added `as Tab` cast on ternary spread element to fix TS2322.
  - `apps/api/src/__tests__/routes/safety.routes.test.ts`: Fixed fileKey fixture to include `organizationId` segment.
  - All 7 turbo tasks (lint, type-check ×3, test ×2, build) passing clean.

### Session 20 — 2026-03-17

- **Phase 3.3 Safety COMPLETE** (`feat/phase3-subphase-3-safety` branch):
  - Layer 1 — Prisma: Added 6 new models (SafetyDocument, SdsEntry, ToolboxTalk, ToolboxTalkAttendee, SafetyForm, IncidentReport). Schema now 32 models. `prisma db push` applied; seed updated with demo safety data.
  - Layer 2 — packages/core: Created `types/safety.ts` (all 5 feature types + input types), `schemas/safety.ts` (11 Zod schemas), `constants/safety.ts` (5 constant maps + list arrays). Wired into index files.
  - Layer 3 — API (service + routes + tests): `safety.service.ts` (23 functions), `routes/safety/index.ts` (23 routes). WRITE_ROLES = Admin/PM/Superintendent/OfficeAdmin. Incident POST open to all authenticated (FieldUser must be able to report). Mocked `userRole.findMany` per test via `mockRole()` helper. 81 new tests (383 total). Updated mock-prisma + build-app helpers.
  - Layer 4 — api-client: `SafetyResource` class with methods for all 23 routes. Added to `ApiClient` interface and `createApiClient()` factory. `pnpm --filter @promanage/api-client build` passes clean.
  - Layer 5 — Web: `use-safety.ts` (22 TanStack Query hooks). `app/(dashboard)/safety/page.tsx` — 5-tab safety hub (Documents, SDS Catalog, Toolbox Talks, Forms, Incidents). IncidentReport tab hidden for FieldUser (INCIDENT_VIEW_ROLES). MinIO 3-step upload pattern for SafetyDocument and SdsEntry. Sidebar: added Safety nav item with ShieldCheckIcon. Web type-check clean.
  - Docker fix (Session 19) — `fix/dockerignore-nested-node-modules` — merged before this session.

### Session 19 — 2026-03-17

- **Docker web image build fix** (`fix/dockerignore-nested-node-modules`):
  - `.dockerignore`: added `**/node_modules` — the existing `node_modules` entry only excluded the repo root; nested `apps/web/node_modules` and `packages/*/node_modules` were being sent in the build context (185 MB!) and the `COPY apps/web/` step overwrote pnpm's workspace symlinks, causing `next build` to fail with `Cannot find module 'next/dist/bin/next'`

### Session 18 — 2026-03-15

- **Dev environment + live bug sweep** (`fix/dev-env-setup` branch):
  - Fixed API dev server — `tsx watch` doesn't auto-load `.env`; added `dotenv ^17.3.1`, changed script to `tsx watch --import=dotenv/config src/server.ts`
  - Added `apps/web/public/.gitkeep` — was missing, causing web Dockerfile `COPY` to fail
  - Fixed licenses page `SelectItem value=""` → `value="none"` (Radix rejects empty string); added document download button using presigned MinIO URL
  - Fixed announcement unread bubble persisting after mark-as-read: added `onMutate` optimistic update with `wasUnread` guard and `Array.isArray(old.data)` guard to prevent corrupting the drafts query (different data shape, same partial key prefix)
  - Fixed notification bell: `onMutate` optimistic updates for mark-read/delete, click-to-navigate, `stopPropagation` on action buttons
  - Added Messages nav badge: `useUnreadCount` in sidebar, `badge` prop on `NavItem`
  - Fixed DM unread count race condition: removed `unread-count` invalidation from `useSendMessage`/`useStartConversation`; added `syncedConvIdRef` effect in `ThreadPanel` to sync after first fetch per conversation
  - Fixed stale snapshot: `selectedConvId`/`selectedAnnId` now store IDs, derive live objects from query cache
  - Added `useMarkConversationRead` hook for optimistic DM read tracking

### Session 17 — 2026-03-15

- **Phase 3.2 Licensing COMPLETE** (all 5 layers):
  - Layer 1: `License` + `LicenseDocument` + `LicenseReminder` Prisma models (26 total); holderType discriminator (ORGANIZATION|USER), freeform licenseType; seed with 2 demo licenses + 2 reminders; `prisma db push` applied
  - Layer 2: `packages/core` — `types/license.ts`, `schemas/license.ts` (Zod: createLicense, updateLicense, createLicenseReminder, updateLicenseReminder), `constants/license.ts` (holder types, statuses, `LICENSE_REMINDER_DAILY_THRESHOLD`)
  - Layer 3: `license.service.ts` (12 functions — list/get/create/update/delete + addDoc/deleteDoc + createReminder/updateReminder/deleteReminder); `routes/licenses/index.ts` (12 routes with RBAC); `plugins/license-reminder.ts` (setInterval daily check: ≤7d fires every day, >7d fires once per cycle, expirationDate update resets cycle); SSE notifications via existing bell; `buildLicenseTestApp()` + mock models added
  - Layer 4: `packages/api-client/src/resources/licenses.ts` (LicensesResource, 12 methods); wired into ApiClient + createApiClient()
  - Layer 5: `use-licenses.ts` (10 hooks, 3-step presigned MinIO document upload), `/licenses/page.tsx` (table + filters + create/edit/detail/delete dialogs; detail shows docs panel + reminder config panel with pause/resume), Licenses nav item (`IdentificationIcon`)
  - **Tests**: 302 API tests passing (43 new: 24 service + 19 route); 399 total with core; web type-check clean
- **Infrastructure cleanup**: reviewed Fastify 5 upgrade (all 302 tests pass, type-check clean); fixed Dockerfile `prisma generate` order (PR #73 merged); Copilot improved to `pnpm --filter exec` pattern
- Branch: `feat/phase3-subphase-2-licensing` — PR pending

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
- TO-DO: run `prisma db push` to apply Task model to database

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

### Session 4 - 2026-03-01

- Sub-phase E: packages/api-client (10 files) - ProManageClient, resources, ApiClientError, createApiClient()
- TypeScript project references wired (composite + tsc --build on both packages)
- Removed .claude/settings.local.json from git tracking
- PR merged by user

### Session 3 - 2026-02-28

- Parsed Obsidian canvas (17+ modules), built ROADMAP.md (10 phases)
- Installed Node 20 + pnpm via nvm, Docker Engine in WSL
- Sub-phase A-D: root tooling, packages/core, database, Fastify API server
- Verified: health check + login returning JWT working

### Session 2 - 2026-02-03

DD-011: PostgreSQL only, defer Redis/WatermelonDB. Updated tech-stack + design-decisions docs.

### Session 1 - 2026-02-02

Created 42 foundation files (docs, config, scripts, templates), monorepo structure.
