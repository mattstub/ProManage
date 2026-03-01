# Session Context — Quick Reference

**Purpose**: Single file to read at the start of each session. Summarizes project state, key decisions, and file locations.

**Last Updated**: 2026-02-28 (Session 3)

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
apps/web/              NOT STARTED (Sub-phase G)
apps/mobile/           DEFERRED

packages/core/         COMPLETE (Sub-phase B — 24 files)
  src/types/             api, auth, user, role, org, project
  src/schemas/           auth, user, org, project (Zod)
  src/constants/         roles, permissions, project-status, api
  src/utils/             pagination, format-date, format-currency
packages/ui-components/ NOT STARTED (Sub-phase F)
packages/api-client/    NOT STARTED (Sub-phase E)

Root tooling:          COMPLETE (Sub-phase A)
  tsconfig.base.json, .eslintrc.json, .prettierrc, docker-compose.yml
```

---

## Current State (2026-02-28)

- **Phase 1, Sub-phases A-D**: Complete (~80 source files)
- **API**: Runs on http://localhost:3001 | Swagger at http://localhost:3001/docs
- **DB**: PostgreSQL in Docker, seeded
- **Next**: Sub-phase E (api-client), F (ui-components), G (apps/web)

### Seed Credentials

| Email | Password | Role |
|---|---|---|
| admin@demo.com | password123 | Admin |
| pm@demo.com | password123 | ProjectManager |
| field@demo.com | password123 | FieldUser |

---

## How to Restart

```bash
source ~/.nvm/nvm.sh && nvm use 20
docker-compose up -d
cd apps/api && pnpm dev
# Optional DB reset:
npx prisma db push --force-reset && npx ts-node prisma/seed.ts
```

---

## Module Map (from Obsidian Canvas)

17+ modules in notes/ProManage Suite.canvas.
Core (Ph 1-4): Dashboard, Projects, Contacts, Auth
Parallelizable (Ph 5+): Safety, Scheduling, Daily Reports, Time Tracking, RFIs, Submittals, Change Orders, POs, Estimation, Material DB, Contracts, Permits, Inspections, Pay Applications, Equipment, Licensing

See: docs/ROADMAP.md

---

## Session Log

### Session 1 — 2026-02-02
Created 42 foundation files (docs, config, scripts, templates), monorepo structure.

### Session 2 — 2026-02-03
DD-011: PostgreSQL only, defer Redis/WatermelonDB. Updated tech-stack + design-decisions docs.

### Session 3 — 2026-02-28
- Parsed Obsidian canvas (17+ modules)
- Built ROADMAP.md (10 phases)
- Installed Node 20 + pnpm via nvm, Docker Engine in WSL
- Sub-phase A: root tooling (tsconfig, prettier, eslint, docker-compose)
- Sub-phase B: packages/core (24 files — types, schemas, constants, utils)
- Sub-phase C: database (schema.prisma 8 models, seed.ts, Docker + prisma db push)
- Sub-phase D: Fastify API server (~30 files — full auth, users, orgs, middleware, services)
- Verified: health check + login returning JWT working

