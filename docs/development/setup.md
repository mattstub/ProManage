# Development Environment Setup

This guide will help you set up your local development environment for ProManage.

## Prerequisites

### Required Software

- **Node.js** (v20+)

```bash
# Check version
node --version

# Install via nvm (recommended)
nvm install 20
nvm use 20
```

- **pnpm** (v8+)

```bash
# Install pnpm globally
npm install -g pnpm

# Check version
pnpm --version
```

- **Git**

```bash
# Check version
git --version
```

- **Docker** (v2) — for local PostgreSQL and MinIO

```bash
docker --version
docker compose version   # must be v2 (note: no hyphen)
```

> **WSL users**: Run all commands directly in WSL — do not prefix with `wsl -d Ubuntu -e bash -c`. The `nvm` environment must be sourced each shell: `source ~/.nvm/nvm.sh && nvm use 20`.

### Recommended Tools

- **VS Code** (or your preferred IDE)
- **PostgreSQL client** (TablePlus, pgAdmin, or psql CLI)
- **Postman** or **Insomnia** (API testing — or use `http://localhost:3001/docs` Swagger UI)

### VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "vitest.explorer"
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
# Start PostgreSQL and MinIO
docker compose up -d

# Verify both are healthy
docker compose ps
```

Expected: `promanage-postgres` and `promanage-minio` both show as **healthy**.

- **Services:**
  - PostgreSQL: `localhost:5432`
  - MinIO: `localhost:9000` (Console: `localhost:9001`)

### 4. Environment Configuration

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

The default values work out of the box with the Docker services. Key variables to know:

```bash
# apps/api/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/promanage"
JWT_SECRET="dev-secret-change-in-production"
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=promanage
```

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5. Database Setup

```bash
cd apps/api

# Apply schema (no interactive prompts)
npx prisma db push

# Seed with demo data (org, 6 roles, 3 users, projects, safety data, etc.)
npx ts-node prisma/seed.ts
```

> Always use `prisma db push` for dev — `prisma migrate dev` requires interactive confirmation and fails non-interactively.

**Reset database:**

```bash
npx prisma db push --force-reset && npx ts-node prisma/seed.ts
```

### 6. Build Shared Packages

Packages must be built before running the app (build order matters — core first):

```bash
pnpm --filter @promanage/core build
pnpm --filter @promanage/api-client build
pnpm --filter @promanage/ui-components build
```

### 7. Verify Installation

```bash
pnpm turbo lint
pnpm turbo type-check
pnpm test
```

## Running Development Servers

Open two terminals:

**Terminal 1 — API server:**

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd apps/api && pnpm dev
# Runs on http://localhost:3001
```

**Terminal 2 — Web app:**

```bash
source ~/.nvm/nvm.sh && nvm use 20
pnpm --filter @promanage/web dev
# Runs on http://localhost:3000
```

> **Note**: `git push` hangs in some WSL contexts — always push from your own terminal, not from a script.

## Database Management

### Prisma Studio (Database GUI)

```bash
cd apps/api
pnpm prisma studio
# Opens at http://localhost:5555
```

### Applying Schema Changes

```bash
cd apps/api

# Apply schema changes (dev)
npx prisma db push

# Reset and re-seed (WARNING: deletes all data)
npx prisma db push --force-reset && npx ts-node prisma/seed.ts
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
- Read the [CONTRIBUTING.md](/CONTRIBUTING.md) guide

---

**Last Updated**: 2026-03-19
