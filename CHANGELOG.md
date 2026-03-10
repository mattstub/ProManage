# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Phase 2.3A Async Messaging Module (Session 12, 2026-03-10)

**Phase 2.3A — Async Messaging (DMs + Announcements)**

*apps/api/prisma*
- `schema.prisma`: 4 new models — `Conversation` (canonical participant ordering), `DirectMessage`, `Announcement` (targetRole, scheduledAt, sentAt), `AnnouncementRead` — 16 models total
- `prisma db push` applied — DB in sync

*packages/core*
- `types/messaging.ts`: Conversation, ConversationWithRelations, DirectMessage, DirectMessageWithSender, Announcement, AnnouncementWithRelations, AnnouncementRead, UnreadCount + input types
- `schemas/messaging.ts`: `sendDirectMessageSchema`, `createAnnouncementSchema`, `updateAnnouncementSchema` (Zod)
- `tsconfig.json`: Changed to CommonJS output — fixes `ERR_UNSUPPORTED_DIR_IMPORT` when running seed via ts-node

*apps/api*
- `services/messaging.service.ts`: `listConversations`, `getOrCreateConversation`, `getConversationMessages`, `sendDirectMessage`, `listAnnouncements`, `listDraftAnnouncements`, `getAnnouncement`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `markAnnouncementRead`, `getUnreadCount`
- `routes/messages/index.ts`: Full REST API with RBAC (DMs: all auth; Announcements create/update/delete: Admin/PM/OfficeAdmin)
- `routes/index.ts`: registered `/messages` prefix
- `middleware/error-handler.ts`: Fixed ZodError duck-type check (`error.name === 'ZodError'`) — resolved 10 pre-existing test failures

*packages/api-client*
- `resources/messaging.ts`: `MessagingResource` — getUnreadCount, listConversations, startConversation, listMessages, sendMessage, listAnnouncements, listDrafts, getAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementRead
- `index.ts`: `ApiClient` interface + `createApiClient()` updated with `messaging` namespace

*apps/web*
- `hooks/use-messaging.ts`: useUnreadCount, useConversations, useConversationMessages, useStartConversation, useSendMessage, useAnnouncements, useDraftAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, useMarkAnnouncementRead
- `app/(dashboard)/messages/page.tsx`: Split-panel inbox — DMs tab (conversation list + thread view, send on Enter), Announcements tab (list + detail, mark-read), Drafts tab (managers only, delete draft)
- `components/layout/sidebar.tsx`: Added Messages nav item (ChatBubbleLeftRightIcon)

*tests*
- `__tests__/services/messaging.service.test.ts`: 18 tests (listConversations, getOrCreateConversation, sendDirectMessage, createAnnouncement, updateAnnouncement, deleteAnnouncement, getUnreadCount)
- `__tests__/routes/messaging.routes.test.ts`: 11 tests (HTTP contract, RBAC, 400/401/403/204 status codes)
- `__tests__/helpers/mock-prisma.ts`: Added conversation, directMessage, announcement, announcementRead mocks
- `__tests__/helpers/build-app.ts`: Added `buildMessagingTestApp()`
- **259 total tests passing** (97 core + 162 API), web type-check clean

### Added - Phase 2.6 Procedures Module (Session 10, 2026-03-07)

**Phase 2.6 — General Procedures (full CRUD + RBAC)**

*apps/api/prisma*
- `schema.prisma`: `Procedure` model with title, content, category, status (DRAFT/PUBLISHED/ARCHIVED), org scoping, optional project link, createdBy user relation — 10 models total
- `prisma db push` applied — DB in sync

*packages/core*
- `types/procedure.ts`: `ProcedureStatus`, `ProcedureCategory`, `Procedure`, `ProcedureWithRelations`, `CreateProcedureInput`, `UpdateProcedureInput`
- `schemas/procedure.ts`: `createProcedureSchema`, `updateProcedureSchema` (Zod, with content max 50k)
- `constants/procedure-status.ts`: `PROCEDURE_STATUSES`, `PROCEDURE_CATEGORIES`, list constants

*apps/api*
- `services/procedure.service.ts`: `listProcedures` (paginated, status/category/project filters), `getProcedure`, `createProcedure`, `updateProcedure`, `deleteProcedure`
- `routes/procedures/index.ts`: GET /, GET /:id (all auth), POST / + PATCH /:id (Admin/PM/OfficeAdmin), DELETE /:id (Admin); rate limiting via fastify.rateLimit()
- `routes/index.ts`: registered `/procedures` prefix

*packages/api-client*
- `resources/procedures.ts`: `ProceduresResource` — `list`, `get`, `create`, `update`, `delete` with typed params/responses
- `index.ts`: `ApiClient` interface + `createApiClient()` updated with `procedures` namespace

