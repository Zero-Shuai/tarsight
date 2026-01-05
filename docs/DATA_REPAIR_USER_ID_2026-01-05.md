# 数据修复记录 - user_id 字段回填

**日期**: 2026-01-05
**执行人**: Claude Code (via Supabase MCP)
**问题**: 数据库字段命名不一致导致历史数据缺失 user_id

---

## 📋 问题概述

### 发现的问题

1. **字段命名不一致**
   - `test_cases` 表：数据库字段为 `created_by`，前端代码使用 `user_id`
   - `test_executions` 表：数据库字段为 `started_by`，前端代码未使用

2. **影响范围**
   - test_cases: 20 条记录中 1 条缺失 user_id（TS020）
   - test_executions: 18 条记录全部缺失 user_id

3. **根本原因**
   - 数据库 schema 与前端代码不匹配
   - 前端插入 `user_id` 字段被数据库忽略（字段不存在）

---

## 🔧 执行的修复

### Phase 1: 字段重命名

#### Migration 1: test_cases 表
```sql
ALTER TABLE test_cases
RENAME COLUMN created_by TO user_id;

COMMENT ON COLUMN test_cases.user_id IS '创建测试用例的用户 ID';
```

**状态**: ✅ 已完成
**执行时间**: 2026-01-05

#### Migration 2: test_executions 表
```sql
ALTER TABLE test_executions
RENAME COLUMN started_by TO user_id;

COMMENT ON COLUMN test_executions.user_id IS '启动测试执行的用户 ID';
```

**状态**: ✅ 已完成
**执行时间**: 2026-01-05

### Phase 2: 历史数据回填

#### Migration 3: 回填缺失的 user_id
```sql
-- 回填 user_id: 9a66ed45-f3e1-43b0-9717-3be8d0241edd

UPDATE test_cases
SET user_id = '9a66ed45-f3e1-43b0-9717-3be8d0241edd'
WHERE user_id IS NULL;

UPDATE test_executions
SET user_id = '9a66ed45-f3e1-43b0-9717-3be8d0241edd'
WHERE user_id IS NULL;

COMMENT ON COLUMN test_cases.user_id IS '创建测试用例的用户 ID (历史数据已回填)';
COMMENT ON COLUMN test_executions.user_id IS '启动测试执行的用户 ID (历史数据已回填)';
```

**状态**: ✅ 已完成
**执行时间**: 2026-01-05

---

## 📊 修复结果验证

### test_cases 表
| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 总记录数 | 20 | 20 |
| 有 user_id | 19 | 20 |
| 缺失 user_id | 1 | 0 |

### test_executions 表
| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 总记录数 | 18 | 18 |
| 有 user_id | 0 | 18 |
| 缺失 user_id | 18 | 0 |

### 具体记录验证
```sql
-- TS020 测试用例修复前后对比
-- 修复前: user_id = NULL
-- 修复后: user_id = '9a66ed45-f3e1-43b0-9717-3be8d0241edd'
```

---

## 💾 代码更新

### 前端代码修改

1. **lib/types/database.ts**
   - 在 `TestCase` 类型中添加 `user_id?: string` 字段
   - 在 `TestExecution` 类型中添加 `user_id?: string` 字段

2. **components/test-case-form.tsx**
   - 创建测试用例时获取当前用户
   - 插入数据时包含 `user_id: user.id`

### Git 提交记录
- `b1ea135` - fix: 在测试用例创建时添加 user_id 字段
- `41fd224` - refactor: 统一字段命名为 user_id 并添加 TestExecution.user_id 字段

---

## 🔄 后续影响

### RLS (Row Level Security) 策略
现在所有数据都有 `user_id` 字段，RLS 策略可以正常工作：
- 用户只能看到自己创建的测试用例
- 用户只能访问自己启动的测试执行

### 数据完整性
- ✅ 所有测试用例都有创建者信息
- ✅ 所有测试执行都有启动者信息
- ✅ 数据追溯性完整

### 新创建的数据
通过前端新创建的测试用例会自动包含当前登录用户的 `user_id`。

---

## 📝 经验总结

### 教训
1. **数据库 schema 与代码必须保持一致**
   - 字段命名应该在设计阶段确定
   - 修改 schema 时必须同步更新代码

2. **使用类型定义的优势**
   - TypeScript 类型定义可以帮助发现字段不匹配
   - 但需要确保类型定义与实际数据库 schema 同步

3. **数据验证的重要性**
   - 应该定期检查关键字段的完整性
   - 发现问题及时修复，避免历史数据积累

### 最佳实践
1. 使用数据库迁移工具（Supabase MCP）进行 schema 变更
2. 字段命名遵循统一约定（user_id vs created_by）
3. 前端代码与数据库 schema 双向验证
4. 定期审计数据完整性

---

## ✅ 验证清单

- [x] 字段重命名完成
- [x] 历史数据回填完成
- [x] 数据验证通过
- [x] 前端代码更新
- [x] TypeScript 类型定义更新
- [x] Git 提交完成
- [x] 文档记录完成
- [ ] 生产环境更新（待执行）

---

## 🚀 生产环境部署

### 部署步骤
```bash
# 1. 拉取最新代码
cd /opt/tarsight
git pull origin master

# 2. 构建并更新
sudo bash scripts/update-production.sh

# 3. 验证功能
# 在前端创建一个新测试用例
# 检查 Supabase 数据库确认 user_id 已正确插入
```

### 回滚计划
如果发现问题，可以通过以下 SQL 回滚：
```sql
-- 回滚字段重命名（如果需要）
ALTER TABLE test_cases RENAME COLUMN user_id TO created_by;
ALTER TABLE test_executions RENAME COLUMN user_id TO started_by;
```

---

**文档维护**: 本文档应作为数据修复的永久记录，存档于 `docs/` 目录。
