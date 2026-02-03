# Session Context — Quick Reference

**Purpose**: Single file to read at the start of each session. Summarizes project state, key decisions, and file locations so we don't re-read all documentation every time.

**Last Updated**: 2026-02-03

---

## Project Summary

**ProManage** is an open-source (AGPL-3.0) construction management platform for general contractors. Desktop-first web app (90% office use) with a mobile companion (10% field use).

- **Repo**: https://github.com/mattstub/ProManage
- **Author**: Matt Stubenhofer
- **Version**: 0.1.0

---

## Tech Stack (Simplified)

| Layer | Technology |
|---|---|
| Web frontend | Next.js 14+, React 18+, TailwindCSS, Radix UI, Zustand, TanStack Query |
| Mobile | React Native + Expo, NativeWind, React Query persistence + AsyncStorage |
| API server | Node.js 20+, Fastify, TypeScript |
| Database | **PostgreSQL 15+ (single database)** — Prisma ORM |
| File storage | S3-compatible (MinIO local, AWS S3 prod) |
| Real-time | Socket.io (single-instance), PostgreSQL LISTEN/NOTIFY |
| Auth | JWT with refresh token rotation |
| Monorepo | pnpm workspaces + Turborepo |

**Deferred** (add when scaling demands): Redis, WatermelonDB

---

## Key Decisions

| ID | Decision | Status |
|---|---|---|
| DD-001 | Desktop-first architecture (90/10 split) | Accepted |
| DD-002 | Monorepo with pnpm + Turborepo | Accepted |
| DD-003 | WebSocket (Socket.io) for real-time | Accepted |
| DD-004 | TypeScript everywhere | Accepted |
| DD-005 | Prisma ORM | Accepted |
| DD-006 | AGPL-3.0 license | Accepted |
| DD-007 | Radix UI + TailwindCSS | Proposed |
| DD-008 | React Native + Expo for mobile | Accepted |
| DD-009 | JWT + refresh token rotation | Proposed |
| DD-010 | Multi-level testing (Vitest, Playwright, etc.) | Proposed |
| DD-011 | PostgreSQL as single DB, defer Redis/WatermelonDB | Accepted |

Full details: [design-decisions.md](design-decisions.md)

---

## Directory Map

```
ProManage/
├── apps/
│   ├── api/          # Fastify API server (src/ empty — ready for implementation)
│   ├── web/          # Next.js web app (src/ empty)
│   └── mobile/       # React Native/Expo (src/ empty)
├── packages/
│   ├── core/         # Business logic, types, validation (Zod)
│   ├── ui-components/  # React component library
│   ├── mobile-components/  # React Native components
│   ├── api-client/   # Type-safe API client
│   └── real-time/    # WebSocket utilities
├── docs/
│   ├── context/      # Strategic docs (this file, vision, tech stack, decisions)
│   ├── development/  # Dev guides (setup, standards, testing, git, API, mobile)
│   ├── guides/       # User guides (planned)
│   └── tools/        # Tool docs
├── config/           # .env templates (base, dev, prod)
├── scripts/          # setup.sh, validate-env.sh, dev.sh
└── .github/          # Issue/PR templates, security policy
```

---

## Key Files by Topic

**Start here**: This file + [ROADMAP.md](../ROADMAP.md)

**Architecture & strategy**:
- [technology-stack.md](technology-stack.md) — full tech details
- [design-decisions.md](design-decisions.md) — all DD records
- [design-system.md](design-system.md) — colors, typography, UI principles
- [project-vision.md](project-vision.md) — vision (template, needs user input)
- [field-office-workflows.md](field-office-workflows.md) — workflows (template, needs user input)

**Development guides**:
- [setup.md](../development/setup.md) — environment setup
- [coding-standards.md](../development/coding-standards.md) — code style
- [testing.md](../development/testing.md) — testing strategy
- [api-design.md](../development/api-design.md) — API conventions
- [git-workflow.md](../development/git-workflow.md) — branching, commits

**Implementation**:
- [implementation-progress.md](implementation-progress.md) — detailed progress log
- Database schema: `apps/api/prisma/schema.prisma` (to be created)
- API routes: `apps/api/src/` (to be created)
- Web pages: `apps/web/src/` (to be created)

---

## Current State (2026-02-03)

- **Foundation**: Complete (42 files — docs, config, scripts, templates)
- **Code**: Not started — all `src/` directories empty
- **Database**: Schema not yet created
- **Next step**: User is writing ROADMAP.md with feature priorities, then we begin Prisma schema design

---

## Session Log

### Session 1 — 2026-02-02
- Created 42 foundation files (docs, config, scripts, templates)
- Established monorepo structure, coding standards, dev guides

### Session 2 — 2026-02-03
- Simplified database strategy: PostgreSQL only, defer Redis/WatermelonDB (DD-011)
- Updated technology-stack.md, design-decisions.md, implementation-progress.md
- Created this session-context.md for quick reference
- User writing ROADMAP.md — next step is schema design
