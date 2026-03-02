# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Phase 1 Sub-phase F (Session 5, 2026-03-01)

**Sub-phase F - packages/ui-components (30 files)**
- 26 React components built with Radix UI primitives + TailwindCSS utility classes
- Form: Button (CVA variants + asChild for Link composition), Input, Textarea, Label, Checkbox, RadioGroup/RadioGroupItem, Switch, Select (+Group/Value/Trigger/Content/Item/Label/Separator)
- Layout: Card (+Header/Title/Description/Content/Footer), Container (maxWidth CVA), Stack (direction/gap/align/justify), Grid (cols/gap), Separator
- Navigation: Tabs (+List/Trigger/Content), Breadcrumbs (accessible nav with aria-current), Pagination (ellipsis logic, imports Button)
- Feedback: Alert (info/success/warning/error variants), Toast (+Provider/Viewport/Title/Description/Action/Close), Dialog (+Trigger/Close/Overlay/Content/Header/Title/Description), Tooltip (+Provider/Trigger/Content), Progress (Radix + translateX indicator), Skeleton
- Data Display: Table (+Header/Body/Row/Head/Cell/Caption), Badge (6 variants), Avatar (+Image/Fallback, size CVA), StatusIndicator (status + size CVA)
- Utils: cn() combining clsx + tailwind-merge for safe class composition
- Build: tsc --build (composite:true, jsx:react-jsx), zero errors; React as peerDependency; Tailwind NOT bundled (consuming app scans src paths)
- All components: forwardRef where applicable, displayName set, consistent import order

### Added - Phase 1 Sub-phase E (Session 4, 2026-03-01)

**Sub-phase E - packages/api-client (10 files)**
- ProManageClient: typed fetch wrapper, JWT access token in memory, credentials: include for httpOnly cookie
- Auto-refresh on 401: calls /auth/refresh and retries once before calling onAuthError
- createApiClient() factory composing all resource namespaces into a single ApiClient interface
- AuthResource: register, login, refresh, logout, me (sets/clears token automatically)
- UsersResource: list (paginated + meta), get, update, deactivate
- OrganizationsResource: getCurrent, updateCurrent
- HealthResource: connectivity ping
- ApiClientError: typed error with status, code, isUnauthorized/isForbidden/isNotFound/isConflict helpers
- TypeScript project references: packages/core upgraded to composite:true, both packages use tsc --build
- Updated clean scripts to remove tsconfig.tsbuildinfo alongside dist/
- Removed .claude/settings.local.json from git; added to .gitignore
- Added *.tsbuildinfo pattern to root .gitignore

### Added - Phase 1 Foundation (Session 3, 2026-02-28)

**Sub-phase A - Root Tooling**
- tsconfig.base.json, .prettierrc/.prettierignore, .eslintrc.json/.eslintignore, docker-compose.yml, root package.json devDeps

**Sub-phase B - packages/core (24 files)**
- Types: ApiResponse, PaginationMeta, User, UserWithRoles, Organization, Project, RoleName, TokenPayload, AuthResponse
- Zod schemas: loginSchema, registerSchema, createProjectSchema, updateProjectSchema
- Constants: RESOURCES (16), ACTIONS (4), DEFAULT_ROLE_PERMISSIONS, USER_ROLES, ERROR_CODES (13), HTTP_STATUS
- Utils: parsePagination, buildPaginationMeta, formatDate, formatCurrency, formatCurrencyCompact

**Sub-phase C - Database Layer**
- schema.prisma: 8 models (Organization, User, Role, Permission, RolePermission, UserRole, RefreshToken, Project)
- seed.ts: 64 permissions, 6 roles, demo org, 3 users, 2 projects
- Docker PostgreSQL 15 + MinIO running; DB pushed and seeded

**Sub-phase D - Fastify API Server (~30 files)**
- Config, lib (AppError hierarchy, response helpers, Pino logger), Fastify type augmentation
- Plugins: Prisma, Swagger/OpenAPI
- Middleware: authenticate, authorize (role+permission factories), error-handler
- Services: password, token, auth, user, organization
- Routes: /health, /api/v1/auth/*, /api/v1/users/:id, /api/v1/organizations/current
- Auth: JWT 15min access + 7d refresh token (httpOnly cookie, rotation)
- Verified: health check + login returning JWT working

**Infrastructure**
- Node.js 20.20.0 + pnpm 8.15.9 via nvm in WSL
- Docker Engine in WSL; PostgreSQL on :5432, MinIO on :9000

### Added - Foundation (Sessions 1-2)
- 42 foundation files: docs, config, scripts, GitHub templates
- pnpm workspaces + Turborepo pipeline configuration

### Changed
- Database strategy: PostgreSQL only, Redis and WatermelonDB deferred (DD-011)
- Updated technology-stack.md and design-decisions.md

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

- Added for new features
- Changed for changes in existing functionality
- Deprecated for soon-to-be removed features
- Removed for now removed features
- Fixed for any bug fixes
- Security in case of vulnerabilities

[unreleased]: https://github.com/mattstub/ProManage/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/mattstub/ProManage/releases/tag/v0.0.1
