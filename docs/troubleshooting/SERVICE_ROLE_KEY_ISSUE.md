# Service Role Key Issue - 解决方案

## 🔍 问题描述

运行 `python run.py` 时出现 `401 Unauthorized` 错误。

## 🐛 根本原因

**.env 文件中的 service_role key 属于不同的 Supabase 项目！**

通过 JWT 解码发现：
- `SUPABASE_URL` 使用的项目: `gtdzmawwckvpzbbsgssv`
- `SUPABASE_ANON_KEY` 使用的项目: `gtdzmawwckvpzbbsgssv` ✅
- `SUPABASE_SERVICE_ROLE_KEY` 使用的项目: `nxxkgjrbpzhjpdkiiflp` ❌ (错误!)

**当前错误的 service_role key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54eGtnanJicHpoanBka2lpZmxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM4MzE2MSwiZXhwIjoyMDgxOTU5MTYxfQ.kW6gIRQpQWbONpuByi_TP5eP1uIx5LM7EGHRLEwCGPw
```

## ✅ 解决方案

### 步骤 1: 获取正确的 Service Role Key

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 `gtdzmawwckvpzbbsgssv` (Tarsight 项目)
3. 进入 **Settings** → **API**
4. 找到 **Project API keys** 部分
5. 复制 **service_role** key (注意：不是 secret key!)

### 步骤 2: 更新 .env 文件

将 `.env` 文件第 7 行的 `SUPABASE_SERVICE_ROLE_KEY` 替换为正确的值：

```bash
# 使用正确的 service_role key (必须来自 gtdzmawwckvpzbbsgssv 项目)
SUPABASE_SERVICE_ROLE_KEY=正确的key...
```

### 步骤 3: 验证

运行以下命令验证修复：

```bash
source .venv/bin/activate
python run.py
```

应该看到类似输出：
```
✅ 使用 service_role key（绕过 RLS）: eyJhbGci...
✅ Supabase 配置已找到
🔍 正在查询数据库中的测试用例...
✅ 找到 3 个模块
✅ 找到 19 个测试用例
```

## 🔍 如何验证 Key 是否正确

可以使用以下 Python 代码验证：

```python
import json
import base64

def decode_jwt(token):
    parts = token.split('.')
    payload = parts[1] + '=' * (4 - len(parts[1]) % 4)
    decoded = base64.b64decode(payload)
    return json.loads(decoded)

service_key = "你的service_role_key"
payload = decode_jwt(service_key)
print(f"项目 ref: {payload.get('ref')}")
# 应该输出: gtdzmawwckvpzbbsgssv
```

## 📝 暂时的替代方案

在获取正确的 service_role key 之前，可以使用：

```bash
python run_simple.py
```

这个脚本会直接从 CSV 文件读取测试用例，不需要查询数据库。

## ⚠️ 注意事项

1. **Service Role Key 可以绕过 RLS** - 只在服务端使用，不要暴露给前端
2. **不同项目的 key 不能混用** - 每个 Supabase 项目有唯一的 key
3. **Key 格式**: JWT token 的 `ref` 字段必须与项目 URL 匹配

## 📊 当前配置状态

| 配置项 | 值 | 状态 |
|--------|-----|------|
| SUPABASE_URL | gtdzmawwckvpzbbsgssv | ✅ 正确 |
| SUPABASE_ANON_KEY | gtdzmawwckvpzbbsgssv | ✅ 正确 |
| SUPABASE_SERVICE_ROLE_KEY | nxxkgjrbpzhjpdkiiflp | ❌ **错误** |
| TARGET_PROJECT | 8786c21f-7437-4a2d-8486-9365a382b38e | ✅ 正确 |

---

**创建日期**: 2025-12-31
**问题**: Service role key 来自不同的项目
**解决**: 需要从 Supabase Dashboard 获取正确的 key