*apps/web*
- `hooks/use-procedures.ts`: `useProcedures`, `useProcedure`, `useCreateProcedure`, `useUpdateProcedure`, `useDeleteProcedure` (TanStack Query)
- `app/(dashboard)/procedures/page.tsx`: full table UI with status+category filters, view/create/edit/delete dialogs, skeleton loading, role-aware actions
- `components/layout/sidebar.tsx`: added **Tasks** and **Procedures** nav items (Tasks was previously missing)

**Verified**: packages/core + api-client build clean, API + web type-check zero errors, 146 tests passing (66 core + 80 API)

### Added - Phase 2 Dashboard Module (Session 7, 2026-03-03)

**Phase 2.1 — Dashboard & Hub (multi-agent build)**

*API layer (apps/api)*
- `project.service.ts`: `listProjects` (paginated + status filter), `getProject`, `createProject`, `updateProject`, `archiveProject` — full `organizationId` scoping
- `dashboard.service.ts`: `getDashboardStats` — single `Promise.all` → `activeProjectCount`, `totalProjectCount`, `teamMemberCount`, `projectsByStatus` breakdown
- `routes/projects/index.ts`: GET /, GET /:id, POST / (Admin/PM), PATCH /:id (Admin/PM), DELETE /:id (Admin)
- `routes/dashboard/index.ts`: GET /stats (all authenticated roles)
- Registered both route groups in `routes/index.ts`

*packages/core*
- `types/dashboard.ts`: `DashboardStats` interface exported from `types/index.ts`

*packages/api-client*
- `resources/projects.ts`: `ProjectsResource` — `list`, `get`, `create`, `update`, `archive` with typed params/responses
- `resources/dashboard.ts`: `DashboardResource` — `getStats()`
- `index.ts`: `ApiClient` interface + `createApiClient()` updated with `projects` and `dashboard` namespaces
- Rebuilt: `pnpm --filter @promanage/api-client build` — zero errors

*apps/web*
- `@heroicons/react` added as dependency
- Hooks: `use-dashboard-stats`, `use-projects`, `use-organization` (TanStack Query)
- `components/dashboard/stats-card.tsx`: `StatsCard` — loading skeleton, blue/green/default variants
- `components/dashboard/project-summary-list.tsx`: `ProjectSummaryList` — status Badge color-coding, skeleton rows
- `app/(dashboard)/dashboard/page.tsx`: replaced placeholders with live data (stats, org name, project list)
- `app/(dashboard)/projects/page.tsx`: full projects table (number, name, type, status Badge, dates), skeleton loading, empty state, "New Project" button (Admin/PM) with stub Dialog
- `components/layout/sidebar.tsx`: Heroicons icons (Home, FolderOpen, Users, Building, Cog), role-aware nav (Organization: Admin/OfficeAdmin; Settings: Admin only)

*Security (both agents — all PASS)*
- API: authentication on all routes, RBAC on writes, organizationId from JWT only, Zod validation, no raw SQL
- Frontend: no token exposure, role gates via Zustand only, resetApiClient() on logout, no localStorage cache, no XSS

### Added - Phase 1 Sub-phase G (Session 6, 2026-03-02)

**Sub-phase G - apps/web Next.js 14 App Router shell (~30 files)**
- Next.js 14.1 + React 19 app with App Router, TypeScript, Tailwind CSS
- Auth pages: `/login` (LoginForm) and `/register` (RegisterForm) with react-hook-form + Zod validation via `@promanage/core/schemas`
- Dashboard layout: sidebar nav (NavItem with active-state detection) + header (Avatar, role Badge, sign-out)
- Protected dashboard page: placeholder stat cards using `@promanage/ui-components`
- Middleware: inverted-whitelist route guard — redirects unauthenticated users to `/login` based on `refresh_token` cookie; redirects authenticated users away from auth pages
- AuthProvider: restores session on mount via `auth.me()`, distinguishes 401/403 (clearAuth) from network errors (unblock UI without clearing session)
- Zustand auth store: `user`, `accessToken`, `isAuthenticated`, `isLoading`, `setAuth`, `setToken`, `clearAuth`, `setLoading`
- TanStack Query: QueryClient singleton, 60s stale time, configured at root via QueryProvider
- API client singleton: `getApiClient()` with `onTokenRefresh` → Zustand, `onAuthError` → redirect; `resetApiClient()` called on logout to clear in-memory token
- Security hardening: `loginSchema` max constraints (email: 254, password: 128), open-redirect footgun removed from middleware, API client singleton reset on logout, network vs auth error distinction in AuthProvider
- .claude/commands/: `/startup`, `/new-branch`, `/commit-pr` slash commands for Claude Code workflow automation
- packages/core build: zero errors after schema change

### Added - Phase 1 Sub-phase F (Session 5, 2026-03-01)

