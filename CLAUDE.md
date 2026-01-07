# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tarsight** is a cloud-based API testing and monitoring platform. The system consists of:
- **Frontend**: Next.js 14 dashboard for test management and analytics (TypeScript, Tailwind CSS, shadcn/ui)
- **Backend**: Python test execution engine using pytest with Supabase integration
- **Database**: Supabase (PostgreSQL) for all data storage with Row Level Security (RLS)

## Architecture

### Three-Tier Architecture
```
Frontend (Next.js)    →    Backend (Python)    →    Database (Supabase)
Dashboard & UI              Test Execution           Data Storage
```

### Key Components

**Frontend** (`tarsight-dashboard/`):
- `app/` - Next.js App Router pages and API routes
- `lib/types/database.ts` - **Central TypeScript type definitions for all database tables**
- `lib/utils/` - Shared utilities (error handling, logging, formatters)
- `lib/supabase/` - Supabase client configuration
- `lib/test-execution-queue.ts` - Test execution queue with spawn-based Python execution
- `components/` - React components organized by feature

**Backend** (`supabase_version/`):
- `run.py` - **Main test execution entry point** - orchestrates test selection, execution, and result import
- `utils/supabase_client.py` - Database operations client
- `utils/test_tarsight.py` - Pytest implementation with custom recorder
- `utils/request_util.py` - HTTP request handling
- `utils/json_test_recorder.py` - Test result recording to JSON
- `utils/env_config.py` - Environment configuration management
- `testcases/` - Test case implementations (organized by module)

**Database Schema** (Supabase):
- Core tables: `projects`, `modules`, `test_cases`, `test_executions`, `test_results`
- Uses UUIDs for primary keys
- JSONB columns for flexible data storage (headers, request_body, response_info)
- Foreign key relationships with cascading deletes

## Common Development Commands

### Frontend Development
```bash
cd tarsight-dashboard
npm install              # Install dependencies
npm run dev             # Start dev server (localhost:3000)
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
```

### Backend Development
```bash
cd supabase_version
pip install -r requirements.txt    # Install dependencies
.venv/bin/python run.py           # Interactive test execution
.venv/bin/python run.py --all     # Execute all modules
.venv/bin/python run.py --case-ids="API001,API002"  # Specific cases
```

### Test Execution (via API)
Tests are triggered from the frontend via `POST /api/test/execute` with:
```json
{
  "test_case_ids": ["uuid1", "uuid2"],
  "case_ids": ["API001", "API002"],
  "mode": "full"  // or "simple" for direct pytest
}
```

The API route calls `run.py` which:
1. Fetches test cases from Supabase
2. Executes tests using pytest with custom recorder
3. Saves results to JSON file
4. Imports JSON results back to Supabase

### Utility Scripts
```bash
# Clean up old test reports (keeps last 7 days)
./scripts/cleanup_reports.sh --keep-days 7

# Production environment update (Ubuntu server)
sudo bash scripts/update-production.sh [--no-lint]

# Health check
bash scripts/health-check.sh [--verbose]
```

## Environment Configuration

### Frontend (`.env.local`)
```bash
# Python backend paths
PROJECT_ROOT=/absolute/path/to/supabase_version
PYTHON_PATH=/absolute/path/to/.venv/bin/python

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Required for admin operations
NEXT_PUBLIC_PROJECT_ID=...
```

### Backend (`.env`)
```bash
# Supabase
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Target API for testing
BASE_URL=https://api-endpoint.com
API_TOKEN=...

# Configuration
DATA_SOURCE=supabase
TARGET_PROJECT=uuid  # Default project ID for execution
```

## Important Patterns

### Type Safety
- All database operations use types from `lib/types/database.ts`
- TypeScript types match Supabase table schema exactly
- Use these types when creating API responses or database queries

---

## 📘 TypeScript 编码规范 (2026-01-07)

### 核心原则

1. **类型优先** - 始终优先使用明确的类型定义，避免依赖类型推断
2. **严格模式** - 项目启用了 TypeScript 严格模式，不允许使用 `any`
3. **显式优于隐式** - 不确定类型时，明确声明而不是让 TypeScript 推断
4. **外部库验证** - 使用第三方库组件前，先查阅文档确认支持的属性

---

### 🎯 类型定义规范

#### 1. 对象类型定义

**❌ 错误示例** - 依赖类型推断：
```typescript
const executionTypeNames = {
  'specific': '指定用例',
  'all': '全部用例',
  'modules': '模块执行'
}

// 问题：executionTypeNames 的类型被推断为字面量类型
// 使用字符串索引时会报错
const key: string = getExecutionType()
const name = executionTypeNames[key] // ❌ 类型错误
```

**✅ 正确示例** - 明确类型声明：
```typescript
const executionTypeNames: Record<string, string> = {
  'specific': '指定用例',
  'all': '全部用例',
  'modules': '模块执行'
}

// 或者使用更具体的类型
type ExecutionType = 'specific' | 'all' | 'modules'
const executionTypeNames: Record<ExecutionType, string> = {
  'specific': '指定用例',
  'all': '全部用例',
  'modules': '模块执行'
}

const key: ExecutionType = getExecutionType()
const name = executionTypeNames[key] // ✅ 类型正确
```

#### 2. 变量类型声明

**❌ 错误示例** - 让 TypeScript 推断联合类型：
```typescript
let value = input // 推断为 string
value = 123 // ❌ 类型错误
```

**✅ 正确示例** - 明确联合类型：
```typescript
let value: string | number | boolean = input
value = 123 // ✅ 正确
value = true // ✅ 正确
```

#### 3. 函数参数和返回值

**❌ 错误示例** - 省略返回值类型：
```typescript
function getUserData(id: string) {
  return { id, name: 'John' } // 推断返回类型，可能不符合预期
}
```

**✅ 正确示例** - 明确返回值类型：
```typescript
interface User {
  id: string
  name: string
}

function getUserData(id: string): User {
  return { id, name: 'John' }
}
```

---

### 🧩 组件使用规范

#### 1. shadcn/ui 组件属性

**常见错误**：使用不存在的属性

```typescript
// ❌ Button 组件不支持 asChild 属性
<Button asChild className="rounded-lg">
  <Link href="/test-cases/new">新建</Link>
</Button>

// ✅ 正确写法：嵌套组件
<Link href="/test-cases/new">
  <Button className="rounded-lg">新建</Button>
</Link>
```

**规则**：
- 使用 shadcn/ui 组件前，先查阅组件文档
- 不确定的属性不要使用，查看 types 定义
- 常见不支持属性：`asChild`, `variant="destructive"` 等

#### 2. 组件 Props 类型定义

**✅ 推荐** - 使用 interface 定义 props：
```typescript
interface TestCaseCardProps {
  testCase: TestCase
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function TestCaseCard({ testCase, onEdit, onDelete }: TestCaseCardProps) {
  // ...
}
```

**✅ 推荐** - 复杂 props 使用对象参数：
```typescript
interface FetchTestCasesOptions {
  projectId?: string
  isActive?: boolean
  orderBy?: 'case_id' | 'created_at'
}

async function fetchTestCases(options: FetchTestCasesOptions = {}) {
  // ...
}
```

---

### ⚠️ 常见陷阱与解决方案

#### 陷阱 1：对象索引访问

**问题**：使用动态字符串作为对象索引
```typescript
const config = {
  apiKey: 'xxx',
  endpoint: 'yyy'
}

const key = getInputFromUser() // 类型为 string
const value = config[key] // ❌ 类型错误
```

**解决方案**：
```typescript
// 方案 1：使用 Record 类型
const config: Record<string, string> = {
  apiKey: 'xxx',
  endpoint: 'yyy'
}
const value = config[key] // ✅

// 方案 2：定义键的联合类型
type ConfigKey = 'apiKey' | 'endpoint'
const config: Record<ConfigKey, string> = {
  apiKey: 'xxx',
  endpoint: 'yyy'
}
const key = getInputFromUser() as ConfigKey
const value = config[key] // ✅

// 方案 3：使用类型断言和默认值
const value = config[key as keyof typeof config] || 'default'
```

#### 陷阱 2：数组方法返回类型

**问题**：数组方法可能返回 undefined
```typescript
const users: User[] = [{ id: 1, name: 'John' }]
const user = users.find(u => u.id === 1)
user.name // ❌ 可能为 undefined
```

**解决方案**：
```typescript
// 方案 1：使用非空断言（确定存在时）
const user = users.find(u => u.id === 1)!
user.name // ✅

// 方案 2：使用可选链
const user = users.find(u => u.id === 1)
user?.name // ✅

// 方案 3：提供默认值
const user = users.find(u => u.id === 1) || {} as User
user.name // ✅
```

#### 陷阱 3：事件处理器类型

**问题**：事件对象类型不明确
```typescript
function handleChange(e) { // ❌ e 隐式为 any
  e.target.value // ❌ 类型错误
}
```

**解决方案**：
```typescript
import { ChangeEvent } from 'react'

function handleChange(e: ChangeEvent<HTMLInputElement>) {
  e.target.value // ✅ 类型正确
}

// 对于表单事件
function handleSubmit(e: ChangeEvent<HTMLFormElement>) {
  e.preventDefault()
  // ...
}
```

---

### 🎓 实战案例分析 (2026-01-07)

以下是在 Tarsight 项目中实际遇到的 TypeScript 类型错误及解决方案。

#### 案例 1：shadcn/ui Button 组件的 asChild 属性

**文件**: `tarsight-dashboard/app/(auth)/test-cases/page.tsx:63`

**错误信息**:
```
Type error: Type '{ children: Element; asChild: true; className: string; }' is not assignable to type 'IntrinsicAttributes & ButtonProps & RefAttributes<HTMLButtonElement>'.
  Property 'asChild' does not exist on type 'IntrinsicAttributes & ButtonProps & RefAttributes<HTMLButtonElement>'.
```

**错误代码**:
```tsx
<Button asChild className="rounded-lg">
  <Link href="/test-cases/new">
    <Plus className="mr-2 h-4 w-4" />
    新建用例
  </Link>
</Button>
```

