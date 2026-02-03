# Contributing to ProManage

Thank you for your interest in contributing to ProManage! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## How to Contribute

### Reporting Bugs

Before submitting a bug report:
- Check the [existing issues](https://github.com/mattstub/ProManage/issues) to avoid duplicates
- Collect relevant information (OS, Node version, steps to reproduce)

When submitting a bug report, use the bug report template and include:
- A clear, descriptive title
- Detailed steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, browser, Node version)

### Suggesting Features

Feature suggestions are welcome! Use the feature request template and include:
- A clear description of the problem you're trying to solve
- Your proposed solution
- Any alternative solutions you've considered
- Why this feature would be useful to most users

### Submitting Pull Requests

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Set up your development environment**
   ```bash
   pnpm install
   cp config/.env.example .env
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test your changes**
   ```bash
   pnpm test
   pnpm lint
   pnpm type-check
   ```

5. **Commit your changes**
   - Use [Conventional Commits](https://www.conventionalcommits.org/) format
   - Write clear, concise commit messages
   - Example: `feat(rfi): add status filter to RFI list`

6. **Push to your fork** and submit a pull request
   ```bash
   git push origin feature/my-feature
   ```

7. **Wait for review**
   - Address any feedback from reviewers
   - Keep your PR up to date with the main branch

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the ESLint and Prettier configurations
- Use 2 spaces for indentation
- Write meaningful variable and function names
- Add comments for complex logic

### Commit Message Format

We use Conventional Commits for automatic changelog generation:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(submittal): add PDF extraction for spec sheets
fix(rfi): correct date formatting in export
docs(readme): update installation instructions
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Aim for good test coverage
- Test on multiple browsers/devices when applicable

### Documentation

- Update relevant documentation for any changes
- Add JSDoc comments for functions and classes
- Update README if adding new features
- Create or update user guides as needed

## Project Structure

```
ProManage/
├── apps/
│   ├── web/          # Next.js web application
│   ├── mobile/       # React Native mobile app
│   └── api/          # Backend API server
├── packages/
│   ├── core/         # Shared business logic
│   ├── ui-components/        # Web UI components
│   ├── mobile-components/    # Mobile components
│   ├── api-client/           # API client
│   └── real-time/            # Real-time communication
├── docs/             # Documentation
└── scripts/          # Build and development scripts
```

## Setting Up Development Environment

### Prerequisites

- Node.js 18+ ([nvm](https://github.com/nvm-sh/nvm) recommended)
- pnpm 8+
- Git

### Initial Setup

1. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ProManage.git
   cd ProManage
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/mattstub/ProManage.git
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Set up environment**
   ```bash
   cp config/.env.example .env
   # Edit .env with your local settings
   ```

5. **Start development servers**
   ```bash
   # All apps
   pnpm dev

   # Individual apps
   pnpm dev:web
   pnpm dev:mobile
   pnpm dev:api
   ```

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Need Help?

- 📖 Read the [documentation](docs/)
- 💬 Ask in [GitHub Discussions](https://github.com/mattstub/ProManage/discussions)
- 🐛 Report issues on [GitHub Issues](https://github.com/mattstub/ProManage/issues)

## Recognition

Contributors will be recognized in:
- The project README
- Release notes for their contributions
- The GitHub contributors page

Thank you for helping make ProManage better for the construction community!
