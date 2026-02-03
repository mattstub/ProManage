# ProManage Documentation

Welcome to the ProManage documentation! This directory contains comprehensive guides, context files, and technical documentation for the ProManage construction management platform.

## Documentation Structure

```bash
docs/
├── context/            # Project context and design documents
├── development/        # Development guides and best practices
├── guides/             # User and feature guides
├── tools/              # Tool-specific documentation
├── ARCHITECTURE.md     # System architecture overview
├── README.md           # This file
└── ROADMAP.md          # Future plans and milestones
```

## Quick Start

### For Developers

1. **New to ProManage?**
   - Start with [development/setup.md](development/setup.md) to set up your local environment
   - Read [context/technology-stack.md](context/technology-stack.md) to understand the tech choices
   - Review [development/coding-standards.md](development/coding-standards.md) for code style guidelines

2. **Contributing Code?**
   - Follow [development/git-workflow.md](development/git-workflow.md) for Git best practices
   - See [../CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
   - Check [development/testing.md](development/testing.md) for testing requirements

3. **Building Features?**
   - Review [context/project-vision.md](context/project-vision.md) for product direction
   - Check [context/design-system.md](context/design-system.md) for UI guidelines
   - Read [development/api-design.md](development/api-design.md) for API patterns

### For Project Managers

- **Project Vision**: [context/project-vision.md](context/project-vision.md)
- **Roadmap**: [ROADMAP.md](ROADMAP.md) (to be created)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md) (to be created)

### For Users

- **Getting Started**: [guides/](guides/) (to be populated)
- **FAQ**: Coming soon

## Documentation Sections

### Context Files ([context/](context/))

Strategic and architectural context:

- **[project-vision.md](context/project-vision.md)** - Product vision, goals, and target market
- **[technology-stack.md](context/technology-stack.md)** - Technology choices and rationale
- **[design-decisions.md](context/design-decisions.md)** - Architectural decision records
- **[design-system.md](context/design-system.md)** - UI/UX design system
- **[field-office-workflows.md](context/field-office-workflows.md)** - User workflows and requirements
- **[glossary.md](context/glossary.md)** - Construction and project terminology
- **[implementation-progress.md](context/implementation-progress.md)** - Setup progress tracking

### Development Guides ([development/](development/))

Technical guides for developers:

- **[setup.md](development/setup.md)** - Local environment setup
- **[coding-standards.md](development/coding-standards.md)** - Code style and best practices
- **[testing.md](development/testing.md)** - Testing strategies and tools
- **[git-workflow.md](development/git-workflow.md)** - Git workflow and commit conventions
- **[api-design.md](development/api-design.md)** - API design patterns and conventions
- **[mobile-setup.md](development/mobile-setup.md)** - Mobile development setup
- **[mobile-testing.md](development/mobile-testing.md)** - Mobile testing guide
- **[mobile-deployment.md](development/mobile-deployment.md)** - Mobile app deployment

### User Guides ([guides/](guides/))

End-user documentation (to be created):

- Getting Started
- Project Management
- Time Tracking
- Daily Reports
- Mobile App Usage

### Tool Documentation ([tools/](tools/))

Documentation for specific tools and integrations.

## Key Documents

### Essential Reading

1. **[Project Vision](context/project-vision.md)** - Understand what we're building and why
2. **[Technology Stack](context/technology-stack.md)** - Know the tools and technologies
3. **[Setup Guide](development/setup.md)** - Get your environment running
4. **[Coding Standards](development/coding-standards.md)** - Write consistent code

### Reference

- **[Design Decisions](context/design-decisions.md)** - Why we made certain technical choices
- **[API Design](development/api-design.md)** - How to design and use APIs
- **[Testing Guide](development/testing.md)** - How to test your code
- **[Design System](context/design-system.md)** - UI component guidelines

## Contributing to Documentation

Documentation is code! Please help keep it accurate and up-to-date.

### Writing Guidelines

1. **Use Markdown** for all documentation
2. **Be concise** but thorough
3. **Include examples** where helpful
4. **Keep it current** - update docs when code changes
5. **Use relative links** for internal references
6. **Add screenshots** for UI-related docs

### File Naming

- Use lowercase with hyphens: `mobile-setup.md`
- Be descriptive: `git-workflow.md` not `git.md`
- Group related docs in subdirectories

### Document Structure

```markdown
# Title

Brief overview of what this document covers.

## Section 1

Content...

## Section 2

Content...

---

**Last Updated**: YYYY-MM-DD
**Status**: Draft | Complete | Outdated
```

## Documentation Status

### Complete ✓

- Development setup and guides
- Coding standards
- Testing guide
- API design guide
- Technology stack
- Design system
- Git workflow

### In Progress 🚧

- Project vision (needs user input)
- Field workflows (needs user input)
- Glossary (needs construction terms)

### Planned 📋

- ROADMAP.md
- ARCHITECTURE.md
- User guides
- API reference (auto-generated)
- Component library docs (Storybook)

## Finding Documentation

### Search Tips

1. **Use GitHub search**: Search within the `docs/` directory
2. **Check the index**: This README links to all major docs
3. **Follow the structure**: Organized by audience and purpose
4. **Look in context**: Related docs are grouped together

### Common Queries

**"How do I set up my development environment?"**
→ [development/setup.md](development/setup.md)

**"What are the code style rules?"**
→ [development/coding-standards.md](development/coding-standards.md)

**"How do I deploy the mobile app?"**
→ [development/mobile-deployment.md](development/mobile-deployment.md)

**"What technology stack do we use?"**
→ [context/technology-stack.md](context/technology-stack.md)

**"Why did we choose X over Y?"**
→ [context/design-decisions.md](context/design-decisions.md)

**"How do I contribute?"**
→ [../CONTRIBUTING.md](../CONTRIBUTING.md)

## External Resources

### React & Next.js

- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Documentation](https://reactnative.dev/)

### Tools & Libraries

- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Socket.io Documentation](https://socket.io/docs/)

### Best Practices

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Testing Library](https://testing-library.com/docs/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Feedback

Found an issue with the documentation?

1. Open an issue on GitHub
2. Submit a PR with improvements
3. Ask in discussions

---

**Last Updated**: 2026-02-02
**Maintained By**: ProManage Team
