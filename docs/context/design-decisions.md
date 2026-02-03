# Design Decisions

This document records significant architectural and technical decisions made during ProManage development, along with the context and rationale behind them.

## Decision Log Format

Each decision follows this structure:
- **Date**: When the decision was made
- **Status**: Proposed, Accepted, Deprecated, Superseded
- **Context**: The situation and forces at play
- **Decision**: What we decided to do
- **Consequences**: The results of the decision (positive and negative)

---

## DD-001: Desktop-First Architecture

**Date**: 2026-02-02
**Status**: Accepted

### Context
Construction management involves both office staff (project managers, estimators, administrators) and field staff (superintendents, foremen). Market research indicates:
- 90% of daily work happens in the office
- 10% of work happens in the field
- Field users need specific, focused functionality
- Office users need comprehensive project management tools

### Decision
Build a desktop-first web application as the primary interface, with a mobile companion app for field-specific tasks.

**Desktop (Web)**: Full-featured project management
**Mobile**: Focused on field tasks (time tracking, photos, daily reports)

### Consequences

**Positive:**
- Better user experience for majority use case (90%)
- Optimized performance for desktop workflows
- Simpler mobile app with focused scope
- Faster development by prioritizing desktop first

**Negative:**
- Mobile users have limited functionality
- Requires maintaining two codebases (mitigated by shared packages)
- Field users must use desktop for advanced features

### Alternatives Considered
- Mobile-first approach: Would compromise desktop UX for 90% of users
- Single responsive web app: Would compromise UX on both platforms
- Desktop-only: Would miss critical field use cases

---

## DD-002: Monorepo Architecture

**Date**: 2026-02-02
**Status**: Accepted

### Context
ProManage consists of multiple applications (web, mobile, API) and shared code (business logic, UI components, utilities). Need to manage dependencies, versioning, and code sharing efficiently.

### Decision
Use a monorepo with pnpm workspaces and Turborepo for build orchestration.

**Structure:**
- `apps/` for applications (web, mobile, api)
- `packages/` for shared code (core, ui-components, api-client)

### Consequences

**Positive:**
- Atomic commits across multiple packages
- Easier refactoring across boundaries
- Simplified dependency management
- Shared tooling configuration
- Build caching with Turborepo

**Negative:**
- Larger repository size
- Steeper learning curve for new contributors
- CI/CD needs monorepo awareness

### Alternatives Considered
- Polyrepo: Would create sync issues between packages
- Lerna/Nx: Turborepo chosen for simpler config and better performance

---

## DD-003: Real-Time Communication Strategy

**Date**: 2026-02-02
**Status**: Accepted

### Context
Field and office teams need real-time updates:
- Time entries submitted in field should appear immediately in office
- Daily report updates from office should notify field
- Photo uploads need instant visibility

### Decision
Use WebSocket (Socket.io) for bidirectional real-time communication, with Server-Sent Events (SSE) as fallback.

**Implementation:**
- Socket.io for primary connection
- Room-based broadcasting (per project/organization)
- Redis adapter for horizontal scaling
- Optimistic updates on client

### Consequences

**Positive:**
- Instant updates across devices
- Better user experience
- Reduced polling overhead
- Scalable with Redis adapter

**Negative:**
- Increased server complexity
- Connection management overhead
- Requires WebSocket-capable hosting

### Alternatives Considered
- Polling: High latency and server load
- SSE only: No bidirectional communication
- GraphQL Subscriptions: Added complexity

---

## DD-004: TypeScript Everywhere

**Date**: 2026-02-02
**Status**: Accepted

### Context
Large codebase with multiple developers requires type safety and better tooling.

### Decision
Use TypeScript for all code: frontend (web, mobile), backend (API), and shared packages.

### Consequences

**Positive:**
- Compile-time error detection
- Better IDE autocomplete and refactoring
- Self-documenting code
- Easier onboarding for new developers

**Negative:**
- Initial setup time
- Learning curve for TypeScript
- Slightly slower development initially

### Alternatives Considered
- JavaScript with JSDoc: Less robust type checking
- TypeScript for backend only: Would miss frontend benefits

---

## DD-005: Prisma ORM

**Date**: 2026-02-02
**Status**: Accepted

### Context
Need a robust, type-safe way to interact with PostgreSQL database.

