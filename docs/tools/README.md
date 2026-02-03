# Tools Documentation

Documentation for tools, integrations, and third-party services used in ProManage.

## Overview

This directory contains documentation for various tools and integrations that enhance ProManage's functionality.

## Tool Categories

### Development Tools

- **Monorepo**: pnpm + Turborepo
- **Type Checking**: TypeScript
- **Linting**: ESLint + Prettier
- **Testing**: Vitest, Playwright, Detox
- **Git Hooks**: Husky + lint-staged

### Infrastructure

- **Database**: PostgreSQL + Prisma
- **Caching**: Redis
- **File Storage**: S3-compatible (MinIO, AWS S3)
- **Containerization**: Docker + Docker Compose

### Real-Time & Communication

- **WebSockets**: Socket.io
- **Email**: SendGrid / SMTP
- **Push Notifications**: Expo Notifications

### Monitoring & Observability

- **Error Tracking**: Sentry (optional)
- **Logging**: Pino
- **Analytics**: (to be determined)

### CI/CD

- **Continuous Integration**: GitHub Actions
- **Deployment**: Vercel (web), EAS (mobile)
- **Testing**: Automated test runs

## Tool Documentation

### Coming Soon

Detailed guides for each tool will be added here:

- `prisma.md` - Prisma ORM setup and usage
- `docker.md` - Docker configuration and commands
- `redis.md` - Redis setup and caching strategies
- `socket-io.md` - WebSocket implementation
- `sendgrid.md` - Email service integration
- `sentry.md` - Error tracking setup
- `github-actions.md` - CI/CD pipeline configuration
- `vercel.md` - Web deployment
- `eas.md` - Mobile app builds and deployment

## Quick References

### Database (Prisma)

```bash
# Generate client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name migration_name

# Open Prisma Studio
pnpm prisma studio

# Seed database
pnpm prisma db seed
```

See: [Prisma Documentation](https://www.prisma.io/docs)

### Redis

```bash
# Start Redis (Docker)
docker-compose up -d redis

# Connect to Redis CLI
docker exec -it redis redis-cli

# Monitor commands
redis-cli MONITOR
```

See: [Redis Documentation](https://redis.io/documentation)

### Docker

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up -d --build
```

See: [Docker Documentation](https://docs.docker.com/)

### EAS (Expo Application Services)

```bash
# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform all
```

See: [EAS Documentation](https://docs.expo.dev/eas/)

## Integration Guides

### Setting Up a New Tool

When adding a new tool or integration:

1. **Document the purpose**: Why are we using this tool?
2. **Installation steps**: How to set it up locally
3. **Configuration**: Required environment variables and settings
4. **Usage examples**: Common use cases
5. **Troubleshooting**: Common issues and solutions
6. **Links**: Official documentation and resources

### Documentation Template

```markdown
# Tool Name

## Overview
Brief description of what this tool does and why we use it.

## Installation

### Prerequisites
List any prerequisites

### Setup Steps
Step-by-step installation instructions

## Configuration

### Environment Variables
List required environment variables

### Settings
Configuration options and recommended values

## Usage

### Basic Usage
Common commands and examples

### Advanced Usage
More complex use cases

## Troubleshooting

### Common Issues
List of common problems and solutions

## Resources
- Official Documentation
- Tutorials
- Community Resources

---
**Last Updated**: YYYY-MM-DD
```

## External Documentation

### Primary Tools

- [pnpm Documentation](https://pnpm.io/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Socket.io Documentation](https://socket.io/docs/)

### DevOps & Infrastructure

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

### Monitoring

- [Sentry Documentation](https://docs.sentry.io/)
- [Pino Documentation](https://getpino.io/)

## Contributing

To add documentation for a new tool:

1. Create a new `.md` file in this directory
2. Follow the documentation template above
3. Update this README with a link
4. Submit a PR

## Questions?

If you have questions about a specific tool:

1. Check the tool's official documentation
2. Search existing GitHub issues
3. Ask in team discussions
4. Create a question issue

---

**Last Updated**: 2026-02-02
**Maintained By**: ProManage Team
