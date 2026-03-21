# ProManage Suite

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-rgb(153,51,153).svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Version 0.1.0](https://img.shields.io/badge/version-0.1.0-lightgray)](package.json)
[![Docker](https://img.shields.io/badge/docker-required-red.svg)](https://www.docker.com/)

[![TypeScript 5.3+](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Built By: Claude.ai](https://img.shields.io/badge/Built_by-Claude_Code-orange)](https://www.claude.ai)

> Open-source construction management tools for small to mid-sized contractors

ProManage is a free, open-source platform designed to help small and mid-sized construction contractors manage their projects without being locked into expensive SaaS platforms. Built desktop-first for office personnel with a mobile companion app for field workers. The idea is to bring all tools into one suite, instead of having to utilize 10 different applications to juggle management.

## Current Status

> **Phase 4.2 Construction Documents — COMPLETE | Working toward Phase 4.3**

## Features

- **Dashboard** — Stats overview, project summaries, role-aware navigation
- **Projects** — Full project detail pages with team, scopes, settings, and dashboard metrics
- **Task Management** — Assign tasks with priority, due dates, and RBAC
- **Channel Chat** — Socket.io real-time channels with per-role permissions and file uploads
- **Messaging** — Direct messages between users + role-targeted announcements
- **Notifications** — Real-time SSE push notifications (task assignments, etc.)
- **Company Calendar** — Custom month-view calendar with event CRUD
- **Procedures** — Document workflows, safety protocols, and SOPs
- **Contact Management** — Organization-level contact directory with project associations
- **Licensing** — Organization and individual license tracking with renewal reminders and document uploads
- **Safety** — 5-tab safety hub: document library, SDS catalog, toolbox talks, safety forms, incident reports
- **Construction Documents** — Project drawing log with per-sheet version history, specification section tracking with amendment/conformed set management, user-defined disciplines

## Architecture

- **Desktop-First**: Primary interface optimized for office personnel (90% of usage)
- **Mobile Companion**: React Native app for field workers (deferred to Phase 5+)
- **API-First**: Clean backend separation enables future integrations
- **Multi-Tenant**: All data scoped by organization

## Technology Stack

| Layer | Technology |
| --- | --- |
| Web Frontend | Next.js 14, React 19, TailwindCSS, Radix UI, Zustand, TanStack Query |
| API Server | Node.js 20, Fastify, TypeScript, Prisma |
| Database | PostgreSQL 15 |
| File Storage | MinIO (local) / AWS S3 (production) |
| Auth | JWT 15min access + 7d refresh token rotation (httpOnly cookie) |
| Monorepo | pnpm workspaces + Turborepo |
| Mobile | React Native + Expo (deferred) |

---

## Quick Start

### Prerequisites

- **Node.js 20+** — use [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20`
- **pnpm 8+** — `npm install -g pnpm`
- **Docker** (v2) — for local PostgreSQL and MinIO

### 1. Install dependencies

```bash
git clone https://github.com/mattstub/ProManage.git
cd ProManage
pnpm install
```

### 2. Configure environment

```bash
# API environment (copy and edit)
cp apps/api/.env.example apps/api/.env

# Web environment
cp apps/web/.env.local.example apps/web/.env.local
```

The default `apps/api/.env` values work out of the box with the Docker services below.

### 3. Start infrastructure

```bash
docker compose up -d
```

Expected: both `promanage-postgres` and `promanage-minio` show as **healthy**.

### 4. Build shared packages

Packages must be built in order — `core` first, then the others in parallel:

```bash
pnpm --filter @promanage/core build
pnpm --filter @promanage/api-client build
pnpm --filter @promanage/ui-components build
```

### 5. Set up the database

```bash
cd apps/api
npx prisma db push
npx ts-node prisma/seed.ts
cd ../..
```

### 6. Launch dev servers

Open two terminals:

- **Terminal 1 — API server**

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd apps/api && pnpm dev
```

- **Terminal 2 — Web app**
  
```bash
source ~/.nvm/nvm.sh && nvm use 20
pnpm --filter @promanage/web dev
```

- **Local Host Routing**

| Service | URL |
| --- | --- |
| Web app | `http://localhost:3000` |
| API server | `http://localhost:3001` |
| API health check | `http://localhost:3001/health` |
| Swagger docs | `http://localhost:3001/docs` |
| MinIO console | `http://localhost:9001` |

---

## Demo Credentials

Seeded automatically by `prisma/seed.ts`:

| **Email**         | **Password**  | **Role**        |
| ----------------- | ------------- | --------------- |
| `admin@demo.com`  | password123   | Admin           |
| `pm@demo.com`     | password123   | ProjectManager  |
| `field@demo.com`  | password123   | FieldUser       |

---

## Common Dev Tasks

### Reset the database

```bash
cd apps/api
npx prisma db push --force-reset
npx ts-node prisma/seed.ts
```

> Always use `prisma db push --force-reset` for dev resets — `prisma migrate dev` requires interactive confirmation.

### Run tests

```bash
pnpm test                              # all packages via Turborepo
pnpm --filter @promanage/core test     # core unit tests only (97 tests)
pnpm --filter @promanage/api test      # API service + route tests (495 tests)
```

### Type-check the web app

```bash
pnpm --filter @promanage/web type-check
```

### Rebuild a stale package

If a package build seems stuck or wrong (stale `.tsbuildinfo`):

```bash
rm -rf packages/core/dist packages/core/tsconfig.tsbuildinfo
pnpm --filter @promanage/core build
```

---

## Project Structure

```bash
ProManage/
├── apps/
│   ├── api/                # Fastify API server (TypeScript, Prisma, JWT auth)
│   │   ├── prisma/         # Schema (40 models), seed script
│   │   └── src/
│   │       ├── routes/     # auth, calendar-events, channels, construction-documents,
│   │       │               # contacts, dashboard, licenses, messages, notifications,
│   │       │               # organizations, procedures, projects, safety, tasks, users
│   │       ├── services/   # Business logic (one file per domain)
│   │       └── middleware/ # authenticate, authorize, error-handler
│   └── web/                # Next.js 15 App Router (desktop-first)
│       └── src/
│           ├── app/        # Pages: dashboard, projects (+ detail tabs: overview,
│           │               # team, scopes, documents, settings), tasks, procedures,
│           │               # calendar, messages, channels, contacts, licenses, safety,
│           │               # organization, settings
│           ├── components/ # layout (sidebar, header, nav), dashboard, auth,
│           │               # channels (chat, thread, attachments)
│           └── hooks/      # TanStack Query hooks (one file per domain)
├── packages/
│   ├── core/               # Shared types, Zod schemas, constants, utils
│   ├── api-client/         # Typed fetch wrapper with auto-refresh on 401
│   └── ui-components/      # Radix UI + Tailwind component library (26 components)
├── docs/                   # Architecture, roadmap, context files
└── scripts/                # Development scripts
```

---

## Docker Deployment

ProManage ships with Dockerfiles for the API and web app. Docker images are published to [GitHub Container Registry](https://ghcr.io) on every merge to `main`.

### Run with docker compose

```bash
# Set required secrets
export JWT_SECRET="$(openssl rand -base64 48)"

# Optional overrides
export NEXT_PUBLIC_API_URL=https://api.yoursite.com
export CORS_ORIGINS=https://yoursite.com

# Start infrastructure, then build and run app services from source
docker compose up -d postgres minio
docker compose up -d --build api web
```

### Build images locally

```bash
# API
docker build -f apps/api/Dockerfile -t promanage-api .

# Web (NEXT_PUBLIC_API_URL is baked in at build time)
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 \
  -t promanage-web .
```

### CI / CD

- **Pull Requests** → `.github/workflows/ci.yml` — lint, type-check, test, build
- **Merge to main** → `.github/workflows/release.yml` — build + push Docker images to GHCR

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System architecture overview
- [Roadmap](docs/ROADMAP.md) — Development phases and milestones
- [Changelog](CHANGELOG.md) — Session-by-session change log

## Contributing

We welcome contributions! Please see [CONTRIBUTING](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit using [conventional commits](https://www.conventionalcommits.org/) format
4. Push the branch and open a Pull Request

## Community

- **Issues**: [GitHub Issues](https://github.com/mattstub/ProManage/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mattstub/ProManage/discussions)

## License

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-rgb(153,51,153).svg)](https://www.gnu.org/licenses/agpl-3.0)

We chose AGPL-3.0 to ensure that all improvements to ProManage remain open source. This protects the community and prevents proprietary forks that don't give back.

---

[![Built By: Claude.ai](https://img.shields.io/badge/Built_by-Claude_Code-orange)](https://www.claude.ai)

[![Human Guidance: Matt Stubenhofer](https://img.shields.io/badge/Human_Guidance-Matt_Stubenhofer-green)](https://www.mattstub.com).
