# Git Workflow

## Branch Strategy

### Main Branches

**`main`**
- Production-ready code
- Protected branch (requires PR and reviews)
- Auto-deploys to production (when ready)
- Always stable and deployable

**`develop`** (Optional - if using Git Flow)
- Integration branch for features
- Deploys to staging environment
- Merge to `main` for releases

### Feature Branches

**Naming Convention:**
```
feature/short-description
fix/issue-description
chore/task-description
docs/documentation-update
refactor/what-is-being-refactored
```

**Examples:**
```
feature/add-time-tracking
fix/daily-report-submission
chore/upgrade-dependencies
docs/update-api-guide
refactor/auth-middleware
```

## Workflow Steps

### 1. Create Branch

```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/add-project-filter

# Or for bug fix
git checkout -b fix/time-entry-validation
```

### 2. Make Changes

```bash
# Make your changes
# ...

# Check status
git status

# View changes
git diff

# Stage specific files
git add src/components/ProjectFilter.tsx
git add src/hooks/useProjectFilter.ts

# Or stage all changes
git add .
```

### 3. Commit Changes

```bash
# Commit with message
git commit -m "Add project filter component"

# Or use detailed message
git commit
```

See [Commit Messages](#commit-messages) section below for guidelines.

### 4. Push to Remote

```bash
# Push branch to remote
git push -u origin feature/add-project-filter

# Subsequent pushes
git push
```

### 5. Create Pull Request

- Go to GitHub repository
- Click "New Pull Request"
- Select your branch
- Fill in PR template
- Request reviewers
- Link related issues

### 6. Address Review Feedback

```bash
# Make requested changes
# ...

# Commit changes
git add .
git commit -m "Address PR feedback: improve filter performance"

# Push updates
git push
```

### 7. Merge PR

After approval:
- **Squash and merge** (preferred for feature branches)
- **Merge commit** (for important feature branches with meaningful history)
- **Rebase and merge** (for clean linear history)

### 8. Clean Up

```bash
# Delete local branch
git branch -d feature/add-project-filter

# Delete remote branch (if not auto-deleted)
git push origin --delete feature/add-project-filter
```

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes

### Examples

**Simple commit:**
```
feat(projects): add filter by status
```

**With body:**
```
fix(time-tracking): correct overtime calculation

The overtime calculation was using wrong threshold.
Changed from 8 hours to 40 hours weekly as per requirements.

Fixes #123
```

**Breaking change:**
```
feat(api): change authentication endpoint

BREAKING CHANGE: /auth/login now returns different response format.
The token is now in response.data.token instead of response.token.
```

### Guidelines

**Good commits:**
```
feat(daily-reports): add photo upload capability
fix(auth): resolve token expiration issue
docs(api): update endpoint documentation
test(projects): add unit tests for project service
```

**Bad commits:**
```
fix stuff
updates
WIP
asdfasdf
```

### Commit Message Tips

- Use imperative mood ("add" not "added")
- Keep subject line under 50 characters
- Capitalize subject line
- No period at end of subject
- Separate subject from body with blank line
- Wrap body at 72 characters
- Explain *what* and *why*, not *how*

## Pull Requests

### PR Title

Follow same format as commit messages:
```
feat(projects): add advanced filtering
fix(mobile): resolve photo upload on iOS
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Added project filter component
- Updated API endpoint for filtering
- Added tests for new functionality

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots or GIFs]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass

## Related Issues
Closes #123
```

### PR Best Practices

**Do:**
- ✅ Keep PRs focused and small
- ✅ Write clear description
- ✅ Link related issues
- ✅ Add screenshots/videos for UI changes
- ✅ Ensure CI passes before requesting review
- ✅ Respond to feedback promptly
- ✅ Keep PR up-to-date with main

**Don't:**
- ❌ Create massive PRs (500+ lines)
- ❌ Mix unrelated changes
- ❌ Leave PR description empty
- ❌ Push broken code
- ❌ Ignore review feedback
- ❌ Force push after review started

## Code Review

### As Author

1. **Before requesting review:**
   - Self-review your changes
   - Ensure tests pass
   - Update documentation
   - Add screenshots if applicable

2. **During review:**
   - Respond to comments
   - Ask for clarification if needed
   - Make requested changes
   - Mark conversations as resolved

3. **After approval:**
   - Merge promptly
   - Delete branch
   - Close related issues

### As Reviewer

1. **Review checklist:**
   - [ ] Code follows style guidelines
   - [ ] Logic is correct and efficient
   - [ ] Tests are adequate
   - [ ] No security issues
   - [ ] Documentation updated
   - [ ] No breaking changes (or properly documented)

2. **Providing feedback:**
   - Be constructive and kind
   - Explain *why* changes are needed
   - Suggest alternatives
   - Distinguish between required changes and suggestions
   - Approve when ready

## Resolving Conflicts

### Merge Conflicts

```bash
# Update your branch with latest main
git checkout feature/my-feature
git fetch origin
git merge origin/main

# Resolve conflicts in editor
# ...

# Mark as resolved
git add <conflicted-files>

# Commit merge
git commit

# Push changes
git push
```

### Rebase (Alternative)

```bash
# Rebase your branch onto main
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# Resolve conflicts if any
# ...
git add <resolved-files>
git rebase --continue

# Force push (only if branch not reviewed yet)
git push --force-with-lease
```

## Advanced Git

### Interactive Rebase

```bash
# Clean up last 3 commits
git rebase -i HEAD~3

# Options:
# pick = keep commit
# reword = change commit message
# squash = combine with previous
# drop = remove commit
```

### Stashing Changes

```bash
# Save work in progress
git stash

# Or with message
git stash save "WIP: project filter"

# List stashes
git stash list

# Apply latest stash
git stash pop

# Apply specific stash
git stash apply stash@{1}

# Delete stash
git stash drop stash@{0}
```

### Cherry-Pick

```bash
# Apply specific commit from another branch
git cherry-pick <commit-hash>
```

### Viewing History

```bash
# Pretty log
git log --oneline --graph --all

# Changes by author
git log --author="John"

# Changes in last week
git log --since="1 week ago"

# Changes to specific file
git log -- path/to/file.ts
```

## Git Hooks

### Pre-commit Hook

Automatically runs before each commit:

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linter
pnpm lint-staged

# Type check
pnpm typecheck
```

### Pre-push Hook

Runs before pushing:

```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests
pnpm test
```

### Commit Message Hook

Validates commit messages:

```bash
# .husky/commit-msg
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validate commit message format
npx --no -- commitlint --edit $1
```

## Common Scenarios

### Undo Last Commit (Keep Changes)

```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)

```bash
git reset --hard HEAD~1
```

### Amend Last Commit

```bash
# Add forgotten files
git add forgotten-file.ts
git commit --amend --no-edit

# Or change message
git commit --amend
```

### Revert Merged PR

```bash
# Create revert commit
git revert -m 1 <merge-commit-hash>
git push
```

### Update Fork

```bash
# Add upstream remote (once)
git remote add upstream https://github.com/original/ProManage.git

# Fetch and merge
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Best Practices

### Commit Often

- Small, focused commits
- Commit working code
- One logical change per commit

### Branch Often

- Create branch for each feature/fix
- Don't work directly on main
- Delete branches after merge

### Pull Before Push

```bash
# Always pull before pushing
git pull --rebase origin main
git push
```

### Write Good Commit Messages

- Explain the "why"
- Reference issue numbers
- Follow conventional commits

### Keep Branches Updated

```bash
# Regularly sync with main
git fetch origin
git merge origin/main
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)

---

**Last Updated**: 2026-02-02
**Status**: Complete
