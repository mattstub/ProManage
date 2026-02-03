# ProManage Suite

> Open-source construction management tools for small contractors

ProManage is a collection of free, open-source tools designed to help small construction contractors manage their projects without being locked into expensive SaaS platforms. Built with a desktop-first approach and a mobile companion app for field workers.

## Features

- **Project Management** - Organize jobs, tasks, and timelines
- **Request for Information (RFI)** - Track and manage RFIs
- **Change Proposal Requests (CPR)** - Handle change orders efficiently
- **Permit & Inspection Management** - Track permits and inspections
- **Submittal Tools** - Manage submittals and product specifications
- **Real-Time Sync** - Office and field stay connected with live updates

## Architecture

- **Desktop-First**: Primary interface optimized for office personnel (90% of usage)
- **Mobile Companion**: React Native app for field workers (status updates, photos)
- **API-First**: Clean backend separation enables future integrations
- **Real-Time**: WebSocket/SSE for bidirectional office-field communication

## Technology Stack

- **Frontend**: React + Next.js (web), React Native + Expo (mobile)
- **Backend**: Node.js + TypeScript
- **Monorepo**: pnpm + Turborepo
- **License**: AGPL-3.0 (ensures all improvements remain open source)

## Quick Start

### Prerequisites

- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm))
- pnpm 8+ (`npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone https://github.com/mattstub/ProManage.git
cd ProManage

# Install dependencies
pnpm install

# Copy environment template
cp config/.env.example .env

# Start development servers
pnpm dev
```

## Project Structure

```
ProManage/
├── apps/
│   ├── web/                # Next.js web application (desktop-first)
│   ├── mobile/             # React Native mobile app (field companion)
│   └── api/                # Backend API server
├── packages/
│   ├── core/               # Shared business logic
│   ├── ui-components/      # Web UI components
│   ├── mobile-components/  # Mobile UI components
│   ├── api-client/         # API client library
│   └── real-time/          # WebSocket/SSE client
├── docs/                   # Documentation
└── scripts/                # Development scripts
```

## Documentation

- [Getting Started](docs/guides/getting-started.md) - Quick start guide
- [User Guide](docs/guides/user-guide.md) - End-user documentation
- [Development Setup](docs/development/setup.md) - Developer environment setup
- [Contributing](CONTRIBUTING.md) - How to contribute
- [Architecture](docs/ARCHITECTURE.md) - System architecture overview
- [Roadmap](docs/ROADMAP.md) - Future plans and milestones

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Community

- **Issues**: [GitHub Issues](https://github.com/mattstub/ProManage/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mattstub/ProManage/discussions)

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Why AGPL-3.0?

We chose AGPL-3.0 to ensure that all improvements to ProManage remain open source, even when used in SaaS applications. This protects the community and prevents proprietary forks that don't give back.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Report a Bug](https://github.com/mattstub/ProManage/issues/new?template=bug_report.md)
- 💡 [Request a Feature](https://github.com/mattstub/ProManage/issues/new?template=feature_request.md)
- ❓ [Ask a Question](https://github.com/mattstub/ProManage/issues/new?template=question.md)

---

Built with ❤️ for small contractors by the construction community
Built with [Claude](https://www.claude.ai)
