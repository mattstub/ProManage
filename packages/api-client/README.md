# @promanage/api-client

Typed fetch wrapper for the ProManage API. Used by `apps/web`. Handles JWT access tokens, auto-refresh on 401 via httpOnly cookie, and typed resource methods for every API route group.

---

## Build

```bash
pnpm --filter @promanage/api-client build
```

---

## Usage

```typescript
import { getApiClient, resetApiClient } from '@/lib/api-client'

// All API calls go through the singleton
const api = getApiClient()

// Call resetApiClient() on logout to clear token + socket state
resetApiClient()
```

The singleton is created in `apps/web/src/lib/api-client.ts` and passed the access token from `useAuthStore`.

---

## Resource Namespaces

| Namespace | Key methods |
| --- | --- |
| `api.auth` | `login`, `register`, `refresh`, `logout` |
| `api.users` | `getProfile`, `updateProfile`, `listUsers` |
| `api.organizations` | `getOrganization`, `updateOrganization` |
| `api.projects` | `list`, `get`, `create`, `update`, `archive`, `getDashboard`, `listContacts`, `assignContact`, `updateContactAssignment`, `removeContact`, `listScopes`, `createScope`, `updateScope`, `deleteScope`, `getSettings`, `updateSettings` |
| `api.dashboard` | `getStats` |
| `api.tasks` | `list`, `get`, `create`, `update`, `delete` |
| `api.procedures` | `list`, `get`, `create`, `update`, `delete` |
| `api.calendarEvents` | `list`, `get`, `create`, `update`, `delete` |
| `api.notifications` | `list`, `markRead`, `markAllRead`, `delete`, `getStreamUrl` |
| `api.messaging` | `listConversations`, `getOrCreateConversation`, `getMessages`, `sendMessage`, `listAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `markAnnouncementRead`, `getUnreadCount` |
| `api.channels` | `list`, `get`, `create`, `update`, `delete`, `listMembers`, `addMember`, `removeMember`, `getMessages`, `sendMessage`, `deleteMessage`, `getUploadUrl`, `getDownloadUrl` |
| `api.contacts` | `list`, `get`, `create`, `update`, `delete`, `addToProject`, `removeFromProject` |
| `api.licenses` | `list`, `get`, `create`, `update`, `delete`, `addDocument`, `deleteDocument`, `createReminder`, `updateReminder`, `deleteReminder` |
| `api.safety` | `listDocuments`, `getDocument`, `createDocument`, `deleteDocument`, `getDocumentUploadUrl`, `getDocumentDownloadUrl`, `listSds`, `getSds`, `createSds`, `deleteSds`, `getSdsUploadUrl`, `getSdsDownloadUrl`, `listToolboxTalks`, `getToolboxTalk`, `createToolboxTalk`, `updateToolboxTalk`, `deleteToolboxTalk`, `addAttendee`, `removeAttendee`, `listForms`, `getForm`, `createForm`, `updateForm`, `deleteForm`, `listIncidents`, `getIncident`, `createIncident`, `updateIncident` |
| `api.health` | `check` |

---

## Error Handling

```typescript
import { ApiClientError } from '@promanage/api-client'

try {
  await getApiClient().projects.create({ name: 'Test', type: 'COMMERCIAL' })
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error(error.status)   // HTTP status code
    console.error(error.code)     // ERROR_CODES constant
    console.error(error.message)  // Human-readable message
  }
}
```

---

## License

AGPL-3.0 — See [LICENSE](../../LICENSE)
