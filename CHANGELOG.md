# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Phase 4.2 Construction Documents (Session 25, 2026-03-21)

- **Prisma schema**: 6 new models — `DrawingDiscipline`, `DrawingSet`, `DrawingSheet`, `DrawingRevision`, `SpecificationSection`, `SpecificationRevision` (40 models total). Back-relations added to Organization, Project, User.
- **packages/core**: New `types/construction-documents.ts` (9 type exports), `schemas/construction-documents.ts` (10 Zod schemas), `constants/construction-documents.ts` (DRAWING_PHASES, DRAWING_PHASES_LIST, ALLOWED_DRAWING_MIME_TYPES, MAX_DRAWING_FILE_SIZE_BYTES). Wired into all index files.
- **apps/api service**: `construction-documents.service.ts` — full service layer for disciplines CRUD, drawing sets CRUD, drawing sheets CRUD + MinIO cleanup, drawing revisions (add/list/delete + presigned upload URLs), spec sections CRUD + MinIO cleanup, spec revisions (auto-incrementing revisionNumber, isCurrent tracking, add/list/delete + presigned upload URLs).
- **apps/api routes**: `routes/construction-documents/index.ts` — 21 routes registered at `/construction-documents`. Disciplines (org-scoped), drawing sets + sheets + revisions, spec sections + revisions (all project-scoped by `:projectId`). RBAC: GET = all auth, POST/PATCH = Admin/PM/Superintendent (uploads) or Admin/PM (metadata), DELETE = Admin/PM.
- **apps/api tests**: `construction-documents.service.test.ts` (14 tests), `construction-documents.routes.test.ts` (14 tests). Updated `mock-prisma.ts` (6 new model mocks) and `build-app.ts` (`buildConstructionDocumentTestApp`). 495 total API tests.
- **packages/api-client**: `ConstructionDocumentsResource` with 20 methods across all 6 entities. Added to `ApiClient` interface and `createApiClient()` factory.
- **apps/web hooks**: `use-construction-documents.ts` — 20 TanStack Query hooks covering all CD operations.
- **apps/web UI**: New `projects/[id]/documents/page.tsx` — Documents tab in project detail with Drawing Log (sheet table, discipline badge, current revision, create dialog) and Specifications (section table, conformed/original status, create dialog). Added Documents tab to `projects/[id]/layout.tsx`.
- **Seed**: 6 default drawing disciplines seeded for demo org (A=Architectural, S=Structural, M=Mechanical, E=Electrical, P=Plumbing, C=Civil).

### Docs - Documentation overhaul (Session 24, 2026-03-19)

- **`docs/development/testing.md`**: Full rewrite — replaced stale Playwright/Detox/RTL/coverage-thresholds content with actual Vitest patterns, `createMockPrisma()`, `buildXxxTestApp()`, `signTestToken()`, `mockRole()` for requireRole middleware, and layer-by-layer test guidance
- **`docs/development/coding-standards.md`**: Fixed import order to match actual ESLint config (4 groups, blank lines, `@` before letters); replaced manual `useState/useEffect` hook example with TanStack Query pattern; fixed `UserRole` type to use real role names; replaced duplicate Testing section with link to testing.md; updated Last Updated
- **`docs/development/setup.md`**: Fixed `docker-compose` → `docker compose` (v2); removed Redis from prerequisites; fixed `prisma migrate dev` → `prisma db push`; fixed seed command to `npx ts-node prisma/seed.ts`; removed `NEXT_PUBLIC_WS_URL`; added WSL note; replaced vscode-jest with vitest.explorer; fixed package build order step
- **`docs/development/api-design.md`**: Replaced `time-entries`/`daily-reports` route examples with actual implemented routes (`calendar-events`, project scopes/contacts)
- **`docs/README.md`**: Replaced stale "planned/in progress" status tables and "to be created" notes with accurate navigation index
- **`apps/api/README.md`**: Full rewrite — accurate env vars, full 14-group route table with RBAC notes, correct scripts, links to central docs
- **`apps/web/README.md`**: Full rewrite — accurate page list (all 14 routes including project detail tabs), correct env vars, key patterns (TanStack Query, auth store, Socket.io, Tailwind scanning)
- **`packages/core/README.md`**: Full rewrite — correct type/schema/constant/util exports matching actual codebase
- **`packages/api-client/README.md`**: Full rewrite — actual resource namespaces and methods (all 11 namespaces, ~90 methods)
- **`packages/ui-components/README.md`**: Removed Storybook references; added Tailwind scanning requirement; added Button variant docs
- **`apps/mobile/README.md`**, **`packages/mobile-components/README.md`**, **`packages/real-time/README.md`**: Trimmed to deferred placeholders
- **Root `README.md`**: Updated Current Status, Features, test counts, model count, route list, page list, mobile deferral phase

### Docs/Chores - Post-Phase 4.1 cleanup (Session 24, 2026-03-19)

