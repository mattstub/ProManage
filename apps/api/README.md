# ProManage API Server

Backend API server built with Node.js, providing RESTful endpoints and WebSocket support.

## Overview

The ProManage API server handles all backend operations including authentication, data management, file storage, and real-time communication between field and office applications.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Caching**: Redis
- **File Storage**: S3-compatible (AWS S3, MinIO)
- **Real-Time**: Socket.io
- **Validation**: Zod
- **Authentication**: JWT with refresh tokens

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+
- S3-compatible storage (MinIO for local dev)

### Installation

```bash
# From project root
cd apps/api

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start Docker services (PostgreSQL, Redis, MinIO)
docker-compose up -d

# Run database migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm prisma db seed

# Start development server
pnpm dev
```

API runs at [http://localhost:3001](http://localhost:3001)
API Docs at [http://localhost:3001/docs](http://localhost:3001/docs)

## Development

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server with hot reload
pnpm build        # Build for production
pnpm start        # Start production server

# Database
pnpm prisma:migrate      # Run migrations
pnpm prisma:generate     # Generate Prisma Client
pnpm prisma:studio       # Open Prisma Studio
pnpm prisma:seed         # Seed database

# Testing & Quality
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript checking
pnpm test         # Run tests
pnpm test:coverage # Run tests with coverage
```

### Environment Variables

See `.env.example` for all required environment variables.

Critical variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for signing JWTs
- `S3_*` - S3 storage configuration

## Project Structure

```
apps/api/
├── src/
│   ├── routes/            # API route handlers
│   │   ├── auth/         # Authentication endpoints
│   │   ├── projects/     # Project endpoints
│   │   ├── time-entries/ # Time tracking
│   │   └── ...
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   ├── lib/              # Utilities and helpers
│   ├── types/            # TypeScript types
│   └── server.ts         # Main server file
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration files
│   └── seed.ts          # Seed data
└── tests/                # Test files
```

## API Endpoints

### Authentication

```
POST   /api/v1/auth/login       # Login
POST   /api/v1/auth/register    # Register
POST   /api/v1/auth/refresh     # Refresh token
POST   /api/v1/auth/logout      # Logout
```

### Projects

```
GET    /api/v1/projects         # List projects
POST   /api/v1/projects         # Create project
GET    /api/v1/projects/:id     # Get project
PUT    /api/v1/projects/:id     # Update project
DELETE /api/v1/projects/:id     # Delete project
```

### Time Entries

```
GET    /api/v1/time-entries     # List time entries
POST   /api/v1/time-entries     # Create time entry
GET    /api/v1/time-entries/:id # Get time entry
PUT    /api/v1/time-entries/:id # Update time entry
DELETE /api/v1/time-entries/:id # Delete time entry
```

See [API Documentation](http://localhost:3001/docs) for full endpoint reference.

## Database

### Migrations

```bash
# Create new migration
pnpm prisma migrate dev --name migration_name

# Apply migrations
pnpm prisma migrate deploy

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
```

### Prisma Studio

```bash
# Open database GUI
pnpm prisma studio
# Visit http://localhost:5555
```

## Real-Time (WebSocket)

### Socket.io Events

**Connection:**
```typescript
socket.emit('join:project', { projectId: '123' })
socket.emit('leave:project', { projectId: '123' })
```

**Events:**
- `project:updated`
- `time-entry:created`
- `daily-report:submitted`

See [docs/development/api-design.md](../../docs/development/api-design.md) for details.

## Testing

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

## Security

### Best Practices

- All passwords hashed with bcrypt
- JWT tokens with short expiration
- Refresh token rotation
- Rate limiting enabled
- CORS properly configured
- Input validation with Zod
- SQL injection prevented by Prisma
- XSS prevention
- Helmet security headers

## Deployment

### Production Build

```bash
# Build
pnpm build

# Start
pnpm start
```

### Docker

```bash
# Build image
docker build -t promanage-api .

# Run container
docker run -p 3001:3001 promanage-api
```

### Environment Setup

Ensure all production environment variables are set. See [config/production.env.example](../../config/production.env.example).

## Monitoring

### Health Check

```
GET /health
```

Returns server status and database connectivity.

### Metrics

- Request logs via Pino
- Error tracking via Sentry (optional)
- Performance monitoring

## Documentation

- [Setup Guide](../../docs/development/setup.md)
- [API Design Guide](../../docs/development/api-design.md)
- [Testing Guide](../../docs/development/testing.md)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

AGPL-3.0 - See [LICENSE](../../LICENSE)
