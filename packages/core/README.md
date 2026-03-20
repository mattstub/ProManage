# @promanage/core

Shared types, Zod schemas, constants, and utilities used across `apps/api`, `apps/web`, and `packages/api-client`.

---

## Build

```bash
pnpm --filter @promanage/core build

# If incremental build is stale:
rm -rf packages/core/dist packages/core/tsconfig.tsbuildinfo
pnpm --filter @promanage/core build
```

Output is CommonJS (required for `ts-node` seed compatibility).

---

## Exports

### Types (`@promanage/core`)

Domain model interfaces and input types for all features:

```typescript
import type {
  // Auth & Users
  User, UserWithRoles, TokenPayload, AuthResponse,
  // Organizations
  Organization,
  // Projects
  Project, ProjectWithRelations, ProjectScope, ProjectSettings,
  ProjectDashboard, ProjectDashboardMetrics, ProjectContactAssignment,
  // Tasks
  Task,
  // Procedures
  Procedure,
  // Calendar
  CalendarEvent,
  // Messaging
  Conversation, DirectMessage, Announcement,
  // Channels
  Channel, ChannelMember, ChatMessage,
  // Contacts
  Contact,
  // Licenses
  License, LicenseDocument, LicenseReminder,
  // Safety
  SafetyDocument, SdsEntry, ToolboxTalk, SafetyForm, IncidentReport,
  // Notifications
  Notification,
  // API
  ApiResponse, PaginationMeta,
} from '@promanage/core'
```

### Schemas (`@promanage/core`)

Zod schemas for request validation (used in both API and client):

```typescript
import {
  loginSchema, registerSchema,
  createProjectSchema, updateProjectSchema,
  createProjectScopeSchema, updateProjectScopeSchema,
  updateProjectSettingsSchema, assignContactToProjectSchema,
  createTaskSchema, updateTaskSchema,
  createProcedureSchema, updateProcedureSchema,
  createCalendarEventSchema, updateCalendarEventSchema,
  sendDirectMessageSchema, createAnnouncementSchema,
  createChannelSchema, sendChatMessageSchema,
  createContactSchema, updateContactSchema,
  createLicenseSchema, updateLicenseSchema,
  createSafetyDocumentSchema, createToolboxTalkSchema,
  // ... (one schema per resource action)
} from '@promanage/core'
```

### Constants (`@promanage/core`)

```typescript
import {
  USER_ROLES,           // { Admin, ProjectManager, Superintendent, Foreman, FieldUser, OfficeAdmin }
  DEFAULT_ROLE_PERMISSIONS,
  PROJECT_STATUSES,     // { PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED, CANCELLED } with labels/colors
  PROJECT_TYPES,        // { COMMERCIAL, RESIDENTIAL, INDUSTRIAL, INFRASTRUCTURE, RENOVATION, OTHER }
  PROJECT_SCOPE_STATUSES,
  TASK_STATUSES, TASK_PRIORITIES,
  PROCEDURE_STATUSES, PROCEDURE_CATEGORIES,
  EVENT_TYPES,
  CONTACT_TYPES,
  LICENSE_STATUSES,
  SAFETY_DOCUMENT_CATEGORIES, TOOLBOX_TALK_STATUSES,
  INCIDENT_TYPES, INCIDENT_STATUSES,
  ERROR_CODES, HTTP_STATUS,
} from '@promanage/core'
```

### Utils (`@promanage/core`)

```typescript
import {
  parsePagination,      // (query) => { page, limit }
  buildPaginationMeta,  // (page, limit, total) => PaginationMeta
  formatDate,           // (date) => 'Mar 19, 2026'
  formatDateShort,      // (date) => '3/19/26'
  formatDateTime,       // (date) => 'Mar 19, 2026 2:30 PM'
  formatRelativeTime,   // (date) => '2 hours ago'
  formatCurrency,       // (amount) => '$1,234.56'
  formatCurrencyCompact, // (amount) => '$1.2K'
} from '@promanage/core'
```

---

## Testing

```bash
pnpm --filter @promanage/core test    # 97 tests
```

Tests live in `src/__tests__/schemas/` and `src/__tests__/utils/`. See [Testing Guide](../../docs/development/testing.md).

---

## License

AGPL-3.0 — See [LICENSE](../../LICENSE)
