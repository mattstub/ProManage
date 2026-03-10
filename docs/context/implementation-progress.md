# Implementation Progress — ProManage

**Last Updated**: 2026-02-28 (Session 3)

---

## Phase 1: Foundation & Core Infrastructure

### Sub-phase A — Root Tooling ✅ COMPLETE

| File | Status | Notes |
|---|---|---|
| tsconfig.base.json | Done | ES2022, bundler resolution, @promanage/* path aliases |
| .prettierrc | Done | no semi, single quote, 2-space |
| .prettierignore | Done | |
| .eslintrc.json | Done | @typescript-eslint + import ordering |
| .eslintignore | Done | |
| docker-compose.yml | Done | PostgreSQL 15 + MinIO with healthchecks |
| package.json (root) | Done | Added all devDeps |

### Sub-phase B — packages/core ✅ COMPLETE (24 files)

**Types** (src/types/)
- api.ts — ApiResponse<T>, PaginationMeta, ApiErrorResponse
- auth.ts — AuthResponse, TokenPayload, LoginRequest, RegisterRequest
- user.ts — User, UserWithRoles
- organization.ts — Organization, CreateOrganizationInput, UpdateOrganizationInput
- project.ts — ProjectType (5), ProjectStatus (6), Project
- role.ts — RoleName (6 roles)
- index.ts

**Schemas** (src/schemas/)
- auth.ts — loginSchema, registerSchema (min 8 chars, upper+lower+number)
- user.ts — updateUserSchema
- organization.ts — updateOrganizationSchema
- project.ts — createProjectSchema, updateProjectSchema
- index.ts

**Constants** (src/constants/)
- permissions.ts — RESOURCES (16), ACTIONS (4), DEFAULT_ROLE_PERMISSIONS (full mapping)
- roles.ts — USER_ROLES (label + description per role)
- project-status.ts — PROJECT_TYPES, PROJECT_STATUSES with labels/colors
- api.ts — ERROR_CODES (13), HTTP_STATUS
- index.ts

**Utils** (src/utils/)
- pagination.ts — parsePagination (clamped), buildPaginationMeta
- format-date.ts — formatDate, formatDateShort, formatDateTime, formatRelativeTime
- format-currency.ts — formatCurrency, formatCurrencyCompact
- index.ts

**Package config**
- package.json — exports: ./types, ./schemas, ./constants, ./utils; dep: zod
- tsconfig.json — extends ../../tsconfig.base.json

### Sub-phase C — Database Layer ✅ COMPLETE

| Item | Status | Notes |
|---|---|---|
| apps/api/package.json | Done | All Fastify, Prisma, JWT, bcrypt, Zod deps |
| apps/api/tsconfig.json | Done | |
| apps/api/.env | Done | LOCAL ONLY — gitignored |
| apps/api/prisma/schema.prisma | Done | 8 models, multi-tenant, @@unique constraints |
| apps/api/prisma/seed.ts | Done | 64 perms, 6 roles, demo org, 3 users, 2 projects |
| Docker running | Done | PostgreSQL 15 on :5432, MinIO on :9000 |
| DB migrated | Done | Used prisma db push (dev) |
| DB seeded | Done | Verified seed data present |

**Schema models**: Organization, User, Role, Permission, RolePermission, UserRole, RefreshToken, Project

**Key constraints**:
- `@@unique([name, organizationId])` on Role
- `@@unique([number, organizationId])` on Project (required for upsert in seed)

### Sub-phase D — Fastify API Server ✅ COMPLETE (~30 files)

| Path | Status |
|---|---|
| src/config/env.ts | Done |
| src/config/index.ts | Done |
| src/lib/errors.ts | Done |
| src/lib/response.ts | Done |
| src/lib/logger.ts | Done |
| src/types/fastify.d.ts | Done |
| src/plugins/prisma.ts | Done |
| src/plugins/swagger.ts | Done |
| src/middleware/authenticate.ts | Done |
| src/middleware/authorize.ts | Done |
| src/middleware/error-handler.ts | Done |
| src/services/password.service.ts | Done |
| src/services/token.service.ts | Done |
| src/services/auth.service.ts | Done |
| src/services/user.service.ts | Done |
| src/services/organization.service.ts | Done |
| src/routes/health.ts | Done |
| src/routes/auth/index.ts | Done |
| src/routes/users/index.ts | Done |
| src/routes/organizations/index.ts | Done |
| src/routes/index.ts | Done |
| src/app.ts | Done |
| src/server.ts | Done |

**Auth flow**: Register creates org+user+Admin role in transaction. Login validates bcrypt. Refresh rotates tokens (old revoked, new issued) in transaction. Refresh token in httpOnly cookie, access token in response body.

**Verified endpoints**:
- GET /health -> {"status":"ok"}
- POST /api/v1/auth/login -> user + JWT (admin@demo.com / password123)
- GET /docs -> Swagger UI

### Sub-phase E — packages/api-client ✅ COMPLETE (10 files)
ProManageClient (fetch wrapper), AuthResource, UsersResource, OrganizationsResource, HealthResource, ApiClientError, createApiClient factory. Auto-refresh on 401, credentials: include for httpOnly cookie.

### Sub-phase F — packages/ui-components ✅ COMPLETE (30 files)
30 files — Radix UI + Tailwind base components. tsc --build verified, zero errors.
- Form: Button (CVA+asChild), Input, Textarea, Label, Checkbox, RadioGroup, Switch, Select
- Layout: Card (+Header/Title/Description/Content/Footer), Container, Stack, Grid, Separator
- Navigation: Tabs, Breadcrumbs, Pagination
- Feedback: Alert, Toast (+Provider/Viewport), Dialog, Tooltip (+Provider), Progress, Skeleton
- Data Display: Table (+Header/Body/Row/Head/Cell/Caption), Badge, Avatar, StatusIndicator
- Utils: cn() (clsx + tailwind-merge)
- Note: apps/web tailwind.config.ts must include ui-components src in content array

### Sub-phase G — apps/web ✅ COMPLETE (~30 files)

**Build verified**: tsc --noEmit zero errors, pnpm build → ✓ Compiled, 5 routes
**Security fixes**: middleware inverted whitelist, loginSchema max constraints, resetApiClient on logout, AuthProvider error distinction

Key files: package.json (React 19), middleware.ts, auth.store.ts, providers/auth-provider.tsx, lib/api-client.ts, components/auth/login-form.tsx, register-form.tsx, components/layout/sidebar.tsx, header.tsx, .claude/commands/ (3 slash commands)

---

## Phase 2: Dashboard & Hub

### Phase 2.1 — Dashboard Layout ✅ COMPLETE (Session 7, 2026-03-03)

**Build verified**: pnpm type-check + pnpm build → zero errors, 6 routes

**New files**:
- `packages/core/src/types/dashboard.ts` — `DashboardStats` interface
- `apps/api/src/services/project.service.ts` — listProjects, getProject, createProject, updateProject, archiveProject
- `apps/api/src/services/dashboard.service.ts` — getDashboardStats (Promise.all aggregate)
- `apps/api/src/routes/projects/index.ts` — CRUD with RBAC (GET: all roles; POST/PATCH: Admin/PM; DELETE: Admin)
- `apps/api/src/routes/dashboard/index.ts` — GET /stats (all authenticated roles)
- `packages/api-client/src/resources/projects.ts` — ProjectsResource (list, get, create, update, archive)
- `packages/api-client/src/resources/dashboard.ts` — DashboardResource (getStats)
- `apps/web/src/hooks/use-dashboard-stats.ts` — TanStack Query hook
- `apps/web/src/hooks/use-projects.ts` — useProjects (paginated) + useProject (single)
- `apps/web/src/hooks/use-organization.ts` — TanStack Query hook
- `apps/web/src/components/dashboard/stats-card.tsx` — StatsCard with skeleton + variants
- `apps/web/src/components/dashboard/project-summary-list.tsx` — badge color-coding, skeleton rows
- `apps/web/src/app/(dashboard)/projects/page.tsx` — Table with sorting/skeleton/empty state, stub Create dialog

**Modified files**:
- `apps/api/src/routes/index.ts` — registered /projects + /dashboard routes
- `packages/api-client/src/index.ts` — ApiClient interface + createApiClient() updated
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — real data (stats, org name, project list)
- `apps/web/src/components/layout/sidebar.tsx` — Heroicons + role-aware nav (Org: Admin/OfficeAdmin; Settings: Admin)

**Security reviews**: API PASS (6/6), Frontend PASS (6/6)

### Phase 2.5 — Task Management ✅ COMPLETE (Session 9, 2026-03-06)

Full CRUD with RBAC (146 tests passing). See session-context.md Session 9 log.

### Phase 2.6 — General Procedures ✅ COMPLETE (Session 10, 2026-03-07)

**New files**:
- `packages/core/src/types/procedure.ts` — `ProcedureStatus`, `ProcedureCategory`, `Procedure`, `ProcedureWithRelations`, input types
- `packages/core/src/schemas/procedure.ts` — `createProcedureSchema`, `updateProcedureSchema`
- `packages/core/src/constants/procedure-status.ts` — `PROCEDURE_STATUSES`, `PROCEDURE_CATEGORIES`, list constants
- `apps/api/src/services/procedure.service.ts` — listProcedures, getProcedure, createProcedure, updateProcedure, deleteProcedure
- `apps/api/src/routes/procedures/index.ts` — CRUD with RBAC (GET: all auth; POST/PATCH: Admin/PM/OfficeAdmin; DELETE: Admin)
- `packages/api-client/src/resources/procedures.ts` — ProceduresResource (list, get, create, update, delete)
- `apps/web/src/hooks/use-procedures.ts` — TanStack Query hooks
- `apps/web/src/app/(dashboard)/procedures/page.tsx` — Table + view/create/edit/delete dialogs, status+category filters

**Modified files**:
- `apps/api/prisma/schema.prisma` — Procedure model (10 models total)
- `packages/core/src/types/index.ts` — procedure type exports
- `packages/core/src/schemas/index.ts` — procedure schema exports
- `packages/core/src/constants/index.ts` — procedure-status exports
- `apps/api/src/routes/index.ts` — registered /procedures route
- `packages/api-client/src/index.ts` — ProceduresResource in ApiClient + createApiClient()
- `apps/web/src/components/layout/sidebar.tsx` — added Tasks + Procedures nav items

### Phase 2.3A — Async Messaging ✅ COMPLETE (Session 12, 2026-03-09)

**New files**:
- `packages/core/src/types/messaging.ts` — Conversation, DirectMessage, Announcement, AnnouncementRead types + input types
- `packages/core/src/schemas/messaging.ts` — sendDirectMessageSchema, createAnnouncementSchema, updateAnnouncementSchema
- `apps/api/src/services/messaging.service.ts` — full conversation + announcement service
- `apps/api/src/routes/messages/index.ts` — CRUD with RBAC
- `packages/api-client/src/resources/messaging.ts` — MessagingResource
- `apps/web/src/hooks/use-messaging.ts` — TanStack Query hooks (conversations, messages, announcements, unread count)
- `apps/web/src/app/(dashboard)/messages/page.tsx` — split-panel inbox UI (DMs + Announcements + Drafts tabs)

**Modified files**:
- `apps/api/prisma/schema.prisma` — 4 new models (16 total)
- `apps/api/src/routes/index.ts` — registered /messages route
- `apps/api/src/middleware/error-handler.ts` — fixed ZodError duck-type check
- `packages/core/tsconfig.json` — changed to CommonJS output (fixed seed ESM issue)
- `packages/core/src/types/index.ts` — messaging type exports
- `packages/core/src/schemas/index.ts` — messaging schema exports
- `packages/api-client/src/index.ts` — MessagingResource in ApiClient + createApiClient()
- `apps/web/src/components/layout/sidebar.tsx` — added Messages nav item
- `apps/api/src/__tests__/helpers/mock-prisma.ts` — Conversation, DirectMessage, Announcement, AnnouncementRead mocks
- `apps/api/src/__tests__/helpers/build-app.ts` — buildMessagingTestApp()

### Phase 2.3B — Channel Chat (Next Session)
- [ ] Socket.io integration with Fastify
- [ ] Channel + ChannelPermission + ChannelMember + ChatMessage + MessageAttachment models
- [ ] Per-channel role-based permissions (read/write/manage)
- [ ] File uploads (PDF, image, video) via MinIO
- [ ] Real-time message delivery

### Phase 2.2–2.4 — Notifications, Calendar (see session 11)

---

## Infrastructure State

| Item | Status | Notes |
|---|---|---|
| Node.js 20.20.0 | Done | Via nvm in WSL |
| pnpm 8.15.9 | Done | Installed globally |
| Docker Engine | Done | Running in WSL |
| PostgreSQL 15 | Done | Docker container, port 5432 |
| MinIO | Done | Docker container, ports 9000/9001 |
| pnpm install | Done | node_modules present |

---

## Known Issues / Quirks

1. **Prisma migrate dev** fails in non-interactive terminals with unique constraint warnings. Use `prisma db push --force-reset` for dev resets.
2. **WSL session isolation**: Each `wsl` invocation creates a new session; background processes don't persist across calls. Run server start + tests in a single bash -c chain.
3. **nvm** must be sourced per-session: `source ~/.nvm/nvm.sh && nvm use 20`
4. **Read tool path issue**: Tools using absolute paths like /home/mattstub/ProManage fail in WSL context. Use Bash with relative paths from cwd instead.

---

## Upcoming: Phase 1 Completion

To complete Phase 1, remaining work:

1. ~~**Sub-phase E** — api-client package (DONE)~~
2. ~~**Sub-phase F** — ui-components package (DONE)~~
3. **Sub-phase G** — apps/web shell (Next.js, auth pages, dashboard layout)

After Phase 1, Phase 2 begins: Dashboard module (real data, widgets, project summary, activity feed).

Full roadmap: docs/ROADMAP.md

---

## Sessions Summary

| Session | Date | Outcome |
|---|---|---|
| Session 1 | 2026-02-02 | 42 foundation files — docs, config, scripts |
| Session 2 | 2026-02-03 | DD-011 (PostgreSQL only), updated tech docs |
| Session 3 | 2026-02-28 | Phase 1 A-D complete — ~80 source files, API running |

