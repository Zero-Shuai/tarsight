# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tarsight** is a cloud-based API testing and monitoring platform with three-tier architecture:
- **Frontend**: Next.js 14 dashboard (TypeScript, Tailwind CSS, shadcn/ui)
- **Backend**: Python test execution engine with pytest and Supabase integration
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)

## Architecture

### Key Components

**Frontend** (`tarsight-dashboard/`):
- `app/` - Next.js App Router pages and API routes
- `lib/types/database.ts` - **Central TypeScript type definitions**
- `lib/test-execution-queue.ts` - Test execution with spawn-based Python execution
- `components/` - React components organized by feature

**Backend** (`supabase_version/`):
- `run.py` - **Main test execution entry point**
- `utils/supabase_client.py` - Database operations client
- `utils/test_tarsight.py` - Pytest with custom recorder
- `testcases/` - Test case implementations

**Database Schema** (Supabase):
- Core tables: `projects`, `modules`, `test_cases`, `test_executions`, `test_results`
- Uses UUIDs for primary keys
- JSONB columns for flexible data storage

## Common Development Commands

### Frontend
```bash
cd tarsight-dashboard
npm run dev             # Start dev server
npm run build           # Build for production
npm run lint            # Run ESLint
```

### Backend
```bash
cd supabase_version
.venv/bin/python run.py           # Interactive execution
.venv/bin/python run.py --all     # Execute all modules
```

### Test Execution (via API)
```json
POST /api/test/execute
{
  "test_case_ids": ["uuid1", "uuid2"],
  "case_ids": ["API001", "API002"],
  "mode": "full"
}
```

### Utilities
```bash
# Clean old reports
./scripts/cleanup_reports.sh --keep-days 7

# Production update
sudo bash scripts/update-production.sh

# Health check
bash scripts/health-check.sh --verbose
```

## Environment Configuration

### Frontend (`.env.local`)
```bash
PROJECT_ROOT=/absolute/path/to/supabase_version
PYTHON_PATH=/absolute/path/to/.venv/bin/python
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Admin operations
NEXT_PUBLIC_PROJECT_ID=...
```

### Backend (`.env`)
```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
BASE_URL=https://api-endpoint.com
API_TOKEN=...
DATA_SOURCE=supabase
TARGET_PROJECT=uuid
```

## TypeScript 编码规范

### 核心原则

1. **类型优先** - Always use explicit type definitions, avoid relying on type inference
2. **严格模式** - TypeScript strict mode enabled, no `any` allowed
3. **显式优于隐式** - Declare types explicitly when uncertain
4. **外部库验证** - Check docs before using third-party library components

### 类型定义规范

**✅ DO - Explicit type declarations**:
```typescript
// For dynamic object indexing
const executionTypeNames: Record<string, string> = {
  'specific': '指定用例',
  'all': '全部用例'
}

// For union types
let value: string | number | boolean = input

// For function returns
interface User { id: string; name: string }
function getUserData(id: string): User {
  return { id, name: 'John' }
}
```

**❌ DON'T - Rely on type inference**:
```typescript
// This will cause type errors
const executionTypeNames = { 'specific': '指定用例' }
let value = input  // Infers as string only
function getUserData(id: string) { return { id, name: 'John' } }
```

### shadcn/ui 组件使用

**⚠️ Common Pitfalls**:
- Button does NOT support: `asChild`, `variant="destructive"`, `size="icon"`
- Always check component types before using unsupported attributes
- Use Link as wrapper, not asChild prop

**✅ Correct**:
```tsx
<Link href="/test-cases/new">
  <Button className="rounded-lg">新建</Button>
</Link>
```

**❌ Wrong**:
```tsx
<Button asChild className="rounded-lg">
  <Link href="/test-cases/new">新建</Link>
</Button>
```

### Supabase 关联查询

**Critical Rule**: Supabase JOIN queries always return **arrays**, even for single records.

