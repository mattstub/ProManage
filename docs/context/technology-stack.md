# Technology Stack

## Architecture Overview

ProManage follows a monorepo architecture with separate applications for web, mobile, and API, sharing common packages for business logic and UI components.

## Frontend Technologies

### Web Application (apps/web)

**Framework**: Next.js 14+ (React 18+)
- App Router for modern routing
- Server Components for performance
- Built-in API routes for BFF pattern
- Optimized for desktop-first usage (90% of users)

**UI & Styling**:
- TailwindCSS for utility-first styling
- Radix UI for accessible components
- Framer Motion for animations
- React Hook Form for form management
- Zod for schema validation

**State Management**:
- Zustand for client state
- TanStack Query (React Query) for server state
- Context API for theme and auth

**Real-Time**:
- Socket.io client for WebSocket connections
- EventSource for SSE fallback
- Optimistic updates with React Query

### Mobile Application (apps/mobile)

**Framework**: React Native (Expo)
- Expo SDK for managed workflow
- Expo Router for file-based routing
- Optimized for field use (10% of users)

**UI & Styling**:
- React Native Paper or NativeBase
- Tailwind CSS (NativeWind)
- React Native Reanimated for animations

**Offline Capabilities**:
- WatermelonDB for local database
- NetInfo for connection status
- Background sync with queue

**Mobile-Specific Features**:
- Camera for photo capture
- Location services
- Push notifications
- Biometric authentication

## Backend Technologies

### API Server (apps/api)

**Runtime**: Node.js 20+ with TypeScript
**Framework**: Fastify or Express
- High performance
- Plugin ecosystem
- WebSocket support

**Database**:
- PostgreSQL 15+ for relational data
- Prisma ORM for type-safe queries
- Migrations with Prisma Migrate

**Caching**:
- Redis for session storage
- Query result caching
- Real-time pub/sub

**Real-Time**:
- Socket.io for WebSocket server
- Redis adapter for horizontal scaling
- Event-driven architecture

**File Storage**:
- S3-compatible storage (AWS S3, MinIO, etc.)
- Presigned URLs for uploads
- Image processing with Sharp

**Authentication & Authorization**:
- JWT for stateless auth
- Refresh token rotation
- Role-based access control (RBAC)
- OAuth 2.0 for third-party integrations

**Validation & Security**:
- Zod for runtime validation
- Helmet for security headers
- Rate limiting
- CORS configuration

## Shared Packages

### packages/core
- Business logic and domain models
- Validation schemas (Zod)
- Type definitions
- Utility functions
- Shared between web, mobile, and API

### packages/ui-components
- React component library
- Shared between web and future admin interfaces
- Storybook for component development

### packages/mobile-components
- React Native components
- Shared mobile UI patterns

### packages/api-client
- Type-safe API client
- Generated from OpenAPI spec
- Used by web and mobile apps

### packages/real-time
- WebSocket client/server logic
- Event types and handlers
- Shared real-time utilities

## Development Tools

### Monorepo Management
- **pnpm**: Fast, efficient package manager
- **Turborepo**: Build orchestration and caching
- Shared configs across workspace

### Code Quality
- **TypeScript**: Type safety across entire stack
- **ESLint**: Linting with recommended configs
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates
- **lint-staged**: Run linters on staged files

### Testing
- **Vitest**: Unit and integration testing
- **Testing Library**: Component testing
- **Playwright**: E2E testing for web
- **Detox**: E2E testing for mobile
- **Supertest**: API testing

### Build & Deployment
- **Docker**: Containerization
- **Docker Compose**: Local development
- **GitHub Actions**: CI/CD pipelines
- **Vercel**: Web app deployment (or self-hosted)
- **EAS Build**: Mobile app builds

### Monitoring & Observability
- **Sentry**: Error tracking
- **Pino**: Structured logging
- **Prometheus**: Metrics (optional)
- **Grafana**: Dashboards (optional)

## Infrastructure

### Development Environment
- Docker Compose for local services
- PostgreSQL container
- Redis container
- MinIO for local S3

### Production Considerations
- Horizontal scaling for API servers
- Database connection pooling
- CDN for static assets
- Load balancer for WebSocket connections

## Database Schema

### ORM & Migrations
- Prisma for schema definition
- Automatic migration generation
- Seeding for development data

### Key Entities
- Users & Authentication
- Projects & Organizations
- Time Tracking
- Daily Reports
- Photos & Documents
- Budget & Costs
- Schedule & Tasks

## API Design

### RESTful API
- Resource-based endpoints
- Standard HTTP methods
- JSON request/response
- OpenAPI/Swagger documentation

### GraphQL (Future Consideration)
- Could replace REST for complex queries
- Better for mobile bandwidth optimization
- Real-time subscriptions alternative

### Real-Time Events
- Socket.io namespaces for isolation
- Room-based broadcasting
- Event-driven updates

## Security Considerations

### Authentication Flow
1. Login with credentials
2. Issue JWT access token (short-lived)
3. Issue refresh token (long-lived, stored in httpOnly cookie)
4. Token rotation on refresh

### Authorization
- RBAC with roles: Admin, Project Manager, Field User, etc.
- Resource-based permissions
- Organization/project isolation

### Data Protection
- Encryption at rest (database)
- Encryption in transit (TLS/HTTPS)
- Sensitive data hashing (bcrypt for passwords)
- XSS protection
- CSRF protection
- SQL injection prevention (Prisma)

## Performance Optimization

### Frontend
- Code splitting
- Lazy loading
- Image optimization (next/image)
- Caching strategies
- Service Workers (PWA)

### Backend
- Database indexing
- Query optimization
- Connection pooling
- Caching with Redis
- CDN for static files

### Real-Time
- Room-based broadcasting (avoid global events)
- Event debouncing
- Compression for WebSocket messages

## Scalability Strategy

### Horizontal Scaling
- Stateless API servers
- Redis for shared session state
- Socket.io Redis adapter

### Database Scaling
- Read replicas for queries
- Connection pooling
- Efficient indexing

### Monitoring & Alerts
- Error tracking
- Performance monitoring
- Resource usage alerts

## Technology Decision Rationale

### Why Next.js?
- Desktop-first approach benefits from SSR/SSG
- Built-in optimization
- Large ecosystem
- Easy deployment

### Why React Native + Expo?
- Code sharing with web (React)
- Managed build process
- Over-the-air updates
- Strong mobile ecosystem

### Why PostgreSQL?
- ACID compliance
- Complex queries support
- JSON support for flexible fields
- Open source

### Why Prisma?
- Type safety
- Great DX
- Migration management
- Works well with monorepo

### Why pnpm + Turborepo?
- Efficient disk usage
- Fast installs
- Great monorepo support
- Build caching

---

**Last Updated**: 2026-02-02
**Status**: Complete
