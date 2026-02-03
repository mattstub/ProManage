# Development Environment Setup

This guide will help you set up your local development environment for ProManage.

## Prerequisites

### Required Software

**Node.js** (v20+)
```bash
# Check version
node --version

# Install via nvm (recommended)
nvm install 20
nvm use 20
```

**pnpm** (v8+)
```bash
# Install pnpm globally
npm install -g pnpm

# Check version
pnpm --version
```

**Git**
```bash
# Check version
git --version
```

**Docker & Docker Compose** (for local services)
```bash
# Check versions
docker --version
docker-compose --version
```

### Recommended Tools

- **VS Code** (or your preferred IDE)
- **PostgreSQL client** (TablePlus, pgAdmin, or psql CLI)
- **Redis client** (RedisInsight or redis-cli)
- **Postman** or **Insomnia** (API testing)

### VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "orta.vscode-jest"
  ]
}
```

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ProManage.git
cd ProManage
```

### 2. Install Dependencies

```bash
# Install all dependencies for monorepo
pnpm install
```

This will install dependencies for all apps and packages in the workspace.

### 3. Start Local Services

```bash
# Start PostgreSQL, Redis, and MinIO (S3-compatible storage)
docker-compose up -d

# Check services are running
docker-compose ps
```

**Services:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `localhost:9000` (Console: `localhost:9001`)

### 4. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Copy app-specific environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

**Edit `.env` files** with your local configuration:

```bash
# apps/api/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/promanage_dev"
REDIS_URL="redis://localhost:6379"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
JWT_SECRET="your-dev-secret-key"
```

```bash
# apps/web/.env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

### 5. Database Setup

```bash
# Navigate to API directory
cd apps/api

# Run Prisma migrations
pnpm prisma migrate dev

# Seed database with sample data (optional)
pnpm prisma db seed
```

### 6. Verify Installation

```bash
# Build all packages
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

## Running Development Servers

### All Services (Recommended)

```bash
# From root directory
pnpm dev
```

This starts:
- Web app: `http://localhost:3000`
- API server: `http://localhost:3001`
- Mobile app: Expo DevTools

### Individual Services

**Web Application:**
```bash
cd apps/web
pnpm dev
# Opens at http://localhost:3000
```

**API Server:**
```bash
cd apps/api
pnpm dev
# Running on http://localhost:3001
```

**Mobile Application:**
```bash
cd apps/mobile
pnpm start
# Opens Expo DevTools
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

## Database Management

### Prisma Studio (Database GUI)

```bash
cd apps/api
pnpm prisma studio
# Opens at http://localhost:5555
```

### Creating Migrations

```bash
cd apps/api

# Create a new migration
pnpm prisma migrate dev --name add_user_fields

# Reset database (WARNING: Deletes all data)
pnpm prisma migrate reset
```

### Updating Schema

1. Edit `apps/api/prisma/schema.prisma`
2. Run `pnpm prisma migrate dev`
3. Prisma will generate migration files and update client

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### pnpm Install Failures

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Type Errors After Package Changes

```bash
# Rebuild all packages
pnpm build

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

### Prisma Client Out of Sync

```bash
cd apps/api

# Regenerate Prisma Client
pnpm prisma generate
```

## Development Workflow

### Typical Day

1. **Pull latest changes**
   ```bash
   git pull origin main
   pnpm install  # Update dependencies if needed
   ```

2. **Start services**
   ```bash
   docker-compose up -d  # Start databases
   pnpm dev              # Start all dev servers
   ```

3. **Make changes**
   - Edit code
   - Save (auto-reload in dev mode)
   - Test in browser/simulator

4. **Before committing**
   ```bash
   pnpm typecheck  # Type checking
   pnpm lint       # Linting
   pnpm test       # Run tests
   ```

### Adding New Package

```bash
# Add to specific workspace
pnpm --filter @promanage/web add <package>

# Add to all workspaces
pnpm -r add <package>

# Add as dev dependency
pnpm --filter @promanage/web add -D <package>
```

### Updating Dependencies

```bash
# Check for outdated packages
pnpm outdated

# Update all dependencies
pnpm update

# Update specific package
pnpm update <package>
```

## IDE Setup

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/apps/api",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Web",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/apps/web"
    }
  ]
}
```

## Docker Setup

### Local Docker Compose

The `docker-compose.yml` file in the root provides:

```yaml
services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: promanage_dev

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
```

### Useful Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart postgres

# Remove all data (WARNING: Destructive)
docker-compose down -v
```

## Testing Setup

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

See [testing.md](testing.md) for detailed testing guide.

## Mobile Development Setup

For iOS and Android development setup, see [mobile-setup.md](mobile-setup.md).

## Next Steps

- Read [coding-standards.md](coding-standards.md) for code style guidelines
- Read [git-workflow.md](git-workflow.md) for Git best practices
- Explore the codebase structure in [/docs/ARCHITECTURE.md](/docs/ARCHITECTURE.md)

## Getting Help

- Check existing [GitHub Issues](https://github.com/yourusername/ProManage/issues)
- Join our [Discord community](#) (if applicable)
- Read the [CONTRIBUTING.md](/CONTRIBUTING.md) guide

---

**Last Updated**: 2026-02-02
