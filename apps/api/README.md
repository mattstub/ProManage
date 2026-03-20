# apps/api — ProManage API Server

Fastify + Prisma + PostgreSQL backend. All data is multi-tenant, scoped by `organizationId`.

- **Port**: `http://localhost:3001`
- **Swagger docs**: `http://localhost:3001/docs`
- **Health check**: `GET /health`

---

## Dev Setup

```bash
# From repo root
source ~/.nvm/nvm.sh && nvm use 20
cd apps/api && pnpm dev
```

> Full environment setup: [docs/development/setup.md](../../docs/development/setup.md)

---

## Environment Variables

Copy `.env.example` to `.env`. Key variables:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (required in production) |
| `MINIO_ENDPOINT` | MinIO host (default: `localhost`) |
| `MINIO_PORT` | MinIO port (default: `9000`) |
| `MINIO_ACCESS_KEY` | MinIO access key (default: `minioadmin`) |
| `MINIO_SECRET_KEY` | MinIO secret key (default: `minioadmin`) |
| `SENTRY_DSN` | Optional — Sentry error tracking |

> Note: The MinIO bucket name is defined in `@promanage/core` as `MINIO_BUCKET_NAME` (currently `promanage-attachments`) and is not configurable via an environment variable.
---

## API Routes

All routes are prefixed `/api/v1/`.

| Group | Routes | Auth |
| --- | --- | --- |
| `auth` | POST login, register, refresh, logout | Public (login/register/logout), JWT (refresh) |
| `users` | GET/PATCH profile, GET list | Authenticated |
| `organizations` | GET/PATCH org | Authenticated |
| `projects` | CRUD + dashboard, team, scopes, settings (18 routes) | RBAC — see route file |
| `dashboard` | GET stats | Authenticated |
| `tasks` | CRUD | RBAC |
| `procedures` | CRUD | RBAC |
| `calendar-events` | CRUD | RBAC |
| `notifications` | GET list, mark-read, SSE stream | Authenticated |
| `messages` | DMs + announcements CRUD | RBAC |
| `channels` | Channel CRUD + members + Socket.io | RBAC |
| `contacts` | CRUD + project associations | RBAC |
| `licenses` | CRUD + documents + reminders | RBAC |
| `safety` | Documents, SDS, toolbox talks, forms, incidents (23 routes) | RBAC |

RBAC write roles by default: `Admin`, `ProjectManager`, `OfficeAdmin`. Route files document exceptions.

---

## Database

34 Prisma models. Schema: `prisma/schema.prisma`.

```bash
# Reset and re-seed (dev only)
cd apps/api
npx prisma db push --force-reset
npx ts-node prisma/seed.ts
```

> Always use `prisma db push --force-reset` for dev resets — `prisma migrate dev` requires interactive confirmation.

---

## Scripts

```bash
pnpm dev          # tsx watch dev server (auto-loads .env)
pnpm build        # tsc compile to dist/
pnpm lint         # ESLint
pnpm type-check   # TypeScript check
pnpm test         # Vitest (463 tests)
```

---

## Further Reading

- [Setup Guide](../../docs/development/setup.md)
- [API Design Conventions](../../docs/development/api-design.md)
- [Testing Guide](../../docs/development/testing.md)
- [Coding Standards](../../docs/development/coding-standards.md)

## License

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-rgb(153,51,153).svg)](https://www.gnu.org/licenses/agpl-3.0)

We chose [AGPL-3.0](../../LICENSE) to ensure that all improvements to ProManage remain open source. This protects the community and prevents proprietary forks that don't give back.
