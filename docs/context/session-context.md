# Session Context — Quick Reference

**Purpose**: Single file to read at the start of each session. Summarizes project state, key decisions, and file locations.

**Last Updated**: 2026-03-02 (Session 6)

---

## Project Summary

**ProManage** — open-source (AGPL-3.0) construction management platform. Desktop-first web app (90%) + mobile companion (10%).

- **Repo**: https://github.com/mattstub/ProManage
- **Author**: Matt Stubenhofer
- **Version**: 0.1.0-dev

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Next.js 14+, React 18+, TailwindCSS, Radix UI, Zustand, TanStack Query |
| Mobile | React Native + Expo (deferred) |
| API server | Node.js 20+, Fastify, TypeScript |
| Database | PostgreSQL 15+ via Prisma ORM |
| File storage | MinIO (local), AWS S3 (prod) |
| Auth | JWT 15min + refresh token rotation 7d (httpOnly cookie) |
| Monorepo | pnpm workspaces + Turborepo |

**Deferred**: Redis, WatermelonDB

---

## Code Style Conventions

- No semicolons, single quotes, 2-space indent
- camelCase vars/functions, PascalCase components/classes, snake_case DB columns (Prisma @map)
- ESLint import order: external -> @promanage/* -> relative -> type

---

## Key Decisions

| ID | Decision | Status |
|---|---|---|
| DD-001 | Desktop-first (90/10 split) | Accepted |
| DD-002 | pnpm + Turborepo monorepo | Accepted |
| DD-004 | TypeScript everywhere | Accepted |
| DD-005 | Prisma ORM | Accepted |
| DD-006 | AGPL-3.0 | Accepted |
| DD-007 | Radix UI + TailwindCSS | Proposed |
| DD-009 | JWT + refresh token rotation | Accepted |
| DD-011 | PostgreSQL only, defer Redis/WatermelonDB | Accepted |

---

## Directory Map (Current State)

```
ProManage/
apps/api/              COMPLETE (Sub-phases C+D)
  prisma/schema.prisma   8 models, multi-tenant
  prisma/seed.ts         demo org, 6 roles, 64 perms, 3 users, 2 projects
  src/config/            Zod env validation
  src/lib/               errors, response helpers, pino logger
  src/middleware/        authenticate, authorize, error-handler
  src/plugins/           prisma, swagger
  src/routes/            health, auth, users, organizations
  src/services/          auth, user, org, token, password
  src/types/             fastify.d.ts augmentation
  src/app.ts             Fastify builder
  src/server.ts          entry point
apps/web/              COMPLETE (Sub-phase G)
  src/app/               App Router: /, /login, /register, /dashboard
  src/middleware.ts      Inverted-whitelist route guard
  src/stores/            Zustand auth store
  src/providers/         AuthProvider, QueryProvider
  src/components/        auth forms, layout (sidebar, header, nav-item)
  src/lib/               api-client singleton, query-client
apps/mobile/           DEFERRED

packages/core/         COMPLETE (Sub-phase B - 24 files)
  src/types/             api, auth, user, role, org, project
  src/schemas/           auth, user, org, project (Zod)
  src/constants/         roles, permissions, project-status, api
  src/utils/             pagination, format-date, format-currency
packages/api-client/   COMPLETE (Sub-phase E - 10 files)
  src/client.ts          ProManageClient (fetch wrapper, auto-refresh on 401)
  src/errors.ts          ApiClientError class
  src/types.ts           ClientConfig, RequestOptions, PaginatedResult
  src/resources/         auth, users, organizations, health
  src/index.ts           createApiClient() factory + all exports
packages/ui-components/ COMPLETE (Sub-phase F - 30 files)
  src/utils/cn.ts        clsx + tailwind-merge utility
  src/components/        26 components (Button, Input, Card, Table, Dialog, Toast, etc.)
  src/index.ts           barrel exports + type re-exports

Root tooling:          COMPLETE (Sub-phase A)
  tsconfig.base.json, .eslintrc.json, .prettierrc, docker-compose.yml
```

---

## Current State (2026-03-02)

- **Phase 1, Sub-phases A-G**: COMPLETE (~150 source files)
- **API**: Runs on http://localhost:3001 | Swagger at http://localhost:3001/docs
- **DB**: PostgreSQL in Docker, seeded
- **api-client**: Built and typed, project references wired
- **ui-components**: Built (tsc --build, zero errors), 26 Radix+Tailwind components
- **Next**: Phase 2 — Dashboard module (real data, widgets, project summary)

### Seed Credentials

| Email | Password | Role |
|---|---|---|
| admin@demo.com | password123 | Admin |
| pm@demo.com | password123 | ProjectManager |
| field@demo.com | password123 | FieldUser |

---

## Claude Code Workflow Commands

Three slash commands live in `.claude/commands/` — invoke them in any Claude Code session:

| Command | Purpose |
|---|---|
| `/startup` | Full session startup checklist (infra, builds, git state) |
| `/new-branch` | Create a properly-named branch for a sub-phase or feature |
| `/commit-pr` | Stage, commit, and prepare a PR with correct format |

---

## How to Restart

```bash
source ~/.nvm/nvm.sh && nvm use 20
docker-compose up -d
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

### Session 1 - 2026-02-02
Created 42 foundation files (docs, config, scripts, templates), monorepo structure.

### Session 2 - 2026-02-03
DD-011: PostgreSQL only, defer Redis/WatermelonDB. Updated tech-stack + design-decisions docs.

### Session 3 - 2026-02-28
- Parsed Obsidian canvas (17+ modules), built ROADMAP.md (10 phases)
- Installed Node 20 + pnpm via nvm, Docker Engine in WSL
- Sub-phase A-D: root tooling, packages/core, database, Fastify API server
- Verified: health check + login returning JWT working

### Session 4 - 2026-03-01
- Sub-phase E: packages/api-client (10 files) - ProManageClient, resources, ApiClientError, createApiClient()
- TypeScript project references wired (composite + tsc --build on both packages)
- Removed .claude/settings.local.json from git tracking
- PR merged by user

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