### Decision
Use Prisma as the ORM for database access.

### Consequences

**Positive:**
- Type-safe database queries
- Excellent TypeScript integration
- Migration management
- Schema-first approach
- Great developer experience

**Negative:**
- Learning curve
- Potential performance overhead vs raw SQL
- Lock-in to Prisma ecosystem

### Alternatives Considered
- TypeORM: Less type-safe, more complex
- Kysely: More SQL-like, less feature-rich
- Raw SQL: No type safety or migration management

---

## DD-006: AGPL-3.0 License

**Date**: 2026-02-02
**Status**: Accepted

### Context
Want to build an open-source project that remains open even when used as SaaS.

### Decision
License ProManage under AGPL-3.0.

### Consequences

**Positive:**
- Network copyleft ensures SaaS deployments contribute back
- Encourages community contributions
- Protects against proprietary forks
- Builds trust with users

**Negative:**
- May deter some commercial adoption
- Requires derivative works to be open source
- More restrictive than MIT/Apache

### Alternatives Considered
- MIT/Apache: Too permissive for our goals
- GPL-3.0: Doesn't cover SaaS usage
- Business Source License: Not truly open source

---

## DD-007: Component Library Choice

**Date**: 2026-02-02
**Status**: Proposed

### Context
Need accessible, customizable UI components for web application.

### Decision
Use Radix UI primitives with TailwindCSS for styling.

### Consequences

**Positive:**
- Fully accessible (WAI-ARIA)
- Unstyled primitives (full design control)
- Works well with TailwindCSS
- Small bundle size

**Negative:**
- More setup than pre-styled libraries
- Need to build custom themes

### Alternatives Considered
- Material UI: Too opinionated, larger bundle
- Chakra UI: Good but less flexible
- shadcn/ui: Built on Radix, could be considered

---

## DD-008: Mobile Framework

**Date**: 2026-02-02
**Status**: Accepted

### Context
Need cross-platform mobile app for iOS and Android with limited development resources.

### Decision
Use React Native with Expo for mobile development.

### Consequences

**Positive:**
- Code sharing with web (React)
- Single codebase for iOS and Android
- Managed build process with EAS
- Over-the-air updates
- Large ecosystem

**Negative:**
- Performance limitations vs native
- Expo limitations (mitigated with custom dev clients)
- Bridge overhead

### Alternatives Considered
- Native (Swift/Kotlin): 2x development effort
- Flutter: Different language (Dart), no code sharing with web
- Ionic/Capacitor: Web-based, performance concerns

---

## DD-009: Authentication Strategy

**Date**: 2026-02-02
**Status**: Proposed

### Context
Need secure authentication across web and mobile platforms.

### Decision
Use JWT with refresh token rotation:
- Short-lived access tokens (15 min)
- Long-lived refresh tokens (7 days)
- httpOnly cookies for web
- Secure storage for mobile

### Consequences

**Positive:**
- Stateless authentication
- Secure token handling
- Mobile-friendly
- Standard approach

**Negative:**
- Token management complexity
- Refresh flow overhead

### Alternatives Considered
- Sessions: Requires shared state, scaling issues
- OAuth only: Would require third-party dependency

---

## DD-010: Testing Strategy

**Date**: 2026-02-02
**Status**: Proposed

### Context
Need comprehensive testing across all applications and packages.

### Decision
Multi-level testing approach:
- **Unit**: Vitest for business logic
- **Component**: Testing Library for React components
- **Integration**: Supertest for API
- **E2E**: Playwright (web), Detox (mobile)

### Consequences

**Positive:**
- Comprehensive coverage
- Fast unit tests
- Confidence in deployments
- Regression prevention

**Negative:**
- Test maintenance overhead
- Slower CI/CD pipeline
- Learning curve for contributors

### Alternatives Considered
- Jest: Vitest is faster and better DX
- Cypress: Playwright is more modern
- E2E only: Would miss unit-level issues

---

## Template for New Decisions

```markdown
## DD-XXX: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

### Context
[Describe the issue and forces at play]

### Decision
[What we decided to do]

### Consequences

**Positive:**
- [Good result]

**Negative:**
- [Trade-off or downside]

### Alternatives Considered
- [Other option]: [Why not chosen]
```

---

**Last Updated**: 2026-02-02
**Status**: Living Document