**问题分析**:
- shadcn/ui 的 Button 组件**不支持** `asChild` 属性
- `asChild` 是 Radix UI 的特性，需要特定配置才能使用
- 开发者误以为这是一个通用属性

**解决方案**:
```tsx
// ✅ 正确写法：将 Link 作为外层容器
<Link href="/test-cases/new">
  <Button className="rounded-lg">
    <Plus className="mr-2 h-4 w-4" />
    新建用例
  </Button>
</Link>
```

**经验教训**:
1. 使用第三方 UI 组件前，**先查阅官方文档**
2. 不确定的属性不要使用，查看组件的类型定义
3. Radix UI 的特性（如 `asChild`）需要额外配置，不能直接使用

**Commit**: `a53d299`

---

#### 案例 2：动态对象索引访问 - executionTypeNames

**文件**: `tarsight-dashboard/app/api/test/execute/route.ts:163`

**错误信息**:
```
Type error: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ specific: string; all: string; modules: string; levels: string; }'.
```

**错误代码**:
```typescript
const executionTypeNames = {
  'specific': '指定用例',
  'all': '全部用例',
  'modules': `模块(${module_names?.join(',') || module_ids?.join(',')})`,
  'levels': `等级(${levels?.join(',')})`
}
const executionName = `${executionTypeNames[execution_type]}执行 - ...`
//                                    ^^^^^^^^^^^^^^
//                                    类型错误：execution_type 为 any
```

**问题分析**:
- `execution_type` 从 `request.json()` 解构得到，类型推断为 `any`
- 对象字面量被推断为具体的键类型，不接受任意字符串索引
- TypeScript 严格模式下不允许用 `any` 作为索引

**解决方案**:
```typescript
// ✅ 方案 1：使用 Record<string, string> 明确类型
const executionTypeNames: Record<string, string> = {
  'specific': '指定用例',
  'all': '全部用例',
  'modules': `模块(${module_names?.join(',') || module_ids?.join(',')})`,
  'levels': `等级(${levels?.join(',')})`
}
const executionName = `${executionTypeNames[execution_type] || '测试'}执行 - ...`

// ✅ 方案 2：定义更精确的联合类型（如果可能）
type ExecutionType = 'specific' | 'all' | 'modules' | 'levels'
const executionTypeNames: Record<ExecutionType, string> = {
  // ...
}
```

**经验教训**:
1. **动态索引访问时，对象类型必须定义为 `Record<string, T>`**
2. 避免依赖类型推断，**显式声明类型**
3. 添加默认值处理：`|| '默认值'`，防止索引失败

**Commit**: `92b914d`

---

#### 案例 3：Supabase 关联查询的数组访问

**文件**: `tarsight-dashboard/app/api/test/preview/route.ts:51`

**错误信息**:
```
Type error: Property 'name' does not exist on type '{ name: any; }[]'.
```

**错误代码**:
```typescript
// Supabase 查询使用 JOIN 语法
const { data: allCases } = await supabase
  .from('test_cases')
  .select('id, level, module_id, modules(name)')  // 注意：modules(name)
  .eq('project_id', projectId)

// 尝试访问 modules.name
modules = [...new Set(allCases?.map(c => c.modules?.name).filter(Boolean) || [])]
//                                           ^^^^^
//                                           类型错误：modules 是数组
```

**问题分析**:
- Supabase 的 `modules(name)` 查询语法表示 JOIN 关联表
- 返回的 `c.modules` 是**数组** `[{ name: string }]`，而不是单个对象
- 即使只有一个关联记录，Supabase 也返回数组格式
- 直接访问 `.name` 会失败，因为数组没有 `name` 属性

**解决方案**:
```typescript
// ✅ 正确写法：访问数组的第一个元素
modules = [...new Set(
  allCases?.map(c => c.modules?.[0]?.name).filter(Boolean) as string[] || []
)]

// ✅ 更安全的写法：处理空数组情况
modules = [...new Set(
  allCases
    ?.map(c => {
      const moduleName = c.modules && c.modules.length > 0 ? c.modules[0].name : null
      return moduleName
    })
    .filter(Boolean) as string[] || []
)]
```

**经验教训**:
1. **Supabase JOIN 查询返回的总是数组**，即使只有一个结果
2. 访问关联字段时使用 `?.[0]?.propertyName` 模式
3. 添加类型断言 `as Type[]` 帮助 TypeScript 理解数组类型
4. 考虑使用**可选链 + 空值合并**：`c.modules?.[0]?.name || '默认模块名'`

**修复位置**: 4 处
- Line 52: `allCases` 处理
- Line 74: `moduleCases` 处理
- Line 96: `levelCases` 处理
- Line 120: `specificCases` 处理

**Commit**: `149fd6b`

---

### 🔍 问题诊断技巧

#### 1. 识别 Supabase 关联查询的返回类型

**查询语句**:
```typescript
.select('id, modules(name)')  // 单个关联
.select('id, modules(*)')      // 所有字段
.select('id, modules!inner(*)') // 内连接
```

**返回类型**:
```typescript
{
  id: string
  modules: Array<{             // 总是数组！
    name: string
    // ... 其他字段
  }>
}
```

**快速检查方法**:
```typescript
// 在浏览器控制台或日志中查看实际数据
console.log('Raw data:', JSON.stringify(allCases, null, 2))

// 检查类型
console.log('Type of modules:', typeof allCases[0].modules) // 'object'
console.log('Is array:', Array.isArray(allCases[0].modules)) // true
```

#### 2. 处理不确定的联合类型

**问题场景**:
```typescript
let value = getSomeValue() // 推断为首次赋值的类型
value = anotherValue       // ❌ 类型错误
```

**解决方案**:
```typescript
// ✅ 明确联合类型
let value: string | number | boolean = getSomeValue()
value = anotherValue       // ✅

// ✅ 使用 unknown 更安全
let value: unknown = getSomeValue()
if (typeof value === 'string') {
  // 在这里 value 被识别为 string
}
```

#### 3. 类型断言的正确使用

**谨慎使用 as**:
```typescript
// ❌ 不好：掩盖类型问题
const name = (data as any).name

// ✅ 更好：缩小类型范围
const name = (data as { name: string }).name

// ✅ 最好：定义接口
interface Data {
  name: string
}
const name = (data as Data).name
```

**使用类型守卫**:
```typescript
function isModule(obj: unknown): obj is { name: string } {
  return typeof obj === 'object' && obj !== null && 'name' in obj
}

if (isModule(c.modules?.[0])) {
  console.log(c.modules[0].name) // ✅ 类型安全
}
```

---

### ✅ 最佳实践清单

#### 编码时

- [ ] **类型优先** - 定义变量时先想好类型
- [ ] **明确接口** - 复杂对象使用 interface 定义
- [ ] **避免 any** - 不确定时使用 `unknown` 而不是 `any`
- [ ] **查阅文档** - 使用第三方库前先看类型定义
- [ ] **类型守卫** - 使用类型守卫缩小类型范围

#### 示例代码

```typescript
// ✅ 好的示例
interface TestCase {
  id: string
  case_id: string
  name: string
  is_active: boolean
}

interface FetchResult {
  data: TestCase[]
  error: Error | null
}

async function fetchTestCases(): Promise<FetchResult> {
  try {
    const response = await fetch('/api/test-cases')
    const data: TestCase[] = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

// ❌ 不好的示例
async function fetchTestCases() { // 没有返回值类型
  try {
    const response = await fetch('/api/test-cases')
    const data = await response.json() // 类型为 any
    return { data, error: null }
  } catch (error) {
    return { data: [], error }
  }
}
```

#### 代码审查时

- [ ] 检查是否有 `any` 类型
- [ ] 检查对象索引是否类型安全
- [ ] 检查函数参数和返回值是否明确
- [ ] 检查第三方库组件属性是否正确
- [ ] 检查是否有未处理的 `undefined` 情况

---

### 🔍 类型检查工具

#### 本地开发

```bash
# 1. 完整类型检查
cd tarsight-dashboard
npx tsc --noEmit

# 2. 检查特定文件
npx tsc --noEmit app/api/test/execute/route.ts

# 3. 监视模式（开发时）
npx tsc --noEmit --watch
```

#### VS Code 配置

确保 `tsconfig.json` 启用了严格检查：
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 提交前检查

添加到 package.json scripts：
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "pre-commit": "npm run type-check"
  }
}
```

使用 husky 添加 git hook：
```bash
npm install -D husky
npx husky install
echo "npm run type-check" > .husky/pre-commit
```

---

### 📚 常用类型定义模板

#### API 响应类型
```typescript
interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

#### 表单类型
```typescript
interface FormField<T> {
  value: T
  error: string | null
  touched: boolean
}

interface FormState<T> {
  [key: string]: FormField<any>
}
```

#### 数据库记录类型
```typescript
interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

interface TestCase extends BaseEntity {
  case_id: string
  name: string
  module_id: string
  is_active: boolean
}
```

---

### 🚨 紧急修复方案

当遇到无法立即修复的类型错误时：

**临时方案** - 使用类型断言（需添加 TODO 注释）：
```typescript
// TODO: 修复这个类型推断问题
const value = (someValue as any).property

// 或者使用 // @ts-ignore（谨慎使用）
// @ts-ignore
const value = someValue.property
```

**正确做法** - 创建 GitHub Issue：
```typescript
// FIXME: 类型推断问题，已创建 Issue #123
// 临时使用类型断言，待重构
const value = (someValue as unknown as ExpectedType).property
```

---

**记住**：TypeScript 的目的是提高代码质量和可维护性，而不是阻碍开发。花时间定义正确的类型会在后期带来巨大的回报！

---

## 🔄 代码审查流程与最佳实践 (2026-01-07)

基于 Tarsight 项目的实战经验，建立严格的代码审查流程以避免重复的错误类型。

### 📋 提交前检查清单

#### 1. 类型检查（必须）

```bash
# 完整类型检查
cd tarsight-dashboard
npx tsc --noEmit

# 检查特定文件
npx tsc --noEmit app/api/test/execute/route.ts
```

**要求**：
- ✅ 零 TypeScript 错误
- ✅ 零 `any` 类型（除非有明确注释）
- ✅ 所有函数都有返回值类型

#### 2. 构建测试

