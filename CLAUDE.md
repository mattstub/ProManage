# ProManage — Claude Code Project Instructions

## What This Is
Open-source construction management platform (AGPL-3.0). Desktop-first web app.
Monorepo: `pnpm workspaces` + `Turborepo`. Author: Matt Stubenhofer.

---

## CRITICAL: WSL Constraints

- **Claude Code runs inside WSL** — do NOT prefix commands with `wsl -d Ubuntu -e bash -c`; run Bash commands directly
- **Read/Glob/Grep tools** work fine with `/home/mattstub/ProManage` absolute paths
- **nvm must be sourced** every shell: `source ~/.nvm/nvm.sh && nvm use 20`
- **`git push` hangs** in Bash tool context — always tell the user to push from their own terminal
- **WSL background processes** don't persist across shell invocations — chain commands in one bash -c

---

## Code Style (enforced by ESLint + Prettier)

- No semicolons, single quotes, 2-space indent
- `camelCase` vars/functions, `PascalCase` components/classes, `snake_case` DB columns (Prisma `@map`)
- Import order: `external` → `@promanage/*` (internal) → `@/*` local aliases → `./relative` → `type` (last)
  - Blank line between each group; alphabetical within each group (`@` sorts before letters)
- Run auto-fix before committing: `npx eslint --fix 'apps/web/src/**/*.{ts,tsx}'`

---

## Build Commands

```bash
# Start infrastructure
source ~/.nvm/nvm.sh && nvm use 20
docker compose up -d   # Note: 'docker compose' (v2), NOT 'docker-compose' (v1)

# Package build order (core first, then parallel)
pnpm --filter @promanage/core build
pnpm --filter @promanage/api-client build
pnpm --filter @promanage/ui-components build

# If incremental build is stale (remove tsbuildinfo alongside dist/)
rm -rf packages/core/dist packages/core/tsconfig.tsbuildinfo

# API dev server
cd apps/api && pnpm dev

# Web dev server
pnpm --filter @promanage/web dev

# Web type-check + build
pnpm --filter @promanage/web type-check
pnpm --filter @promanage/web build

# DB reset (use push, NOT migrate dev — fails non-interactively)
cd apps/api && npx prisma db push --force-reset && npx ts-node prisma/seed.ts
```

---

## Architecture

| Package | Stack | Status |
|---|---|---|
| `apps/api` | Fastify + Prisma + PostgreSQL | COMPLETE |
| `apps/web` | Next.js 14 + React 19 + Tailwind | COMPLETE |
| `packages/core` | Zod schemas, shared types, utils | COMPLETE |
| `packages/api-client` | Typed fetch wrapper, auto-refresh | COMPLETE |
| `packages/ui-components` | Radix UI + CVA + Tailwind | COMPLETE |

**Auth**: JWT 15min access token (memory) + 7d refresh token (httpOnly cookie, rotation)
**Multi-tenant**: all data scoped by `organizationId`
**6 roles**: Admin, ProjectManager, Superintendent, Foreman, FieldUser, OfficeAdmin

---

## Phase Status

- **Phase 1** (Foundation): ALL COMPLETE — sub-phases A through G
- **Phase 2** (Dashboard & Hub): ALL COMPLETE — 2.1 Dashboard, 2.2 Notifications, 2.3A Async Messaging, 2.3B Channel Chat, 2.4 Calendar, 2.5 Tasks, 2.6 Procedures
- **Phase 3** (Contacts & Company Setup): COMPLETE — 3.1 Contact Management COMPLETE; 3.2 Licensing COMPLETE; 3.3 Safety COMPLETE
- Full roadmap: `docs/ROADMAP.md`

---

## Testing

### Run Tests

```bash
pnpm test                                      # all packages via turbo
pnpm --filter @promanage/core test             # unit tests only
pnpm --filter @promanage/api test              # API service + route tests only
```

### Test Infrastructure

| Package | Config | Helpers |
|---|---|---|
| `packages/core` | `vitest.config.ts` + `tsconfig.test.json` | — |
| `apps/api` | `vitest.config.ts` + `tsconfig.test.json` + `src/__tests__/setup.ts` | `build-app.ts`, `mock-prisma.ts` |

