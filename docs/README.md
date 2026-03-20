# ProManage Documentation

Technical and contextual documentation for the ProManage construction management platform.

## Documentation Structure

```bash
docs/
├── context/              # Strategic context and decisions
├── development/          # Developer guides
├── guides/               # End-user guides (in progress)
├── tools/                # Tool-specific docs
├── ARCHITECTURE.md       # System architecture overview
├── ROADMAP.md            # Development phases and milestones
└── README.md             # This file
```

## For Developers

### Getting Started

| Guide | Description |
| --- | --- |
| [development/setup.md](development/setup.md) | Local environment setup — Node, Docker, DB, dev servers |
| [development/coding-standards.md](development/coding-standards.md) | TypeScript, React, naming, import order, formatting |
| [development/testing.md](development/testing.md) | Vitest patterns, mock-prisma, route test helpers |
| [development/api-design.md](development/api-design.md) | REST conventions, response format, RBAC patterns |
| [development/git-workflow.md](development/git-workflow.md) | Branch naming, commit format, PR workflow |

### Architecture & Context

| Document | Description |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, data flow, multi-tenancy model |
| [ROADMAP.md](ROADMAP.md) | Phase-by-phase feature roadmap with completion status |
| [context/session-context.md](context/session-context.md) | Current implementation state — read at session start |

## Writing Guidelines

- Use Markdown for all documentation
- Be concise — link out rather than duplicating content
- Use relative links for internal references
- Keep docs current — doc updates ship in the same commit as code changes

### File Naming

- Lowercase with hyphens: `api-design.md`
- Grouped by audience in subdirectories

---

**Last Updated**: 2026-03-19
