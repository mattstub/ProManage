# ProManage — System Architecture

**Last Updated**: 2026-03-01
**Status**: Phase 1 (A–F) complete. apps/web (Sub-phase G) in progress.

---

## Overview

ProManage is a multi-tenant construction management platform built as a pnpm + Turborepo monorepo. It follows a desktop-first (90%) approach with a mobile companion (10%) for field workers.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│                                                                 │
│   apps/web (Next.js 14)          apps/mobile (React Native)    │
│   Desktop-first SPA               Field companion (deferred)   │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTP (REST + JSON)
                 │ JWT Bearer token in Authorization header
                 │ Refresh token in httpOnly cookie
┌────────────────▼────────────────────────────────────────────────┐
│                        API Layer                                │
│                                                                 │
│   apps/api (Fastify + TypeScript)                               │
│   - JWT auth middleware (15min access + 7d refresh rotation)    │
│   - RBAC authorization (6 roles, 16 resources, 4 actions)       │
│   - Prisma ORM queries (PostgreSQL 15)                          │
│   - Pino structured logging                                     │
│   - Swagger/OpenAPI at /docs                                    │
└────────────────┬────────────────────────────────────────────────┘
                 │ Prisma Client
┌────────────────▼────────────────────────────────────────────────┐
│                      Data Layer                                 │
│                                                                 │
│   PostgreSQL 15           MinIO (S3-compatible)                 │
│   - 8 Prisma models       - File/photo storage                  │
│   - Multi-tenant          - Presigned upload URLs               │
│   - organizationId on     - Local in dev, AWS S3 in prod        │
│     all user data                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
ProManage/
├── apps/
│   ├── api/          Fastify API server          COMPLETE
│   ├── web/          Next.js web app             IN PROGRESS (Sub-phase G)
│   └── mobile/       React Native + Expo         DEFERRED
│
├── packages/
│   ├── core/         Shared types, schemas,      COMPLETE
│   │                 constants, utils
│   ├── ui-components/ Radix + Tailwind           COMPLETE
│   │                 component library
│   ├── api-client/   Typed fetch wrapper          COMPLETE
│   ├── real-time/    WebSocket/SSE client         DEFERRED
│   └── mobile-components/ RN components          DEFERRED
│
├── turbo.json        Build pipeline (^build deps)
├── pnpm-workspace.yaml
└── tsconfig.base.json  Shared compiler options
```

### Package Dependency Graph

```
@promanage/core
    ↑
@promanage/api-client    @promanage/ui-components
                                ↑
                          apps/web
