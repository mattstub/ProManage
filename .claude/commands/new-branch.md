# /new-branch — Create a Branch for a New Sub-phase or Feature

Usage: `/new-branch` — Claude will ask for the branch details and create it.

---

## Branch Naming Convention

```bash
feat/phase{N}-subphase-{letter}-{short-kebab-description}
```

Examples:

- `feat/phase1-subphase-g-apps-web`
- `feat/phase2-dashboard-widgets`
- `fix/phase1-auth-refresh-race`
- `docs/update-roadmap-phase2`

Prefixes:

| Prefix | When to use |
| --- | --- |
| `feat/` | New sub-phase or feature work |
| `fix/` | Bug fix targeting a specific area |
| `docs/` | Documentation-only changes |
| `chore/` | Tooling, config, deps (no production code) |
| `refactor/` | Internal restructure without behavior change |

---

## Creating the Branch

Always branch from `main` unless explicitly told otherwise:

```bash
git checkout main
git pull origin main
git checkout -b feat/phase{N}-subphase-{letter}-{description}
```

Verify:

```bash
git branch
git log --oneline -3
```

---

## Branch Scope Rules

- **One branch per sub-phase** — keep scope focused and PRs reviewable
- Never commit directly to `main`
- If a sub-phase has multiple logical chunks, commit frequently on the branch — don't batch everything into one commit
- If scope grows unexpectedly, discuss with user before continuing

---

## During the Sub-phase

Commit at logical checkpoints (not just at the end):

- After scaffold / initial file structure
- After each major feature area (e.g., auth pages done, then layout done)
- Before any risky refactor

Use the commit format from `/commit-pr`.

---

## Completing the Sub-phase

When all work is done and verified:

1. Run final build + type-check
2. Update docs (session-context, implementation-progress, CHANGELOG)
3. Stage and commit everything (see `/commit-pr`)
4. Tell the user: "Branch is ready — please `git push origin {branch-name}` from your terminal to open the PR"
5. Provide the PR title and description for the user to paste

> WSL limitation: `git push` hangs when run inside a `bash -c` context. The user must push from their own terminal session.
