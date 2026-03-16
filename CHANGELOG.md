# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed - Dev environment + live bug sweep (Session 18, 2026-03-15)

**Branch: `fix/dev-env-setup`**

*apps/api*
- `package.json`: Fixed `dev` script — `tsx watch` does not auto-load `.env`; added `dotenv ^17.3.1` and changed script to `tsx watch --import=dotenv/config src/server.ts` so `DATABASE_URL`, `JWT_SECRET`, etc. are available at startup

*apps/web*
- `public/.gitkeep`: Added missing `public/` directory so web Dockerfile `COPY apps/web/public ./public` no longer fails
- `hooks/use-licenses.ts`: Added `useDownloadLicenseDocument` hook — calls `getDocumentDownloadUrl`, opens presigned MinIO URL in new tab
- `hooks/use-messaging.ts`:
  - `useMarkConversationRead`: new hook — optimistically zeros `unreadCount` on a conversation and decrements `directMessages`/`total` in `unread-count` cache when a DM thread is opened
  - `useMarkAnnouncementRead.onMutate`: tracks `wasUnread` before setting `isRead: true` to avoid double-decrement; added `Array.isArray(old.data)` guard so partial key match no longer corrupts the drafts query (which has a different data shape)
  - `useSendMessage.onSuccess` + `useStartConversation.onSuccess`: removed `unread-count` invalidation — sending a message cannot increase the sender's unread count; early refetch raced with server-side mark-as-read
- `hooks/use-notifications.ts`: Added `onMutate` optimistic updates to `useMarkRead`, `useMarkAllRead`, `useDeleteNotification` — notifications now clear instantly without waiting for server refetch
- `components/layout/nav-item.tsx`: Added `badge?: number` prop — renders blue rounded pill badge when `badge > 0` (capped at "99+")
- `components/layout/sidebar.tsx`: Wired `useUnreadCount` → passes `badge` to Messages nav item so unread DM+announcement count shows in sidebar
- `components/layout/notification-bell.tsx`:
  - Added click-to-navigate on notification rows (`getNotificationHref` maps entityType → route); marks as read + navigates + closes panel
  - Added `e.stopPropagation()` on action buttons so row click doesn't fire when using mark-read/delete buttons
  - Added `onMutate` optimistic updates (already landed in use-notifications.ts)
- `app/(dashboard)/licenses/page.tsx`: Fixed `SelectItem value=""` → `value="none"` (Radix Select rejects empty string); updated `notifySupervisorId` mapping to filter out `"none"` sentinel; added download button (ArrowDownTrayIcon) to each document row using `useDownloadLicenseDocument`
- `app/(dashboard)/messages/page.tsx`:
  - Converted `selectedConv`/`selectedAnn` to ID-based pattern — stores only the ID in state and derives the live object from query cache to prevent stale snapshot bugs
  - Calls `markConversationRead(conv)` on conversation click for optimistic unread-count decrement
  - `ThreadPanel`: added `syncedConvIdRef` + `useEffect` — invalidates `unread-count` and `conversations` once after the first message fetch per conversation, ensuring server-side mark-as-read is reflected in the cache

### Added - Phase 3.2 Licensing (Session 17, 2026-03-15)

**Phase 3.2 — License Tracking with Renewal Reminders**

*apps/api/prisma*
- `schema.prisma`: `License` model (name, licenseNumber, authority, licenseType freeform, holderType ORGANIZATION|USER, userId nullable, startDate, expirationDate, renewalDate, status, notes) + `LicenseDocument` (fileName, fileKey, fileUrl, fileSize, mimeType, documentTag) + `LicenseReminder` (daysBeforeExpiration, notifyUserId, notifySupervisorId nullable, isActive, lastNotifiedAt) — 26 models total
- `seed.ts`: 2 demo licenses (org-level GC License expiring in 25 days + user-level Master Electrician) + 2 reminders (30d + 7d daily) on the near-expiry license

*packages/core*
- `types/license.ts`: `LicenseHolderType`, `LicenseStatus`, `License`, `LicenseDocument`, `LicenseReminder`, `LicenseWithRelations`, `LicenseUserSummary`, input types
- `schemas/license.ts`: `createLicenseSchema`, `updateLicenseSchema`, `createLicenseReminderSchema`, `updateLicenseReminderSchema` (freeform licenseType, Zod validation)
- `constants/license.ts`: `LICENSE_HOLDER_TYPES`, `LICENSE_STATUS_LIST`, `LICENSE_REMINDER_DAILY_THRESHOLD` (7)