- **PR #113 — docs/license**: Added `LICENSE` file (AGPL-3.0)
- **PR #112 — docs/lint-cleanup**: Addressed linting errors in AI-generated documentation and `.claude/commands/`; Copilot review fixes for API route error handling; updated `apps/api/README.md`
- Phase 4.1 (`feat/phase4-subphase-1-project-entity`) merged to `main` as PR #111

---

### Fixed - Phase 4.1 follow-up fixes (Session 23, 2026-03-18)

- **Branch: `feat/phase4-subphase-1-project-entity`**
  - `apps/web/src/app/globals.css`: Updated from Tailwind v3 `@tailwind` directives to v4 `@import "tailwindcss"` syntax; added `@source` for `packages/ui-components/src`. The CI fix commit (9169fa8) switched the PostCSS plugin to `@tailwindcss/postcss` (v4) without updating globals.css, causing all Tailwind styles to be dropped entirely.
  - `apps/web/src/app/(dashboard)/projects/[id]/layout.tsx`, `page.tsx`, `team/page.tsx`, `scopes/page.tsx`, `settings/page.tsx`: Fixed Next.js 15 `params` Promise warning — typed `params` as `Promise<{ id: string }>` and unwrapped with `React.use(params)` in all 5 project detail page/layout components.
  - `apps/web/src/app/(dashboard)/projects/page.tsx`: Fixed `SelectItem value=""` Radix crash (empty string forbidden); changed filter state to `"ALL"` sentinel. Rewrote filter/search bar to match established `contacts/page.tsx` pattern (plain `Label` + `Input`, fixed-width selects, `Button` component, 300ms debounced search).
  - `docs/ROADMAP.md`: Added Project Channels tab item to Phase 4.1; cross-linked from Phase 2.3B deferred note. Updated status + Last Updated date.

### Added - Phase 4.1 Project Entity Expansion (Session 22, 2026-03-18)

- **Branch: `feat/phase4-subphase-1-project-entity`**
  - *apps/api/prisma*
    - `schema.prisma`: Extended `Project` with 8 new optional metadata fields (ownerName, ownerPhone, ownerEmail, architectName, contractorLicense, permitNumber, budget, squareFootage). Added `role String?` to `ContactProject`. New `ProjectScope` model (name, description, status, sequence, budget, date range). New `ProjectSettings` model (6 boolean toggles, defaultView). 34 models total.
    - `seed.ts`: Added demo ProjectSettings + ProjectScopes for both seed projects; added `role` to ContactProject associations.
  - *packages/core*
    - `types/project.ts`: Added `ProjectScopeStatus` type; added `status?` to `CreateProjectInput`; new interfaces: `ProjectScope`, `ProjectSettings`, `ProjectContactAssignment`, `ProjectWithRelations`, `ProjectDashboardMetrics`, `ProjectDashboard`; new input types: `CreateProjectScopeInput`, `UpdateProjectScopeInput`, `UpdateProjectSettingsInput`, `AssignContactToProjectInput`.
    - `schemas/project.ts`: Extended `createProjectSchema`/`updateProjectSchema` with all new fields; added `createProjectScopeSchema`, `updateProjectScopeSchema`, `updateProjectSettingsSchema`, `assignContactToProjectSchema`.
    - `constants/project-status.ts`: Added `PROJECT_SCOPE_STATUSES` and `PROJECT_SCOPE_STATUS_LIST`.
  - *apps/api*
    - `services/project.service.ts`: Rewritten with 14 functions — `listProjects` (search + type/status filters), `getProject` (with scopes/settings/contacts), `createProject` (transaction: project + settings), `updateProject`, `archiveProject`, `getProjectDashboard` (6 parallel queries → metrics), `listProjectContacts`, `assignContactToProject`, `removeContactFromProject`, `listProjectScopes`, `createProjectScope`, `updateProjectScope`, `deleteProjectScope`, `getProjectSettings` (upsert defaults), `updateProjectSettings`.
    - `routes/projects/index.ts`: 18 routes — Project CRUD (5), Dashboard (1), Team/contacts (4), Scopes (4), Settings (2). WRITE_ROLES = Admin+PM; Archive = Admin only; Settings = Admin+PM.
    - `__tests__/helpers/mock-prisma.ts`: Added `projectScope` (5 methods) and `projectSettings` (3 methods including `create`) mock groups; added `contactProject.findMany`.
    - `__tests__/helpers/build-app.ts`: Added `buildProjectTestApp()` helper.
    - `__tests__/services/project.service.test.ts`: 30 new service tests.
    - `__tests__/routes/project.routes.test.ts`: 33 new route tests; added `mockRole()` helper (seeds `userRole.findMany` so `requireRole` middleware works correctly in tests).
  - *packages/api-client*
    - `resources/projects.ts`: 11 new methods (getDashboard, listContacts, assignContact, updateContactAssignment, removeContact, listScopes, createScope, updateScope, deleteScope, getSettings, updateSettings). `ListProjectsParams` extended with `type` and `search`.
    - `index.ts`: New type exports from core (ProjectScope, ProjectSettings, ProjectContactAssignment, ProjectDashboard, CreateProjectScopeInput, UpdateProjectScopeInput, UpdateProjectSettingsInput, AssignContactToProjectInput).
  - *apps/web*
    - `hooks/use-projects.ts`: 12 new hooks (useProjectDashboard, useProjectContacts, useProjectScopes, useProjectSettings, useCreateProject, useUpdateProject, useArchiveProject, useAssignContact, useRemoveProjectContact, useCreateProjectScope, useUpdateProjectScope, useDeleteProjectScope, useUpdateProjectSettings).
    - `app/(dashboard)/projects/page.tsx`: Clickable rows (→ detail page), search input, status+type filter dropdowns, working `CreateProjectDialog` (full form → POST → redirect to detail).
    - `app/(dashboard)/projects/[id]/layout.tsx`: Tab navigation (Overview / Team / Scopes / Settings) with active indicator; project name in breadcrumb.
    - `app/(dashboard)/projects/[id]/page.tsx`: 4 metric cards (open tasks, open incidents, toolbox talks, upcoming events); project details panel; owner/contractor panel; scope progress list.
    - `app/(dashboard)/projects/[id]/team/page.tsx`: Contact assignment table; `AssignContactDialog` (contact picker + role field); remove button for Admin/PM.
    - `app/(dashboard)/projects/[id]/scopes/page.tsx`: Scope list with status badges; `ScopeFormDialog` (create + edit); delete button for Admin/PM.
    - `app/(dashboard)/projects/[id]/settings/page.tsx`: Toggle-based settings panel (Modules, Requirements, Notifications sections); auto-save on toggle; read-only for non-Admin/PM.
  - *apps/api/Dockerfile (carried from Session 22 startup)*
    - Fixed CMD path: `node dist/server.js` → `node apps/api/dist/server.js`
    - Added `apk add --no-cache openssl` + `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` for Prisma on Alpine
