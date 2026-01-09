# Troubleshooting Guide

Common issues and solutions for Tarsight development and deployment.

## Alpine Linux Compatibility

### Problem

Docker uses Alpine Linux which has `/bin/sh` but NOT `/bin/bash`.

### Symptoms

- Test execution fails with "command not found" errors
- Spawn process exits with code 127
- Logs show `/bin/bash: No such file or directory`

### Solution

Always use `/bin/sh` instead of `/bin/bash`:

```typescript
// ❌ Wrong
const child = spawn('/bin/bash', ['-c', command])

// ✅ Correct
const child = spawn('/bin/sh', ['-c', command])
```

**Location:** `lib/test-execution-queue.ts:260`

### Verification

```bash
# Check available shell in Docker
docker compose exec frontend which /bin/sh
docker compose exec frontend which /bin/bash  # Should return "not found"
```

## Next.js 16 App Router Naming Conflicts

### Problem

Server and Client components with same name cause infinite recursion.

### Symptoms

- Page renders blank
- Browser hangs or crashes
- Console shows "Maximum call stack size exceeded"

### Solution

Use import aliases for client components:

```tsx
// ✅ Correct - Use alias
import { ExecutionDetailPage as ExecutionDetailPageClient } from '@/components/execution-detail-page'

export default async function ExecutionDetailPageRoute({ params }) {
  const data = await fetchData()
  return <ExecutionDetailPageClient executionId={params.id} />
}

// ❌ Wrong - Same name
import { ExecutionDetailPage } from '@/components/execution-detail-page'

export default function ExecutionDetailPage({ params }) {
  // Calls itself recursively!
}
```

## Supabase Nested Query Data Structure

### Problem

Supabase returns nested structure but components expect flat structure.

### Symptoms

- Type errors accessing nested properties
- `undefined` values when accessing `modules.name`
- TypeScript errors: "Property 'name' does not exist on type 'Module[]'"

### Solution

Flatten nested data before passing to components:

```typescript
const flattenedResults = testResults.map((result: any) => ({
  ...result,
  // Extract nested fields to top-level
  case_id: result.test_case?.case_id,
  test_name: result.test_case?.test_name,
  module_name: result.test_case?.module?.[0]?.name || 'Unknown',
  response_time: result.duration ? Math.round(Number(result.duration) * 1000) : 0,
  response_code: result.response_info?.Code || result.response_info?.Status_Code
}))
```

### Remember

Supabase JOIN queries always return **arrays**, even for single records:

```typescript
// ✅ Correct - Access as array
const moduleName = data[0]?.modules?.[0]?.name || 'Unknown'

// ❌ Wrong - Direct access
const moduleName = data[0]?.modules?.name  // Type error!
```

## TypeScript Type Errors

### Problem: Implicit Any

```typescript
// ❌ Error: Parameter 'data' implicitly has 'any' type
function processData(data) {
  return data.map(item => item.name)
}

// ✅ Fix: Add explicit type
interface Item { name: string }
function processData(data: Item[]) {
  return data.map(item => item.name)
}
```

### Problem: Dynamic Object Access

```typescript
// ❌ Error: No index signature
const config = { mode: 'specific' }
const mode = config[type]

// ✅ Fix: Use Record type
const config: Record<string, string> = { mode: 'specific' }
const mode = config[type]
```

### Problem: Union Type Narrowing

```typescript
// ❌ Error: Type 'string' is not assignable to type 'boolean'
function setValue(value: string | boolean) {
  if (value === 'true') {
    return true  // Error!
  }
}

// ✅ Fix: Explicit type assertion
function setValue(value: string | boolean) {
  if (value === 'true') {
    return true as boolean
  }
  return value
}
```

## Port Conflicts

### Problem

Port 3000 already in use.

### Solutions

```bash
# Find what's using the port
lsof -i :3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

## Docker Build Issues

### Problem: Build fails during npm install

```bash
# Clear cache and rebuild
docker compose down
docker system prune -a
docker compose build --no-cache frontend
docker compose up -d frontend

# Check logs
docker compose logs -f frontend
```

### Problem: Container exits immediately

```bash
# Check logs for errors
docker compose logs frontend

# Common causes:
# 1. Missing environment variables
docker compose exec frontend env | grep NEXT_PUBLIC

# 2. Invalid command
docker compose exec frontend which node
docker compose exec frontend which npm
```

## Database Connection Issues

### Problem: Cannot connect to Supabase

```bash
# Verify credentials
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test connection
curl $SUPABASE_URL

# Check service role key is correct (for admin operations)
# Service role key is longer than anon key
```

### Problem: RLS policy prevents access

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View policies
SELECT * FROM pg_policies
WHERE tablename = 'test_cases';

-- Temporarily disable (for debugging only!)
ALTER TABLE test_cases DISABLE ROW LEVEL SECURITY;
```

## Test Execution Issues

### Problem: Tests stuck in "Running" state

```bash
# Check for stuck executions in database
psql $DATABASE_URL

SELECT id, status, created_at
FROM test_executions
WHERE status = 'running'
ORDER BY created_at;

-- Update stuck executions
UPDATE test_executions
SET status = 'failed'
WHERE status = 'running'
AND created_at < NOW() - INTERVAL '1 hour';
```

### Problem: Python subprocess fails

```bash
# Verify Python is accessible
docker compose exec frontend python3 --version

# Check PROJECT_ROOT
docker compose exec frontend ls -la $PROJECT_ROOT

# Check PYTHON_PATH
docker compose exec frontend ls -la $PYTHON_PATH

# Test manual execution
docker compose exec frontend /bin/sh -c "$PYTHON_PATH $PROJECT_ROOT/run.py --help"
```

## GitHub Actions Deployment Failures

### Problem: Deployment fails type check

```bash
# Solution 1: Fix type errors
cd frontend
npx tsc --noEmit

# Solution 2: Skip lint for this commit
git commit -m "feat: new feature [no-lint]"
```

### Problem: SSH connection fails

```bash
# Test SSH connection
ssh -i ~/.ssh/production_key user@host

# Check GitHub Secret
# PRODUCTION_SSH_KEY should include:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----

# Add newlines properly
echo "$PRODUCTION_SSH_KEY" > /tmp/key
chmod 600 /tmp/key
ssh -i /tmp/key user@host
```

## Performance Issues

### Problem: Page loads slowly

```bash
# Check bundle size
npm run build
# Look for large chunks in output

# Enable React dev tools profiler
# Identify slow components

# Add React.memo to expensive components
export const MyComponent = memo(MyComponentComponent)
```

### Problem: Too many re-renders

```typescript
// Wrap handlers with useCallback
const handleClick = useCallback(() => {
  // handler logic
}, [dependency])

// Memoize expensive calculations
const sorted = useMemo(() => {
  return data.sort(...)
}, [data])
```

## Health Check

Run comprehensive health check:

```bash
bash scripts/health-check.sh --verbose

# Checks:
# - Docker containers running
# - Frontend responding
# - Python accessible
# - Environment variables set
# - Database connection
```

## Getting Help

1. Check logs: `docker compose logs -f frontend`
2. Run health check: `bash scripts/health-check.sh --verbose`
3. Check documentation: `docs/` directory
4. Review GitHub issues: `docs/troubleshooting/`
