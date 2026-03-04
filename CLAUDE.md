# ProManage — Claude Code Project Instructions

## What This Is
Open-source construction management platform (AGPL-3.0). Desktop-first web app.
Monorepo: `pnpm workspaces` + `Turborepo`. Author: Matt Stubenhofer.

---

## CRITICAL: WSL Constraints

- **All bash commands** must use: `wsl -d Ubuntu -e bash -c "..."`
- **Read/Glob/Grep tools** fail with `/home/mattstub/ProManage` paths — use Bash instead
- **nvm must be sourced** every shell: `source ~/.nvm/nvm.sh && nvm use 20`
- **`git push` hangs** in bash -c context — tell the user to push from their own terminal
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
docker-compose up -d

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
- **Phase 2** (Dashboard module): IN PROGRESS — 2.1 complete (dashboard, projects, real data)
- Full roadmap: `docs/ROADMAP.md`

---

## Next Session Discussion Items

Before starting Phase 2.2+, discuss and decide on:

1. **CI/CD Pipeline** — What should the pipeline look like? Options: GitHub Actions for lint/type-check/build on PR, automated test runs, deployment target (VPS, Vercel, Railway, etc.), environment promotion strategy (dev → staging → prod).

2. **Unit Testing strategy** — No tests exist yet. Decide on: framework (Vitest for packages + API, Playwright for E2E), coverage targets, what to test first (API services vs. UI components vs. auth flows), and whether to add tests retroactively to Phase 1 or write them alongside Phase 2+ work.

3. **Logging/Observability** — API uses Pino (structured JSON logging). Discuss: log levels per environment, log aggregation service (Loki, Papertrail, Datadog), frontend error tracking (Sentry), and whether to add request tracing before the project scales.

---

## apps/web Patterns

- `getApiClient()` singleton + `resetApiClient()` called on logout
- `AuthProvider` distinguishes 401/403 (→ `clearAuth`) from network errors (→ `setLoading(false)` only)
- Middleware uses inverted whitelist — protects everything except `/login` and `/register`
- `useAuthStore` (Zustand): `user`, `accessToken`, `isAuthenticated`, `isLoading`
- `@promanage/ui-components` requires `tailwind.config.ts` to scan `../../packages/ui-components/src/**`

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
