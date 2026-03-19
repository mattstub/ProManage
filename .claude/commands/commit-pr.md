# /commit-pr — Stage, Commit, and Open a Pull Request

Use this when a sub-phase or logical unit of work is ready to commit and/or PR.

---

## Commit Message Format

```bash
type(scope): short imperative description

- Detail bullet 1
- Detail bullet 2

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`

**Scopes** (use the package or app name): `core`, `api-client`, `ui-components`, `api`, `web`, `root`

Examples:

```bash
feat(web): add Next.js app shell with auth pages and dashboard layout
docs: update session-context and implementation-progress for sub-phase G
chore(root): add .claude/commands workflow files
```

---

## Staging Rules

**Always stage specific files** — never `git add .` or `git add -A`:

```bash
git add apps/web/src/app/login/page.tsx apps/web/src/app/dashboard/page.tsx
git add docs/context/session-context.md
```

**Never stage**:

- `.env` files or any secrets
- `node_modules/`
- `dist/` or `tsconfig.tsbuildinfo` (these are build artifacts, gitignored)
- `.claude/settings.local.json`

Check what's staged before committing:

```bash
git diff --staged --stat
```

---

## Commit Workflow

```bash
# 1. Stage specific files
git add {specific files...}

# 2. Verify staged content
git diff --staged --stat

# 3. Commit
git commit -m "$(cat <<'EOF'
feat(web): short description here

- Bullet detail 1
- Bullet detail 2

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

# 4. Verify
git log --oneline -3
```

---

## When to Commit vs When to PR

| Situation | Action |
| --- | --- |
| Logical chunk complete (e.g., auth pages done) | Commit on the feature branch |
| Sub-phase fully complete + docs updated | Commit, then open PR |
| Discovered a mistake after commit | New commit with fix — never amend a shared commit |
| Merge conflict | Resolve manually, then commit the resolution |

---

## Opening a Pull Request

When a sub-phase is complete:

1. **Final commit** should include all doc updates (session-context, implementation-progress, CHANGELOG)
2. **Tell the user**: "Ready to push — please run `git push origin {branch}` from your terminal"
3. **Provide the PR content**:

```bash
Title: feat(web): Sub-phase G — apps/web Next.js shell

## Summary
- Added Next.js 14 App Router shell to apps/web
- Auth pages: login, register with form validation
- Dashboard layout: sidebar nav + header
- Protected route middleware (redirect unauthenticated users)
- TanStack Query + Zustand configured
- Basic dashboard page with placeholder content

## Test Plan
- [ ] pnpm build runs clean (no TypeScript errors)
- [ ] /login page renders and form validates
- [ ] /register page renders
- [ ] Authenticated routes redirect to /login when no token
- [ ] Dashboard layout renders sidebar + header

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> WSL limitation: `git push` hangs inside `bash -c`. User must run push from their own terminal.

---

## Documentation Updates (required before final commit)

Every PR must include documentation updates in the same commit. Check all four:

| File | What to update |
| --- | --- |
| `README.md` | Update feature list / phase status if a new phase or major feature is complete |
| `CHANGELOG.md` | Add entry under `[Unreleased]` — packages changed, new files, bug fixes |
| `docs/ROADMAP.md` | Check off completed items (`- [ ]` → `- [x]`), update "Last Updated" + "Status" footer |
| `docs/context/session-context.md` | Update "Last Updated", current state section, directory map, session log |
| `CLAUDE.md` | Update Phase Status section only if a phase completes |

> `docs/context/implementation-progress.md` is deprecated — session-context.md is now authoritative.

Quick check before committing:

```bash
# Confirm docs are staged alongside code
git diff --staged --name-only | grep -E "README|CHANGELOG|ROADMAP|session-context|CLAUDE"
```

---

## After PR is Merged

1. Checkout `main` and pull: `git checkout main && git pull origin main`
2. Begin next sub-phase using `/new-branch`
