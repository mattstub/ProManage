#!/bin/bash
# ProManage — Service Status Check
# Run from the repo root: bash scripts/status.sh

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
header() { echo -e "\n${BOLD}$1${NC}"; }

ISSUES=0

# ── Docker containers ─────────────────────────────────────────────────────────
header "Docker containers"
for name in promanage-postgres promanage-minio; do
  STATUS=$(docker inspect "$name" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['State']['Health']['Status'])" 2>/dev/null || echo "not found")
  if [ "$STATUS" = "healthy" ]; then
    ok "$name  ($STATUS)"
  else
    fail "$name  ($STATUS)"
    ((ISSUES++)) || true
  fi
done

# ── Package dist ──────────────────────────────────────────────────────────────
header "Package builds"
for pkg in packages/core packages/api-client packages/ui-components; do
  if [ -d "$pkg/dist" ]; then
    ok "$pkg/dist"
  else
    fail "$pkg/dist missing — run: pnpm --filter @promanage/$(basename $pkg) build"
    ((ISSUES++)) || true
  fi
done

# ── API health endpoint ───────────────────────────────────────────────────────
header "API server  (http://localhost:3001)"
API_RESP=$(curl -s --max-time 2 http://localhost:3001/health 2>/dev/null || echo "")
if echo "$API_RESP" | grep -q '"ok"'; then
  ok "GET /health → $(echo "$API_RESP" | tr -d ' \n')"
else
  warn "API not responding — start with: cd apps/api && pnpm dev"
fi

# ── Web app ───────────────────────────────────────────────────────────────────
header "Web app     (http://localhost:3000)"
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:3000 2>/dev/null || echo "000")
if [ "$WEB_STATUS" = "200" ] || [ "$WEB_STATUS" = "307" ]; then
  ok "HTTP $WEB_STATUS"
else
  warn "Web not responding (HTTP $WEB_STATUS) — start with: pnpm --filter @promanage/web dev"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}${BOLD}  All infrastructure healthy.${NC}"
else
  echo -e "${RED}${BOLD}  $ISSUES infrastructure issue(s) found.${NC}"
  echo -e "  Run ${BLUE}bash scripts/dev.sh${NC} to start infrastructure."
fi
echo ""
