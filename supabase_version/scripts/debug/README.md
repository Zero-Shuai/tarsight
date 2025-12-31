# 调试工具目录

此目录包含用于调试和故障排查的临时脚本。

## 脚本说明

### fix_stuck_executions.py
修复卡在 "running" 状态的执行记录（初版）

### fix_stuck_executions_v2.py
修复卡在 "running" 状态的执行记录（改进版）

### run_simple.py
简化版测试执行器，用于快速测试

### test_env.py
环境变量测试脚本，用于验证环境配置

## 使用说明

这些脚本仅用于开发调试，不应在生产环境使用。

运行示例：
```bash
cd /Users/zhangshuai/WorkSpace/Tarsight/supabase_version
python scripts/debug/test_env.py
```