- **Tests**: 463 API tests passing (63 new). 5/5 turbo tasks (lint, type-check ×2, test ×2) passing. Web type-check clean.

### Fixed - CI/Lint for Phase 3.3 Safety (Session 21, 2026-03-17)

- Replaced `eslint-plugin-import@2.x` with `eslint-plugin-import-x@4.16.2` — ESLint 10 removed `sourceCode.getTokenOrCommentBefore()`, breaking the old plugin; updated plugin key and rule prefix in `eslint.config.mjs` and `.eslintrc.json`
- `apps/api/src/routes/safety/index.ts`: removed duplicate `crypto` import, fixed import group ordering, removed dead code in SDS download-url handler, fixed `const expectedPrefix` erroneously inside TypeScript type annotation, replaced `uuidv4()` with `randomUUID()`
- `packages/api-client/src/resources/safety.ts`: removed duplicate `getDocumentDownloadUrl`; added `getSdsDownloadUrl`
- `apps/web/src/hooks/use-safety.ts`: restored `useDownloadSafetyDocument` and `useDownloadSds` to call api-client methods
- `apps/web/src/app/(dashboard)/safety/page.tsx`: added `as Tab` cast to fix TS2322 on ternary spread
- `apps/api/src/__tests__/routes/safety.routes.test.ts`: fixed fileKey fixture to include `organizationId` path segment
- All 7 turbo tasks now passing (lint, type-check ×3, test ×2, build)

### Added - Phase 3.3 Safety (Session 20, 2026-03-17)

