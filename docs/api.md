# API Documentation

Complete API reference for Tarsight backend and frontend endpoints.

## Authentication

Most endpoints require authentication via Supabase JWT:

```typescript
// Client-side authentication
import { supabase } from '@/lib/supabase/client'

const { data: { user } } = await supabase.auth.getUser()
const token = (await supabase.auth.getSession()).data.session?.access_token

// Include in requests
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Test Execution Endpoints

### Execute Tests

`POST /api/test/execute`

Execute test cases with various filtering options.

**Request Body:**

```typescript
interface ExecuteRequest {
  // Specific test case IDs (UUIDs)
  test_case_ids?: string[]

  // Test case identifiers (e.g., API001)
  case_ids?: string[]

  // Module IDs to execute all tests in module
  module_ids?: string[]

  // Execution mode
  mode: 'preview' | 'full' | 'quick'

  // Optional: Custom execution name
  execution_name?: string

  // Optional: Tags to filter by
  tags?: string[]
}
```

**Response:**

```typescript
interface ExecuteResponse {
  execution_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  total_tests: number
  message: string
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/test/execute \
  -H "Content-Type: application/json" \
  -d '{
    "case_ids": ["API001", "API002"],
    "mode": "full"
  }'
```

### Preview Execution

`POST /api/test/preview`

Preview which tests would be executed without running them.

**Request Body:**

```typescript
interface PreviewRequest {
  test_case_ids?: string[]
  case_ids?: string[]
  module_ids?: string[]
  tags?: string[]
}
```

**Response:**

```typescript
interface PreviewResponse {
  total_tests: number
  test_cases: Array<{
    id: string
    case_id: string
    test_name: string
    module: string
    method: string
    url: string
  }>
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/test/preview \
  -H "Content-Type: application/json" \
  -d '{
    "case_ids": ["API001", "API002"]
  }'
```

## Queue Management Endpoints

### Get Queue Status

`GET /api/queue/status`

Get current queue status and statistics.

**Response:**

```typescript
interface QueueStatusResponse {
  status: 'idle' | 'running'
  currentExecution?: {
    id: string
    name: string
    startedAt: string
  }
  queue: Array<{
    id: string
    name: string
    queuedAt: string
  }>
  stats: {
    completed: number
    failed: number
    running: number
    queued: number
  }
}
```

### Update Queue Config

`PUT /api/queue/config`

Update queue configuration settings.

**Request Body:**

```typescript
interface QueueConfigRequest {
  maxConcurrent?: number  // Default: 1
  timeout?: number        // Default: 300 (seconds)
  retryOnFailure?: boolean
  maxRetries?: number     // Default: 0
}
```

**Response:**

```typescript
interface QueueConfigResponse {
  success: boolean
  config: QueueConfigRequest
}
```

### Clear Queue

`POST /api/queue/clear`

Clear all pending items from the queue.

**Response:**

```typescript
interface ClearQueueResponse {
  success: boolean
  cleared: number
}
```

### Queue Diagnostics

`GET /api/queue/diagnostics`

Get detailed diagnostics about queue health.

**Response:**

```typescript
interface QueueDiagnosticsResponse {
  status: 'healthy' | 'degraded' | 'error'
  uptime: number  // seconds
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  lastExecution?: {
    id: string
    status: string
    duration: number
  }
}
```

## Test Case Endpoints

### Generate Test Case ID

`GET /api/test-cases/generate-id?module_id={uuid}`

Generate next sequential test case ID for a module.

**Response:**

```typescript
interface GenerateIdResponse {
  case_id: string  // e.g., PRJ001-MOD001-003
}
```

### List Test Cases

`GET /api/test-cases`

Get paginated list of test cases with filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `module_id` | string | Filter by module |
| `level` | string | Filter by priority (P0, P1, P2, P3) |
| `is_active` | boolean | Filter active status |
| `search` | string | Search in case_id or test_name |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |

**Response:**

```typescript
interface TestCasesResponse {
  data: TestCase[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
```

### Create Test Case

`POST /api/test-cases`

Create a new test case.

**Request Body:**

```typescript
interface CreateTestCaseRequest {
  case_id: string
  test_name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  expected_status: number
  module_id: string
  description?: string
  tags?: string[]
  headers?: object
  request_body?: object
  variables?: object
  validation_rules?: object
  level?: 'P0' | 'P1' | 'P2' | 'P3'
  is_active?: boolean
}
```

### Update Test Case

`PUT /api/test-cases/{id}`

Update an existing test case. Same body as create.

### Delete Test Case

`DELETE /api/test-cases/{id}`

Delete a test case.

**Response:**

```typescript
interface DeleteResponse {
  success: boolean
  message: string
}
```

## Module Endpoints

### List Modules

`GET /api/modules`

Get all modules for the current project.

**Response:**

```typescript
interface ModulesResponse {
  data: Module[]
}

interface Module {
  id: string
  name: string
  module_code?: string
  project_id: string
  test_case_count?: number
}
```

### Create Module

`POST /api/modules`

**Request Body:**

```typescript
interface CreateModuleRequest {
  name: string
  module_code?: string
}
```

## Execution Endpoints

### Get Execution Details

`GET /api/executions/{id}`

Get detailed execution results.

**Response:**

```typescript
interface ExecutionDetailsResponse {
  execution: {
    id: string
    execution_name: string
    status: string
    created_at: string
    completed_at?: string
    total_tests: number
    passed: number
    failed: number
    skipped: number
  }
  results: TestResult[]
}

interface TestResult {
  id: string
  test_case_id: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error_message?: string
  response_info?: {
    Status_Code: number
    Body: any
    Headers: object
  }
  test_case?: {
    case_id: string
    test_name: string
    module: {
      name: string
    }
  }
}
```

### List Executions

`GET /api/executions`

Get paginated list of executions.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `page` | number | Page number |
| `limit` | number | Items per page |

## Analytics Endpoints

### Get Statistics

`GET /api/analytics/stats`

Get test execution statistics.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | `7d`, `30d`, `90d`, `all` |

**Response:**

```typescript
interface StatsResponse {
  totalExecutions: number
  totalTests: number
  passRate: number
  avgDuration: number
  byLevel: {
    P0: { total: number; passed: number; passRate: number }
    P1: { total: number; passed: number; passRate: number }
    P2: { total: number; passed: number; passRate: number }
    P3: { total: number; passed: number; passRate: number }
  }
  byModule: Array<{
    name: string
    total: number
    passed: number
    passRate: number
  }>
}
```

## Error Responses

All endpoints may return error responses:

```typescript
interface ErrorResponse {
  error: string
  message: string
  details?: any
}
```

**Common HTTP Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

API endpoints are rate limited:

- Unauthenticated: 10 requests/minute
- Authenticated: 100 requests/minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704844800
```

## WebSocket Events

For real-time updates, subscribe to Supabase realtime:

```typescript
const channel = supabase
  .channel('test-executions')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'test_executions'
  }, (payload) => {
    console.log('Execution updated:', payload)
  })
  .subscribe()
```
