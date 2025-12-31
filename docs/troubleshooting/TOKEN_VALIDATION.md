# Token 验证功能说明

## 🎯 功能介绍

新增的 Token 验证功能会在执行测试前自动检查 API Token 是否有效，如果过期或无效会提示用户更新。

## 🔄 工作流程

### 1. 自动验证
运行 `python run.py` 时会自动验证 Token：

```bash
python run.py --all
```

输出：
```
🔧 Tarsight 测试执行器 (新版工作流程)
============================================================

🔍 验证 API Token...
✅ Token 有效

✅ Supabase 配置已找到: ...
```

### 2. Token 过期时
如果 Token 过期，会显示：

```
🔍 验证 API Token...
❌ Token 已过期: User session has expired or been logged out

============================================================
⚠️  API Token 已过期或无效
============================================================

请从浏览器中获取新的 API Token:
1. 打开 Tarsight 网站
2. 登录后按 F12 打开开发者工具
3. 切换到 Network 标签
4. 刷新页面，找到任意 API 请求
5. 在请求头中找到 'authorization' 字段
6. 复制 'Bearer ' 后面的完整 token

提示: 新 token 格式类似: eyJ0eXAiOiJKV1QiLCJhbGc...

请输入新的 API Token (留空跳过):
```

### 3. 输入新 Token
粘贴新的 Token 后：

```
请输入新的 API Token (留空跳过): Bearer eyJ0eXAiOiJKV1Q...

🔍 验证新 token...
✅ Token 验证成功!

是否将新 token 保存到 .env 文件? (y/n): y
✅ Token 已保存到 .env 文件
```

### 4. 继续执行测试
Token 验证通过后，自动继续执行测试。

## 📋 Token 过期的判断标准

Token 被认为过期的情况：

1. **API 返回 code=1001**
   ```json
   {"code": 1001, "message": "User session has expired or been logged out"}
   ```

2. **API 返回 success=false**
   ```json
   {"success": false, "message": "Invalid token"}
   ```

3. **HTTP 状态码为 401 或 403**

## 🛠️ 手动更新 Token

你也可以直接编辑 `.env` 文件更新 Token：

```bash
# 编辑 .env 文件
nano .env

# 找到 API_TOKEN 行，替换为新的 token
API_TOKEN=Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

## 🔧 验证端点

Token 验证使用的 API 端点：
```
POST https://t-stream-iq.tarsv.com/api/rank/popular_trend/list
```

这是一个轻量级的 API，专门用于验证 Token 有效性。

## 💡 提示

1. **Token 有效期**：通常为 24 小时
2. **自动保存**：更新 Token 后可以选择自动保存到 `.env`
3. **跳过更新**：如果输入为空，会跳过更新（但测试可能无法执行）
4. **验证失败**：如果新 Token 验证失败，会提示重新输入

## 🚀 使用示例

```bash
# 自动运行所有测试（会先验证 Token）
python run.py --all

# 指定测试名称
python run.py --all --name "夜间测试"

# 跳过 Token 验证（不推荐）
# 需要修改代码移除验证步骤
```

## ⚠️ 注意事项

1. Token 包含敏感信息，请勿泄露
2. `.env` 文件不应提交到版本控制
3. Token 过期后需要重新登录网站获取
4. 验证失败不会影响 `.env` 文件中的原 Token