- **Branch: `feat/phase3-subphase-3-safety`**
  - *apps/api/prisma*
    - `schema.prisma`: 6 new models — SafetyDocument (category enum, MinIO fileKey), SdsEntry (product/manufacturer/chemical, optional SDS PDF), ToolboxTalk (SCHEDULED/COMPLETED/CANCELLED status), ToolboxTalkAttendee (composite talk+user, name + signedAt), SafetyForm (category enum, content/template, isActive toggle), IncidentReport (6 incident types, OPEN/UNDER_REVIEW/CLOSED status, corrective action). Schema now 32 models total.
    - `seed.ts`: Added demo safety data (2 SafetyDocuments, 1 SdsEntry, 2 ToolboxTalks with attendees, 2 SafetyForms, 1 IncidentReport)
  - *packages/core*
    - `src/types/safety.ts`: TypeScript interfaces and union types for all 5 safety features (SafetyDocument, SdsEntry, ToolboxTalk, ToolboxTalkAttendee, SafetyForm, IncidentReport) + all Create/Update input types
    - `src/schemas/safety.ts`: 11 Zod validation schemas
    - `src/constants/safety.ts`: 5 constant maps with label/color metadata + `_LIST` array exports (SAFETY_DOCUMENT_CATEGORIES, TOOLBOX_TALK_STATUSES, SAFETY_FORM_CATEGORIES, INCIDENT_TYPES, INCIDENT_STATUSES)
  - *apps/api*
    - `src/services/safety.service.ts`: 23 service functions covering all 5 safety sub-features; MinIO presigned URL generation for document/SDS upload; best-effort MinIO cleanup on delete
    - `src/routes/safety/index.ts`: 23 routes. WRITE_ROLES = Admin/PM/Superintendent/OfficeAdmin for safety write endpoints (including toolbox talks). Incident POST open to all authenticated. Upload-URL routes registered after `:id` routes.
    - `src/__tests__/services/safety.service.test.ts`: 30 service-layer tests
    - `src/__tests__/routes/safety.routes.test.ts`: 37 route-layer tests; `mockRole()` helper for `userRole.findMany` mock per test; RBAC enforcement + schema validation coverage
    - `src/__tests__/helpers/mock-prisma.ts`: Added 6 new model mocks
    - `src/__tests__/helpers/build-app.ts`: Added `buildSafetyTestApp` with minio mock
  - **Testing Total**: 383 tests passing
  - *packages/api-client*
    - `src/resources/safety.ts`: `SafetyResource` class — methods for all 23 API endpoints grouped by sub-feature
    - `src/index.ts`: Added `SafetyResource` export, `safety` property to `ApiClient` interface and `createApiClient()`
  - *apps/web*
    - `src/hooks/use-safety.ts`: 22 TanStack Query hooks (list/get/create/update/delete + file upload for documents and SDS)
    - `src/app/(dashboard)/safety/page.tsx`: 5-tab safety hub — Documents (upload+download+edit), SDS Catalog (file optional), Toolbox Talks (attendee roster in detail dialog), Forms (active/inactive toggle), Incidents (role-gated: FieldUser excluded from list/detail). Tabbed navigation with blue active indicator.
    - `src/components/layout/sidebar.tsx`: Added Safety nav item with ShieldCheckIcon between Licenses and Messages

### Fixed - Docker web image build (Session 19, 2026-03-17)

- **Branch: `fix/dockerignore-nested-node-modules`**
  - `.dockerignore`: Added `**/node_modules` pattern — the previous `node_modules` entry only excluded the repo-root directory; nested workspace node_modules (`apps/web/node_modules`, `packages/*/node_modules`) were included in the build context, causing the `COPY apps/web/` step to overwrite pnpm's installed workspace symlinks and break `next build` inside Docker with `Cannot find module 'next/dist/bin/next'`

### Fixed - Dev environment + live bug sweep (Session 18, 2026-03-15)

- **Branch: `fix/dev-env-setup`**
  - *apps/api*
    - `package.json`: Fixed `dev` script — `tsx watch` does not auto-load `.env`; added `dotenv ^17.3.1` and changed script to `tsx watch --import=dotenv/config src/server.ts` so `DATABASE_URL`, `JWT_SECRET`, etc. are available at startup
  - *apps/web*
    - `public/.gitkeep`: Added missing `public/` directory so web Dockerfile `COPY apps/web/public ./public` no longer fails
    - `hooks/use-licenses.ts`: Added `useDownloadLicenseDocument` hook — calls `getDocumentDownloadUrl`, opens presigned MinIO URL in new tab
    - `hooks/use-messaging.ts`:
      - `useMarkConversationRead`: new hook — optimistically zeros `unreadCount` on a conversation and decrements `directMessages`/`total` in `unread-count` cache when a DM thread is opened
      - `useMarkAnnouncementRead.onMutate`: tracks `wasUnread` before setting `isRead: true` to avoid double-decrement; added `Array.isArray(old.data)`   guard so partial key match no longer corrupts the drafts query (which has a different data shape)
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