### Adding Tests for a New Feature

**Required: tests ship with the feature, not after it.**

1. **New API route/service** → add tests in `apps/api/src/__tests__/`
   - `services/[name].service.test.ts` — business logic, mock Prisma via `createMockPrisma()`
   - `routes/[name].routes.test.ts` — HTTP contract (status codes, cookies, body shape), use `buildAuthTestApp()` or add a new `build[Name]TestApp()` helper
   - For a new route group, add a `buildXxxTestApp()` in `helpers/build-app.ts`

2. **New `packages/core` schema or util** → add tests in `packages/core/src/__tests__/`
   - `schemas/[name].test.ts` — valid + invalid inputs, boundary values
   - `utils/[name].test.ts` — all branches + edge cases

3. **What to test at each layer**

   | Layer | What to test | What NOT to test |
   |---|---|---|
   | Service | Business rules, error branches (wrong password, revoked token, inactive user) | DB queries in isolation — trust Prisma |
   | Route | Status codes, response shape, cookie set/clear, auth required vs public | Internal service logic |
   | Schema | Regex/length constraints, required fields, type coercion | Implementation details |
   | Utils | Return values for all branches + edge cases (0, negative, max) | Intl internals |

### Mocking Conventions

- **Prisma**: `createMockPrisma()` from `apps/api/src/__tests__/helpers/mock-prisma.ts` — add new model mocks there as new features are added
- **External services** (bcrypt, crypto, token signing): `vi.mock()` at the top of service test files
- **Fastify app**: `buildAuthTestApp()` for auth routes; create parallel helpers for other route groups
- **JWTs in route tests**: `signTestToken(app, payload)` — signs with the test secret

### Key Design Decisions

- Auth loop fix (Session 8): `logout` is unauthenticated — the client calls it from `onAuthError` to clear the httpOnly cookie before redirecting, preventing the middleware redirect loop caused by expired cookies

---

## Next Session Discussion Items

1. **CI/CD Pipeline** — GitHub Actions for lint/type-check/build/test on PR, deployment target (VPS, Vercel, Railway), environment promotion strategy.

2. **Logging/Observability** — Pino log levels per environment, log aggregation (Loki, Papertrail, Datadog), Sentry for frontend errors.

---

## apps/web Patterns

- `getApiClient()` singleton + `resetApiClient()` called on logout
- `AuthProvider` distinguishes 401/403 (→ `clearAuth`) from network errors (→ `setLoading(false)` only)
- Middleware uses inverted whitelist — protects everything except `/login` and `/register`
- `useAuthStore` (Zustand): `user`, `accessToken`, `isAuthenticated`, `isLoading`
- `@promanage/ui-components` requires `tailwind.config.ts` to scan `../../packages/ui-components/src/**`

---

## Branch Protection

**`main` is branch-protected** — direct pushes are rejected by GitHub.

- **Always run `/new-branch` before starting any work** to create a feature branch
- All work must go through a PR; never commit directly to `main`
- `git push` to `main` will be rejected — push the feature branch and open a PR

---

## Workflow Slash Commands

| Command | What it does |
|---|---|
| `/startup` | Full session startup checklist |
| `/new-branch` | Create correctly-named branch for a sub-phase |
| `/commit-pr` | Stage, commit, and prepare PR |

---

## Key File Locations

| File | Purpose |
|---|---|
| `docs/context/session-context.md` | Session quick-ref — READ FIRST |
| `docs/context/implementation-progress.md` | Detailed sub-phase checklist |
| `CHANGELOG.md` | Session-by-session change log |
| `apps/api/prisma/schema.prisma` | DB schema (8 models) |
| `apps/api/.env` | Local env (gitignored) |
| `apps/web/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:3001` (gitignored) |

---

## Seed Credentials

| Email | Password | Role |
|---|---|---|
| admin@demo.com | password123 | Admin |
| pm@demo.com | password123 | ProjectManager |
| field@demo.com | password123 | FieldUser |
