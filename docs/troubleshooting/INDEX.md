# 故障排查文档索引

本目录包含 Tarsight 项目常见问题的解决方案和故障排查指南。

## 📋 问题分类

### 🔁 执行相关问题

#### [重复执行记录问题](DUPLICATE_EXECUTION_FINAL_FIX.md)
**症状**: 点击一次执行按钮，创建多条执行记录

**原因**:
- 前端按钮防抖问题
- 后端双重创建记录
- 环境变量传递链断裂

**解决方案**: 传递 `EXECUTION_ID` 和 `TARSIGHT_EXECUTION_ID`

---

#### [执行状态卡住问题](EXECUTION_STATUS_SUMMARY.md)
**症状**: 执行记录一直停留在 "running" 状态

**原因**: API Token 过期导致测试失败

**解决方案**: 更新 `.env` 中的 `API_TOKEN`

---

#### [执行完整解决方案](FINAL_SOLUTION_SUMMARY.md)
包含所有执行相关问题的完整分析和解决方案。

---

### 🔑 认证相关问题

#### [Service Role Key 问题](SERVICE_ROLE_KEY_ISSUE.md)
**症状**: Supabase 权限错误，无法绕过 RLS

**原因**: Service Role Key 未正确配置

**解决方案**: 配置 `SUPABASE_SERVICE_ROLE_KEY`

---

#### [Token 验证问题](TOKEN_VALIDATION.md)
**症状**: API Token 验证失败或过期

**原因**: Token 有效期限制

**解决方案**: 使用 `--skip-token-check` 参数或更新 Token

---

## 🔍 快速诊断

### 执行失败诊断流程

1. **检查执行状态**
   ```bash
   cd supabase_version
   PYTHONPATH=. .venv/bin/python -c "
   from utils.supabase_client import get_supabase_client
   from utils.env_config import get_env_config

   env_config = get_env_config()
   client = get_supabase_client(access_token=env_config.supabase_service_role_key)

   result = client._make_request('GET', 'test_executions', params={'status': 'eq.running'})
   print(f'Running executions: {len(result.get(\"data\", []))}')
   "
   ```

2. **检查环境变量**
   ```bash
   cd supabase_version
   .venv/bin/python scripts/debug/test_env.py
   ```

3. **验证 API Token**
   ```bash
   cd supabase_version
   .venv/bin/python utils/token_validator.py
   ```

---

## 📞 获取帮助

如果以上文档无法解决您的问题，请：

1. 查看项目主 README: `/README.md`
2. 查看架构文档: `/docs/FINAL_STRUCTURE.md`
3. 提交 Issue 到项目仓库
