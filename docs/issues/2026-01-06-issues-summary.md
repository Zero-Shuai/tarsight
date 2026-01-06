# 问题总结 - 2026-01-06

## 📋 今日遇到的所有问题及解决方案

### 问题 1: 测试用例页面报错 - 缺少 UI 组件

**错误信息**:
```
Module not found: Can't resolve '@/components/ui/select'
Module not found: Can't resolve '@/components/ui/checkbox'
Module not found: Can't resolve '@/components/ui/alert'
```

**根本原因**:
- `test-execution-form.tsx` 使用了 shadcn/ui 组件
- 这些组件文件不存在于项目中
- 没有安装对应的 Radix UI 依赖

**解决方案**:
```bash
# 1. 创建缺失的组件文件
components/ui/select.tsx
components/ui/checkbox.tsx
components/ui/alert.tsx

# 2. 安装依赖
npm install @radix-ui/react-select
npm install @radix-ui/react-checkbox
# alert 使用 class-variance-authority（已安装）

# 3. 修复导入路径
test-execution-form.tsx:15
- import { Alert, AlertDescription, AlertTitle } from '@/components/ui'
+ import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
```

**教训**:
- ✅ 使用组件前先检查文件是否存在
- ✅ 建立组件依赖检查清单
- ✅ 在 CLAUDE.md 中记录常用缺失组件

---

### 问题 2: 重复的"新增用例"按钮

**现象**:
- `/test-cases` 页面有两个"新增用例"按钮
- 一个在页面顶部
- 一个在 TestCaseList 组件内部

**根本原因**:
- 功能迭代过程中遗留的重复代码
- TestCaseList 组件包含了自己的表单和按钮

**解决方案**:
```tsx
// components/test-case-list.tsx

// 删除以下内容：
- import TestCaseForm from './test-case-form'
- import { Plus } from 'lucide-react'
- const [showCreateForm, setShowForm] = useState(false)
- 整个表单渲染逻辑（47-75行）
- 新增按钮（69-75行）

// 保留：列表显示和筛选功能
```

**教训**:
- ✅ 功能重构时完整移除旧代码
- ✅ 使用搜索工具检查重复实现
- ✅ 建立单一职责原则

---

### 问题 3: "新增用例"按钮指向不存在的页面

**现象**:
- 点击"新增用例"后访问 `/test-cases/new`
- 页面返回 404

**根本原因**:
- 只创建了按钮，没有创建对应的路由页面

**解决方案**:
```tsx
// 1. 创建服务端组件页面
app/(auth)/test-cases/new/page.tsx
- 从数据库获取 modules 列表
- 渲染 NewTestCaseForm 组件

// 2. 创建客户端包装组件
components/new-test-case-form.tsx
- 使用 useRouter 实现表单提交后导航
- 传递 onSuccess 和 onCancel 回调

// 3. 遵循 Next.js App Router 模式
Server Component (page.tsx) → Client Wrapper → Form Component
```

**代码结构**:
```typescript
// app/(auth)/test-cases/new/page.tsx (Server Component)
export default async function NewTestCasePage() {
  const modules = await getModules()
  return (
    <div>
      <h1>新建测试用例</h1>
      <NewTestCaseForm modules={modules} />
    </div>
  )
}

// components/new-test-case-form.tsx (Client Component)
'use client'
export function NewTestCaseForm({ modules }) {
  const router = useRouter()
  return (
    <TestCaseForm
      modules={modules}
      onSuccess={() => router.push('/test-cases')}
      onCancel={() => router.push('/test-cases')}
    />
  )
}
```

**教训**:
- ✅ 创建路由前先检查文件是否存在
- ✅ Next.js App Router 需要明确的 `page.tsx` 文件
- ✅ 区分 Server 和 Client 组件职责

---

### 问题 4: 测试用例编号系统改造需求理解偏差

**用户需求**:
> "能否改造一下现在的用例编号,我希望用例编号是通过项目编号-模块编号-序号的形式吧,
> 感觉是需要在项目管理增加一个模块控制项目编号,在模块观看加个字段控制模块编号"

**初始方案问题**:
- 没有完全理解用户对"手动输入编号"的期望
- 过度设计自动生成逻辑

**澄清后的需求**:
1. **编号格式**: PRJ001-MOD001-001（使用连字符）
2. **输入方式**: 项目编号和模块编号都手动输入
3. **序号规则**: 按模块递增（每个模块独立计数）
4. **数据迁移**: 统一迁移现有用例编号

**解决方案**:
```typescript
// 模块表单 - 手动输入
<Input
  value={module_code}
  onChange={(e) => setModuleCode(e.target.value.toUpperCase())}
  pattern="MOD\d{3}"
  placeholder="MOD001"
/>

// 测试用例表单 - 自动生成预览
<Input
  value={formData.case_id || previewCaseId}
  placeholder={previewCaseId || "PRJ001-MOD001-001"}
/>
<Button onClick={() => setFormData({ ...formData, case_id: previewCaseId })}>
  <Sparkles /> 自动生成
</Button>
```

**教训**:
- ✅ 需求理解不清晰时使用 AskUserQuestion 工具
- ✅ 提供 2-4 个明确选项让用户选择
- ✅ 不要假设用户的偏好
- ✅ 进入 Plan Mode 充分探索后再实施

---

