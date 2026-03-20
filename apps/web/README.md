# apps/web — ProManage Web App

Next.js 15 App Router frontend. Desktop-first (90% of use cases). Connects to `apps/api` via `@promanage/api-client`.

- **URL**: `http://localhost:3000`

---

## Dev Setup

```bash
source ~/.nvm/nvm.sh && nvm use 20
pnpm --filter @promanage/web dev
```

> Full environment setup: [docs/development/setup.md](../../docs/development/setup.md)

---

## Environment Variables

Copy `.env.local.example` to `.env.local`:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API server URL (default: `http://localhost:3001`) |

---

## Pages

All pages live under `src/app/(dashboard)/`:

| Route | Description |
| --- | --- |
| `/dashboard` | Stats overview, project summaries |
| `/projects` | Project list with search + filters |
| `/projects/[id]` | Project overview (metrics, details, scope progress) |
| `/projects/[id]/team` | Assign/remove contacts with roles |
| `/projects/[id]/scopes` | Scope CRUD |
| `/projects/[id]/settings` | Toggle-based project settings |
| `/tasks` | Task management with RBAC |
| `/procedures` | Procedure library |
| `/calendar` | Custom month-view calendar |
| `/messages` | DMs + announcements |
| `/channels` | Real-time Socket.io channel chat |
| `/contacts` | Organization contact directory |
| `/licenses` | License tracking + document uploads |
| `/safety` | 5-tab safety hub (documents, SDS, toolbox talks, forms, incidents) |
| `/organization` | Org settings |
| `/settings` | User settings |

---

## Key Patterns

- **API client**: `getApiClient()` singleton from `src/lib/api-client.ts`. Call `resetApiClient()` + `resetSocket()` on logout.
- **Auth**: `useAuthStore` (Zustand) — `user`, `accessToken`, `isAuthenticated`, `isLoading`. `AuthProvider` handles 401 (→ `clearAuth`) vs network errors (→ `setLoading(false)`).
- **Server state**: TanStack Query hooks in `src/hooks/` (one file per domain).
- **Real-time**: `useSocket()` hook manages Socket.io connection with JWT in `handshake.auth.token`.
- **Middleware**: Inverted whitelist — protects everything except `/login` and `/register`.
- **Tailwind**: Config scans `../../packages/ui-components/src/**` — required for ui-components styles to work.

---

## Scripts

```bash
pnpm dev          # Next.js dev server
pnpm build        # Production build
pnpm type-check   # TypeScript check (tsc --noEmit)
pnpm lint         # ESLint
```

---

## Further Reading

- [Setup Guide](../../docs/development/setup.md)
- [Coding Standards](../../docs/development/coding-standards.md)
- [UI Components](../../packages/ui-components/README.md)

## License

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-rgb(153,51,153).svg)](https://www.gnu.org/licenses/agpl-3.0)

We chose [AGPL-3.0](../../LICENSE) to ensure that all improvements to ProManage remain open source. This protects the community and prevents proprietary forks that don't give back.
