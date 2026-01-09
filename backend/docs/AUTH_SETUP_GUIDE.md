# 快速配置用户认证和 RLS

## 方法 1：使用生成的 SQL 脚本（推荐）

### 步骤 1：生成 SQL 脚本

```bash
cd /Users/zhangshuai/WorkSpace/Tarsight/supabase_version/scripts
./generate_auth_rls_sql.sh
```

这会生成 `setup_auth_and_rls.sql` 文件。

### 步骤 2：在 Supabase Dashboard 中执行 SQL

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New Query**
5. 复制 `setup_auth_and_rls.sql` 文件的内容
6. 粘贴到编辑器中
7. 点击 **Run** 执行

### 步骤 3：启用 Email Auth

1. 在 Supabase Dashboard 中
2. 进入 **Authentication** → **Settings**
3. 确保 **Email Auth** 已启用
4. （可选）关闭邮箱验证（仅测试环境）

### 步骤 4：测试

```bash
# 启动前端
cd /Users/zhangshuai/WorkSpace/Tarsight/tarsight-dashboard
npm run dev
```

访问 `http://localhost:3000`，会自动跳转到登录页面。

---

## 方法 2：手动执行（逐步配置）

如果需要分步骤执行，可以使用以下 SQL：

### 1. 添加 user_id 列

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id TEXT;
```

### 2. 启用 RLS

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
```

### 3. 创建策略（以 projects 为例）

```sql
-- 查看策略
CREATE POLICY "Users can view their own projects"
ON projects
FOR SELECT
USING (auth.uid()::text = user_id);

-- 插入策略
CREATE POLICY "Users can insert their own projects"
ON projects
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- 更新策略
CREATE POLICY "Users can update their own projects"
ON projects
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- 删除策略
CREATE POLICY "Users can delete their own projects"
ON projects
FOR DELETE
USING (auth.uid()::text = user_id);
```

其他表的策略请参考 `setup_auth_and_rls.sql` 文件。

---

## 验证配置

### 检查 RLS 是否启用

在 Supabase Dashboard 中执行：

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('projects', 'modules', 'test_cases', 'test_executions', 'test_results');
```

应该显示所有表的 `rowsecurity` 为 `true`。

### 检查策略是否创建

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

应该看到所有表的策略。

---

## 常见问题

### Q: 执行 SQL 时报错 "relation does not exist"

**A:** 确保表已经存在。先运行 `create_execution_tables.py` 创建表。

### Q: RLS 策略不生效

**A:** 检查：
1. RLS 是否已启用（`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`）
2. 用户是否已登录（`auth.uid()` 是否返回用户 ID）
3. `user_id` 字段是否正确设置

### Q: 如何处理现有数据？

**A:** 为现有项目分配 user_id：

```sql
-- 查看没有 user_id 的项目
SELECT id, name FROM projects WHERE user_id IS NULL;

-- 为特定项目分配 user_id（需要先获取用户的 UUID）
UPDATE projects
SET user_id = 'your-user-uuid-here'
WHERE user_id IS NULL;

-- 或者为所有项目分配给当前用户
UPDATE projects
SET user_id = auth.uid()::text
WHERE user_id IS NULL;
```

### Q: 如何获取用户的 UUID？

**A:** 用户注册后，在 Supabase Dashboard 的 **Authentication** → **Users** 表中可以查看。

---

## 后端使用认证

### 登录并获取 Token

```python
from utils.auth import get_auth_client
from utils.supabase_client import get_supabase_client

# 登录
auth_client = get_auth_client()
result = auth_client.sign_in('user@example.com', 'password')

if result['success']:
    access_token = result['access_token']

    # 使用 token 初始化客户端
    client = get_supabase_client(access_token=access_token)

    # 现在 RLS 会自动过滤数据
    projects = client.get_projects()
```

---

## 前端配置

前端已经配置好认证，只需要：

1. **安装依赖**

```bash
cd /Users/zhangshuai/WorkSpace/Tarsight/tarsight-dashboard
npm install @supabase/ssr
```

2. **配置环境变量**（`.env.local`）

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_PROJECT_ID=your_project_id
```

3. **运行**

```bash
npm run dev
```

---

## 更多文档

详细配置说明请查看：
- [AUTHENTICATION_SETUP.md](../AUTHENTICATION_SETUP.md) - 完整认证配置指南
- [README](../README.md) - 项目主文档