- **Phase 3.2 — License Tracking with Renewal Reminders**
  - *apps/api/prisma*
    - `schema.prisma`: `License` model (name, licenseNumber, authority, licenseType freeform, holderType ORGANIZATION|USER, userId nullable, startDate, expirationDate, renewalDate, status, notes) + `LicenseDocument` (fileName, fileKey, fileUrl, fileSize, mimeType, documentTag) + `LicenseReminder` (daysBeforeExpiration, notifyUserId, notifySupervisorId nullable, isActive, lastNotifiedAt) — 26 models total
    - `seed.ts`: 2 demo licenses (org-level GC License expiring in 25 days + user-level Master Electrician) + 2 reminders (30d + 7d daily) on the near-expiry license
  - *packages/core*
    - `types/license.ts`: `LicenseHolderType`, `LicenseStatus`, `License`, `LicenseDocument`, `LicenseReminder`, `LicenseWithRelations`, `LicenseUserSummary`, input types
    - `schemas/license.ts`: `createLicenseSchema`, `updateLicenseSchema`, `createLicenseReminderSchema`, `updateLicenseReminderSchema` (freeform licenseType, Zod validation)
    - `constants/license.ts`: `LICENSE_HOLDER_TYPES`, `LICENSE_STATUS_LIST`, `LICENSE_REMINDER_DAILY_THRESHOLD` (7)
  - *apps/api*
    - `services/license.service.ts`: `listLicenses` (paginated, search, holderType/status/userId filter), `getLicense`, `createLicense`, `updateLicense` (resets reminder cycles on expiration change), `deleteLicense` (cascades MinIO documents), `addLicenseDocument`, `deleteLicenseDocument`, `createReminder`, `updateReminder`, `deleteReminder`
    - `routes/licenses/index.ts`: 12 routes — GET list/detail (all auth), POST/PATCH license (Admin/OfficeAdmin), DELETE license (Admin), POST upload-url + confirm + DELETE document (Admin/OfficeAdmin), GET download-url (all auth), POST/PATCH/DELETE reminder (Admin/OfficeAdmin/PM)
    - `plugins/license-reminder.ts`: daily in-process check (setInterval); ≤7-day window fires every day; >7-day threshold fires once per expiration cycle; reset when expirationDate updated; SSE notifications via existing bell
    - `__tests__/helpers/mock-prisma.ts` + `build-app.ts`: license/licenseDocument/licenseReminder mocks + `buildLicenseTestApp()`
    - `__tests__/services/license.service.test.ts`: 24 service tests
    - `__tests__/routes/license.routes.test.ts`: 19 route tests — 43 new tests (399 total)
  - *packages/api-client*
    - `resources/licenses.ts`: `LicensesResource` — `list`, `get`, `create`, `update`, `delete`, `getDocumentUploadUrl`, `confirmDocumentUpload`, `deleteDocument`, `getDocumentDownloadUrl`, `createReminder`, `updateReminder`, `deleteReminder`
  - *apps/web*
    - `hooks/use-licenses.ts`: 10 hooks — `useLicenses`, `useLicense`, `useCreateLicense`, `useUpdateLicense`, `useDeleteLicense`, `useUploadLicenseDocument` (3-step presigned MinIO), `useDeleteLicenseDocument`, `useCreateLicenseReminder`, `useUpdateLicenseReminder`, `useDeleteLicenseReminder`
    - `app/(dashboard)/licenses/page.tsx`: table + holderType/status/search filters, create/edit dialog (freeform type, holder, date fields), detail dialog (document upload/delete panel + reminder config panel with pause/resume), delete confirm dialog; expiry countdown badges (7d=red, 30d=yellow)
    - `components/layout/sidebar.tsx`: Licenses nav item (`IdentificationIcon`)

### Fixed - API Dockerfile prisma generate order (2026-03-15)

- `apps/api/Dockerfile`: moved `prisma generate` to run **before** `tsc`; schema is now copied immediately after `pnpm install` so Prisma TypeScript types are available during compilation — fixes `noImplicitAny` errors on all Prisma callback parameters in Docker builds (mirrors the CI workflow fix in `6ca0a7e`)

### Added - Phase 3.1 Contact Management (Session 15, 2026-03-12)

