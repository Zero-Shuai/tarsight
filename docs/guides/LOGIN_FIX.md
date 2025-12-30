# 修复登录问题和配置 RLS 指南

## 问题诊断

1. ✅ 前端登录页面已创建
2. ✅ 中间件已配置路由保护
3. ❓ Supabase Auth 是否启用
4. ❓ 用户是否在 Supabase 中创建
5. ❓ RLS 策略是否正确配置
6. ❓ 项目的 user_id 是否设置

---

## 解决步骤（按顺序执行）

### 步骤 1: 在 Supabase Dashboard 中创建用户

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 左侧菜单 → **Authentication** → **Users**
4. 点击 **"Add user"** → **"Create new user"**
5. 填写信息：
   - **Email**: `243644123@qq.com`
   - **Password**: `Bruce1993@`
   - **Auto Confirm User**: ✅ 勾选（这样可以跳过邮箱验证）
6. 点击 **"Create user"**

**重要**: 创建后会显示用户列表，点击用户可以查看 **User UID**，复制这个 UUID（类似：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

---

### 步骤 2: 启用 Email Auth（如果未启用）

1. 在 Supabase Dashboard 中
2. 左侧菜单 → **Authentication** → **Settings**
3. 找到 **"Email Auth"**
4. 确保 **"Enable Email provider"** 是开启状态
5. **"Confirm email"** 可以关闭（测试环境）
6. 点击 **"Save"**

---

### 步骤 3: 配置 RLS 策略

1. 在 Supabase Dashboard 中
2. 左侧菜单 → **SQL Editor**
3. 点击 **"New Query"**
4. 复制 [`setup_auth_and_rls.sql`](setup_auth_and_rls.sql) 的全部内容
5. 粘贴到编辑器
6. 点击 **"Run"** (或按 Ctrl+Enter)

这个脚本会：
- ✅ 添加 `user_id` 列到 `projects` 表
- ✅ 为所有表启用 RLS
- ✅ 创建行级安全策略

---

### 步骤 4: 将项目分配给用户

1. 在 SQL Editor 中新建查询
2. 复制以下 SQL（替换 `YOUR_USER_UUID_HERE` 为步骤 1 中复制的 UUID）：

```sql
-- 更新现有项目的 user_id
UPDATE projects
SET user_id = 'YOUR_USER_UUID_HERE'
WHERE user_id IS NULL;

-- 验证更新
SELECT id, name, user_id
FROM projects;
```

3. 点击 **"Run"**

---

### 步骤 5: 验证配置

执行以下 SQL 验证所有配置：

```sql
-- 1. 检查 RLS 是否启用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('projects', 'modules', 'test_cases', 'test_executions', 'test_results')
ORDER BY tablename;

-- 应该所有表的 rowsecurity 都是 true

-- 2. 检查策略是否创建
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- 应该看到所有表的策略

-- 3. 检查项目的 user_id
SELECT id, name, user_id
FROM projects;

-- 应该看到 user_id 已设置
```

---

### 步骤 6: 测试前端登录

1. 确保前端正在运行：

```bash
cd /Users/zhangshuai/WorkSpace/Tarsight/tarsight-dashboard
npm run dev
```

2. 打开浏览器访问 `http://localhost:3000`
3. 应该自动跳转到登录页面
4. 输入：
   - **邮箱**: `243644123@qq.com`
   - **密码**: `Bruce1993@`
5. 点击 **"登录"**

---

## 如果还是无法登录

### 检查 1: 浏览器控制台

按 F12 打开开发者工具，查看 Console 标签页是否有错误信息。

### 检查 2: Network 标签

查看 Network 标签页，看请求是否成功：
- 找到 `/auth/v1/token` 请求
- 查看响应状态码和内容

### 检查 3: Supabase Logs

1. 在 Supabase Dashboard
2. 左侧菜单 → **Reports**
3. 查看 **Auth** 相关日志

---

## 常见错误和解决方案

### 错误 1: "Invalid login credentials"

**原因**: 用户不存在或密码错误

**解决**:
1. 在 Supabase Dashboard → Authentication → Users 中确认用户存在
2. 重置密码：点击用户 → **"Reset password"**

### 错误 2: "Email not confirmed"

**原因**: 邮箱验证未完成

**解决**:
1. 在 Authentication → Settings 中关闭 "Confirm email"
2. 或在 Users 中点击用户 → **"Confirm email"** 手动确认

### 错误 3: 登录成功但看不到数据

**原因**: RLS 策略阻止了数据访问

**解决**:
1. 确认已执行步骤 3（配置 RLS）
2. 确认已执行步骤 4（分配项目给用户）
3. 检查项目的 `user_id` 是否正确

### 错误 4: 页面一直跳转到登录页

**原因**: Middleware 检测到未登录

**解决**: 这说明路由保护正常工作，只需要成功登录即可

---

## 快速测试脚本

创建一个简单的测试文件来验证 Supabase 连接：

**test_auth.html** (在浏览器中打开):

```html
<!DOCTYPE html>
<html>
<head>
    <title>测试 Supabase Auth</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <h1>Supabase Auth 测试</h1>

    <div>
        <input type="email" id="email" placeholder="邮箱" value="243644123@qq.com">
        <input type="password" id="password" placeholder="密码" value="Bruce1993@">
        <button onclick="signIn()">登录</button>
        <button onclick="signUp()">注册</button>
    </div>

    <pre id="result"></pre>

    <script>
        const SUPABASE_URL = 'https://gtdzmawwckvpzbbsgssv.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 你的 anon key

        const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        async function signIn() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    document.getElementById('result').textContent = '错误: ' + error.message;
                } else {
                    document.getElementById('result').textContent = '成功！\n' + JSON.stringify(data, null, 2);
                }
            } catch (e) {
                document.getElementById('result').textContent = '异常: ' + e.message;
            }
        }

        async function signUp() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password
                });

                if (error) {
                    document.getElementById('result').textContent = '错误: ' + error.message;
                } else {
                    document.getElementById('result').textContent = '成功！\n' + JSON.stringify(data, null, 2);
                }
            } catch (e) {
                document.getElementById('result').textContent = '异常: ' + e.message;
            }
        }
    </script>
</body>
</html>
```

保存为 HTML 文件并在浏览器打开测试。

---

## 完成确认清单

- [ ] Supabase Auth 已启用
- [ ] 用户 `243644123@qq.com` 已在 Supabase 中创建
- [ ] RLS 已在所有表上启用
- [ ] RLS 策略已创建
- [ ] 项目已分配给用户（user_id 已设置）
- [ ] 前端可以成功登录
- [ ] 登录后可以看到数据

---

## 需要帮助？

如果按照以上步骤操作后仍有问题，请提供：

1. 浏览器控制台的错误信息（F12 → Console）
2. Network 标签中 `/auth/v1/token` 请求的响应
3. Supabase Dashboard → Reports 中的错误日志