```

`core` has no internal deps. `api-client` and `ui-components` both depend on `core`. `apps/api` depends on `core` directly (the server is the API, not a client of it). `apps/web` depends on all three packages.

---

## TypeScript Build Strategy

All packages use `tsc --build` with `composite: true` for incremental compilation and project references.

| Package | Build tool | JSX | Key tsconfig options |
|---|---|---|---|
| packages/core | tsc --build | — | composite, ES2022, bundler resolution |
| packages/api-client | tsc --build | — | composite, DOM lib, refs core |
| packages/ui-components | tsc --build | react-jsx | composite, DOM lib, `**/*.tsx` include |
| apps/api | tsc (plain) | — | CommonJS, moduleResolution: node |
| apps/web | Next.js (internal) | react-jsx | handled by Next.js compiler |

**Critical**: `clean` scripts must delete `tsconfig.tsbuildinfo` alongside `dist/` or incremental builds skip emit on a clean directory.

---

## Authentication & Authorization

### Auth Flow

```
Client                      API
  │                          │
  ├─── POST /auth/login ────►│
  │                          │  bcrypt.compare(password, hash)
  │                          │  sign accessToken (15min, JWT)
  │                          │  sign refreshToken (7d, JWT)
  │                          │  store refreshToken hash in DB
  │◄── { accessToken } ─────┤  Set-Cookie: refreshToken (httpOnly)
  │
  │  Subsequent requests:
  ├─── GET /api/v1/... ─────►│  Authorization: Bearer <accessToken>
  │                          │  authenticate middleware: verify JWT
  │◄── { data } ────────────┤
  │
  │  When accessToken expires:
  ├─── POST /auth/refresh ──►│  reads refreshToken from httpOnly cookie
  │                          │  verifies + revokes old token in DB
  │                          │  issues new accessToken + refreshToken
  │◄── { accessToken } ─────┤  Set-Cookie: new refreshToken
```

### RBAC

6 roles: `Admin`, `ProjectManager`, `Superintendent`, `Foreman`, `FieldUser`, `OfficeAdmin`

Permissions matrix: 16 resources x 4 actions (create/read/update/delete) = 64 possible permissions. Default role-permission mappings defined in `packages/core/src/constants/permissions.ts`.

The `authorize` middleware factory accepts either a role name or a `{ resource, action }` permission check.

---

## Database Schema (8 models)

```
Organization ─── User ─── UserRole ─── Role ─── RolePermission ─── Permission
                  │
                  ├── RefreshToken
                  │
Project ──────────┘ (organizationId scoping)
```

All user-facing models include `organizationId` for multi-tenant isolation. Unique constraints: `Role(name, organizationId)`, `Project(number, organizationId)`.

**ORM**: Prisma 5 — schema at `apps/api/prisma/schema.prisma`, seed at `apps/api/prisma/seed.ts`.

---

## API Design

- **Base URL**: `/api/v1/`
- **Format**: JSON request/response
- **Auth**: Bearer token in `Authorization` header
- **Docs**: Swagger UI at `/docs` (fastify-swagger + fastify-swagger-ui)

### Current Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | Public | Health check |
| POST | /api/v1/auth/register | Public | Create org + admin user |
| POST | /api/v1/auth/login | Public | Issue tokens |
| POST | /api/v1/auth/refresh | Cookie | Rotate refresh token |
| POST | /api/v1/auth/logout | Bearer | Revoke refresh token |
| GET | /api/v1/auth/me | Bearer | Current user profile |
| GET | /api/v1/users/:id | Bearer | Get user by ID |
| PATCH | /api/v1/users/:id | Bearer | Update user |
| GET | /api/v1/organizations/current | Bearer | Get current org |
| PATCH | /api/v1/organizations/current | Bearer | Update current org |

---

## UI Component Library (packages/ui-components)

Built on Radix UI primitives + TailwindCSS. Pattern: thin wrapper + CVA variants + `cn()` (clsx + tailwind-merge).

**Key design choices:**
- React is a `peerDependency` — consuming app (Next.js) owns the React instance
- Tailwind is NOT a package dependency — consuming app runs Tailwind and must include `../../packages/ui-components/src/**/*.{ts,tsx}` in its `content` config
- `Button` uses Radix `Slot` for `asChild` prop — enables `<Button asChild><Link href="...">` without DOM nesting violations
- `ToastProvider` and `TooltipProvider` must be mounted at the app layout root

**26 components across 5 categories**: Form (8), Layout (5), Navigation (3), Feedback (6), Data Display (4)

---

## Local Development Infrastructure

Managed via `docker-compose.yml` at the repo root:

| Service | Port | Purpose |
|---|---|---|
| PostgreSQL 15 | 5432 | Primary database |
| MinIO | 9000 | S3-compatible file storage |
| MinIO Console | 9001 | MinIO admin UI |

---

## Key Design Decisions

| ID | Decision | Rationale |
|---|---|---|
| DD-001 | Desktop-first (90/10 split) | Construction management is office-heavy; field is secondary |
| DD-002 | pnpm + Turborepo | Efficient disk usage, build caching, great monorepo support |
| DD-004 | TypeScript everywhere | Type safety across full stack, Prisma schema to TS types |
| DD-005 | Prisma ORM | Type-safe queries, migration management, good monorepo DX |
| DD-006 | AGPL-3.0 | Ensures all improvements (including SaaS forks) stay open |
| DD-007 | Radix UI + TailwindCSS | Accessible primitives + utility CSS; avoids opinionated design system |
| DD-009 | JWT + refresh token rotation | Stateless API, secure token lifecycle, httpOnly cookie for refresh |
| DD-011 | PostgreSQL only (defer Redis) | ACID compliance, JSONB, LISTEN/NOTIFY — Redis only when scaling |

---

## Future Architecture Considerations

- **Redis**: Add only when horizontal API scaling requires shared session or pub/sub
- **WebSockets**: packages/real-time deferred; single-instance Socket.io when needed
- **WatermelonDB**: Mobile offline DB — deferred until field offline requirements are confirmed
- **GraphQL**: Possible future addition for complex dashboard queries
- **CDN**: Static assets and MinIO presigned URLs behind CDN in production