*apps/api*
- `services/license.service.ts`: `listLicenses` (paginated, search, holderType/status/userId filter), `getLicense`, `createLicense`, `updateLicense` (resets reminder cycles on expiration change), `deleteLicense` (cascades MinIO documents), `addLicenseDocument`, `deleteLicenseDocument`, `createReminder`, `updateReminder`, `deleteReminder`
- `routes/licenses/index.ts`: 12 routes — GET list/detail (all auth), POST/PATCH license (Admin/OfficeAdmin), DELETE license (Admin), POST upload-url + confirm + DELETE document (Admin/OfficeAdmin), GET download-url (all auth), POST/PATCH/DELETE reminder (Admin/OfficeAdmin/PM)
- `plugins/license-reminder.ts`: daily in-process check (setInterval); ≤7-day window fires every day; >7-day threshold fires once per expiration cycle; reset when expirationDate updated; SSE notifications via existing bell
- `__tests__/helpers/mock-prisma.ts` + `build-app.ts`: license/licenseDocument/licenseReminder mocks + `buildLicenseTestApp()`
- `__tests__/services/license.service.test.ts`: 24 service tests
- `__tests__/routes/license.routes.test.ts`: 19 route tests — 43 new tests (399 total)

*packages/api-client*
- `resources/licenses.ts`: `LicensesResource` — `list`, `get`, `create`, `update`, `delete`, `getDocumentUploadUrl`, `confirmDocumentUpload`, `deleteDocument`, `getDocumentDownloadUrl`, `createReminder`, `updateReminder`, `deleteReminder`

*apps/web*
- `hooks/use-licenses.ts`: 10 hooks — `useLicenses`, `useLicense`, `useCreateLicense`, `useUpdateLicense`, `useDeleteLicense`, `useUploadLicenseDocument` (3-step presigned MinIO), `useDeleteLicenseDocument`, `useCreateLicenseReminder`, `useUpdateLicenseReminder`, `useDeleteLicenseReminder`
- `app/(dashboard)/licenses/page.tsx`: table + holderType/status/search filters, create/edit dialog (freeform type, holder, date fields), detail dialog (document upload/delete panel + reminder config panel with pause/resume), delete confirm dialog; expiry countdown badges (7d=red, 30d=yellow)
- `components/layout/sidebar.tsx`: Licenses nav item (`IdentificationIcon`)

### Fixed - API Dockerfile prisma generate order (2026-03-15)

- `apps/api/Dockerfile`: moved `prisma generate` to run **before** `tsc`; schema is now copied immediately after `pnpm install` so Prisma TypeScript types are available during compilation — fixes `noImplicitAny` errors on all Prisma callback parameters in Docker builds (mirrors the CI workflow fix in `6ca0a7e`)

### Added - Phase 3.1 Contact Management (Session 15, 2026-03-12)

**Phase 3.1 — Organization Contact Directory**

*apps/api/prisma*
- `schema.prisma`: `Contact` model (firstName, lastName, company, type, email, phone, mobile, title, notes, isActive) + `ContactProject` join table; `@@unique([organizationId, email])` for org-scoped email uniqueness; relations added on Organization, User, Project — 23 models total
- `seed.ts`: 3 demo contacts (SUBCONTRACTOR, INSPECTOR, ARCHITECT), 2 project associations on project 1

*packages/core*
- `types/contact.ts`: `ContactType` union, `Contact`, `ContactWithRelations`, `ContactProjectSummary`, `CreateContactInput`, `UpdateContactInput`
- `schemas/contact.ts`: `createContactSchema`, `updateContactSchema` (Zod: required name, enum type, email format, max lengths)
- `constants/contact.ts`: `CONTACT_TYPES` (label + color per type), `CONTACT_TYPE_LIST`

*apps/api*
- `services/contact.service.ts`: `listContacts` (paginated, type filter, full-text search across name/company/email), `getContact`, `createContact`, `updateContact`, `deleteContact`, `addContactToProject`, `removeContactFromProject` — all queries org-scoped
- `routes/contacts/index.ts`: 7 routes — GET list/single (all auth), POST/PATCH (Admin/PM/OfficeAdmin), DELETE (Admin), POST+DELETE project association (Admin/PM)
- `routes/index.ts`: registered `/contacts` prefix
- `__tests__/helpers/mock-prisma.ts`: contact + contactProject mocks added
- `__tests__/helpers/build-app.ts`: `buildContactTestApp()` helper added
- `__tests__/services/contact.service.test.ts`: 24 service tests (listContacts, getContact, createContact, updateContact, deleteContact, addContactToProject, removeContactFromProject)
- `__tests__/routes/contact.routes.test.ts`: 37 route tests (auth, RBAC, validation, org-scoping, project association)
- **259 total tests passing** (up from 198)

*packages/api-client*
- `resources/contacts.ts`: `ContactsResource` — `list`, `get`, `create`, `update`, `delete`, `addToProject`, `removeFromProject`
- `index.ts`: `ContactsResource` exported, `contacts` added to `ApiClient` interface + `createApiClient()`

*apps/web*
- `hooks/use-contacts.ts`: `useContacts`, `useContact`, `useCreateContact`, `useUpdateContact`, `useDeleteContact`, `useAddContactToProject`, `useRemoveContactFromProject`
- `app/(dashboard)/contacts/page.tsx`: table with type filter + full-text search, create/edit/delete dialogs, RBAC-gated actions (skeleton loading, empty states)
- `components/layout/sidebar.tsx`: Contacts nav item with `UsersIcon`

