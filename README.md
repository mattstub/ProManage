# ProManage Suite

> Open-source construction management tools for small contractors

ProManage is a free, open-source platform designed to help small construction contractors manage their projects without being locked into expensive SaaS platforms. Built desktop-first for office personnel with a mobile companion app for field workers.

## Current Status

> **Phase 1 (Foundation) — In Progress**
>
> Sub-phases A–F complete (~120 source files). The API server and shared packages are fully built. The web application shell (Sub-phase G) is next.
>
> | Sub-phase | Component | Status |
> |---|---|---|
> | A | Root Tooling (monorepo, tsconfig, ESLint, Prettier, Docker) | ✅ Complete |
> | B | packages/core (types, schemas, constants, utils) | ✅ Complete |
> | C | Database (Prisma schema, Docker PostgreSQL, seed data) | ✅ Complete |
> | D | apps/api (Fastify API server, auth, RBAC, Swagger) | ✅ Complete |
> | E | packages/api-client (typed fetch wrapper, auto-refresh) | ✅ Complete |
> | F | packages/ui-components (Radix + Tailwind, 26 components) | ✅ Complete |
> | G | apps/web (Next.js 14 App Router shell) | ⏳ Not Started |

## Features

- **Project Management** — Organize jobs, tasks, and timelines
- **Request for Information (RFI)** — Track and manage RFIs
- **Change Proposal Requests (CPR)** — Handle change orders efficiently
- **Permit & Inspection Management** — Track permits and inspections
- **Submittal Tools** — Manage submittals and product specifications
- **Daily Reports & Time Tracking** — Field-to-office workflow
- **Scheduling & Equipment** — Resource and equipment management

## Architecture

- **Desktop-First**: Primary interface optimized for office personnel (90% of usage)
- **Mobile Companion**: React Native app for field workers (status updates, photos)
- **API-First**: Clean backend separation enables future integrations
- **Multi-Tenant**: All data scoped by organization

## Technology Stack

| Layer | Technology |
|---|---|
| Web Frontend | Next.js 14, React 18, TailwindCSS, Radix UI, Zustand, TanStack Query |
| API Server | Node.js 20, Fastify, TypeScript, Prisma |
| Database | PostgreSQL 15 |
| File Storage | MinIO (local) / AWS S3 (production) |
| Auth | JWT 15min access + 7d refresh token rotation (httpOnly cookie) |
| Monorepo | pnpm workspaces + Turborepo |
| Mobile | React Native + Expo (deferred) |

## Quick Start

### Prerequisites

- **Node.js 20+** — use [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20`
- **pnpm 8+** — `npm install -g pnpm`
- **Docker & Docker Compose** — for local PostgreSQL and MinIO

### Installation

```bash
# Clone the repository
git clone https://github.com/mattstub/ProManage.git
cd ProManage

# Install dependencies
pnpm install

# Start local services (PostgreSQL + MinIO)
docker-compose up -d

# Configure the API environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database credentials

# Seed the database
cd apps/api && npx ts-node prisma/seed.ts && cd ../..

# Start the API server
pnpm --filter api dev
```

Once running, visit:
- API health check: http://localhost:3001/health
- Swagger docs: http://localhost:3001/docs

### Demo Credentials (after seeding)

| Email | Password | Role |
|---|---|---|
| admin@demo.com | password123 | Admin |
| pm@demo.com | password123 | ProjectManager |
| field@demo.com | password123 | FieldUser |

## Project Structure

```
ProManage/
├── apps/
│   ├── api/                # Fastify API server (TypeScript, Prisma, JWT auth)
│   ├── web/                # Next.js web application (desktop-first)
│   └── mobile/             # React Native mobile app (deferred)
├── packages/
│   ├── core/               # Shared types, Zod schemas, constants, utils
│   ├── ui-components/      # Radix UI + Tailwind component library
│   ├── api-client/         # Typed fetch wrapper with auto-refresh
│   ├── mobile-components/  # Mobile UI components (deferred)
│   └── real-time/          # WebSocket/SSE client (deferred)
├── docs/                   # Documentation
└── scripts/                # Development scripts
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System architecture overview
- [Roadmap](docs/ROADMAP.md) — Development phases and milestones
- [Technology Stack](docs/context/technology-stack.md) — Stack decisions and rationale
- [Design System](docs/context/design-system.md) — Component and style guidelines
- [Contributing](CONTRIBUTING.md) — How to contribute
- [Changelog](CHANGELOG.md) — Version history

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes following [conventional commits](https://www.conventionalcommits.org/) format
4. Push to the branch and open a Pull Request

## Community

- **Issues**: [GitHub Issues](https://github.com/mattstub/ProManage/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mattstub/ProManage/discussions)

## License

AGPL-3.0 — see [LICENSE](LICENSE) for details.

We chose AGPL-3.0 to ensure that all improvements to ProManage remain open source, even when deployed as a SaaS application. This protects the community and prevents proprietary forks that don't give back.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Report a Bug](https://github.com/mattstub/ProManage/issues/new?template=bug_report.md)
- 💡 [Request a Feature](https://github.com/mattstub/ProManage/issues/new?template=feature_request.md)
- ❓ [Ask a Question](https://github.com/mattstub/ProManage/issues/new?template=question.md)

---

Built for small contractors by the construction community.
Built with [Claude](https://www.claude.ai).
