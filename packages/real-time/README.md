# @promanage/real-time

Real-time communication library using Socket.io for ProManage applications.

## Overview

Provides WebSocket-based real-time bidirectional communication between field and office applications using Socket.io.

## Installation

```bash
# This package is part of the ProManage monorepo
# Install from project root
pnpm install
```

## Usage

### Client (Web/Mobile)

```typescript
import { createRealtimeClient } from '@promanage/real-time'

const realtime = createRealtimeClient({
  url: process.env.WS_URL,
  auth: {
    token: getAuthToken(),
  },
})

// Connect
await realtime.connect()

// Join project room
realtime.joinProject('project-123')

// Listen for events
realtime.on('project:updated', (data) => {
  console.log('Project updated:', data)
})

realtime.on('time-entry:created', (data) => {
  console.log('New time entry:', data)
})

// Leave project room
realtime.leaveProject('project-123')

// Disconnect
realtime.disconnect()
```

### Server

```typescript
import { createRealtimeServer } from '@promanage/real-time'
import { io } from './server' // Socket.io server instance

const realtime = createRealtimeServer(io)

// Broadcast to project room
realtime.toProject('project-123').emit('project:updated', projectData)

// Broadcast to user
realtime.toUser('user-456').emit('notification', notificationData)

// Broadcast to organization
realtime.toOrganization('org-789').emit('announcement', announcement)
```

## Events

### Project Events

```typescript
// Project updates
realtime.on('project:updated', (data: Project) => {})
realtime.on('project:deleted', (data: { id: string }) => {})

// Emit
realtime.emit('project:updated', project)
```

### Time Entry Events

```typescript
// Time entry updates
realtime.on('time-entry:created', (data: TimeEntry) => {})
realtime.on('time-entry:updated', (data: TimeEntry) => {})
realtime.on('time-entry:deleted', (data: { id: string }) => {})
```

### Daily Report Events

```typescript
// Daily report updates
realtime.on('daily-report:submitted', (data: DailyReport) => {})
realtime.on('daily-report:approved', (data: { id: string }) => {})
```

### System Events

```typescript
// Connection events
realtime.on('connect', () => console.log('Connected'))
realtime.on('disconnect', () => console.log('Disconnected'))
realtime.on('error', (error) => console.error('Error:', error))

// Reconnection events
realtime.on('reconnect', (attemptNumber) => {})
realtime.on('reconnect_attempt', (attemptNumber) => {})
realtime.on('reconnect_failed', () => {})
```

## Rooms

### Join/Leave Rooms

```typescript
// Join project room
realtime.joinProject('project-123')

// Leave project room
realtime.leaveProject('project-123')

// Join organization room (auto-joins all user's projects)
realtime.joinOrganization('org-456')

// Leave organization room
realtime.leaveOrganization('org-456')
```

## React Hooks (Web)

```typescript
import { useRealtime, useRealtimeEvent } from '@promanage/real-time/react'

function ProjectDashboard({ projectId }: Props) {
  const realtime = useRealtime()

  // Join project room on mount
  useEffect(() => {
    realtime.joinProject(projectId)
    return () => realtime.leaveProject(projectId)
  }, [projectId])

  // Listen for updates
  useRealtimeEvent('project:updated', (project) => {
    // Update local state
    updateProject(project)
  })

  useRealtimeEvent('time-entry:created', (entry) => {
    // Add to list
    addTimeEntry(entry)
  })
}
```

## React Hooks (Mobile)

```typescript
import { useRealtime } from '@promanage/real-time'

function ProjectScreen({ projectId }: Props) {
  const realtime = useRealtime()

  useEffect(() => {
    realtime.joinProject(projectId)

    const unsubscribe = realtime.on('project:updated', (project) => {
      // Update state
    })

    return () => {
      unsubscribe()
      realtime.leaveProject(projectId)
    }
  }, [projectId])
}
```

## Configuration

### Client Config

```typescript
interface RealtimeClientConfig {
  url: string                // WebSocket URL
  auth?: {
    token?: string          // JWT token
  }
  reconnection?: boolean    // Auto-reconnect (default: true)
  reconnectionAttempts?: number  // Max attempts (default: Infinity)
  reconnectionDelay?: number     // Delay between attempts (default: 1000ms)
  timeout?: number          // Connection timeout (default: 20000ms)
}
```

### Server Config

```typescript
interface RealtimeServerConfig {
  cors?: {
    origin: string | string[]
    credentials: boolean
  }
  pingTimeout?: number      // Ping timeout (default: 60000ms)
  pingInterval?: number     // Ping interval (default: 25000ms)
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

## Event Naming Convention

Events follow the pattern: `<resource>:<action>`

Examples:
- `project:created`
- `project:updated`
- `project:deleted`
- `time-entry:created`
- `daily-report:submitted`

## Performance

### Optimizations

- **Room-based broadcasting**: Only send events to relevant users
- **Event debouncing**: Prevent duplicate events
- **Compression**: Enable WebSocket compression
- **Binary support**: For large payloads

### Scaling

For horizontal scaling with multiple server instances:

```typescript
import { Redis } from 'ioredis'
import { createAdapter } from '@socket.io/redis-adapter'

const pubClient = new Redis()
const subClient = pubClient.duplicate()

io.adapter(createAdapter(pubClient, subClient))
```

## Package Structure

```
packages/real-time/
├── src/
│   ├── client.ts       # Client implementation
│   ├── server.ts       # Server implementation
│   ├── events.ts       # Event types
│   ├── hooks/          # React hooks
│   │   └── react.ts
│   └── index.ts        # Main export
└── tests/              # Tests
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

AGPL-3.0 - See [LICENSE](../../LICENSE)
