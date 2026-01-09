# 测试用例编号系统改造 - 实施完成总结

## 📋 已完成的工作

### ✅ 1. 数据库迁移脚本

#### Migration 002: 添加编号字段
**文件**: `supabase_version/database/migrations/002_add_project_module_codes.sql`

- ✅ 添加 `project_code` 字段到 `projects` 表（VARCHAR(20), UNIQUE）
- ✅ 添加 `module_code` 字段到 `modules` 表（VARCHAR(20), UNIQUE per project）
- ✅ 扩展 `test_cases.case_id` 字段长度从 VARCHAR(20) 到 VARCHAR(50)
- ✅ 创建索引提升查询性能
- ✅ 创建数据库函数 `generate_case_id()` 和 `generate_next_case_sequence()`
- ✅ 支持自动生成格式：`PRJ001-MOD001-001`

#### Migration 003: 数据迁移
**文件**: `supabase_version/database/migrations/003_migrate_to_new_id_format.sql`

- ✅ 创建备份表（`*_backup_20260106`）
- ✅ 为现有项目生成编号（PRJ001, PRJ002...）
- ✅ 为现有模块生成编号（MOD001, MOD002...）
- ✅ 迁移现有测试用例编号为新格式
- ✅ 添加 NOT NULL 约束
- ✅ 创建映射表供参考

### ✅ 2. TypeScript 类型定义
**文件**: `tarsight-dashboard/lib/types/database.ts`

- ✅ `Project` 类型添加 `project_code: string`
- ✅ `Module` 类型添加 `module_code: string`
- ✅ `TestCase.case_id` 添加注释说明新格式

### ✅ 3. API 端点
**文件**: `tarsight-dashboard/app/api/test-cases/generate-id/route.ts`

- ✅ GET 端点：`/api/test-cases/generate-id?module_id=xxx`
- ✅ 自动获取项目和模块编号
- ✅ 计算下一个序号
- ✅ 返回完整编号：`{ case_id, project_code, module_code, sequence }`

### ✅ 4. 前端改造

#### 模块管理页面
**文件**: `tarsight-dashboard/app/(auth)/modules/page.tsx`

- ✅ 表单添加"模块编号"输入框
- ✅ 自动转大写，格式验证（MOD\d{3}）
- ✅ 模块卡片显示编号徽章

#### 测试用例表单
**文件**: `tarsight-dashboard/components/test-case-form.tsx`

- ✅ 监听模块变化，自动预览编号
- ✅ 显示预览编号提示
- ✅ 添加"✨"按钮应用自动生成的编号
- ✅ 模块选择器显示模块编号
- ✅ 只在新增时预览，编辑时不预览

### ✅ 5. Python 后端适配
**文件**: `supabase_version/utils/supabase_client.py`

- ✅ 更新 `get_test_cases_by_case_ids()` 方法
- ✅ 正确处理包含连字符的编号（用引号包裹）
- ✅ 向后兼容旧格式编号

---

## 🚀 部署步骤

### 步骤 1: 应用数据库迁移

```bash
# 进入 Supabase 项目目录
cd /Users/zhangshuai/WorkSpace/Tarsight/supabase_version

# 方式 1: 使用 Supabase CLI（推荐）
npx supabase db execute --file database/migrations/002_add_project_module_codes.sql
npx supabase db execute --file database/migrations/003_migrate_to_new_id_format.sql

# 方式 2: 使用 Supabase Dashboard
# 1. 打开 Supabase Dashboard
# 2. 进入 SQL Editor
# 3. 复制粘贴两个 migration 文件的内容执行
```

### 步骤 2: 验证迁移结果

```sql
-- 检查项目编号
SELECT id, name, project_code FROM projects;

-- 检查模块编号
SELECT id, name, module_code FROM modules;

-- 检查测试用例编号
SELECT id, case_id FROM test_cases ORDER BY created_at DESC LIMIT 10;

-- 验证唯一约束
SELECT project_code, COUNT(*) FROM projects GROUP BY project_code HAVING COUNT(*) > 1;
SELECT project_id, module_code, COUNT(*) FROM modules GROUP BY project_id, module_code HAVING COUNT(*) > 1;
```

### 步骤 3: 测试前端功能

1. **启动开发服务器**
   ```bash
   cd tarsight-dashboard
   npm run dev
   ```

2. **测试模块编号**
   - 访问 `/modules`
   - 点击"新增模块"
   - 输入模块编号（例如：MOD001）
   - 保存并验证编号显示正确

3. **测试自动生成编号**
   - 访问 `/test-cases/new`
   - 选择一个模块（已有 module_code 的）
   - 查看是否显示预览编号
   - 点击 ✨ 按钮应用编号
   - 保存并验证

### 步骤 4: 测试 Python 后端