**Sub-phase F - packages/ui-components (30 files)**
- 26 React components built with Radix UI primitives + TailwindCSS utility classes
- Form: Button (CVA variants + asChild for Link composition), Input, Textarea, Label, Checkbox, RadioGroup/RadioGroupItem, Switch, Select (+Group/Value/Trigger/Content/Item/Label/Separator)
- Layout: Card (+Header/Title/Description/Content/Footer), Container (maxWidth CVA), Stack (direction/gap/align/justify), Grid (cols/gap), Separator
- Navigation: Tabs (+List/Trigger/Content), Breadcrumbs (accessible nav with aria-current), Pagination (ellipsis logic, imports Button)
- Feedback: Alert (info/success/warning/error variants), Toast (+Provider/Viewport/Title/Description/Action/Close), Dialog (+Trigger/Close/Overlay/Content/Header/Title/Description), Tooltip (+Provider/Trigger/Content), Progress (Radix + translateX indicator), Skeleton
- Data Display: Table (+Header/Body/Row/Head/Cell/Caption), Badge (6 variants), Avatar (+Image/Fallback, size CVA), StatusIndicator (status + size CVA)
- Utils: cn() combining clsx + tailwind-merge for safe class composition
- Build: tsc --build (composite:true, jsx:react-jsx), zero errors; React as peerDependency; Tailwind NOT bundled (consuming app scans src paths)
- All components: forwardRef where applicable, displayName set, consistent import order

### Added - Phase 1 Sub-phase E (Session 4, 2026-03-01)

**Sub-phase E - packages/api-client (10 files)**
- ProManageClient: typed fetch wrapper, JWT access token in memory, credentials: include for httpOnly cookie
- Auto-refresh on 401: calls /auth/refresh and retries once before calling onAuthError
- createApiClient() factory composing all resource namespaces into a single ApiClient interface
- AuthResource: register, login, refresh, logout, me (sets/clears token automatically)
- UsersResource: list (paginated + meta), get, update, deactivate
- OrganizationsResource: getCurrent, updateCurrent
- HealthResource: connectivity ping
- ApiClientError: typed error with status, code, isUnauthorized/isForbidden/isNotFound/isConflict helpers
- TypeScript project references: packages/core upgraded to composite:true, both packages use tsc --build
- Updated clean scripts to remove tsconfig.tsbuildinfo alongside dist/
- Removed .claude/settings.local.json from git; added to .gitignore
- Added *.tsbuildinfo pattern to root .gitignore

### Added - Phase 1 Foundation (Session 3, 2026-02-28)

**Sub-phase A - Root Tooling**
- tsconfig.base.json, .prettierrc/.prettierignore, .eslintrc.json/.eslintignore, docker-compose.yml, root package.json devDeps

**Sub-phase B - packages/core (24 files)**
- Types: ApiResponse, PaginationMeta, User, UserWithRoles, Organization, Project, RoleName, TokenPayload, AuthResponse
- Zod schemas: loginSchema, registerSchema, createProjectSchema, updateProjectSchema
- Constants: RESOURCES (16), ACTIONS (4), DEFAULT_ROLE_PERMISSIONS, USER_ROLES, ERROR_CODES (13), HTTP_STATUS
- Utils: parsePagination, buildPaginationMeta, formatDate, formatCurrency, formatCurrencyCompact

**Sub-phase C - Database Layer**
- schema.prisma: 8 models (Organization, User, Role, Permission, RolePermission, UserRole, RefreshToken, Project)
- seed.ts: 64 permissions, 6 roles, demo org, 3 users, 2 projects
- Docker PostgreSQL 15 + MinIO running; DB pushed and seeded

**Sub-phase D - Fastify API Server (~30 files)**
- Config, lib (AppError hierarchy, response helpers, Pino logger), Fastify type augmentation
- Plugins: Prisma, Swagger/OpenAPI
- Middleware: authenticate, authorize (role+permission factories), error-handler
- Services: password, token, auth, user, organization
- Routes: /health, /api/v1/auth/*, /api/v1/users/:id, /api/v1/organizations/current
- Auth: JWT 15min access + 7d refresh token (httpOnly cookie, rotation)
- Verified: health check + login returning JWT working

**Infrastructure**
- Node.js 20.20.0 + pnpm 8.15.9 via nvm in WSL
- Docker Engine in WSL; PostgreSQL on :5432, MinIO on :9000

### Added - Foundation (Sessions 1-2)
- 42 foundation files: docs, config, scripts, GitHub templates
- pnpm workspaces + Turborepo pipeline configuration

### Changed
- Database strategy: PostgreSQL only, Redis and WatermelonDB deferred (DD-011)
- Updated technology-stack.md and design-decisions.md

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Nothing yet

### Security
- Nothing yet

## [0.0.1] - 2026-02-02

### Added
- Initial repository setup
- AGPL-3.0 license
- Basic project scaffolding

---

## Types of Changes

- Added for new features
- Changed for changes in existing functionality
- Deprecated for soon-to-be removed features
- Removed for now removed features
- Fixed for any bug fixes
- Security in case of vulnerabilities

[unreleased]: https://github.com/mattstub/ProManage/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/mattstub/ProManage/releases/tag/v0.0.1
