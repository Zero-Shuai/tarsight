# 用户认证和行级安全（RLS）配置指南

本文档介绍如何为 Tarsight 项目配置用户认证和 Supabase 行级安全策略。

## 目录

- [功能概述](#功能概述)
- [后端配置](#后端配置)
- [前端配置](#前端配置)
- [部署步骤](#部署步骤)
- [使用说明](#使用说明)
- [常见问题](#常见问题)

---

## 功能概述

### 后端功能

- ✅ 用户注册（邮箱 + 密码）
- ✅ 用户登录
- ✅ 用户登出
- ✅ Token 管理（本地存储）
- ✅ Token 自动刷新
- ✅ RLS 策略配置

### 前端功能

- ✅ 登录/注册页面
- ✅ 路由保护（middleware）
- ✅ 侧边栏显示用户信息
- ✅ 登出功能
- ✅ 自动会话管理

### 安全特性

- 🔒 所有数据表启用 RLS
- 🔒 用户只能访问自己的数据
- 🔒 基于 auth.uid() 的数据隔离
- 🔒 自动 JWT Token 管理

---

## 后端配置

### 1. 准备工作

确保已安装 Python 依赖：

```bash
cd /Users/zhangshuai/WorkSpace/Tarsight/supabase_version
pip install -r requirements.txt
```

### 2. 添加 user_id 列

首先为 `projects` 表添加 `user_id` 列：

```bash
python scripts/setup_auth_and_rls.py --add-user-id
```

### 3. 配置 RLS 策略

运行 RLS 配置脚本：

```bash
python scripts/setup_auth_and_rls.py
```

这个脚本会：
- 为所有表启用 RLS
- 创建行级安全策略
- 确保用户只能访问自己的数据

### 4. 后端认证 API 使用

**用户注册：**

```python
from utils.auth import get_auth_client

auth_client = get_auth_client()
result = auth_client.sign_up(
    email='user@example.com',
    password='securepassword'
)

if result['success']:
    print("注册成功")
    print("Access Token:", result['access_token'])
```

**用户登录：**

```python
result = auth_client.sign_in(
    email='user@example.com',
    password='securepassword'
)

if result['success']:
    print("登录成功")
    access_token = result['access_token']
```

**使用 Token 访问数据（RLS 生效）：**

```python
from utils.supabase_client import get_supabase_client

# 使用 access_token 初始化客户端
client = get_supabase_client(access_token=access_token)

# 现在 RLS 策略会自动过滤数据
projects = client.get_projects()  # 只返回当前用户的项目
```

**用户登出：**

```python
result = auth_client.sign_out(access_token)
```

---

## 前端配置

### 1. 安装依赖

```bash
cd /Users/zhangshuai/WorkSpace/Tarsight/tarsight-dashboard
npm install
```

需要确保 `package.json` 中包含 `@supabase/ssr`：

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0"
  }
}
```

### 2. 配置环境变量

确保 `.env.local` 文件配置正确：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_PROJECT_ID=your-project-id
```

### 3. 启用 Supabase Auth

在 Supabase Dashboard 中：

1. 导航到 **Authentication** → **Settings**
2. 确保 **Email Auth** 已启用
3. 配置邮件服务器（可选，用于邮箱验证）

### 4. 运行开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`，会自动重定向到登录页面。

---

## 部署步骤

### Step 1: 配置数据库

```bash
cd /Users/zhangshuai/WorkSpace/Tarsight/supabase_version

# 添加 user_id 列
python scripts/setup_auth_and_rls.py --add-user-id

# 配置 RLS
python scripts/setup_auth_and_rls.py
```

### Step 2: 启用 Supabase Auth

在 Supabase Dashboard：

1. 进入 **Authentication** → **Settings**
2. 启用 **Email Provider**
3. 可选：配置 SMTP 邮件服务
4. 可选：关闭邮箱验证（仅测试环境）

### Step 3: 部署后端

后端不需要额外部署，认证功能已集成到现有代码中。

### Step 4: 部署前端

```bash
cd /Users/zhangshuai/WorkSpace/Tarsight/tarsight-dashboard

# Docker 部署
./deploy.sh

# 或手动构建
npm run build
npm start
```

### Step 5: 首次使用

1. 访问部署的前端地址
2. 点击"注册"创建账户
3. 使用邮箱和密码登录
4. 开始使用 Tarsight

---

## 使用说明

### 后端使用示例

**在测试脚本中使用认证：**

```python
import pytest
from utils.auth import get_auth_client
from utils.supabase_client import get_supabase_client

@pytest.fixture(scope="session")
def authenticated_client():
    """获取认证后的客户端"""
    auth_client = get_auth_client()

    # 登录
    result = auth_client.sign_in(
        email='test@example.com',
        password='testpass123'
    )

    access_token = result['access_token']

    # 返回带 token 的客户端
    return get_supabase_client(access_token)

def test_user_projects(authenticated_client):
    """测试用户只能访问自己的项目"""
    projects = authenticated_client.get_projects()

    # 断言：只返回当前用户的项目
    for project in projects:
        assert project['user_id'] == auth_client.get_user_id()
```

**在 CLI 工具中使用认证：**

```python
from utils.auth import get_auth_client, require_auth
from utils.supabase_client import get_supabase_client

@require_auth
def list_my_projects():
    """列出当前用户的项目"""
    auth_client = get_auth_client()
    token = auth_client.get_current_token()
    client = get_supabase_client(access_token=token)

    projects = client.get_projects()
    for project in projects:
        print(f"- {project['name']}")
```

### 前端使用说明

**登录页面功能：**

- 支持邮箱 + 密码登录
- 支持新用户注册
- 自动表单验证
- 错误提示

**会话管理：**

- 用户登录后，Token 自动存储在浏览器 Cookie 中
- 访问任何页面时，middleware 自动检查认证状态
- 未登录用户自动重定向到登录页

**登出：**

点击侧边栏的"登出"按钮即可。

---

## 常见问题

### Q1: 如何测试 RLS 是否生效？

**答：** 使用不同账户登录，检查数据是否隔离：

```python
# 用户 A
client_a = get_supabase_client(token_a)
projects_a = client_a.get_projects()

# 用户 B
client_b = get_supabase_client(token_b)
projects_b = client_b.get_projects()

# 断言：两个用户的数据不同
assert set(projects_a) != set(projects_b)
```

### Q2: 忘记密码怎么办？

**答：** Supabase Auth 内置密码重置功能。在 Supabase Dashboard 中启用 "Email Auth" 的 "Password Recovery" 选项。

前端可以实现密码重置页面：

```typescript
async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}
```

### Q3: 如何禁用认证（仅用于开发）？

**答：** 修改 `middleware.ts`：

```typescript
export async function middleware(request: NextRequest) {
  // 开发环境跳过认证
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // ... 原有认证逻辑
}
```

**⚠️ 警告：生产环境必须启用认证！**

### Q4: 如何支持社交登录（Google, GitHub 等）？

**答：** 在 Supabase Dashboard 中配置 Providers：

1. 进入 **Authentication** → **Providers**
2. 启用需要的 Provider（如 Google）
3. 配置 OAuth 客户端 ID 和密钥
4. 前端添加社交登录按钮：

```typescript
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  })
  if (error) throw error
}
```

### Q5: 数据库中已有旧数据，如何添加 user_id？

**答：** 运行迁移脚本后，需要手动更新旧数据：

```sql
-- 为所有现有项目分配给特定用户
UPDATE projects
SET user_id = 'your-user-id-here'
WHERE user_id IS NULL;

-- 或为每个用户分配自己的数据（需要先确定 user_id）
UPDATE projects
SET user_id = 'user-id-1'
WHERE id IN ('project-1', 'project-2');
```

### Q6: Token 过期了怎么办？

**答：** 前端和后端都支持自动 Token 刷新：

**后端：**

```python
auth_client = get_auth_client()
tokens = auth_client._load_tokens()
new_token = auth_client.refresh_access_token(tokens['refresh_token'])
```

**前端：** Supabase JS SDK 自动处理 Token 刷新。

### Q7: 如何在 Supabase Dashboard 查看 RLS 策略？

**答：**

1. 进入 **Database** → **Tables**
2. 选择表（如 `projects`）
3. 点击 **RLS Policies**
4. 可以查看、编辑、删除策略

---

## 安全建议

1. **生产环境必须启用 RLS**
   - 防止数据泄露
   - 确保用户隔离

2. **使用强密码策略**
   - 前端添加密码强度验证
   - 后端可配置最小密码长度

3. **启用 HTTPS**
   - 使用 Nginx 反向代理
   - 配置 SSL 证书

4. **定期更新依赖**
   ```bash
   npm update
   pip install --upgrade -r requirements.txt
   ```

5. **监控认证日志**
   - Supabase Dashboard → **Reports**
   - 查看登录、注册活动

---

## 相关文档

- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware 文档](https://nextjs.org/docs/advanced-features/middleware)

---

## 支持

如有问题，请检查：
1. Supabase Dashboard 的认证配置
2. 数据库 RLS 策略是否启用
3. 环境变量是否正确
4. 浏览器控制台和后端日志
