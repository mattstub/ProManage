# @promanage/api-client

Type-safe API client for ProManage applications.

## Overview

A fully typed API client for communicating with the ProManage backend, shared between web and mobile applications.

## Installation

```bash
# This package is part of the ProManage monorepo
# Install from project root
pnpm install
```

## Usage

### Web Application

```typescript
import { createApiClient } from '@promanage/api-client'

const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  token: () => getAuthToken(), // Function to get current token
})

// Use the API
const projects = await api.projects.list()
const project = await api.projects.get('123')
await api.projects.create({ name: 'New Project' })
```

### Mobile Application

```typescript
import { createApiClient } from '@promanage/api-client'

const api = createApiClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  token: () => AsyncStorage.getItem('token'),
})

// Use the API
const timeEntries = await api.timeEntries.list()
```

## API Methods

### Authentication

```typescript
// Login
const { user, token } = await api.auth.login(email, password)

// Register
const { user } = await api.auth.register(data)

// Refresh token
const { token } = await api.auth.refresh(refreshToken)

// Logout
await api.auth.logout()
```

### Projects

```typescript
// List projects
const projects = await api.projects.list({ status: 'active' })

// Get project
const project = await api.projects.get('project-id')

// Create project
const newProject = await api.projects.create({
  name: 'Office Renovation',
  budget: 250000,
})

// Update project
const updated = await api.projects.update('project-id', { status: 'completed' })

// Delete project
await api.projects.delete('project-id')
```

### Time Entries

```typescript
// Clock in
const entry = await api.timeEntries.clockIn({
  projectId: '123',
  costCode: 'labor',
  location: { lat, lon },
})

// Clock out
await api.timeEntries.clockOut(entry.id)

// List entries
const entries = await api.timeEntries.list({
  projectId: '123',
  startDate: '2026-01-01',
})
```

### Daily Reports

```typescript
// Submit report
const report = await api.dailyReports.create({
  projectId: '123',
  weather: 'Sunny',
  workPerformed: 'Framing on second floor',
  photos: ['photo-id-1', 'photo-id-2'],
})

// List reports
const reports = await api.dailyReports.list({ projectId: '123' })
```

### File Uploads

```typescript
// Get presigned URL
const { uploadUrl, fileUrl } = await api.uploads.getPresignedUrl({
  filename: 'photo.jpg',
  contentType: 'image/jpeg',
})

// Upload to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': 'image/jpeg' },
})
```

## Configuration

```typescript
interface ApiClientConfig {
  baseURL: string                      // API base URL
  token?: string | (() => string | Promise<string>) // Auth token
  onUnauthorized?: () => void          // Called on 401
  timeout?: number                     // Request timeout (ms)
  retries?: number                     // Retry attempts
}
```

## Error Handling

```typescript
import { ApiError } from '@promanage/api-client'

try {
  await api.projects.create(data)
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.code)      // VALIDATION_ERROR
    console.error(error.message)   // Human-readable message
    console.error(error.status)    // HTTP status code
    console.error(error.details)   // Additional error details
  }
}
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

# Coverage
pnpm test:coverage
```

## Type Safety

All API methods are fully typed with TypeScript:

```typescript
// TypeScript knows the shape of the response
const project: Project = await api.projects.get('123')

// TypeScript validates request payloads
await api.projects.create({
  name: 'Test',  // ✓ Required field
  budget: 1000,  // ✓ Number
  // status: 'invalid'  // ✗ Type error
})
```

## Package Structure

```
packages/api-client/
├── src/
│   ├── client.ts       # Main API client
│   ├── endpoints/      # API endpoint methods
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   └── ...
│   ├── types.ts        # TypeScript types
│   ├── errors.ts       # Error classes
│   └── index.ts        # Main export
└── tests/              # Tests
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

AGPL-3.0 - See [LICENSE](../../LICENSE)
