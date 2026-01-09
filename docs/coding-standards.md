# Coding Standards

TypeScript, React, Supabase, and shadcn/ui coding standards for Tarsight.

## TypeScript Standards

### Core Principles

1. **Type First** - Always use explicit type definitions
2. **Strict Mode** - No implicit `any`, strict null checks enabled
3. **Explicit Over Implicit** - Declare types explicitly when uncertain
4. **Validate External Libraries** - Check docs before using third-party components

### Type Definitions

**✅ DO - Explicit type declarations:**

```typescript
// For dynamic object indexing
const executionTypeNames: Record<string, string> = {
  'specific': '指定用例',
  'all': '全部用例'
}

// For union types with multiple possibilities
let value: string | number | boolean = input

// For function return types
interface User {
  id: string
  name: string
}

function getUserData(id: string): User {
  return { id, name: 'John' }
}

// For array item types
const testCases: TestCase[] = await fetchTestCases()

// For optional properties
interface TestCase {
  id: string
  description?: string  // Optional
  tags: string[]        // Required array
}
```

**❌ DON'T - Rely on type inference:**

```typescript
// This causes type errors with dynamic access
const executionTypeNames = { 'specific': '指定用例' }
// Error: No index signature

// This narrows type too much
let value = input
// Error: Type is inferred as string only

// Missing return type
function getUserData(id: string) {
  return { id, name: 'John' }
}
// Error: Return type not explicitly declared
```

### Type Guards

```typescript
// Type guard for checking object types
function isTestCase(data: unknown): data is TestCase {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'test_name' in data
  )
}

// Usage
if (isTestCase(input)) {
  console.log(input.test_name)  // TypeScript knows this is safe
}
```

## React Standards

### Component Structure

```typescript
// 1. Imports (external first, then internal)
import { useState, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

// 2. Type definitions
interface MyComponentProps {
  data: TestCase[]
  onUpdate: (id: string) => void
}

// 3. Helper functions (outside component)
const formatTestCase = (testCase: TestCase): string => {
  return `${testCase.case_id}: ${testCase.test_name}`
}

// 4. Component function
function MyComponentComponent({ data, onUpdate }: MyComponentProps) {
  // Hooks
  const [loading, setLoading] = useState(false)

  // Memoized callbacks
  const handleUpdate = useCallback((id: string) => {
    onUpdate(id)
  }, [onUpdate])

  // Memoized values
  const formatted = useMemo(() => {
    return data.map(formatTestCase)
  }, [data])

  // Render
  return (
    <div>
      {formatted.map(item => (
        <div key={item.id}>{item}</div>
      ))}
    </div>
  )
}

// 5. Export with memo
export const MyComponent = memo(MyComponentComponent)
```

### Performance Best Practices

```typescript
// ✅ Move helper functions outside component
const parseJson = (value: string): object => {
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function MyComponent({ data }) {
  // ✅ Wrap handlers with useCallback
  const handleClick = useCallback(() => {
    console.log(data.id)
  }, [data.id])

  // ✅ Memoize expensive computations
  const sorted = useMemo(() => {
    return data.sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  // ✅ Use React.memo for export
  return <div onClick={handleClick}>{sorted[0]?.name}</div>
}

export const MyComponent = memo(MyComponentComponent)
```

## shadcn/ui Component Standards

### Button Component (Custom Implementation)

**Note**: This project uses a custom Button component, not the standard shadcn/ui Button.

**Supported variants:** `default`, `outline`, `ghost`
**Supported sizes:** `default`, `sm`, `lg`

```tsx
// ✅ Correct
<Button variant="default">Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// ❌ Not supported
<Button variant="destructive">  // Error!
<Button size="icon">              // Error!
<Button asChild={...}>            // Error!
```

**Link Pattern:**
```tsx
// ✅ Correct - Wrap Link around Button
<Link href="/test-cases/new">
  <Button>新建</Button>
</Link>
```

**Check Component Exists First:**

```bash
# Verify component exists before using
ls components/ui/select.tsx
ls components/ui/checkbox.tsx

# If missing, install
npx shadcn-ui@latest add select
```

**Common Missing Components:**
- `select.tsx`
- `checkbox.tsx`
- `alert.tsx`
- `dialog.tsx`
- `tabs.tsx`

## Supabase Standards

### Nested Query Handling

**Critical Rule**: Supabase JOIN queries always return **arrays**, even for single records.

```typescript
// ✅ Correct - Handle as array
const { data } = await supabase
  .from('test_cases')
  .select('*, modules(name)')

// Access first element of array
const moduleName = data[0]?.modules?.[0]?.name || 'Unknown'

// ❌ Wrong - Direct access
const moduleName = data[0]?.modules?.name  // Type error!
```

### Type-Safe Queries

```typescript
// Define query types
type TestCaseWithModule = TestCase & {
  modules: Module[]
}

// Use typed query
const { data, error } = await supabase
  .from('test_cases')
  .select<'*', TestCaseWithModule>('*, modules(*)')

if (error) {
  // Handle error
  console.error('Query failed:', error)
  return []
}

// Safe access with default
const testCase = data?.[0]
const moduleName = testCase?.modules?.[0]?.name ?? 'Unknown'
```

### RLS Policy Patterns

```sql
-- Users can view own data
CREATE POLICY "Users can view own test_cases"
ON test_cases FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own data
CREATE POLICY "Users can insert own test_cases"
ON test_cases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own data
CREATE POLICY "Users can update own test_cases"
ON test_cases FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own data
CREATE POLICY "Users can delete own test_cases"
ON test_cases FOR DELETE
USING (auth.uid() = user_id);
```

## File Naming Conventions

### Components

```typescript
// Component files: kebab-case
test-case-form.tsx
test-execution-dialog.tsx
execution-detail-page.tsx

// Export: PascalCase
export function TestCaseForm() { }
export const TestExecutionDialog = memo(...)
```

### API Routes

```
app/api/
├── test/
│   ├── execute/route.ts
│   └── preview/route.ts
├── queue/
│   ├── config/route.ts
│   └── status/route.ts
└── test-cases/
    └── generate-id/route.ts
```

### Type Files

```
lib/types/
├── database.ts      # Database schema types
├── test-execution.ts # Test execution types
└── index.ts         # Re-exports
```

## Code Quality

### Linting

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Type Checking

```bash
# Full type check
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npx tsc --noEmit"
    }
  }
}
```
