# API Design Guide

## Overview

ProManage API follows RESTful principles with consistent patterns for all endpoints.

## Base URL

```
Development: http://localhost:3001/api/v1
Production: https://api.promanage.app/v1
```

## Authentication

### JWT Bearer Token

All authenticated requests require JWT token in Authorization header:

```http
Authorization: Bearer <token>
```

### Token Endpoints

```http
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/register
```

## Request/Response Format

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer <token>
Accept: application/json
```

### Success Response

```json
{
  "data": { /* Resource or array of resources */ },
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## HTTP Status Codes

### Success Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE

### Client Error Codes

- `400 Bad Request` - Invalid request format or validation error
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict (duplicate, etc.)
- `422 Unprocessable Entity` - Valid format but business logic error

### Server Error Codes

- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Resource Naming

### URLs

**Use nouns, not verbs:**
```
✅ GET /projects
✅ POST /projects
✅ GET /projects/123
✅ PUT /projects/123

❌ GET /getProjects
❌ POST /createProject
```

**Use plural nouns:**
```
✅ /projects
✅ /users
✅ /time-entries

❌ /project
❌ /user
```

**Use kebab-case:**
```
✅ /daily-reports
✅ /time-entries
✅ /cost-codes

❌ /dailyReports
❌ /daily_reports
```

### Nested Resources

```
GET /projects/123/time-entries
POST /projects/123/time-entries
GET /projects/123/daily-reports
```

**Limit nesting to 2 levels:**
```
✅ /projects/123/time-entries
❌ /organizations/1/projects/123/time-entries/456/comments
```

## HTTP Methods

### GET - Retrieve Resources

```http
# List all projects
GET /projects

# Get specific project
GET /projects/123

# Filter results
GET /projects?status=active&sort=-createdAt

# Pagination
GET /projects?page=2&perPage=20
```

### POST - Create Resource

```http
POST /projects
Content-Type: application/json

{
  "name": "Office Renovation",
  "description": "Renovate main office",
  "budget": 250000,
  "startDate": "2026-03-01"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Location: /projects/124

{
  "data": {
    "id": "124",
    "name": "Office Renovation",
    ...
  }
}
```

### PUT - Full Update

```http
PUT /projects/123
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "budget": 300000,
  "startDate": "2026-03-01"
}
```

### PATCH - Partial Update

```http
PATCH /projects/123
Content-Type: application/json

{
  "status": "completed"
}
```

### DELETE - Remove Resource

```http
DELETE /projects/123
```

**Response:**
```http
HTTP/1.1 204 No Content
```

## Filtering & Sorting

### Filtering

```http
# Single filter
GET /projects?status=active

# Multiple filters
GET /projects?status=active&budget[gte]=100000

# Date ranges
GET /time-entries?startDate[gte]=2026-01-01&startDate[lte]=2026-01-31
```

### Operators

- `[eq]` - Equals (default)
- `[ne]` - Not equals
- `[gt]` - Greater than
- `[gte]` - Greater than or equal
- `[lt]` - Less than
- `[lte]` - Less than or equal
- `[in]` - In array
- `[contains]` - String contains

### Sorting

```http
# Ascending
GET /projects?sort=name

# Descending
GET /projects?sort=-createdAt

# Multiple fields
GET /projects?sort=-status,name
```

### Pagination

```http
# Page-based
GET /projects?page=2&perPage=20

# Cursor-based (for large datasets)
GET /projects?cursor=eyJpZCI6MTIzfQ&limit=20
```

### Field Selection

```http
# Select specific fields
GET /projects?fields=id,name,status

# Include relations
GET /projects?include=organization,timeEntries
```

## Validation

### Request Validation

Use Zod schemas:

```typescript
import { z } from 'zod'

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  budget: z.number().positive(),
  startDate: z.string().datetime(),
  organizationId: z.string().uuid(),
})

// In route handler
fastify.post('/projects', async (request, reply) => {
  try {
    const data = CreateProjectSchema.parse(request.body)
    const project = await createProject(data)
    return reply.code(201).send({ data: project })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      })
    }
    throw error
  }
})
```

## Versioning

### URL Versioning

```http
/api/v1/projects
/api/v2/projects
```

### Deprecation

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Mon, 01 Jan 2027 00:00:00 GMT
Link: </api/v2/projects>; rel="successor-version"
```

## Rate Limiting

### Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

## Caching

### ETags

```http
HTTP/1.1 200 OK
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Cache-Control: max-age=3600
```

**Client conditional request:**
```http
GET /projects/123
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

**Not modified response:**
```http
HTTP/1.1 304 Not Modified
```

## Real-Time (WebSocket)

### Connection

```typescript
import { io } from 'socket.io-client'

const socket = io('ws://localhost:3001', {
  auth: {
    token: '<jwt-token>',
  },
})
```

### Events

```typescript
// Join project room
socket.emit('join:project', { projectId: '123' })

// Listen for updates
socket.on('project:updated', (data) => {
  console.log('Project updated:', data)
})

socket.on('time-entry:created', (data) => {
  console.log('New time entry:', data)
})

// Leave room
socket.emit('leave:project', { projectId: '123' })
```

### Event Naming

```
<resource>:<action>
```

Examples:
- `project:created`
- `project:updated`
- `project:deleted`
- `time-entry:created`
- `daily-report:submitted`

## File Uploads

### Multipart Form Data

```http
POST /uploads
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

[binary data]
--boundary--
```

### Presigned URLs (Recommended)

```http
# 1. Request presigned URL
POST /uploads/presigned
Content-Type: application/json

{
  "filename": "photo.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "data": {
    "uploadUrl": "https://s3.../upload...",
    "fileUrl": "https://s3.../file.jpg",
    "expiresAt": "2026-02-02T12:00:00Z"
  }
}
```

```http
# 2. Upload directly to S3
PUT https://s3.../upload...
Content-Type: image/jpeg

[binary data]
```

## Bulk Operations

### Batch Create

```http
POST /projects/batch
Content-Type: application/json

{
  "items": [
    { "name": "Project 1", ... },
    { "name": "Project 2", ... }
  ]
}
```

### Batch Update

```http
PATCH /projects/batch
Content-Type: application/json

{
  "ids": ["1", "2", "3"],
  "updates": {
    "status": "completed"
  }
}
```

### Batch Delete

```http
DELETE /projects/batch
Content-Type: application/json

{
  "ids": ["1", "2", "3"]
}
```

## Webhooks

### Register Webhook

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://example.com/webhook",
  "events": ["project.created", "time-entry.created"],
  "secret": "webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "project.created",
  "timestamp": "2026-02-02T10:00:00Z",
  "data": {
    "id": "123",
    "name": "New Project",
    ...
  }
}
```

### Signature Verification

```http
X-Webhook-Signature: sha256=<hmac-signature>
```

## Documentation

### OpenAPI/Swagger

Generate OpenAPI spec from code:

```typescript
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'ProManage API',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development',
      },
    ],
  },
})

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
})
```

Access at: `http://localhost:3001/docs`

## Error Handling

### Error Codes

```typescript
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const
```

### Custom Errors

```typescript
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string, id: string) {
    super(
      ErrorCodes.NOT_FOUND,
      `${resource} with id ${id} not found`,
      404
    )
  }
}
```

## Best Practices

### Do's

- ✅ Use consistent naming conventions
- ✅ Version your API
- ✅ Validate all inputs
- ✅ Use proper HTTP status codes
- ✅ Implement rate limiting
- ✅ Document all endpoints
- ✅ Use pagination for lists
- ✅ Handle errors consistently

### Don'ts

- ❌ Expose internal implementation details
- ❌ Return different formats from same endpoint
- ❌ Use verbs in URL paths
- ❌ Ignore security best practices
- ❌ Skip input validation
- ❌ Return stack traces in production
- ❌ Use GET for state-changing operations

---

**Last Updated**: 2026-02-02
**Status**: Complete
