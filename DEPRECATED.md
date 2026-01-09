# 废弃页面和组件清单

> **创建日期**: 2026-01-09
> **最后更新**: 2026-01-09
> **目的**: 记录项目中已废弃但未删除的页面和组件，避免混淆

---

## 🚫 已废弃的页面路由

### 1. `/test-cases/new` - 废弃的测试用例创建页面

**文件位置**: `app/(auth)/test-cases/new/page.tsx`

**废弃原因**:
- ✅ 已被抽屉式表单（Drawer）替代
- ✅ 主页面 `/test-cases` 已集成创建功能
- ✅ 独立页面创建用户体验不如抽屉式

**当前状态**:
- ❌ 仍然存在，但未在导航中显示
- ⚠️ 可能被直接 URL 访问
- 🔄 应删除但需确认无外部链接

**替代方案**:
- 使用 `/test-cases` 主页面
- 点击"新增测试用例"按钮打开抽屉式表单

**依赖组件**:
- `components/new-test-case-form.tsx` (废弃)
- `components/test-case-form.tsx` (部分废弃)

**删除计划**:
- [ ] 确认无导航链接指向此路由
- [ ] 删除 `app/(auth)/test-cases/new/` 目录
- [ ] 删除 `components/new-test-case-form.tsx`

---

## 🚫 已废弃的组件

### 1. `NewTestCaseForm` - 新增测试用表单包装器

**文件位置**: `components/new-test-case-form.tsx`

**废弃原因**:
- ✅ 仅用于废弃的 `/test-cases/new` 页面
- ✅ 功能完全由 `TestCaseFormDrawer` 替代

**当前状态**:
- ❌ 仅被废弃页面导入
- 🔄 应随页面一起删除

**替代方案**:
- `TestCaseFormDrawer` - 主页面使用的抽屉式表单

---

### 2. `TestCaseForm` - 独立页面表单

**文件位置**: `components/test-case-form.tsx`

**废弃程度**: **部分废弃** ⚠️

**状态说明**:
- ❌ **已废弃**: 用于独立创建页面 (`/test-cases/new`)
- ✅ **仍在使用**: 被 `NewTestCaseForm` 引用
- ✅ **已集成断言功能**: 包含 `AssertionBuilder` 组件

**使用情况**:
```typescript
// 当前使用位置
components/new-test-case-form.tsx:  <TestCaseForm ... />
components/test-case-actions.tsx:   <TestCaseForm ... />  // ⚠️ 需确认
```

**建议**:
1. 保留此文件，但明确注释其用途
2. 检查 `test-case-actions.tsx` 是否需要迁移到 Drawer
3. 添加文件头注释说明使用场景

---

## 🔄 活跃的组件（正在使用）

### ✅ `TestCaseFormDrawer` - 抽屉式测试用例表单

**文件位置**: `components/test-case-form-drawer.tsx`

**使用位置**:
```typescript
components/test-case-workbench.tsx:  <TestCaseFormDrawer ... />
```

**功能**:
- ✅ 主测试用例列表页面的编辑/创建表单
- ✅ 侧边抽屉式 UI
- ✅ 已集成断言功能 (AssertionBuilder)
- ✅ 支持旧数据迁移 (validation_rules → assertions)

**状态**: **活跃使用** ✅

---

## 📋 清理计划

### 阶段 1: 标记废弃（当前阶段）
- [x] 创建 `DEPRECATED.md` 文档
- [ ] 在废弃文件顶部添加 `@deprecated` 注释
- [ ] 在代码中添加 TODO 删除标记

### 阶段 2: 验证无依赖
- [ ] 搜索所有对 `/test-cases/new` 的引用
- [ ] 检查导航菜单配置
- [ ] 检查是否有书签或外部链接
- [ ] 确认 `test-case-actions.tsx` 使用场景

### 阶段 3: 执行删除
- [ ] 删除 `app/(auth)/test-cases/new/` 目录
- [ ] 删除 `components/new-test-case-form.tsx`
- [ ] 决定 `test-case-form.tsx` 去留
  - 选项 A: 删除（如果无其他使用）
  - 选项 B: 保留但添加废弃注释（如果有其他使用）

---

## 🔍 检查清单

在删除废弃组件前，请确认：

### 数据库层面
- [ ] 无硬编码的路由引用
- [ ] 无配置文件引用

### 代码层面
```bash
# 搜索所有引用
grep -r "test-cases/new" app/ components/
grep -r "NewTestCaseForm" app/ components/
grep -r "from.*test-case-form" components/ | grep -v drawer
```

### 导航层面
- [ ] 主导航菜单无链接
- [ ] 面包屑配置无引用
- [ ] 快捷键配置无引用

### 文档层面
- [ ] 更新 `docs/architecture.md`
- [ ] 更新 `README.md`
- [ ] 更新相关 API 文档

---

## 📝 添加废弃注释的标准

在废弃文件顶部添加以下注释：

```typescript
/**
 * @deprecated
 *
 * 废弃原因: 已被抽屉式表单 (TestCaseFormDrawer) 替代
 * 废弃日期: 2026-01-09
 * 替代方案: TestCaseFormDrawer
 * 删除计划: v2.0.0
 *
 * ⚠️ 请勿在此文件中添加新功能！
 * ⚠️ 请使用 components/test-case-form-drawer.tsx 代替
 */
'use client'

// ... 原有代码
```

---

## 🎯 经验教训

### 问题 1: 缺少废弃标记
- ❌ 没有明确标记废弃的组件
- ❌ 没有记录替代方案
- ❌ 导致新旧组件混淆

### 问题 2: 缺少依赖追踪
- ❌ 没有清理依赖关系
- ❌ 没有验证引用情况
- ❌ 导致废弃代码仍然被维护

### 问题 3: 缺少文档
- ❌ 没有废弃清单文档
- ❌ 没有删除计划
- ❌ 新开发者不清楚哪些组件可用

---

## ✅ 改进建议

### 1. 废弃流程规范

当需要废弃组件时：

```bash
# Step 1: 添加废弃标记
# 在文件顶部添加 @deprecated 注释

# Step 2: 记录到 DEPRECATED.md
# 更新此文档，说明废弃原因和替代方案

# Step 3: 迁移引用
# 将所有引用迁移到新组件

# Step 4: 添加删除标记
# 在 git commit 中标记删除计划

# Step 5: 下个大版本删除
# 在版本升级时彻底删除废弃代码
```

### 2. 组件命名规范

```typescript
// ❌ 容易混淆
test-case-form.tsx
test-case-form-drawer.tsx

// ✅ 更清晰
test-case-form-page.tsx      // 页面级表单
test-case-form-drawer.tsx    // 抽屉式表单

// ✅ 或使用功能命名
test-case-creation-form.tsx  // 创建用表单
test-case-editing-drawer.tsx // 编辑抽屉
```

### 3. 文档同步

每次功能变更时：
- [ ] 更新 `docs/architecture.md`
- [ ] 更新 `DEPRECATED.md`
- [ ] 添加迁移指南（如果需要）
- [ ] 更新组件使用示例

---

## 📞 联系方式

如有疑问或需要确认删除：
- 检查项目文档: `docs/`
- 查看 Issue: GitHub Issues
- 联系维护者

---

**最后更新**: 2026-01-09
**维护者**: Tarsight Team
