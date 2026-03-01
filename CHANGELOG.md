# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — Phase 1: Foundation & Core Infrastructure (Session 3, 2026-02-28)

**Sub-phase A — Root Tooling**
- `tsconfig.base.json` — shared TypeScript base config (ES2022, bundler resolution, path aliases for all `@promanage/*` packages)
- `.prettierrc` / `.prettierignore` — code formatting (no semis, single quotes, 2-space indent)
- `.eslintrc.json` / `.eslintignore` — linting with `@typescript-eslint` and `eslint-plugin-import` with enforced import order
- Updated root `package.json` with TypeScript/ESLint/Prettier devDependencies
- Updated `docker-compose.yml` — PostgreSQL 15 (port 5432) + MinIO (ports 9000/9001) with healthchecks

**Sub-phase B — `packages/core` (24 files)**
- Shared TypeScript types: `ApiResponse<T>`, `PaginationMeta`, `User`, `UserWithRoles`, `Organization`, `Project`, `RoleName`, `TokenPayload`, `AuthResponse`
- Zod validation schemas: `loginSchema`, `registerSchema`, `createProjectSchema`, `updateProjectSchema`
- Constants: `RESOURCES` (16), `ACTIONS` (4), `DEFAULT_ROLE_PERMISSIONS` (full mapping per role), `USER_ROLES`, `ERROR_CODES` (13), `HTTP_STATUS`
- Utilities: `parsePagination`, `buildPaginationMeta`, `formatDate`, `formatCurrency`, `formatCurrencyCompact`
- Package exports configured for `./types`, `./schemas`, `./constants`, `./utils`

**Sub-phase C — Database Layer**
- `apps/api/prisma/schema.prisma` — 8 models: `Organization`, `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `RefreshToken`, `Project`
- Multi-tenant design: all data scoped to `organizationId`; `@@unique([name, organizationId])` on Role, `@@unique([number, organizationId])` on Project
- `apps/api/prisma/seed.ts` — 64 permissions (16 resources × 4 actions), demo org, 6 system roles with permission assignments, 3 seed users, 2 sample projects
- `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/.env`
- Docker containers running; database migrated and seeded via `prisma db push`

**Sub-phase D — Fastify API Server (~30 files)**
- Config: `src/config/env.ts` (Zod env validation), `src/config/index.ts`
- Lib: `AppError` class hierarchy (NotFound, Unauthorized, Forbidden, Validation, Conflict), response helpers (`success`, `created`, `paginated`, `noContent`), Pino logger
- Types: `src/types/fastify.d.ts` — augments `FastifyInstance` with `prisma`, `FastifyRequest` with `user`
- Plugins: Prisma plugin (connect/disconnect lifecycle), Swagger/OpenAPI 3.0 (docs at `/docs`)
- Middleware: `authenticate` (JWT preHandler), `authorize` (role + permission factory functions), `error-handler` (AppError, ZodError, Prisma errors)
- Services: `password.service` (bcrypt), `token.service` (JWT sign + crypto refresh tokens), `auth.service` (register, login, refresh, logout, getMe), `user.service` (list/get/update/deactivate), `organization.service`
- Routes: `GET /health`, auth CRUD at `/api/v1/auth/*`, users at `/api/v1/users/:id`, org at `/api/v1/organizations/current`
- Auth pattern: JWT access token (15 min) + refresh token (7 days, httpOnly cookie, rotation on refresh)
- `src/app.ts` (Fastify builder) + `src/server.ts` (entry point)

**Infrastructure**
- Node.js 20.20.0 + pnpm 8.15.9 installed in WSL via nvm
- Docker Engine installed and running in WSL
- API server verified operational on `http://localhost:3001`
- Seeded login `admin@demo.com` / `password123` verified returning JWT

### Added — Earlier Sessions (Foundation, Sessions 1–2)
- Initial project structure and monorepo setup
- Core documentation (README, CONTRIBUTING, CODE_OF_CONDUCT)
- Development environment configuration files (42 files total)
- Workspace configuration for pnpm monorepo + Turborepo pipeline
- Full docs: context/, development/, config/ templates, scripts/, .github/ templates

### Changed
- Database strategy simplified: PostgreSQL as single database, Redis and WatermelonDB deferred (DD-011)
- Updated technology-stack.md and design-decisions.md to reflect DD-011

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

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

[unreleased]: https://github.com/mattstub/ProManage/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/mattstub/ProManage/releases/tag/v0.0.1
