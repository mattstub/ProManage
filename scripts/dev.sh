#!/bin/bash
# ProManage — Development Environment Launcher
# Run from the repo root: bash scripts/dev.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${BLUE}→${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
header() { echo -e "\n${BOLD}$1${NC}"; }

# ── 1. nvm / Node ─────────────────────────────────────────────────────────────
header "Node.js"
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
  nvm use 20 --silent 2>/dev/null && ok "Node $(node -v)" || { fail "nvm use 20 failed"; exit 1; }
else
  fail "nvm not found at $NVM_DIR — install nvm first"; exit 1
fi

# ── 2. Docker infrastructure ──────────────────────────────────────────────────
header "Docker"
if ! docker info &>/dev/null; then
  fail "Docker daemon is not running — start Docker and try again"; exit 1
fi

info "Starting containers..."
docker compose up -d 2>&1 | grep -E "^(Container|Error)" || true

# Wait for health (up to 30s)
for i in $(seq 1 30); do
  PG_OK=$(docker inspect promanage-postgres 2>/dev/null | grep -c '"healthy"' || true)
  MN_OK=$(docker inspect promanage-minio   2>/dev/null | grep -c '"healthy"' || true)
  [ "$PG_OK" -ge 1 ] && [ "$MN_OK" -ge 1 ] && break
  [ $i -eq 30 ] && { fail "Containers didn't become healthy in 30s"; docker ps; exit 1; }
  sleep 1
done

ok "promanage-postgres (healthy)"
ok "promanage-minio    (healthy)"

# ── 3. Package builds ─────────────────────────────────────────────────────────
header "Package builds"
if [ ! -d "packages/core/dist" ]; then
  info "Building @promanage/core..."
  pnpm --filter @promanage/core build --silent && ok "@promanage/core built" || { fail "core build failed"; exit 1; }
else
  ok "@promanage/core  (dist present)"
fi

if [ ! -d "packages/api-client/dist" ]; then
  info "Building @promanage/api-client..."
  pnpm --filter @promanage/api-client build --silent && ok "@promanage/api-client built" || { fail "api-client build failed"; exit 1; }
else
  ok "@promanage/api-client (dist present)"
fi

if [ ! -d "packages/ui-components/dist" ]; then
  info "Building @promanage/ui-components..."
  pnpm --filter @promanage/ui-components build --silent && ok "@promanage/ui-components built" || { fail "ui-components build failed"; exit 1; }
else
  ok "@promanage/ui-components (dist present)"
fi

# ── 4. Env file checks ────────────────────────────────────────────────────────
header "Environment files"
[ -f "apps/api/.env" ]       && ok "apps/api/.env"       || warn "apps/api/.env missing — copy from apps/api/.env.example"
[ -f "apps/web/.env.local" ] && ok "apps/web/.env.local" || warn "apps/web/.env.local missing — add NEXT_PUBLIC_API_URL=http://localhost:3001"

# ── 5. Launch instructions ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  Infrastructure ready. Open two more terminals:${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BOLD}Terminal 2 — API server${NC}"
echo -e "  ${BLUE}cd apps/api && pnpm dev${NC}"
echo -e "  Runs on:  http://localhost:3001"
echo -e "  Swagger:  http://localhost:3001/docs"
echo ""
echo -e "  ${BOLD}Terminal 3 — Web app${NC}"
echo -e "  ${BLUE}pnpm --filter @promanage/web dev${NC}"
echo -e "  Runs on:  http://localhost:3000"
echo ""
echo -e "  ${BOLD}Seed credentials${NC}"
echo -e "  admin@demo.com / pm@demo.com / field@demo.com  →  password123"
echo ""
echo -e "  ${BOLD}Other commands${NC}"
echo -e "  ${BLUE}pnpm test${NC}               run all tests"
echo -e "  ${BLUE}bash scripts/status.sh${NC}  check health of running services"
echo ""