- **Phase 3.1 — Organization Contact Directory**
  - *apps/api/prisma*
    - `schema.prisma`: `Contact` model (firstName, lastName, company, type, email, phone, mobile, title, notes, isActive) + `ContactProject` join table; `@@unique([organizationId, email])` for org-scoped email uniqueness; relations added on Organization, User, Project — 23 models total
    - `seed.ts`: 3 demo contacts (SUBCONTRACTOR, INSPECTOR, ARCHITECT), 2 project associations on project 1
  - *packages/core*
    - `types/contact.ts`: `ContactType` union, `Contact`, `ContactWithRelations`, `ContactProjectSummary`, `CreateContactInput`, `UpdateContactInput`
    - `schemas/contact.ts`: `createContactSchema`, `updateContactSchema` (Zod: required name, enum type, email format, max lengths)
    - `constants/contact.ts`: `CONTACT_TYPES` (label + color per type), `CONTACT_TYPE_LIST`
  - *apps/api*
    - `services/contact.service.ts`: `listContacts` (paginated, type filter, full-text search across name/company/email), `getContact`, `createContact`, `updateContact`, `deleteContact`, `addContactToProject`, `removeContactFromProject` — all queries org-scoped
    - `routes/contacts/index.ts`: 7 routes — GET list/single (all auth), POST/PATCH (Admin/PM/OfficeAdmin), DELETE (Admin), POST+DELETE project association (Admin/PM)
    - `routes/index.ts`: registered `/contacts` prefix
    - `__tests__/helpers/mock-prisma.ts`: contact + contactProject mocks added
    - `__tests__/helpers/build-app.ts`: `buildContactTestApp()` helper added
    - `__tests__/services/contact.service.test.ts`: 24 service tests (listContacts, getContact, createContact, updateContact, deleteContact, addContactToProject, removeContactFromProject)
    - `__tests__/routes/contact.routes.test.ts`: 37 route tests (auth, RBAC, validation, org-scoping, project association)
  - **259 total tests passing** (up from 198)
  - *packages/api-client*
    - `resources/contacts.ts`: `ContactsResource` — `list`, `get`, `create`, `update`, `delete`, `addToProject`, `removeFromProject`
    - `index.ts`: `ContactsResource` exported, `contacts` added to `ApiClient` interface + `createApiClient()`
  - *apps/web*
    - `hooks/use-contacts.ts`: `useContacts`, `useContact`, `useCreateContact`, `useUpdateContact`, `useDeleteContact`, `useAddContactToProject`, `useRemoveContactFromProject`
    - `app/(dashboard)/contacts/page.tsx`: table with type filter + full-text search, create/edit/delete dialogs, RBAC-gated actions (skeleton loading, empty states)
    - `components/layout/sidebar.tsx`: Contacts nav item with `UsersIcon`
  - *Security*
    - Org-scoped email uniqueness: `@@unique([organizationId, email])`
    - All service queries include `organizationId` filter
    - Zod schemas exclude `organizationId`, `createdById` (mass-assignment prevention)
    - Cross-org project association blocked at service layer
    - 404 returned for cross-org access (not 403, prevents resource existence disclosure

### Added - Phase 2.3B Channel Chat (Sessions 13-14, 2026-03-11)

- **Phase 2.3B — Real-Time Channel Chat (Discord/Slack style)**
  - *apps/api/prisma*
    - `schema.prisma`: 5 new models — `Channel` (name/slug/isPrivate, org+project scoped), `ChannelPermission` (canRead/canWrite/canManage per role), `ChannelMember`, `ChatMessage` (body, soft-delete via `deletedAt`, thread via `parentId`), `MessageAttachment` (MinIO storageKey, MIME type, size) — 21 models total
    - `seed.ts`: seeds 2 demo channels ("General", "Project Alpha"), 6-role permissions each, all 3 demo users as members
  - *packages/core*
    - `types/channel.ts`: Channel, ChannelWithRelations, ChannelPermission, ChannelMember, ChatMessage, ChatMessageWithRelations, MessageAttachment + input types
    - `types/socket-events.ts`: typed Socket.io event payloads (channel:message, channel:message:edited, channel:message:deleted, channel member join/leave)
    - `schemas/channel.ts`: createChannelSchema, updateChannelSchema, sendChatMessageSchema, updateChannelPermissionSchema
    - `constants/channel.ts`: CHANNEL_MANAGE_ROLES, ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_SIZE_BYTES (50MB), MINIO_BUCKET_NAME
  - *apps/api*
    - `plugins/minio.ts`: MinIO client plugin — ensures bucket exists at startup, decorates `fastify.minio`
    - `plugins/socket-io.ts`: Socket.io plugin — JWT auth via `handshake.auth.token` (never query param), joins org/user rooms on connect, decorates `fastify.io`
    - `types/fastify.d.ts`: extended with `io: Server` and `minio: MinioClient`
    - `app.ts`: registers minioPlugin + socketIoPlugin
    - `services/channel.service.ts`: 15 functions — listChannels, getChannel, createChannel, updateChannel, deleteChannel, listChannelPermissions, updateChannelPermission (upsert), joinChannel, leaveChannel, listMessages, sendMessage, editMessage, deleteMessage (soft), getUploadUrl (presigned PUT 5min), confirmAttachment, getAttachmentDownloadUrl (presigned GET 1hr)
    - `routes/channels/index.ts`: 15 routes with READ/WRITE/SENSITIVE rate limits and RBAC
    - `routes/index.ts`: registered `/channels` prefix
  - *packages/api-client*
    - `resources/channels.ts`: ChannelsResource — 14 methods covering channels CRUD, permissions, membership, messages, attachments
    - `types.ts`: added `'PUT'` to `RequestOptions.method` union
    - `index.ts`: ApiClient interface + createApiClient() updated with `channels` namespace
  - *apps/web*
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
  - *packages added*
    - `apps/api`: `socket.io ^4.8.3`, `minio ^8.0.7`, `@fastify/multipart ^8.3.0`
    - `apps/web`: `socket.io-client ^4.8.3`
  - *tests*
    - `__tests__/helpers/mock-prisma.ts`: channel, channelPermission, channelMember, chatMessage, messageAttachment mocks
    - `__tests__/helpers/build-app.ts`: createMockIo(), createMockMinio(), buildChannelTestApp()
  - **162 API tests passing**, web type-check clean
  - *bug fixes (Sessions 13-14)*
    - `middleware/error-handler.ts`: Zod 4 compatibility — `.issues ?? .errors` duck-typing for ZodError
    - `config/env.ts`: Zod 4 `.default(false)` instead of `.default('false')` for boolean transform
    - `services/messaging.service.ts`: renamed unused `authorId` → `_authorId` (TS strict unused-param)

### Added - Phase 2.3A Async Messaging Module (Session 12, 2026-03-10)

- **Phase 2.3A — Async Messaging (DMs + Announcements)**
  - *apps/api/prisma*
    - `schema.prisma`: 4 new models — `Conversation` (canonical participant ordering), `DirectMessage`, `Announcement` (targetRole, scheduledAt, sentAt), `AnnouncementRead` — 16 models total
    - `prisma db push` applied — DB in sync
  - *packages/core*
    - `types/messaging.ts`: Conversation, ConversationWithRelations, DirectMessage, DirectMessageWithSender, Announcement, AnnouncementWithRelations, AnnouncementRead, UnreadCount + input types
    - `schemas/messaging.ts`: `sendDirectMessageSchema`, `createAnnouncementSchema`, `updateAnnouncementSchema` (Zod)
    - `tsconfig.json`: Changed to CommonJS output — fixes `ERR_UNSUPPORTED_DIR_IMPORT` when running seed via ts-node
  - *apps/api*
    - `services/messaging.service.ts`: `listConversations`, `getOrCreateConversation`, `getConversationMessages`, `sendDirectMessage`, `listAnnouncements`, `listDraftAnnouncements`, `getAnnouncement`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `markAnnouncementRead`, `getUnreadCount`
    - `routes/messages/index.ts`: Full REST API with RBAC (DMs: all auth; Announcements create/update/delete: Admin/PM/OfficeAdmin)
    - `routes/index.ts`: registered `/messages` prefix
    - `middleware/error-handler.ts`: Fixed ZodError duck-type check (`error.name === 'ZodError'`) — resolved 10 pre-existing test failures
  - *packages/api-client*
    - `resources/messaging.ts`: `MessagingResource` — getUnreadCount, listConversations, startConversation, listMessages, sendMessage, listAnnouncements, listDrafts, getAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementRead
    - `index.ts`: `ApiClient` interface + `createApiClient()` updated with `messaging` namespace
  - *apps/web*
    - `hooks/use-messaging.ts`: useUnreadCount, useConversations, useConversationMessages, useStartConversation, useSendMessage, useAnnouncements, useDraftAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, useMarkAnnouncementRead
    - `app/(dashboard)/messages/page.tsx`: Split-panel inbox — DMs tab (conversation list + thread view, send on Enter), Announcements tab (list + detail, mark-read), Drafts tab (managers only, delete draft)
    - `components/layout/sidebar.tsx`: Added Messages nav item (ChatBubbleLeftRightIcon)
  - *tests*
    - `__tests__/services/messaging.service.test.ts`: 18 tests (listConversations, getOrCreateConversation, sendDirectMessage, createAnnouncement, updateAnnouncement, deleteAnnouncement, getUnreadCount)
    - `__tests__/routes/messaging.routes.test.ts`: 11 tests (HTTP contract, RBAC, 400/401/403/204 status codes)
    - `__tests__/helpers/mock-prisma.ts`: Added conversation, directMessage, announcement, announcementRead mocks
    - `__tests__/helpers/build-app.ts`: Added `buildMessagingTestApp()`
  - **259 total tests passing** (97 core + 162 API), web type-check clean

### Added - Phase 2.6 Procedures Module (Session 10, 2026-03-07)

- **Phase 2.6 — General Procedures (full CRUD + RBAC)**
  - *apps/api/prisma*
    - `schema.prisma`: `Procedure` model with title, content, category, status (DRAFT/PUBLISHED/ARCHIVED), org scoping, optional project link, createdBy user relation — 10 models total
    - `prisma db push` applied — DB in sync
  - *packages/core*
    - `types/procedure.ts`: `ProcedureStatus`, `ProcedureCategory`, `Procedure`, `ProcedureWithRelations`, `CreateProcedureInput`, `UpdateProcedureInput`
    - `schemas/procedure.ts`: `createProcedureSchema`, `updateProcedureSchema` (Zod, with content max 50k)
    - `constants/procedure-status.ts`: `PROCEDURE_STATUSES`, `PROCEDURE_CATEGORIES`, list constants
  - *apps/api*
    - `services/procedure.service.ts`: `listProcedures` (paginated, status/category/project filters), `getProcedure`, `createProcedure`, `updateProcedure`, `deleteProcedure`
    - `routes/procedures/index.ts`: GET /, GET /:id (all auth), POST / + PATCH /:id (Admin/PM/OfficeAdmin), DELETE /:id (Admin); rate limiting via fastify.rateLimit()
    - `routes/index.ts`: registered `/procedures` prefix
  - *packages/api-client*
    - `resources/procedures.ts`: `ProceduresResource` — `list`, `get`, `create`, `update`, `delete` with typed params/responses
    - `index.ts`: `ApiClient` interface + `createApiClient()` updated with `procedures` namespace
  - *apps/web*
    - `hooks/use-procedures.ts`: `useProcedures`, `useProcedure`, `useCreateProcedure`, `useUpdateProcedure`, `useDeleteProcedure` (TanStack Query)
    - `app/(dashboard)/procedures/page.tsx`: full table UI with status+category filters, view/create/edit/delete dialogs, skeleton loading, role-aware actions
  - `components/layout/sidebar.tsx`: added **Tasks** and **Procedures** nav items (Tasks was previously missing)
- **Verified**: packages/core + api-client build clean, API + web type-check zero errors, 146 tests passing (66 core + 80 API)

### Added - Phase 2 Dashboard Module (Session 7, 2026-03-03)

- **Phase 2.1 — Dashboard & Hub (multi-agent build)**
  - *API layer (apps/api)*
    - `project.service.ts`: `listProjects` (paginated + status filter), `getProject`, `createProject`, `updateProject`, `archiveProject` — full `organizationId` scoping
    - `dashboard.service.ts`: `getDashboardStats` — single `Promise.all` → `activeProjectCount`, `totalProjectCount`, `teamMemberCount`, `projectsByStatus` breakdown
    - `routes/projects/index.ts`: GET /, GET /:id, POST / (Admin/PM), PATCH /:id (Admin/PM), DELETE /:id (Admin)
    - `routes/dashboard/index.ts`: GET /stats (all authenticated roles)
    - Registered both route groups in `routes/index.ts`
  - *packages/core*
    - `types/dashboard.ts`: `DashboardStats` interface exported from `types/index.ts`
  - *packages/api-client*
    - `resources/projects.ts`: `ProjectsResource` — `list`, `get`, `create`, `update`, `archive` with typed params/responses
    - `resources/dashboard.ts`: `DashboardResource` — `getStats()`
    - `index.ts`: `ApiClient` interface + `createApiClient()` updated with `projects` and `dashboard` namespaces
    - Rebuilt: `pnpm --filter @promanage/api-client build` — zero errors
  - *apps/web*
    - `@heroicons/react` added as dependency
    - Hooks: `use-dashboard-stats`, `use-projects`, `use-organization` (TanStack Query)
    - `components/dashboard/stats-card.tsx`: `StatsCard` — loading skeleton, blue/green/default variants
    - `components/dashboard/project-summary-list.tsx`: `ProjectSummaryList` — status Badge color-coding, skeleton rows
    - `app/(dashboard)/dashboard/page.tsx`: replaced placeholders with live data (stats, org name, project list)
    - `app/(dashboard)/projects/page.tsx`: full projects table (number, name, type, status Badge, dates), skeleton loading, empty state, "New Project" button (Admin/PM) with stub Dialog
    - `components/layout/sidebar.tsx`: Heroicons icons (Home, FolderOpen, Users, Building, Cog), role-aware nav (Organization: Admin/OfficeAdmin; Settings: Admin only)
  - *Security (both agents — all PASS)*
    - API: authentication on all routes, RBAC on writes, organizationId from JWT only, Zod validation, no raw SQL
    - Frontend: no token exposure, role gates via Zustand only, resetApiClient() on logout, no localStorage cache, no XSS

### Added - Phase 1 Sub-phase G (Session 6, 2026-03-02)

- **Sub-phase G - apps/web Next.js 14 App Router shell (~30 files)**
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

- **Sub-phase F - packages/ui-components (30 files)**
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

- **Sub-phase E - packages/api-client (10 files)**
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

- **Sub-phase A - Root Tooling**
  - tsconfig.base.json, .prettierrc/.prettierignore, .eslintrc.json/.eslintignore, docker-compose.yml, root package.json devDeps
- **Sub-phase B - packages/core (24 files)**
  - Types: ApiResponse, PaginationMeta, User, UserWithRoles, Organization, Project, RoleName, TokenPayload, AuthResponse
  - Zod schemas: loginSchema, registerSchema, createProjectSchema, updateProjectSchema
  - Constants: RESOURCES (16), ACTIONS (4), DEFAULT_ROLE_PERMISSIONS, USER_ROLES, ERROR_CODES (13), HTTP_STATUS
  - Utils: parsePagination, buildPaginationMeta, formatDate, formatCurrency, formatCurrencyCompact
- **Sub-phase C - Database Layer**
  - schema.prisma: 8 models (Organization, User, Role, Permission, RolePermission, UserRole, RefreshToken, Project)
  - seed.ts: 64 permissions, 6 roles, demo org, 3 users, 2 projects
  - Docker PostgreSQL 15 + MinIO running; DB pushed and seeded
- **Sub-phase D - Fastify API Server (~30 files)**
  - Config, lib (AppError hierarchy, response helpers, Pino logger), Fastify type augmentation
  - Plugins: Prisma, Swagger/OpenAPI
  - Middleware: authenticate, authorize (role+permission factories), error-handler
  - Services: password, token, auth, user, organization
  - Routes: /health, /api/v1/auth/*, /api/v1/users/:id, /api/v1/organizations/current
  - Auth: JWT 15min access + 7d refresh token (httpOnly cookie, rotation)
  - Verified: health check + login returning JWT working
- **Infrastructure**
  - Node.js 20.20.0 + pnpm 8.15.9 via nvm in WSL
  - Docker Engine in WSL; PostgreSQL on :5432, MinIO on :9000

### Added - Foundation (Sessions 1-2)

- 42 foundation files: docs, config, scripts, GitHub templates
- pnpm workspaces + Turborepo pipeline configuration

### Changed

- Database strategy: PostgreSQL only, Redis and WatermelonDB deferred (DD-011)
- Updated technology-stack.md and design-decisions.md

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