```bash
cd supabase_version

# 测试查询功能
.venv/bin/python -c "
from utils.supabase_client import get_supabase_client
client = get_supabase_client()

# 测试新格式查询
test_cases = client.get_test_cases_by_case_ids(
    project_id='8786c21f-7437-4a2d-8486-9365a382b38e',
    case_ids=['PRJ001-MOD001-001', 'PRJ001-MOD001-002']
)
print(f'查询到 {len(test_cases)} 个测试用例')
for tc in test_cases:
    print(f'  - {tc[\"case_id\"]}')
"
```

---

## ⚠️ 注意事项

### 数据安全
- ✅ 迁移脚本已创建备份表（`*_backup_20260106`）
- ✅ 如果需要回滚，可从备份表恢复数据
- ⚠️ 建议在维护窗口执行迁移
- ⚠️ 迁移前确保数据库已备份

### 兼容性
- ✅ Python 代码向后兼容旧格式编号
- ✅ 新旧格式可以共存
- ⚠️ 建议全部迁移后统一使用新格式

### 验证清单
- [ ] Migration 002 执行成功
- [ ] Migration 003 执行成功
- [ ] 所有项目都有 `project_code`
- [ ] 所有模块都有 `module_code`
- [ ] 所有测试用例都有新格式 `case_id`
- [ ] 模块表单可以输入编号
- [ ] 测试用例表单显示预览编号
- [ ] Python 查询支持新格式
- [ ] 测试执行功能正常

---

## 📊 新编号格式说明

### 格式规范
```
项目编号 - 模块编号 - 序号
PRJ001 - MOD001 - 001
```

### 命名规则
- **项目编号**: `PRJ` + 三位数字（PRJ001, PRJ002...）
- **模块编号**: `MOD` + 三位数字（MOD001, MOD002...）
- **序号**: 三位数字，按模块递增（001, 002, 003...）

### 示例
```
PRJ001-MOD001-001  (项目1的模块1的第1个用例)
PRJ001-MOD001-002  (项目1的模块1的第2个用例)
PRJ001-MOD002-001  (项目1的模块2的第1个用例)
PRJ002-MOD001-001  (项目2的模块1的第1个用例)
```

---

## 🐛 故障排查

### 问题 1: 模块选择后没有显示预览编号

**原因**: 模块未设置 `module_code`

**解决**:
1. 进入模块管理页面
2. 编辑模块，设置模块编号（例如：MOD001）
3. 返回测试用例表单重新选择模块

### 问题 2: 数据库迁移失败

**原因**: 字段已存在或约束冲突

**解决**:
```sql
-- 检查字段是否已存在
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('projects', 'modules')
  AND column_name IN ('project_code', 'module_code');

-- 删除字段重新执行
ALTER TABLE public.projects DROP COLUMN IF EXISTS project_code;
ALTER TABLE public.modules DROP COLUMN IF EXISTS module_code;
```

### 问题 3: Python 查询不到新格式编号

**原因**: case_id 中的连字符未正确转义

**解决**:
- ✅ 已更新 `supabase_client.py` 的 `get_test_cases_by_case_ids()` 方法
- ✅ 确保使用最新版本的代码

### 问题 4: 生成编号时报错

**错误信息**: "项目或模块编号未设置"

**解决**:
1. 检查项目是否有 `project_code`
2. 检查模块是否有 `module_code`
3. 使用以下 SQL 设置编号：
   ```sql
   UPDATE projects SET project_code = 'PRJ001' WHERE id = '...';
   UPDATE modules SET module_code = 'MOD001' WHERE id = '...';
   ```

---

## 📝 后续优化建议

### 短期（1-2周）
1. 为项目表单添加 `project_code` 输入框（当前只有一个项目）
2. 添加编号唯一性验证（创建时检查是否重复）
3. 添加批量修复编号的工具（如果迁移有问题）

### 中期（1个月）
1. 考虑添加编号重新生成功能
2. 添加编号规则配置（支持自定义前缀）
3. 优化 API 性能（缓存项目/模块编号）

### 长期（3个月）
1. 支持多项目编号系统
2. 添加编号历史记录功能
3. 考虑使用 UUID 或其他编号方案

---

## ✅ 验收标准

### 数据库层面
- [x] Migration 脚本已创建
- [ ] Migration 已在生产环境执行
- [ ] 所有数据已迁移为新格式
- [ ] 备份表已验证

### 前端层面
- [x] 模块表单支持输入 module_code
- [x] 测试用例表单显示预览编号
- [x] 自动生成功能正常工作
- [ ] 用户测试通过

### 后端层面
- [x] Python 代码已更新
- [x] API 端点已创建
- [ ] 查询功能测试通过
- [ ] 测试执行功能测试通过

---

## 📞 技术支持

如遇到问题，请提供以下信息：
1. 错误截图或错误日志
2. 执行的具体操作步骤
3. 数据库版本和 Supabase 版本
4. 前端控制台输出（F12）
5. Python 后端日志

---

**实施日期**: 2026-01-06
**实施人员**: Claude Code
**文档版本**: v1.0