```bash
# 本地构建验证
npm run build

# 检查构建产物大小
du -sh .next
```

**要求**：
- ✅ 构建成功
- ✅ 无严重警告
- ✅ 构建时间合理（< 5 分钟）

#### 3. 第三方组件属性验证

**shadcn/ui 组件使用前检查**：
```typescript
// ❌ 不要这样做：使用不确定的属性
<Button asChild={true} size="icon" variant="destructive">

// ✅ 正确做法：查阅文档或类型定义
import { Button } from '@/components/ui/button'

// 查看 ButtonProps 类型定义
// 支持：variant, size, className 等
// 不支持：asChild, size="icon", variant="destructive" 等

<Button variant="outline" size="sm" className="...">
```

**检查步骤**：
1. 查看组件的类型定义：`components/ui/button.tsx`
2. 确认支持的 props 值
3. 不确定的属性先测试，再提交

#### 4. Supabase 查询验证

**关联查询类型检查**：
```typescript
// ❌ 常见错误：直接访问关联字段
.select('id, modules(name)')
data.modules.name  // ❌ modules 是数组

// ✅ 正确做法：访问数组第一个元素
.select('id, modules(name)')
data.modules?.[0]?.name  // ✅ 安全访问

// ✅ 更安全：检查数组长度
const moduleName = data.modules && data.modules.length > 0
  ? data.modules[0].name
  : '默认值'
```

**验证步骤**：
1. 在浏览器控制台打印实际数据
2. 检查返回类型是否为数组
3. 使用可选链 `?.[0]?.` 访问

---

### 🔍 代码审查要点

#### TypeScript 相关

**必须检查**：
- [ ] 所有变量都有明确的类型声明
- [ ] 对象字面量使用 `Record<string, T>` 如果需要动态索引
- [ ] 第三方组件的 props 值在允许范围内
- [ ] Supabase 查询的关联字段正确访问（`?.[0]?.`）
- [ ] 没有 `@ts-ignore` 或 `as any`（除非有详细注释）

**常见问题模式**：
```typescript
// ❌ 问题 1：依赖类型推断
const config = { key: 'value' }
const value = config[dynamicKey]  // 类型错误

// ✅ 正确 1：明确类型
const config: Record<string, string> = { key: 'value' }

// ❌ 问题 2：第三方组件属性错误
<Button size="icon">  // 不支持的值

// ✅ 正确 2：查阅类型定义
<Button size="sm">

// ❌ 问题 3：Supabase 关联访问错误
data.modules.name  // modules 是数组

// ✅ 正确 3：数组访问
data.modules?.[0]?.name
```

#### 代码质量

**必须检查**：
- [ ] 代码符合项目编码规范（见 CLAUDE.md TypeScript 编码规范）
- [ ] 没有硬编码的配置值
- [ ] 错误处理完善
- [ ] 控制台日志已清理（除必要的调试日志）

---

### 🛡️ 预防措施

#### 1. Git Pre-commit Hooks

**安装 husky**：
```bash
npm install -D husky
npx husky install
```

**配置 pre-commit hook**：
```bash
# 创建 .husky/pre-commit
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 运行 TypeScript 类型检查..."
cd tarsight-dashboard
npm run type-check

if [ $? -ne 0 ]; then
  echo "❌ 类型检查失败，请修复后再提交"
  exit 1
fi

echo "✅ 类型检查通过"
EOF

chmod +x .husky/pre-commit
```

#### 2. VS Code 配置

**添加到 .vscode/settings.json**：
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.strictTypeChecks": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

#### 3. 自动化类型检查脚本

**添加到 package.json**：
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "check": "npm run type-check && npm run lint",
    "pre-commit": "npm run check"
  }
}
```

#### 4. CI/CD 集成

**GitHub Actions workflow**：
```yaml
name: Type Check