### 问题 5: 没有优先使用现有的 MCP 服务

**问题**:
- 创建了 SQL 迁移文件但没有考虑使用 MCP 工具直接执行
- 增加了手动操作的复杂度

**更好的方案**:
```python
# 使用 MCP apply_migration（开发环境）
mcp__plugin_supabase_supabase__apply_migration(
    project_id="xxx",
    name="add_project_module_codes",
    query="ALTER TABLE public.projects ADD COLUMN project_code VARCHAR(20);"
)

# 使用 MCP execute_sql 验证
mcp__plugin_supabase_supabase__execute_sql(
    project_id="xxx",
    query="SELECT COUNT(*) FROM public.projects WHERE project_code IS NOT NULL;"
)

# 使用 MCP list_tables 检查结构
mcp__plugin_supabase_supabase__list_tables(
    project_id="xxx",
    schemas=["public"]
)
```

**MCP vs SQL 文件对比**:

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 开发测试 | MCP apply_migration | 快速迭代，立即验证 |
| 生产部署 | SQL 文件 + MCP 验证 | 审计追踪，可回滚 |
| 数据修复 | MCP execute_sql | 一次性操作，无需版本 |
| 结构变更 | SQL 文件 | 版本控制，代码审查 |

**教训**:
- ✅ 优先检查可用的 MCP 服务
- ✅ 开发环境使用 MCP 提高效率
- ✅ 生产环境保留 SQL 文件供审计
- ✅ 在 CLAUDE.md 中记录 MCP 最佳实践

---

## 📊 问题分类统计

### 按类型分类
- **前端组件缺失**: 1 个（问题 1）
- **代码重复/遗留**: 1 个（问题 2）
- **路由/页面缺失**: 1 个（问题 3）
- **需求理解**: 1 个（问题 4）
- **工具使用不当**: 1 个（问题 5）

### 按严重程度分类
- **高（阻塞功能）**: 2 个（问题 1, 3）
- **中（影响体验）**: 2 个（问题 2, 4）
- **低（优化改进）**: 1 个（问题 5）

### 按解决时间分类
- **< 10 分钟**: 2 个（问题 1, 2）
- **10-30 分钟**: 1 个（问题 3）
- **> 1 小时**: 2 个（问题 4, 5）

---

## 🎯 预防措施

### 1. 开发前检查清单

**使用组件前**:
```bash
# 检查组件是否存在
ls components/ui/select.tsx
ls components/ui/checkbox.tsx
ls components/ui/alert.tsx

# 检查依赖是否安装
npm list @radix-ui/react-select
```

**创建路由前**:
```bash
# 检查页面文件是否存在
ls app/(auth)/test-cases/new/page.tsx

# 检查是否有重复实现
grep -r "新增用例" components/
```

**数据库变更前**:
```python
# 列出可用的 MCP 工具
mcp__plugin_supabase_supabase__list_tables()
mcp__plugin_supabase_supabase__get_project()
```

### 2. 需求理解流程

```
1. 用户提出需求
   ↓
2. 检查是否有歧义
   ↓
3. 如有歧义 → 使用 AskUserQuestion（2-4个选项）
   ↓
4. 确认理解 → 进入 Plan Mode
   ↓
5. 充分探索 → 制定详细方案
   ↓
6. 用户审批 → 开始实施
```

### 3. 工具选择优先级

```
数据库操作：
1. MCP apply_migration（开发）
2. MCP execute_sql（查询/修复）
3. SQL 文件（生产）

文档查询：
1. MCP context7（库文档）
2. MCP web-search（最新信息）
3. MCP web-reader（具体页面）

代码理解：
1. Read/Grep 工具（精确查找）
2. Task agent（复杂探索）
```

---

## 📚 相关文档更新

### 已更新文档
1. ✅ `CLAUDE.md` - 添加 Development Best Practices
   - MCP Services Integration
   - Frontend Component Dependencies
   - Page Structure Patterns
   - Database Schema Changes

2. ✅ `MIGRATION_GUIDE.md` - 完整迁移指南
   - 部署步骤
   - 验证清单
   - 故障排查

3. ✅ `OPTIMIZED_MIGRATION_GUIDE.md` - MCP 优先方案
   - MCP 工具使用
   - 快速验证方法
   - 回滚策略

### 建议后续改进
1. 创建 `components/ui/` 组件依赖检查脚本
2. 建立 route 文件清单（避免 404）
3. 定期审查代码重复（使用工具）
4. MCP 工具使用最佳实践文档

---

## 💡 经验教训总结

### 技术层面
1. **组件依赖管理**: 建立检查清单，使用前验证
2. **路由规范**: Server + Client 分离模式
3. **数据库操作**: MCP 优先，SQL 文件兜底
4. **代码质量**: 及时清理遗留代码

### 流程层面
1. **需求理解**: 不确定就问，不要假设
2. **工具使用**: 优先检查现有工具，避免重复造轮
3. **文档记录**: 问题总结到 CLAUDE.md
4. **测试验证**: 每个步骤都要验证

### 沟通层面
1. **明确需求**: 使用 AskUserQuestion 获取明确答案
2. **透明沟通**: 告知用户方案优缺点
3. **及时反馈**: 问题立即暴露，不要隐藏

---

**记录日期**: 2026-01-06
**记录人**: Claude Code
**版本**: v1.0