**✅ Correct**:
```typescript
const { data } = await supabase
  .from('test_cases')
  .select('*, modules(name)')

// Access first element of array
const moduleName = data[0]?.modules?.[0]?.name || 'Unknown'
```

**❌ Wrong**:
```typescript
// This causes type error - modules is an array
const moduleName = data[0]?.modules?.name
```

### 类型检查

```bash
# Full type check
cd tarsight-dashboard
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

## Known Issues & Solutions

### Alpine Linux Compatibility

**Problem**: Docker uses Alpine Linux which has `/bin/sh` but NOT `/bin/bash`

**Solution**: Always use `/bin/sh` instead of `/bin/bash`

```typescript
// ❌ Wrong
const child = spawn('/bin/bash', ['-c', command])

// ✅ Correct
const child = spawn('/bin/sh', ['-c', command])
```

**File**: `lib/test-execution-queue.ts:260`

### Next.js 14 App Router - Component Naming

**Problem**: Server and Client components with same name cause infinite recursion

**✅ Solution**: Use import aliases

```tsx
// ✅ Correct
import { ExecutionDetailPage as ExecutionDetailPageClient } from '@/components/execution-detail-page'

export default async function ExecutionDetailPageRoute({ params }) {
  return <ExecutionDetailPageClient />
}
```

**❌ Wrong**:
```tsx
import { ExecutionDetailPage } from '@/components/execution-detail-page'

export default function ExecutionDetailPage({ params }) {
  // Calls itself recursively!
}
```

### Supabase Nested Query Data

**Problem**: Supabase returns nested structure but components expect flat structure

**✅ Solution**: Flatten nested data before passing to components

```typescript
const flattenedResults = testResults.map((result: any) => ({
  ...result,
  // Extract nested fields to top-level
  case_id: result.test_case?.case_id,
  test_name: result.test_case?.test_name,
  module_name: result.test_case?.module?.name || 'Unknown',
  response_time: result.duration ? Math.round(Number(result.duration) * 1000) : 0,
  response_code: result.response_info?.Code || result.response_info?.Status_Code
}))
```

## Development Best Practices

### MCP Services Integration

**Available MCP Servers**:
- `plugin_supabase_supabase` - Database operations (migrations, queries)
- `plugin_context7_context7` - Library documentation
- `github` - Repository operations
- `web-reader` / `web-search-prime` - Web content retrieval

**Best Practices**:
1. Use `mcp__plugin_supabase_supabase__apply_migration()` for DDL operations
2. Use `mcp__plugin_context7_context7__query-docs()` for library questions
3. Create versioned `.sql` files for production migrations

### Frontend Component Dependencies

**Check before using**:
```bash
# Verify component exists
ls components/ui/select.tsx
ls components/ui/checkbox.tsx

# Install dependencies
npm install @radix-ui/react-select
```

**Common missing components**: `select.tsx`, `checkbox.tsx`, `alert.tsx`, `dialog.tsx`

### Page Structure Patterns

**Server vs Client Components**:
- Server components: Data fetching, static content
- Client components: Interactivity, forms, hooks

**Pattern**:
```tsx
// Server component (page.tsx)
async function NewPage() {
  const data = await fetchData()
  return <ClientFormWrapper data={data} />
}

// Client wrapper (wrapper.tsx)
'use client'
export function ClientFormWrapper({ data }) {
  const router = useRouter()
  return <Form onSuccess={() => router.push('/list')} />
}
```

### Database Schema Changes

**Workflow**:
1. Use MCP `apply_migration()` for development
2. Create versioned `.sql` file for production
3. Update TypeScript types in `lib/types/database.ts`
4. Update all affected components
5. Test with real data

## Deployment

### GitHub Actions (Recommended)

**Quick Start**:
1. Add GitHub Secrets (PRODUCTION_HOST, PRODUCTION_USER, PRODUCTION_SSH_KEY)
2. Push to master → Auto-deploys

**Skip Type Checking**: Add `[no-lint]` to commit message
```bash
git commit -m "feat: new feature [no-lint]"
```

**Documentation**:
- Quick Start: [AUTO_DEPLOY_QUICKSTART.md](./AUTO_DEPLOY_QUICKSTART.md)
- Full Guide: [docs/guides/GITHUB_ACTIONS_DEPLOYMENT.md](./docs/guides/GITHUB_ACTIONS_DEPLOYMENT.md)

### Manual Deployment (Docker)

```bash
cd /opt/tarsight