on: [pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run build
```

---

### 📊 问题分类与处理优先级

#### 🔴 高优先级（必须修复）

**阻塞部署的问题**：
1. TypeScript 类型错误
2. 构建失败
3. 第三方组件不兼容

**处理流程**：
1. 立即修复
2. 添加到已知问题列表
3. 更新 CLAUDE.md 实战案例

#### 🟡 中优先级（应该修复）

**不影响构建的问题**：
1. ESLint 警告
2. 性能问题
3. 代码重复

**处理流程**：
1. 创建 GitHub Issue
2. 在 PR 中标记为 `improvement`
3. 安排在下一个 Sprint 修复

#### 🟢 低优先级（可以优化）

**优化建议**：
1. 类型定义优化
2. 代码风格统一
3. 文档完善

**处理流程**：
1. 添加到技术债务列表
2. 在有时间时处理

---

### 🎓 从错误中学习

#### Tarsight 项目 TypeScript 错误统计

**2026-01-07 一天内的修复**：

| # | 类型 | Commit | 修复时间 |
|---|------|--------|---------|
| 1 | Button `asChild` 属性 | `a53d299` | 5 分钟 |
| 2 | 对象索引访问类型 | `92b914d` | 3 分钟 |
| 3 | Supabase 数组访问 | `149fd6b` | 10 分钟 |
| 4 | Button `size="icon"` | `5053854` | 2 分钟 |

**总耗时**: 约 20 分钟
**如果预先检查**: 可避免 100%

#### 经验总结

**高频错误类型**：
1. **shadcn/ui 组件属性** (2/4 = 50%)
   - `asChild` 不支持
   - `size="icon"` 不支持
   - `variant="destructive"` 不支持

2. **类型推断问题** (1/4 = 25%)
   - 对象索引访问缺少 `Record<string, T>`
   - 变量类型未明确声明

3. **Supabase 查询类型** (1/4 = 25%)
   - 关联字段返回数组，直接访问对象

**预防措施**：
1. ✅ 使用第三方组件前**查阅类型定义**
2. ✅ **显式声明类型**，不依赖推断
3. ✅ Supabase 关联字段使用 `?.[0]?.` 模式
4. ✅ **本地运行类型检查**再提交

---

### 📝 审查检查清单模板

**Pull Request 审查模板**：

```markdown
## TypeScript 类型检查
- [ ] 本地运行 `npm run type-check` 无错误
- [ ] 没有使用 `any` 类型（除非有注释说明）
- [ ] 所有函数都有返回值类型

## 组件使用检查
- [ ] shadcn/ui 组件的 props 值在允许范围内
- [ ] 不确定的属性已查阅类型定义
- [ ] Supabase 查询的关联字段正确访问

## 测试检查
- [ ] 本地构建成功：`npm run build`
- [ ] 功能已手动测试
- [ ] 没有控制台错误或警告

## 文档检查
- [ ] 复杂逻辑已添加注释
- [ ] 如果是新功能，已更新相关文档
```

---

### 🔧 工具推荐

#### VS Code 扩展

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "astro-build.vscode-ts-plugin"
  ]
}
```

#### 命令行工具

```bash
# 快速类型检查
alias tc='cd tarsight-dashboard && npx tsc --noEmit'

# 快速构建检查
alias build='cd tarsight-dashboard && npm run build'

# 完整检查
alias check='npm run type-check && npm run build'
```

---

### 💡 持续改进

**定期回顾**：
- 每周回顾新增的 TypeScript 错误
- 识别高频问题模式
- 更新编码规范和检查清单

**知识分享**：
- 在团队会议中分享典型错误案例
- 将新发现的问题添加到 CLAUDE.md
- 定期更新实战案例库

**工具优化**：
- 根据实际问题调整 ESLint 规则
- 添加自定义 TypeScript 插件
- 改进 pre-commit hooks

---

**记住**：代码审查的目的是**预防问题**，而不是发现问题。通过严格的提交前检查，可以避免 80% 以上的类型错误！

### Error Handling
- Frontend: Use `lib/utils/error-handler.ts` for retry logic and error logging
- Backend: Python logging with structured messages
- Always use `SUPABASE_SERVICE_ROLE_KEY` for admin operations

### Test Execution Flow
1. User selects test cases → Frontend calls `/api/test/execute`
2. API route spawns Python subprocess with environment variables
3. Python `run.py` fetches test config from Supabase
4. Tests execute using pytest with `JsonTestRecorder`
5. Results saved to `reports/{execution_id}.json`
6. Results imported to `test_results` table in Supabase
7. Frontend polls for status updates

### Database Operations
- **Client-side**: Use `createClient()` from `@/lib/supabase/server` with RLS
- **Server-side**: Use service role key for admin operations (bypasses RLS)
- **Python**: Use `get_supabase_client(access_token=service_role_key)`

### Authentication
- Supabase Auth handles user authentication
- `user_profiles` table extends auth.users with additional data
- RLS policies ensure users can only access their own data
- Middleware in `middleware.ts` protects routes

## Known Issues & Solutions

### ⚠️ TypeScript Build Errors in Docker

#### Issue 1: Button Variant Type Error
**Error**:
```
Type '"destructive"' is not assignable to type '"default" | "outline" | "ghost" | undefined'
```

**Location**: `tarsight-dashboard/components/queue-config-form.tsx:292`

**Cause**: shadcn/ui Button component doesn't support `variant="destructive"`

**Solution**:
```tsx
// Change from:
<Button variant="destructive" size="sm">

// To:
<Button
  variant="outline"
  size="sm"
  className="text-red-600 hover:text-red-700 hover:bg-red-50"
>
```

#### Issue 2: Variable Type Inference Error
**Error**:
```
Type error: Type 'boolean' is not assignable to type 'string'
```

**Location**: `tarsight-dashboard/components/test-case-form.tsx:122`

**Cause**: TypeScript infers `parsedValue` as `string` from initial assignment

**Solution**:
```tsx
// Add explicit type annotation:
let parsedValue: string | boolean | number = newValidationRule.value
```

**Workaround**: Use `--no-lint` flag to skip type checking temporarily:
```bash
# In package.json, change build script:
"build": "next build --no-lint"

# Or use update script with --no-lint flag:
sudo bash scripts/update-production.sh --no-lint
```

---

### ⚠️ Alpine Linux Compatibility Issues

#### Issue: spawn /bin/bash ENOENT Error

**Error**:
```
Error: spawn /bin/bash ENOENT
Exit code: -2
```

**Location**: `lib/test-execution-queue.ts`

**Cause**:
- Docker container uses **Alpine Linux** (node:20-alpine)
- Alpine has `/bin/sh` but **NOT** `/bin/bash`
- Code tries to spawn `/bin/bash` which doesn't exist

**Solution**:
```typescript
// Change from:
const child = spawn('/bin/bash', ['-c', command], { ... })

// To:
const child = spawn('/bin/sh', ['-c', command], { ... })
```

**File**: `lib/test-execution-queue.ts:260`

**Verification**:
```bash
# Check if /bin/sh exists in container
docker compose exec frontend which /bin/sh

# Test Python execution
docker compose exec frontend python3 --version

# Run health check
bash scripts/health-check.sh
```

**Impact**: Test execution functionality completely fails without this fix

---

### 🔧 Docker Build Optimization

#### Build Cache Issues

**Problem**: Docker builds using cached layers even after code changes

**Solution**: Use `--no-cache` flag
```bash
docker compose build --no-cache frontend
```

#### Build Failures with Type Errors

**Problem**: TypeScript errors cause build to fail

**Temporary Solution**: Modify package.json
```json
{
  "scripts": {
    "build": "next build --no-lint"
  }
}
```

**Long-term Solution**: Fix type errors at source

---

### ⚠️ Next.js 14 App Router - Execution Detail Page Issues

#### Issue 1: Component Naming Collision Causing Infinite Recursion

**Error**:
```
Error: Cannot read properties of undefined (reading 'id')
Or
Page shows "无效的执行 ID" even with correct execution ID
```

**Location**: `tarsight-dashboard/app/(auth)/executions/[id]/page.tsx`

**Cause**:
- Page component has the same name as imported client component
- Both named `ExecutionDetailPage`, causing shadowing
- Page component calls itself recursively instead of rendering the client component

**Problem Code**:
```tsx
// ❌ WRONG: Naming collision
import { ExecutionDetailPage } from '@/components/execution-detail-page'

export default async function ExecutionDetailPage({ params }) {
  return <ExecutionDetailPage />  // Calls itself!
}
```

**Solution**:
```tsx
// ✅ CORRECT: Use import alias
import { ExecutionDetailPage as ExecutionDetailPageClient } from '@/components/execution-detail-page'

export default async function ExecutionDetailPageRoute({ params }) {
  return <ExecutionDetailPageClient />
}
```

**Commit**: `9976c5e` - fix: 修复组件名称冲突导致的递归调用问题

---

#### Issue 2: Missing TestCaseResult Type Definition

**Error**:
```
TypeScript error: Cannot find name 'TestCaseResult'
Or
All fields show as empty/undefined in execution detail page
```

**Location**: `tarsight-dashboard/lib/types/database.ts`

**Cause**:
- `TestCaseResult` type was not defined
- Components expected this type but it didn't exist
- Caused all data to be undefined

**Solution**:
Add comprehensive type definition in `lib/types/database.ts`:

```typescript
// 用于执行详情页，包含 test_results + test_cases + modules 的扁平化数据
export type TestCaseResult = {
  // test_results 表字段
  id: string
  execution_id: string
  test_case_id: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error_message?: string
  request_info?: { URL, Method, Headers, Body... }
  response_info?: { Status_Code, Headers, Body... }
  created_at: string

  // test_cases 表字段 (嵌套)
  test_case?: {
    case_id: string
    test_name: string
    method: string
    url: string
    module?: { name: string }
    ...
  }

  // 便捷访问字段（扁平化）
  case_id?: string        // test_case.case_id
  test_name?: string      // test_case.test_name
  module_name?: string    // test_case.module.name
  response_time?: number  // duration
  response_code?: number  // response_info.Status_Code
  request_headers?: Record<string, string>
  request_body?: Record<string, any>
  response_headers?: Record<string, string>
  response_body?: any
}
```

**Commit**: `c138b15` - fix: 修复执行详情页数据展示问题

---

#### Issue 3: Supabase Nested Query Results Not Flattened

**Symptoms**:
- Module name shows "Unknown"
- All response times show "0ms"
- Test names and IDs are empty
- Data exists in database but not displayed

**Location**: `tarsight-dashboard/app/(auth)/executions/[id]/page.tsx`

**Cause**:
- Supabase returns nested structure: `test_case.case_id`, `test_case.module.name`
- Components expect flat structure: `case_id`, `module_name`
- Data exists but can't be accessed

**Problem Code**:
```typescript
// ❌ WRONG: Returns nested Supabase structure
const { data: testResults } = await supabase
  .from('test_results')
  .select('*, test_case:test_cases(*, module:modules(name))')
  .eq('execution_id', executionId)

return { execution, testResults }  // Nested structure!
```

**Solution**:
```typescript
// ✅ CORRECT: Flatten nested data
const { data: testResults } = await supabase
  .from('test_results')
  .select('*, test_case:test_cases(*, module:modules(name))')
  .eq('execution_id', executionId)

// Flatten nested structure to top-level fields
const flattenedResults = (testResults || []).map((result: any) => ({
  ...result,
  // Extract nested fields to top-level
  case_id: result.test_case?.case_id,
  test_name: result.test_case?.test_name,
  module_name: result.test_case?.module?.name || 'Unknown',
  method: result.test_case?.method,
  url: result.test_case?.url,
  response_time: result.duration,
  response_code: result.response_info?.Status_Code,
  request_headers: result.request_info?.Headers,
  request_body: result.request_info?.Body,
  response_headers: result.response_info?.Headers,
  response_body: result.response_info?.Body
}))

return { execution, testResults: flattenedResults }
```

**Key Points**:
- Always flatten nested Supabase query results before passing to components
- Use optional chaining (`result.test_case?.case_id`) to handle missing data
- Provide default values (`|| 'Unknown'`) for required display fields
- Map duration → response_time for consistency

**Commit**: `c138b15` - fix: 修复执行详情页数据展示问题

---

### 📋 Development Workflow Best Practices

#### Rule 1: Always Use Import Aliases for Page Components

When importing client components into server pages, use aliases to avoid naming conflicts:

```tsx
// ✅ GOOD: Use alias
import { ExecutionDetailPage as ExecutionDetailPageClient } from '@/components/execution-detail-page'

// ❌ BAD: Same name causes shadowing
import { ExecutionDetailPage } from '@/components/execution-detail-page'
export default function ExecutionDetailPage() { ... }
```

#### Rule 2: Define Types Before Using Them

Always define types in `lib/types/database.ts` before using them in components:

```typescript
// 1. Define type in database.ts
export type TestCaseResult = { ... }

// 2. Import and use in component
import type { TestCaseResult } from '@/lib/types/database'
```

#### Rule 3: Flatten Supabase Nested Queries

Supabase returns nested data structure. Always flatten before using:

```typescript
// Supabase returns: { test_case: { case_id: "TS001" } }
// Components expect: { case_id: "TS001" }

const flattened = results.map(r => ({
  ...r,
  case_id: r.test_case?.case_id,  // Extract to top-level
  module_name: r.test_case?.module?.name
}))
```

#### Rule 4: Test with Real Data

When building data-heavy pages:
1. Use real execution IDs from database
2. Verify data structure with console.log
3. Check all fields display correctly
4. Test with different data scenarios (empty, missing fields)

---

## Deployment

### Automated Deployment (GitHub Actions)

**Recommended**: Use GitHub Actions for automatic deployment when pushing to master branch.

**Setup Guide**: See [AUTO_DEPLOY_QUICKSTART.md](./AUTO_DEPLOY_QUICKSTART.md) for 5-minute setup.

**Quick Start**:
1. Add GitHub Secrets (PRODUCTION_HOST, PRODUCTION_USER, PRODUCTION_SSH_KEY)
2. Add SSH public key to server
3. Push to master → Auto-deploys

**Manual Trigger**: Visit GitHub Actions page → "Run workflow"

**Skip Type Checking**: Add `[no-lint]` to commit message:
```bash
git commit -m "feat: new feature [no-lint]"
git push origin master
```

**Documentation**:
- Quick Start: [AUTO_DEPLOY_QUICKSTART.md](./AUTO_DEPLOY_QUICKSTART.md)
- Full Guide: [docs/guides/GITHUB_ACTIONS_DEPLOYMENT.md](./docs/guides/GITHUB_ACTIONS_DEPLOYMENT.md)

### Manual Deployment (Docker)

**Production Update Script** (Ubuntu Server):
```bash
cd /opt/tarsight

# Standard update
sudo bash scripts/update-production.sh

# With TypeScript errors
sudo bash scripts/update-production.sh --no-lint

# Skip health check
sudo bash scripts/update-production.sh --skip-health-check
```

**Health Check**:
```bash
# Basic check
bash scripts/health-check.sh

# Verbose mode
bash scripts/health-check.sh --verbose
```

**Manual Update**:
```bash
# 1. Pull latest code
git pull origin master

# 2. Build and deploy
docker compose up -d --build

# 3. Check logs
docker compose logs -f frontend
```

### Troubleshooting Deployment

#### Container Won't Start
```bash
# Check logs
docker compose logs frontend --tail 100

# Check for specific errors
docker compose logs frontend | grep -i error

# Restart container
docker compose restart frontend
```

#### Test Execution Fails
```bash
# Verify Alpine compatibility
docker compose exec frontend which /bin/sh

# Check Python installation
docker compose exec frontend python3 --version

# Test manual execution
docker compose exec frontend /bin/sh -c "cd /app/python && python3 -c 'print(\"test\")'"
```

#### Rollback to Previous Version
```bash
# Using git
git reset --hard HEAD~1
docker compose up -d --build

# Using backup
cd /opt/tarsight_backup_YYYYMMDD_HHMMSS
docker compose up -d
```

## Testing

### Running Single Tests
```bash
cd supabase_version
.venv/bin/python -m pytest testcases/test_module_name.py::test_function_name -v
```

### Running with Debugging
```bash
# Enable pytest debugging
.venv/bin/python -m pytest testcases/test_module_name.py -v -s
```

### Allure Reports (if configured)
```bash
.venv/bin/python -m pytest --alluredir=reports/allure-results
allure generate reports/allure-results -o reports/allure-report
```

## Key Files to Understand

- `supabase_version/run.py:1-100` - Test execution orchestration
- `tarsight-dashboard/app/api/test/execute/route.ts:1-50` - API endpoint that triggers tests
- `tarsight-dashboard/lib/types/database.ts` - Database schema types
- `supabase_version/utils/supabase_client.py` - Database client wrapper
- `supabase_version/utils/test_tarsight.py` - Pytest implementation
- `tarsight-dashboard/lib/test-execution-queue.ts` - **CRITICAL: Queue management with spawn()**

## Docker Configuration

### Multi-Stage Build
The Dockerfile uses multi-stage builds:
1. **Builder stage**: Installs dependencies and builds Next.js app
2. **Runner stage**: Production runtime with Python 3

**Important**:
- Runner stage uses Alpine Linux
- Only `/bin/sh` is available, NOT `/bin/bash`
- Python 3 is installed via `apk add python3`

### Container Environment
- **Base image**: `node:20-alpine`
- **Python**: Installed via `apk add python3 py3-pip`
- **Work directory**: `/app`
- **Python code**: `/app/python`

## Development Workflow

### Making Changes

1. **Frontend Changes**:
   ```bash
   cd tarsight-dashboard
   npm run dev  # Test locally
   npm run build  # Verify build succeeds
   ```

2. **Backend Changes**:
   ```bash
   cd supabase_version
   .venv/bin/python -m pytest testcases/  # Run tests
   ```

3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: description"
   git push origin master
   ```

4. **Deploy to Production**:
   ```bash
   # On Ubuntu server
   cd /opt/tarsight
   sudo bash scripts/update-production.sh
   ```

### Before Deploying

**Checklist**:
- [ ] No TypeScript type errors (or use `--no-lint`)
- [ ] Alpine compatibility verified (`/bin/sh` not `/bin/bash`)
- [ ] Tests pass locally
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in browser
- [ ] Test execution works end-to-end

## Documentation

- `README.md` - Project overview and quick start
- `docs/architecture/QUICK_REFERENCE.md` - Command reference and debugging
- `docs/architecture/ARCHITECTURE_REVIEW.md` - Detailed architecture analysis
- `docs/guides/PRODUCTION_UPDATE_GUIDE.md` - Production deployment guide
- `docs/troubleshooting/INDEX.md` - Common issues and solutions
- `docs/PROJECT_CLEANUP_REPORT_2026-01-05.md` - Latest cleanup report

## Quick Reference for Common Tasks

### Check TypeScript Errors
```bash
cd tarsight-dashboard
npx tsc --noEmit
```

### Fix Alpine Compatibility
```bash
# Search for /bin/bash usage
grep -r "/bin/bash" tarsight-dashboard/ --include="*.ts" --include="*.tsx"

# Replace with /bin/sh
sed -i 's|/bin/bash|/bin/sh|g' <file>
```

### Verify Docker Build
```bash
cd /opt/tarsight
docker compose build --no-cache frontend
docker compose up -d frontend
docker compose logs -f frontend
```

### Health Check
```bash
bash scripts/health-check.sh --verbose
```

## Troubleshooting

### Execution Stuck in "Running" Status
Check for stuck executions in database:
```python
from utils.supabase_client import get_supabase_client
from utils.env_config import get_env_config

env_config = get_env_config()
client = get_supabase_client(access_token=env_config.supabase_service_role_key)
result = client._make_request('GET', 'test_executions', params={'status': 'eq.running'})
```

### API Token Expiration
Symptom: "User session has expired" errors
Solution: Update `API_TOKEN` in `.env` and validate with `utils/token_validator.py`

### Python Path Issues
- Always use absolute paths in `PROJECT_ROOT` and `PYTHON_PATH`
- The API route passes these as environment variables to the Python subprocess
- Verify paths are correct when running in production

### Docker Build Takes Too Long
- Normal first build: 5-8 minutes
- Subsequent builds with cache: 2-3 minutes
- Use `--no-cache` only when necessary
- Clear Docker cache: `docker system prune -a`

### Test Execution Not Working
**Check**:
1. Alpine compatibility: `/bin/sh` exists
2. Python installed: `docker compose exec frontend python3 --version`
3. Test execution queue: Check logs for `spawn ENOENT` errors
4. Environment variables: `EXECUTION_ID`, `CASE_IDS`, `TARGET_PROJECT`

**Common Fixes**:
- Change `/bin/bash` to `/bin/sh` in code
- Verify Python 3 is installed in Docker image
- Check environment variable passing
- Review `lib/test-execution-queue.ts` spawn command

## Performance Optimization

### Reduce Docker Build Time
- Use BuildKit: `DOCKER_BUILDKIT=1 docker build`
- Leverage layer caching
- Minimize dependencies in package.json

### Monitor Resource Usage
```bash
# Check container stats
docker stats tarsight-frontend

# Check disk space
df -h /opt/tarsight

# Clean up old Docker images
docker system prune -a
```

## Security Best Practices

- Never commit `.env` files or API tokens
- Use service role key only on server-side
- Enable RLS (Row Level Security) on all Supabase tables
- Rotate API tokens regularly
- Keep dependencies updated

## Getting Help

### Internal Resources
- Check `docs/troubleshooting/INDEX.md` for common issues
- Review error logs in Docker containers
- Run health check script: `bash scripts/health-check.sh --verbose`

### External Resources
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Docker Docs: https://docs.docker.com

## Project Maintenance

### Regular Tasks
- **Daily**: Monitor error logs, check test execution success rate
- **Weekly**: Review disk space, clean up old test reports
- **Monthly**: Update dependencies, review and rotate API tokens
- **Quarterly**: Review architecture, optimize performance

### Cleanup Scripts
```bash
# Clean old test reports (older than 7 days)
./scripts/cleanup_reports.sh --keep-days 7

# Clean Docker cache (monthly)
docker system prune -a

# Clean git branches (quarterly)
git branch -d $(git branch --merged | grep -v master)
```

## Notes

- This project uses **Alpine Linux** in Docker containers
- Always use `/bin/sh` instead of `/bin/bash` for maximum compatibility
- TypeScript strict mode is enabled - fix type errors at source when possible
- Test execution uses Node.js `spawn()` to run Python subprocesses
- All production deployments should use the `update-production.sh` script
- Health checks should be run regularly to catch issues early

---

## Development Best Practices

### MCP Services Integration (优先使用现有服务)

**Available MCP Servers**:
- `plugin_supabase_supabase` - Direct database operations (migrations, queries, table management)
- `plugin_context7_context7` - Library documentation and code examples
- `github` - Repository management and operations
- `zread` - GitHub repository reading
- `web-reader` / `web-search-prime` - Web content retrieval

**Best Practices**:
1. **Database Operations**: Use `mcp__plugin_supabase_supabase__` tools instead of manual SQL files when possible
   - `apply_migration()` - Execute DDL operations directly
   - `execute_sql()` - Run ad-hoc queries
   - `list_tables()`, `list_migrations()` - Inspect current state
   - `get_project()` - Verify project configuration

2. **When to Create SQL Migration Files**:
   - ✅ Do: Create `.sql` files for versioned, reproducible migrations
   - ✅ Do: Use MCP tools for one-off fixes or data migrations
   - ✅ Do: Use MCP tools to inspect before/after migration state

3. **Documentation**: Use `mcp__plugin_context7_context7__query-docs()` for library questions
   - Faster than web searches
   - Always up-to-date examples
   - Reduces hallucination risk

### Frontend Component Dependencies

**Issue**: Missing shadcn/ui components cause build failures

**Solution**: Before using any UI component, verify it exists:
```bash
# Check if component exists
ls components/ui/select.tsx
ls components/ui/checkbox.tsx
ls components/ui/alert.tsx

# Install missing dependencies
npm install @radix-ui/react-select
npm install @radix-ui/react-checkbox
```

**Common Missing Components**:
- `select.tsx` - Required for dropdowns
- `checkbox.tsx` - Required for multi-select
- `alert.tsx` - Required for notifications
- `dialog.tsx` - Required for modals

### Page Structure Patterns

**Server vs Client Components**:
- Server components: Data fetching, static content
- Client components: Interactivity, forms, hooks

**Pattern for Forms**:
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

**Always create both**:
- `app/(auth)/feature/new/page.tsx` - Server component
- `components/feature-form-wrapper.tsx` - Client component

### Database Schema Changes

**Workflow for Schema Updates**:
1. ✅ Use MCP `apply_migration()` for development/testing
2. ✅ Create versioned `.sql` file for production migration
3. ✅ Update TypeScript types in `lib/types/database.ts`
4. ✅ Update all affected components and API routes
5. ✅ Test with real data before deploying

**Example - Adding a Field**:
```typescript
// 1. Update types
export type Module = {
  module_code: string  // NEW FIELD
}

// 2. Update form
<Input value={module_code} onChange={...} />

// 3. Update display
<Badge>{module.module_code}</Badge>

// 4. Update backend (if needed)
escaped_ids = ','.join([f'"{cid}"' for cid in case_ids])
```

---

### UI/UX Design Guidelines

**核心原则**：针对"测试管理仪表盘"这类复杂、多数据展示的项目，UI 容易变得臃肿、凌乱（即所谓的"后台管理系统味"）。要提升审美，核心在于**"减法"**和**"层次感"**。

---

#### 1. 采用"现代仪表盘"设计语言

**设计风格参考**：
- **Linear** - 极简深色模式
- **Vercel** - 极致白净风格
- **Stripe** - 精致的渐变和动画

**布局与间距**：
- ❌ 不要使用边框将每个模块死死围住
- ✅ 使用**大留白**（spacing-8 或更大）和**细微的阴影（Soft Shadows）**来区分区块
- ✅ 使用 `gap-6` 或 `gap-8` 增加组件间距
- ✅ 避免 hard lines，用 `shadow-sm` 或 `shadow-md` 替代 `border`

**圆角规范**：
- ✅ 统一使用较大的圆角：`rounded-xl` (12px) 或 `rounded-2xl` (16px)
- ✅ 这会让复杂的测试数据看起来不那么生硬

**字体排版**：
- ✅ 标题使用中粗体（`font-semibold`）
- ✅ 数据指标（如通过率）使用等宽字体（`font-mono`）或加粗显示
- ✅ 增加专业感

---

#### 2. 对"核心功能"进行审美重塑

**测试用例管理（列表）**：
- ❌ 别再用传统的 Table（表格）
- ✅ 使用 **"卡片式列表"**
- ✅ 在每行开头加入精美的小图标（Lucide icons）
- ✅ 使用悬停效果增强交互反馈

**执行状态（状态标签）**：
- ❌ 不要只用红绿蓝（高饱和度）
- ✅ 使用**"低饱和度背景 + 高饱和度文字"**的 Badge
  - 成功：`bg-emerald-50 text-emerald-700 border-emerald-200`
  - 失败：`bg-rose-50 text-rose-700 border-rose-200`
  - 运行中：`bg-blue-50 text-blue-700 border-blue-200`
  - 跳过：`bg-slate-50 text-slate-700 border-slate-200`

**统计图表**：
- ❌ 不要使用 Echarts 的默认配色
- ✅ 给它一组调色盘：
  - 冰川蓝：`#3b82f6` (blue-500)
  - 薄荷绿：`#10b981` (emerald-500)
  - 石墨灰：`#64748b` (slate-500)
- ✅ 开启**平滑曲线（Smooth line）**和**区域渐变填充**

---

#### 3. 推荐的视觉组件库

**Shadcn/UI 配置**（当前项目已使用）：
- ✅ `Badge` - 用例状态标签
- ✅ `Card` - 数据展示容器（配合 `Skeleton` 加载动效）
- ✅ `Command` - 替代繁琐的下拉框，用于筛选过滤
- ✅ `Dialog` - 模态框
- ✅ `Alert` - 通知提示

---

#### 4. 进阶：增加"信息密度控制"

测试管理工具最大的痛点是信息太多。需要通过视觉层次引导用户注意力：

**次要信息置灰**：
```tsx
// ❌ 错误示例：所有信息都是黑色
<span className="text-sm">{executionId}</span>
<span className="text-sm">{createdAt}</span>

// ✅ 正确示例：次要信息弱化显示
<span className="text-xs text-slate-400 font-mono">{executionId}</span>
<span className="text-xs text-slate-400">{formatDate(createdAt)}</span>
```

**核心数据突出**：
```tsx
// ✅ 通过率等关键指标使用大号字体和高对比度
<div className="text-3xl font-bold text-emerald-600">98.5%</div>
<div className="text-xs text-slate-500 mt-1">测试通过率</div>
```

**空状态设计**：
```tsx
// ❌ 错误示例
<div>暂无数据</div>

// ✅ 正确示例：带插图或精致图标
<div className="text-center py-12">
  <CheckCircle2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
  <h3 className="text-lg font-semibold text-slate-700">暂无测试执行</h3>
  <p className="text-sm text-slate-500 mt-2">点击上方按钮开始执行测试</p>
</div>
```

---

#### 5. 为 Claude Code 编写的"高审美"提示词模板

当需要重构页面时，可以使用以下指令：

> "请帮我重构当前的仪表盘 UI。我需要它看起来像 **Linear** 或 **Vercel** 的风格：
>
> 1. **配色方案**：
>    - 使用极简的浅灰背景 `bg-slate-50`
>    - 卡片使用白色背景 `bg-white`
>    - 微弱的边框 `border-slate-200`
>    - 极细的投影 `shadow-sm`
>
> 2. **卡片设计**：
>    - 每个模块（统计、用例、项目）使用大圆角 `rounded-xl`
>    - 卡片间距 `gap-6`
>    - 内边距 `p-6`
>
> 3. **数据可视化**：
>    - 测试结果的统计图表请使用平滑的面积图
>    - 配色参考：
>      - 通过：`emerald-500`
>      - 失败：`rose-500`
>      - 运行中：`blue-500`
>
> 4. **交互细节**：
>    - 为所有的 Action 按钮添加 hover 时的轻微位移或缩放效果
>    - 使用 `transition-all duration-200`
>    - 按钮使用 `rounded-lg` 或更大
>
> 5. **信息层次**：
>    - 次要信息（如 ID、时间）使用 `text-slate-400`
>    - 核心数据（如通过率）使用大号字体和加粗
>    - 状态标签使用低饱和度背景 + 高饱和度文字"

---

#### 6. Tailwind CSS 实用类参考

**间距系统**：
- `gap-4` - 组件间基础间距（16px）
- `gap-6` - 卡片间距（24px）
- `gap-8` - 大区块间距（32px）
- `p-6` - 卡片内边距（24px）
- `py-12` - 页面垂直内边距（48px）

**阴影系统**：
- `shadow-sm` - 微妙阴影（推荐用于卡片）
- `shadow-md` - 中等阴影（悬停时使用）
- `shadow-lg` - 强烈阴影（模态框使用）

**圆角系统**：
- `rounded-lg` - 常规圆角（8px）
- `rounded-xl` - 大圆角（12px）- **推荐用于卡片**
- `rounded-2xl` - 超大圆角（16px）

**色彩系统（状态色）**：
- 成功：`text-emerald-600`, `bg-emerald-50`
- 失败：`text-rose-600`, `bg-rose-50`
- 警告：`text-amber-600`, `bg-amber-50`
- 信息：`text-blue-600`, `bg-blue-50`
- 次要：`text-slate-400`, `text-slate-500`

---

#### 7. 实施检查清单

在创建或重构页面时，确保：

- [ ] 使用 `bg-slate-50` 作为页面背景
- [ ] 卡片使用 `bg-white` + `rounded-xl` + `shadow-sm`
- [ ] 卡片间距至少 `gap-6`
- [ ] 状态标签使用低饱和度背景
- [ ] 次要信息使用 `text-slate-400` 或 `text-slate-500`
- [ ] 按钮添加 `transition-all duration-200`
- [ ] 使用图标增强视觉识别
- [ ] 空状态有精致的设计（带图标和说明）
- [ ] 避免使用传统表格（Table），改用卡片式列表
- [ ] 统一圆角大小（优先 `rounded-xl`）

---

## 🎨 UI/UX 设计系统完整实现 (2026-01-06)

### 设计理念

**核心原则**：Minimalist SaaS 风格 - 参考 Linear、Vercel、Stripe 等现代 SaaS 产品

**设计语言**：
- 极简主义：减少视觉噪音，突出核心内容
- 层次感：通过颜色、大小、间距创造清晰的视觉层级
- 呼吸感：充足的留白，避免拥挤感
- 精致细节：微妙的动画、渐变、阴影

---

### 配色系统

#### 主色调
- **页面背景**：`bg-slate-50`
- **卡片背景**：`bg-white`
- **边框**：`border-slate-50`（极细微）
- **主文字**：`text-slate-900`（标题）、`text-slate-500`（说明）
- **次要文字**：`text-slate-400`（辅助信息）

#### 侧边栏深色主题
- **主背景**：`bg-[#0f172a]/95`（95% 不透明）
- **半透明背景**：`bg-[#0f172a]/50`（50% 不透明）
- **边框**：`border-white/10`（10% 白色半透明）
- **背景模糊**：`backdrop-blur-sm`
- **主文字**：`text-white`
- **菜单常规态**：`text-slate-400`
- **菜单激活态**：`text-blue-400` + `bg-blue-600/10`
- **标题**：`text-slate-500`

#### 状态色彩（低饱和度背景）
- **成功**：`bg-emerald-50 text-emerald-600 border-emerald-100`
- **失败**：`bg-rose-50 text-rose-600 border-rose-100`
- **警告**：`bg-amber-50 text-amber-600 border-amber-100`
- **信息**：`bg-blue-50 text-blue-600 border-blue-100`
- **运行中**：`bg-blue-50 text-blue-600 border-blue-100`

#### 图标背景色
- **蓝色**：`bg-blue-50 text-blue-600`
- **绿色**：`bg-emerald-50 text-emerald-600`
- **琥珀色**：`bg-amber-50 text-amber-600`
- **紫色**：`bg-violet-50 text-violet-600`

---

### 阴影系统

**统一标准**：
- **常规态**：`shadow-sm`（极微妙阴影）
- **悬停态**：`shadow-md`（中等阴影）
- **移除**：所有自定义阴影（如 `shadow-[0_2px_10px_rgba(0,0,0,0.02)]`）

**使用场景**：
- 所有卡片：`shadow-sm` + `hover:shadow-md`
- 按钮和交互元素：`shadow-sm hover:shadow-md`

---

### 圆角系统

**统一标准**：
- **卡片**：`rounded-xl`（12px）- **主要使用**
- **按钮**：`rounded-lg`（8px）
- **图标容器**：`rounded-lg` 或 `rounded-xl`
- **输入框**：`rounded-lg`

---

### 间距系统

**页面内边距**：
- **小屏幕**：`px-4 py-12`
- **大屏幕**：`px-8 py-12`

**卡片间距**：
- **网格间距**：`gap-6`（24px）
- **区块间距**：`space-y-8`（32px）
- **列表间距**：`space-y-2.5`（10px）

**卡片内边距**：
- **标准卡片**：`p-5`（20px）
- **紧凑卡片**：`p-4`（16px）

---

### 组件设计规范

#### 统计卡片（Stats Card）

**布局**：纵向（图标在上，数值在下）

```tsx
<div className="bg-white rounded-xl shadow-sm p-5 border border-slate-50">
  <div className="flex flex-col items-center justify-center space-y-3">
    {/* 图标容器 */}
    <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
      <Icon className="h-5.5 w-5.5 text-blue-600" />
    </div>
    {/* 数值和标题 */}
    <div className="text-center space-y-0.5">
      <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  </div>
</div>
```

**关键要素**：
- 图标尺寸：`h-11 w-11`，图标 `h-5.5 w-5.5`
- 数值：`text-4xl font-black tracking-tight`
- 标题：`text-sm font-medium text-slate-500`
- Hover：`group-hover:scale-110`（图标缩放动画）

#### 进度条（Progress Bar）

**极细渐变设计**：

```tsx
<div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
  <div
    className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 h-1.5 rounded-full transition-all duration-500"
    style={{ width: `${percentage}%` }}
  />
</div>
```

**规格**：
- 高度：`h-1.5`（1.5px，极细）
- 背景槽：`bg-slate-100`
- 渐变：`from-blue-600 via-blue-500 to-blue-400`（深→浅）
- 圆角：`rounded-full`
- 动画：`transition-all duration-500`

#### 导航项（Navigation Item）

**激活态左侧亮条**：

```tsx
<Link
  href={href}
  className={cn(
    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-blue-600/10 text-blue-400'
      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
  )}
>
  {/* 左侧亮条 */}
  {isActive && (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-0.5 bg-blue-400 rounded-full" />
  )}
  <Icon className="h-5 w-5 flex-shrink-0" />
  <span className="flex-1">{title}</span>
</Link>
```

**状态**：
- **常规态**：`text-slate-400`
- **Hover**：`text-slate-100` + `bg-white/5`
- **激活态**：`text-blue-400` + `bg-blue-600/10` + 左侧亮条

---

### 动画系统

#### 页面进入动画

**使用 Tailwind animate-in**：

```tsx
<div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
  {/* 内容 */}
</div>
```

**参数说明**：
- `animate-in` - 启用进入动画
- `fade-in` - 淡入（透明度 0→1）
- `slide-in-from-bottom-4` - 从底部向上滑动 16px
- `duration-700` - 持续 700ms
- `delay-{N}00` - 延迟 N×100ms
- `ease-out` - 缓动函数（快进慢出）

**动画序列**：
- 页面标题：`delay-100`
- 统计卡片1：`delay-200`
- 统计卡片2：`delay-300`
- 统计卡片3：`delay-400`
- 统计卡片4：`delay-500`
- 模块分布：`delay-600`
- 最近执行：`delay-700`

#### Hover 动画

**标准模式**：
```tsx
className="transition-all duration-200"
```

**图标缩放**：
```tsx
className="group-hover:scale-110 transition-transform duration-300"
```

---

### 特效系统

#### 玻璃拟态 (Glassmorphism)

**应用场景**：侧边栏、特定卡片

```tsx
className="bg-[#0f172a]/95 backdrop-blur-sm border-r border-white/10"
```

**参数**：
- 背景透明度：`/95`（主）、`/50`（辅助区域）
- 背景模糊：`backdrop-blur-sm`
- 边框：`border-white/10`（10% 白色半透明）

#### 骨架屏 (Skeleton Loading)

**使用 Suspense + Skeleton 组件**：

```tsx
import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/dashboard-skeleton'

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PageContent />
    </Suspense>
  )
}
```

**骨架屏设计要点**：
- 使用 `animate-pulse` 产生淡入淡出效果
- 不同层级使用不同灰色（`bg-slate-100`、`bg-slate-200`）
- 完美匹配真实内容结构

---

### 空状态设计

**精致空状态三要素**：

1. **视觉图标**：
   - 渐变背景：`bg-gradient-to-br from-blue-50 to-slate-100`
   - 圆形容器：`w-24 h-24 rounded-full`
   - 图标：`h-12 w-12 text-blue-400`

2. **友好文案**：
   - 标题：`text-lg font-semibold text-slate-900`
   - 描述：`text-sm text-slate-500`，详细且引导性强
   - 最大宽度：`max-w-md mx-auto`

3. **行动号召**：
   - 主按钮：`bg-blue-600 hover:bg-blue-700`
   - 图标 + 文字
   - 阴影和过渡效果

**示例代码**：

```tsx
<div className="text-center py-20 px-8">
  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-slate-100 mb-6">
    <CheckCircle2 className="h-12 w-12 text-blue-400" />
  </div>
  <h3 className="text-lg font-semibold text-slate-900 mb-3">暂无执行记录</h3>
  <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
    开始执行测试后，您的测试记录将显示在这里。您可以随时查看每次执行的详细结果。
  </p>
  <Link href="/test-cases">
    <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md">
      <PlayCircle className="h-4 w-4" />
      执行测试
    </button>
  </Link>
</div>
```

---

### 响应式设计

**断点系统**：
- **小屏幕**（默认）：1 列布局
- **中屏幕**（`md:`）：2 列布局
- **大屏幕**（`lg:`）：4 列布局

**网格布局**：

```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  {/* 卡片 */}
</div>
```

**内边距响应**：

```tsx
className="px-4 sm:px-8"
```

**最大宽度限制**：

```tsx
<div className="max-w-7xl mx-auto">
  {/* 内容 */}
</div>
```

---

### 字体系统

#### 字重层级
- **最粗**：`font-black`（900）- 统计数值
- **粗体**：`font-bold`（700）- 主标题
- **中等**：`font-semibold`（600）- 卡片标题
- **常规**：`font-medium`（500）- 正文

#### 字号层级
- **页面标题**：`text-3xl`（30px）
- **卡片标题**：`text-lg`（18px）
- **统计数值**：`text-4xl`（36px）
- **正文**：`text-sm`（14px）
- **辅助文字**：`text-xs`（12px）

#### 字间距
- **紧凑**：`tracking-tight` - 数值、Logo
- **常规**：默认
- **宽间距**：`tracking-wider` - 小标题

---

### 实施检查清单

在创建或重构页面时，确保：

**基础样式**：
- [ ] 使用 `bg-slate-50` 作为页面背景
- [ ] 卡片使用 `bg-white` + `rounded-xl` + `shadow-sm`
- [ ] 卡片间距至少 `gap-6`
- [ ] 次要信息使用 `text-slate-400` 或 `text-slate-500`
- [ ] 避免使用高饱和度纯色

**组件设计**：
- [ ] 统计卡片使用纵向布局（图标在上，数值在下）
- [ ] 数值使用 `font-black` 加粗
- [ ] 进度条高度为 `h-1.5` 并添加渐变
- [ ] 状态标签使用低饱和度背景
- [ ] 导航项激活态使用左侧亮条

**交互反馈**：
- [ ] 所有交互元素添加 `transition-all duration-200`
- [ ] Hover 时使用 `shadow-md`
- [ ] 图标容器添加 `group-hover:scale-110`
- [ ] 按钮添加阴影和过渡效果

**动画效果**：
- [ ] 页面加载时添加进入动画
- [ ] 使用 `delay-{N}00` 实现渐进式呈现
- [ ] 动画时长统一为 `duration-700`
- [ ] 缓动函数使用 `ease-out`

**特效**：
- [ ] 侧边栏使用玻璃拟态（`backdrop-blur-sm`）
- [ ] 加载状态使用骨架屏
- [ ] 空状态有精致设计（图标 + 文案 + 按钮）

**响应式**：
- [ ] 小屏幕使用 `px-4`，大屏幕使用 `px-8`
- [ ] 主容器设置 `max-w-7xl` 限制最大宽度
- [ ] 使用响应式网格（`md:grid-cols-2 lg:grid-cols-4`）

---

### 关键组件文件

**已优化的核心组件**：
- `components/sidebar.tsx` - 深色主题侧边栏 + 玻璃拟态
- `components/dashboard-skeleton.tsx` - 首页骨架屏
- `components/user-menu.tsx` - 深色主题用户菜单
- `app/(auth)/page.tsx` - Minimalist SaaS 风格首页
- `app/(auth)/executions/page.tsx` - 执行历史列表
- `app/(auth)/test-cases/page.tsx` - 测试用例列表
- `components/test-case-list.tsx` - 测试用例卡片列表

---

### 已知优化记录

**编号格式验证 (2026-01-06)**：
- ✅ 项目编号正则：`^[A-Za-z][A-Za-z0-9]{0,19}$`（允许纯英文）
- ✅ 模块编号正则：`^[A-Za-z][A-Za-z0-9]{0,19}$`
- ✅ 数据库约束已更新（需要执行 Migration 002）

**侧边栏深色主题 (2026-01-06)**：
- ✅ 背景色：`bg-[#0f172a]`
- ✅ 玻璃拟态：`backdrop-blur-sm` + 半透明背景
- ✅ 激活态：左侧蓝色亮条 + 淡蓝色背景
- ✅ Logo：`text-2xl font-bold tracking-tight`

**首页统计卡片 (2026-01-06)**：
- ✅ 纵向布局：图标在上，数值在下
- ✅ 数值加粗：`font-black`
- ✅ 图标尺寸：`h-11 w-11`，图标 `h-5.5 w-5.5`
- ✅ 极细阴影：`shadow-sm` / `shadow-md`

**进度条优化 (2026-01-06)**：
- ✅ 极细高度：`h-1.5`
- ✅ 三色渐变：`from-blue-600 via-blue-500 to-blue-400`
- ✅ 圆角：`rounded-full`

**动画系统 (2026-01-06)**：
- ✅ 页面进入动画：`animate-in fade-in slide-in-from-bottom-4`
- ✅ 渐进式呈现：`delay-100` ~ `delay-700`
- ✅ 骨架屏加载：`DashboardSkeleton` 组件

**空状态优化 (2026-01-06)**：
- ✅ 渐变图标背景
- ✅ 友好引导文案
- ✅ 行动号召按钮

**响应式优化 (2026-01-06)**：
- ✅ 小屏幕：`px-4`
- ✅ 大屏幕：`px-8`
- ✅ 最大宽度：`max-w-7xl`

---

## 🚨 GitHub Actions 自动部署故障排查指南 (2026-01-07)

### 问题背景

在配置 GitHub Actions 自动部署到生产服务器时，遇到了 4 个连环问题，导致部署失败。以下是完整的排查过程和解决方案。

---

### 问题 1️⃣：TypeScript 类型错误 - Button 组件的 `asChild` 属性

**错误信息**：
```
Type error: Type '{ children: Element; asChild: true; className: string; }' is not assignable to type 'IntrinsicAttributes & ButtonProps & RefAttributes<HTMLButtonElement>'.
  Property 'asChild' does not exist on type 'IntrinsicAttributes & ButtonProps & RefAttributes<HTMLButtonElement>'.

./app/(auth)/test-cases/page.tsx:63:21
```

**原因分析**：
- `shadcn/ui` 的 Button 组件不支持 `asChild` 属性
- `asChild` 是 Radix UI 的特性，需要特定配置

**解决方案**：
```tsx
// ❌ 错误写法
<Button asChild className="rounded-lg">
  <Link href="/test-cases/new">
    <Plus className="mr-2 h-4 w-4" />
    新建用例
  </Link>
</Button>

// ✅ 正确写法
<Link href="/test-cases/new">
  <Button className="rounded-lg">
    <Plus className="mr-2 h-4 w-4" />
    新建用例
  </Button>
</Link>
```

**文件位置**：`tarsight-dashboard/app/(auth)/test-cases/page.tsx:63`

**Commit**: `a53d299` - fix: 移除 Button 组件的 asChild 属性以修复 TypeScript 类型错误

---

### 问题 2️⃣：Git 命令非零退出码导致脚本终止

**错误现象**：
```
out: Already up to date.
2026/01/07 08:15:40 Process exited with status 1
```

**原因分析**：
- `git pull` 在某些情况下返回非零退出码（即使显示 "Already up to date"）
- GitHub Actions workflow 中使用了 `set -e`（遇到错误立即退出）
- 导致脚本在 `git pull` 后终止，无法继续执行部署

**解决方案**：
在 GitHub Actions workflow 中为 git 命令添加 `|| true`：
```yaml
# ❌ 错误写法
git fetch origin
git pull origin master

# ✅ 正确写法
git fetch origin || true
git pull origin master || true
```

**Commit**: `98a8222` - fix: 优化 GitHub Actions workflow 以提高容错性

---

### 问题 3️⃣：多行 Commit Message 导致 Bash 语法错误

**错误现象**：
```bash
COMMIT_MSG="fix: 优化 GitHub Actions workflow 以提高容错性

- 为 git fetch/pull 添加 || true 避免非零退出码导致失败
- 添加部署开始提示便于调试
- 改进错误处理逻辑"
# 脚本执行到此行时失败，未显示后续输出
```

**原因分析**：
- GitHub Actions 的 `${{ github.event.head_commit.message }}` 会展开为完整的多行 commit message
- 多行字符串在 bash 中导致语法错误
- 即使后续使用 `head -n 1` 也无济于事（因为展开时已经包含换行符）

**尝试的解决方案（失败）**：
```bash
# ❌ 方案 1：使用 head -n 1（失败，因为展开时已是多行）
COMMIT_MSG="${{ github.event.head_commit.message }}"
COMMIT_FIRST_LINE=$(echo "$COMMIT_MSG" | head -n 1)
```

**最终解决方案**：
在 GitHub Actions 层面（而不是 bash 层面）处理 commit message：
```yaml
# ✅ 正确方案：使用 grep 直接判断
EXTRA_ARGS=""
echo "${{ github.event.head_commit.message }}" | grep -qE "\[no-lint\]|\[skip\s+lint\]" && EXTRA_ARGS="--no-lint" || true
```

**工作原理**：
1. `${{ github.event.head_commit.message }}` 展开为多行文本
2. 通过管道 `|` 传递给 `grep` 命令
3. `grep -q` 静默匹配（不输出，只返回退出码）
4. 如果匹配到 `[no-lint]` 或 `[skip lint]`，设置 `EXTRA_ARGS="--no-lint"`
5. `|| true` 确保即使没有匹配也不会导致脚本退出

**Commit**: `a9ef222` - fix: 在 GitHub Actions 层面处理 commit message 以避免多行文本问题

---

### 问题 4️⃣：Windows 换行符（CRLF）导致脚本无法执行 ⭐ **根本原因**

**错误信息**：
```
err: scripts/auto-deploy.sh: line 5: \r': command not found
err: scripts/auto-deploy.sh: line 7: \r': command not found
2026/01/07 08:29:28 Process exited with status 127
```

**原因分析**：
- `scripts/auto-deploy.sh` 文件使用了 Windows 风格的换行符（CRLF: `\r\n`）
- Linux 需要 Unix 风格的换行符（LF: `\n`）
- 当脚本在 Linux 上执行时，`\r` 被当作命令的一部分
- 导致 `\r': command not found` 错误

**检查方法**：
```bash
file scripts/auto-deploy.sh
# 输出：scripts/auto-deploy.sh: Bourne-Again shell script, UTF-8 text, with CRLF line terminators
```

**解决方案**：

1. **转换现有文件**：
```bash
# 方法 1：使用 dos2unix（如果已安装）
dos2unix scripts/auto-deploy.sh

# 方法 2：使用 sed
sed -i '' 's/\r$//' scripts/auto-deploy.sh
```

2. **验证转换结果**：
```bash
file scripts/auto-deploy.sh
# 输出：scripts/auto-deploy.sh: Bourne-Again shell script, UTF-8 text
# （没有 "with CRLF line terminators"）
```

3. **预防措施**：创建 `.gitattributes` 文件
```gitattributes
# Shell scripts must use LF
*.sh text eol=lf

# Python files should use LF
*.py text eol=lf

# YAML files should use LF
*.yml text eol=lf
*.yaml text eol=lf

# Markdown files can use platform native
*.md text eol=auto

# JSON files should use LF
*.json text eol=lf
```

4. **配置 Git 自动处理换行符**：
```bash
git config core.autocrlf input
```

**Commit**:
- `66a5567` - fix: 修复 auto-deploy.sh 的 Windows 换行符问题
- `d17c7fa` - chore: 添加 .gitattributes 确保脚本文件使用 LF 换行符

---

### 完整的修复时间线

| Commit | SHA | 修复内容 | 状态 |
|--------|-----|---------|------|
| 1️⃣ | `7d9c55f` | 添加 GitHub Actions workflow | ❌ 失败 |
| 2️⃣ | `a53d299` | ✅ 修复 Button asChild TypeScript 错误 | ❌ Git pull 退出码 |
| 3️⃣ | `98a8222` | ✅ 添加 `|| true` 容错 | ❌ 多行 commit message |
| 4️⃣ | `57545b4` | ❌ `head -n 1` 处理（无效） | ❌ 仍是多行问题 |
| 5️⃣ | `a9ef222` | ✅ GitHub Actions 层面 grep | ❌ **CRLF 换行符！** |
| 6️⃣ | `66a5567` | ✅ **修复 auto-deploy.sh 换行符** | ✅ 成功！ |
| 7️⃣ | `d17c7fa` | ✅ 添加 .gitattributes 防止复发 | ✅ 部署完成 |

---

### 关键经验总结

#### 1️⃣ **TypeScript 类型错误**
- shadcn/ui 组件的属性需要查阅文档
- `asChild` 不是标准属性，需要特殊配置
- 遇到类型错误时，优先考虑移除不常用的属性

#### 2️⃣ **Git 命令容错性**
- CI/CD 环境中，git 命令可能返回非零退出码
- 始终使用 `|| true` 来处理非关键命令
- `set -e` 虽然安全，但需要配合错误处理

#### 3️⃣ **多行文本处理**
- GitHub Actions 变量展开是**在脚本执行前**完成的
- 避免将可能包含多行的变量直接赋值给 bash 变量
- 使用管道和 grep 在外部处理，避免展开问题

#### 4️⃣ **换行符问题** ⭐ **最常见**
- **Windows (CRLF)**: `\r\n` - 会导致 Linux 脚本无法执行
- **Unix/Linux (LF)**: `\n` - 脚本文件的标准格式
- **检查方法**: `file filename` - 查看是否包含 "CRLF line terminators"
- **最佳实践**:
  - 使用 `.gitattributes` 强制指定换行符
  - 配置 `core.autocrlf = input`
  - 在提交前检查所有 shell 脚本

---

### 预防检查清单

在配置 GitHub Actions 自动部署时，确保：

**代码质量**：
- [ ] 本地构建成功：`npm run build`
- [ ] 无 TypeScript 类型错误：`npx tsc --noEmit`
- [ ] 所有测试通过

**脚本文件**：
- [ ] 所有 `.sh` 文件使用 LF 换行符：`file scripts/*.sh`
- [ ] 没有 CRLF 换行符
- [ ] 脚本有执行权限：`chmod +x scripts/*.sh`

**Git 配置**：
- [ ] `.gitattributes` 文件存在并配置正确
- [ ] `core.autocrlf` 设置为 `input`
- [ ] workflow 文件语法正确

**GitHub Secrets**：
- [ ] `PRODUCTION_HOST` - 服务器 IP 或域名
- [ ] `PRODUCTION_USER` - SSH 用户名
- [ ] `PRODUCTION_SSH_KEY` - SSH 私钥（完整 PEM 格式）
- [ ] `PRODUCTION_PORT` - SSH 端口（可选，默认 22）

**服务器配置**：
- [ ] SSH 公钥已添加到服务器的 `~/.ssh/authorized_keys`
- [ ] `authorized_keys` 文件权限正确：`chmod 600 ~/.ssh/authorized_keys`
- [ ] Docker 和 Docker Compose 已安装
- [ ] 项目目录存在：`/opt/tarsight`

---

### 快速诊断命令

```bash
# 1. 检查文件换行符
file scripts/auto-deploy.sh

# 2. 转换换行符
sed -i '' 's/\r$//' scripts/auto-deploy.sh

# 3. 验证 Git 配置
git config core.autocrlf
cat .gitattributes

# 4. 测试脚本语法
bash -n scripts/auto-deploy.sh

# 5. 本地测试部署脚本
sudo bash scripts/auto-deploy.sh
```

---

### 相关文档

- GitHub Actions 部署文档：`AUTO_DEPLOY_QUICKSTART.md`
- 完整部署指南：`docs/guides/GITHUB_ACTIONS_DEPLOYMENT.md`
- 生产更新指南：`docs/guides/PRODUCTION_UPDATE_GUIDE.md`

---

**Last Updated**: 2026-01-07 (上午)
**Latest Changes**:
- 🐛 修复 Button 组件 asChild TypeScript 类型错误
- 🐛 修复 Git 命令非零退出码导致脚本终止
- 🐛 修复多行 commit message 导致 bash 语法错误
- 🐛 **修复 Windows 换行符（CRLF）问题** - 根本原因
- ✨ 添加 .gitattributes 防止换行符问题复发
- ✨ 配置 core.autocrlf 自动处理换行符
- **Added UI/UX Design Guidelines section** - Modern dashboard design principles
