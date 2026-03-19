# /startup — Session Startup Routine

Run this at the beginning of every coding session to orient and verify the environment.

---

## 1. Orient

Read the context files to understand current project state:

```bash
Read: docs/context/session-context.md
Read: docs/context/implementation-progress.md
```

Confirm:

- Which sub-phase is currently active or next
- What the last session log entry says
- Any open branches or pending PRs

---

## 2. Verify Infrastructure

Run these commands to start infrastructure:

```bash
source ~/.nvm/nvm.sh && nvm use 20
docker compose up -d
docker compose ps
```

Expected: `promanage-postgres` and `promanage-minio` both `healthy`.

---

## 3. Check Package Build State

```bash
ls packages/core/dist packages/api-client/dist packages/ui-components/dist 2>/dev/null || echo "dist missing — rebuild needed"
```

If rebuild is needed (build order matters — core first):

```bash
source ~/.nvm/nvm.sh && nvm use 20
pnpm --filter @promanage/core build
pnpm --filter @promanage/api-client build
pnpm --filter @promanage/ui-components build
```

If incremental build seems stuck or wrong (stale .tsbuildinfo):

```bash
rm -rf packages/core/dist packages/core/tsconfig.tsbuildinfo
pnpm --filter @promanage/core build
```

---

## 4. Confirm Git State

```bash
git status
git branch
git log --oneline -5
```

If continuing a sub-phase, verify you're on the right feature branch.
If starting a new sub-phase, run `/new-branch` next.

---

## 5. Start Dev Server (if doing API work)

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd apps/api && pnpm dev
```

Verify: `http://localhost:3001/health` → `{"status":"ok"}`

> WSL note: background processes don't persist across shell sessions. Keep a dedicated terminal for the server.

---

## 6. DB Reset (only if needed)

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd apps/api
npx prisma db push --force-reset && npx ts-node prisma/seed.ts
```

> Always use `prisma db push --force-reset` — `prisma migrate dev` fails non-interactively.

---

## End-of-Session Checklist

Before closing the session:

- [ ] All work staged and committed (run `/commit-pr` when sub-phase is complete)
- [ ] `docs/context/session-context.md` updated — new session log entry, updated "Last Updated" date
- [ ] `docs/context/implementation-progress.md` updated — sub-phase checked off
- [ ] `CHANGELOG.md` updated with session summary
- [ ] If sub-phase complete: PR open, user handles `git push` from terminal (WSL git push hangs in bash -c)