*Security*
- Org-scoped email uniqueness: `@@unique([organizationId, email])`
- All service queries include `organizationId` filter
- Zod schemas exclude `organizationId`, `createdById` (mass-assignment prevention)
- Cross-org project association blocked at service layer
- 404 returned for cross-org access (not 403, prevents resource existence disclosure

### Added - Phase 2.3B Channel Chat (Sessions 13-14, 2026-03-11)

**Phase 2.3B — Real-Time Channel Chat (Discord/Slack style)**

*apps/api/prisma*
- `schema.prisma`: 5 new models — `Channel` (name/slug/isPrivate, org+project scoped), `ChannelPermission` (canRead/canWrite/canManage per role), `ChannelMember`, `ChatMessage` (body, soft-delete via `deletedAt`, thread via `parentId`), `MessageAttachment` (MinIO storageKey, MIME type, size) — 21 models total
- `seed.ts`: seeds 2 demo channels ("General", "Project Alpha"), 6-role permissions each, all 3 demo users as members

*packages/core*
- `types/channel.ts`: Channel, ChannelWithRelations, ChannelPermission, ChannelMember, ChatMessage, ChatMessageWithRelations, MessageAttachment + input types
- `types/socket-events.ts`: typed Socket.io event payloads (channel:message, channel:message:edited, channel:message:deleted, channel member join/leave)
- `schemas/channel.ts`: createChannelSchema, updateChannelSchema, sendChatMessageSchema, updateChannelPermissionSchema
- `constants/channel.ts`: CHANNEL_MANAGE_ROLES, ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_SIZE_BYTES (50MB), MINIO_BUCKET_NAME

*apps/api*
- `plugins/minio.ts`: MinIO client plugin — ensures bucket exists at startup, decorates `fastify.minio`
- `plugins/socket-io.ts`: Socket.io plugin — JWT auth via `handshake.auth.token` (never query param), joins org/user rooms on connect, decorates `fastify.io`
- `types/fastify.d.ts`: extended with `io: Server` and `minio: MinioClient`
- `app.ts`: registers minioPlugin + socketIoPlugin
- `services/channel.service.ts`: 15 functions — listChannels, getChannel, createChannel, updateChannel, deleteChannel, listChannelPermissions, updateChannelPermission (upsert), joinChannel, leaveChannel, listMessages, sendMessage, editMessage, deleteMessage (soft), getUploadUrl (presigned PUT 5min), confirmAttachment, getAttachmentDownloadUrl (presigned GET 1hr)
- `routes/channels/index.ts`: 15 routes with READ/WRITE/SENSITIVE rate limits and RBAC
- `routes/index.ts`: registered `/channels` prefix

*packages/api-client*
- `resources/channels.ts`: ChannelsResource — 14 methods covering channels CRUD, permissions, membership, messages, attachments
- `types.ts`: added `'PUT'` to `RequestOptions.method` union
- `index.ts`: ApiClient interface + createApiClient() updated with `channels` namespace

*apps/web*
- `hooks/use-socket.ts`: Socket.io singleton with `getSocket(accessToken)` / `resetSocket()` — JWT in handshake.auth
- `hooks/use-channels.ts`: 14 TanStack Query hooks (useChannels, useChannel, useChannelMessages, useChannelPermissions, useCreateChannel, useUpdateChannel, useDeleteChannel, useUpdateChannelPermission, useJoinChannel, useLeaveChannel, useSendChannelMessage, useEditChannelMessage, useDeleteChannelMessage, useGetUploadUrl, useConfirmAttachment) + `useChannelSocketEvents()` for real-time cache invalidation
- `lib/api-client.ts`: calls `resetSocket()` on auth error alongside resetApiClient()
- `components/channels/create-channel-dialog.tsx`: name/slug/description/isPrivate
- `components/channels/channel-chat-panel.tsx`: scrollable message list, inline edit, soft-delete, thread trigger, socket-powered real-time updates
- `components/channels/message-thread-panel.tsx`: slide-in thread reply panel
- `components/channels/attachment-uploader.tsx`: 3-step presigned PUT upload flow
- `components/channels/channel-settings-panel.tsx`: General/Permissions/Members/Danger Zone tabs
- `app/(dashboard)/channels/page.tsx`: split-panel channel list + chat
- `components/layout/sidebar.tsx`: added Channels nav item (HashtagIcon)

*packages added*
- `apps/api`: `socket.io ^4.8.3`, `minio ^8.0.7`, `@fastify/multipart ^8.3.0`
- `apps/web`: `socket.io-client ^4.8.3`

*tests*
- `__tests__/helpers/mock-prisma.ts`: channel, channelPermission, channelMember, chatMessage, messageAttachment mocks
- `__tests__/helpers/build-app.ts`: createMockIo(), createMockMinio(), buildChannelTestApp()
- **162 API tests passing**, web type-check clean

*bug fixes (Sessions 13-14)*
- `middleware/error-handler.ts`: Zod 4 compatibility — `.issues ?? .errors` duck-typing for ZodError
- `config/env.ts`: Zod 4 `.default(false)` instead of `.default('false')` for boolean transform
- `services/messaging.service.ts`: renamed unused `authorId` → `_authorId` (TS strict unused-param)

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
