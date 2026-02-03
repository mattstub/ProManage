# @promanage/core

Shared business logic, types, and utilities for ProManage applications.

## Overview

The core package contains business logic, domain models, validation schemas, and utility functions shared across web, mobile, and API applications.

## Installation

```bash
# This package is part of the ProManage monorepo
# Install from project root
pnpm install
```

## Usage

```typescript
import { User, Project } from '@promanage/core/types'
import { validateEmail, formatCurrency } from '@promanage/core/utils'
import { ProjectSchema } from '@promanage/core/schemas'
```

## Exports

### Types

```typescript
// Domain models
import type {
  User,
  Project,
  TimeEntry,
  DailyReport
} from '@promanage/core/types'
```

### Validation Schemas (Zod)

```typescript
import {
  UserSchema,
  ProjectSchema,
  TimeEntrySchema,
  DailyReportSchema
} from '@promanage/core/schemas'

// Usage
const project = ProjectSchema.parse(data)
```

### Utilities

```typescript
import {
  formatDate,
  formatCurrency,
  validateEmail,
  calculateProjectProgress
} from '@promanage/core/utils'
```

### Constants

```typescript
import {
  PROJECT_STATUS,
  USER_ROLES,
  TIME_ENTRY_STATUS
} from '@promanage/core/constants'
```

## Development

### Build

```bash
# Build package
pnpm build

# Watch mode
pnpm dev
```

### Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Package Structure

```
packages/core/
├── src/
│   ├── types/         # TypeScript type definitions
│   ├── schemas/       # Zod validation schemas
│   ├── utils/         # Utility functions
│   ├── constants/     # App constants
│   └── index.ts       # Main export
├── tests/             # Test files
└── package.json
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

AGPL-3.0 - See [LICENSE](../../LICENSE)