# Standard update
sudo bash scripts/update-production.sh

# Skip type checking
sudo bash scripts/update-production.sh --no-lint

# Manual update
git pull origin master
docker compose up -d --build
docker compose logs -f frontend
```

### Health Check

```bash
# Basic check
bash scripts/health-check.sh

# Verbose mode
bash scripts/health-check.sh --verbose
```

## Testing

```bash
# Single test
cd supabase_version
.venv/bin/python -m pytest testcases/test_module_name.py::test_function_name -v

# With debugging
.venv/bin/python -m pytest testcases/test_module_name.py -v -s
```

## Key Files

- `supabase_version/run.py:1-100` - Test execution orchestration
- `tarsight-dashboard/app/api/test/execute/route.ts:1-50` - API endpoint
- `tarsight-dashboard/lib/types/database.ts` - **Database schema types**
- `tarsight-dashboard/lib/test-execution-queue.ts` - **CRITICAL: Queue management**

## Quick Reference

### Check TypeScript Errors
```bash
cd tarsight-dashboard
npx tsc --noEmit
```

### Fix Alpine Compatibility
```bash
# Search for /bin/bash usage
grep -r "/bin/bash" tarsight-dashboard/ --include="*.ts" --include="*.tsx"
```

### Verify Docker Build
```bash
docker compose build --no-cache frontend
docker compose up -d frontend
docker compose logs -f frontend
```

## Troubleshooting

### Execution Stuck in "Running"
Check database for stuck executions with service role key

### Test Execution Fails
1. Verify Alpine compatibility: `docker compose exec frontend which /bin/sh`
2. Check Python: `docker compose exec frontend python3 --version`
3. Check environment variables: `EXECUTION_ID`, `CASE_IDS`, `TARGET_PROJECT`

### Common Fixes
- Change `/bin/bash` to `/bin/sh`
- Verify Python 3 installed in Docker
- Check environment variable passing
- Review `lib/test-execution-queue.ts` spawn command

## Documentation Index

**Core Documentation**:
- [README.md](./README.md) - Project overview
- [docs/architecture/QUICK_REFERENCE.md](./docs/architecture/QUICK_REFERENCE.md) - Command reference
- [docs/guides/PRODUCTION_UPDATE_GUIDE.md](./docs/guides/PRODUCTION_UPDATE_GUIDE.md) - Deployment guide
- [docs/troubleshooting/INDEX.md](./docs/troubleshooting/INDEX.md) - Common issues

**Design Guidelines**:
- [docs/guides/UI_UX_DESIGN_SYSTEM.md](./docs/guides/UI_UX_DESIGN_SYSTEM.md) - Complete UI/UX design system

**Development Logs**:
- [docs/development-logs/2026-01-07.md](./docs/development-logs/2026-01-07.md) - Execution detail page refactoring

**Troubleshooting Guides**:
- [docs/troubleshooting/GITHUB_ACTIONS_ISSUES.md](./docs/troubleshooting/GITHUB_ACTIONS_ISSUES.md) - GitHub Actions deployment issues
- [docs/troubleshooting/TYPESCRIPT_ISSUES.md](./docs/troubleshooting/TYPESCRIPT_ISSUES.md) - TypeScript type errors

## Important Notes

- This project uses **Alpine Linux** in Docker containers
- Always use `/bin/sh` instead of `/bin/bash`
- TypeScript strict mode is enabled
- Test execution uses Node.js `spawn()` for Python subprocesses
- Use service role key for admin operations
- Enable RLS on all Supabase tables
- Check health regularly to catch issues early

---

**Last Updated**: 2026-01-08
**Character Count**: ~8,500 (target: < 30,000)
