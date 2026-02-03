# ProManage Web Application

Desktop-first web application built with Next.js and React, optimized for office workflows.

## Overview

The ProManage web app is the primary interface for project management, designed for office-based users (90% of use cases). It provides comprehensive project management tools with full desktop functionality.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **Styling**: TailwindCSS + Radix UI
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Real-Time**: Socket.io Client

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Running API server (see [apps/api](../api/README.md))

### Installation

```bash
# From project root
cd apps/web

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Development

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript checking
pnpm test         # Run tests
pnpm test:e2e     # Run E2E tests with Playwright
```

### Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `NEXT_PUBLIC_API_URL` - API server URL
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL
- `NEXT_PUBLIC_ENV` - Environment (development/production)

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related pages
│   ├── (dashboard)/       # Main app pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── forms/            # Form components
│   └── layouts/          # Layout components
├── lib/                   # Utilities and helpers
│   ├── api.ts            # API client
│   ├── auth.ts           # Auth utilities
│   └── utils.ts          # General utilities
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── styles/                # Global styles
└── public/                # Static assets
```

## Features

- **Project Management**: Create, view, and manage construction projects
- **Time Tracking**: Review and approve time entries
- **Daily Reports**: View field reports with photos
- **Budget Tracking**: Monitor project costs and budgets
- **Real-Time Updates**: Live updates from field teams
- **User Management**: Manage team members and permissions

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# With coverage
pnpm test:coverage
```

## Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel

# Production deployment
vercel --prod
```

### Self-Hosted

```bash
# Build
pnpm build

# Start production server
pnpm start
```

## Documentation

- [Setup Guide](../../docs/development/setup.md)
- [Coding Standards](../../docs/development/coding-standards.md)
- [Testing Guide](../../docs/development/testing.md)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

AGPL-3.0 - See [LICENSE](../../LICENSE)
