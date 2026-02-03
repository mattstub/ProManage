# Pull Request

## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test additions/updates
- [ ] CI/CD changes
- [ ] Dependency updates

## Related Issues

<!-- Link to related issues using keywords: Fixes #123, Closes #456, Related to #789 -->

Fixes #
Closes #
Related to #

## Changes Made

<!-- List the main changes in this PR -->

-
-
-

## Technical Details (if applicable)

<!-- Provide technical context about the implementation -->

**Architecture Changes:**
<!-- Describe any architectural changes -->

**Database Changes:**
<!-- List any database migrations or schema changes -->

**API Changes:**
<!-- List any API endpoint changes or new endpoints -->

**Breaking Changes:**
<!-- Detail any breaking changes and migration path -->

## Testing

<!-- Describe the tests you've added or run -->

### Manual Testing

- [ ] Tested on development environment
- [ ] Tested on staging environment (if applicable)
- [ ] Tested on multiple browsers (web only)
- [ ] Tested on iOS simulator/device (mobile only)
- [ ] Tested on Android emulator/device (mobile only)

### Automated Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing locally
- [ ] Test coverage maintained or improved

**Test Coverage:**
<!-- Include coverage percentage if applicable -->

## Screenshots/Videos (if applicable)

<!-- Add screenshots or videos demonstrating the changes -->

**Before:**
<!-- Screenshot/video of before the changes -->

**After:**
<!-- Screenshot/video of after the changes -->

## Checklist

<!-- Mark completed items with an 'x' -->

### Code Quality

- [ ] Code follows the project's style guidelines
- [ ] Self-reviewed my own code
- [ ] Commented complex code sections
- [ ] No console.log or debugging statements left
- [ ] No linting errors or warnings
- [ ] TypeScript types properly defined

### Documentation

- [ ] Updated relevant documentation
- [ ] Added/updated code comments where necessary
- [ ] Updated API documentation (if applicable)
- [ ] Added/updated README if needed
- [ ] Updated CHANGELOG.md

### Testing & Quality

- [ ] Added tests for new functionality
- [ ] All existing tests still pass
- [ ] No new TypeScript errors
- [ ] Performed accessibility check (web/mobile UI changes)
- [ ] Checked for performance impacts

### Security & Privacy

- [ ] No sensitive data exposed in code or logs
- [ ] Input validation added where necessary
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Authentication/authorization checked

### Database & Migrations

- [ ] Database migrations are reversible
- [ ] Migration tested on development database
- [ ] Seed data updated if needed
- [ ] No breaking changes to existing data

### Dependencies

- [ ] No unnecessary dependencies added
- [ ] Dependencies are up to date
- [ ] Security vulnerabilities checked (`pnpm audit`)

## Deployment Notes

<!-- Special instructions for deployment -->

- [ ] Requires database migration
- [ ] Requires environment variable changes
- [ ] Requires cache clearing
- [ ] Requires service restart
- [ ] Other: <!-- specify -->

**Environment Variables:**
<!-- List any new or changed environment variables -->

```bash
# Add to .env
NEW_VAR=value
```

## Performance Impact

<!-- Describe any performance implications -->

- [ ] No performance impact
- [ ] Performance improved
- [ ] Potential performance impact (describe below)

## Rollback Plan

<!-- How to rollback if issues are found after deployment -->

## Reviewer Notes

<!-- Any specific areas you'd like reviewers to focus on -->

## Post-Merge Tasks

<!-- List any tasks that need to be done after merging -->

- [ ] Task 1
- [ ] Task 2

---

## For Reviewers

### Review Focus Areas

- [ ] Code quality and best practices
- [ ] Test coverage and test quality
- [ ] Security implications
- [ ] Performance impact
- [ ] Documentation accuracy
- [ ] Breaking changes properly handled
- [ ] Error handling
- [ ] Accessibility (if UI changes)

### Review Checklist

- [ ] Code changes reviewed
- [ ] Tests reviewed and verified
- [ ] Documentation reviewed
- [ ] No security concerns
- [ ] Approved for merge
