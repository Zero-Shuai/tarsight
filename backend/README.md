# Tarsight Supabase版本 - 数据库集成测试系统

专注于Supabase数据库集成的API测试框架，支持测试结果持久化存储和云端数据分析。

## ���� 快速开始

### 基本使用

```bash
# 运行Supabase集成测试（默认模式）
python run.py

# 指定测试执行名称
python run.py --name "登录模块测试"

# 详细输出模式
python run.py --verbose

# 指定测试执行名称并详细输出
python run.py --name "回归测试" --verbose
```

### 报告生成

```bash
# 生成增强HTML报告
python scripts/quick_enhanced_report_database.py

# ��试Supabase连接
python scripts/test_supabase_connection.py

# 设置Supabase数据库表
python scripts/setup_supabase.py
```

## 📁 项目结构

```
supabase_version/
├── 🚀 run.py                      # 主运行脚本（集成Supabase）
├── 📊 testcases/
│   ├── test_tarsight.py          # 测试用例实现
│   ├── test_cases.csv            # CSV表格测试数据
│   └── table_test_data.py        # CSV数据读取器
├── 🔧 scripts/
│   ├── run_tests_database.py     # 数据库版测试执行脚本
│   ├── quick_enhanced_report_database.py # 数据库版HTML报告
│   ├── test_supabase_connection.py # Supabase连接测试
│   └── setup_supabase.py         # Supabase数据库设置
├── 🗄️ utils/
│   ├── test_execution_recorder.py # 测试执行记录器
│   └── file_test_recorder.py     # 文件测试记录器
├── 🗄️ supabase/
│   ├── client.py                 # Supabase客户端
│   └── simple_client.py          # 简化Supabase客户端
├── 🗄️ database/
│   ├── create_execution_tables.py # 执行表创建脚本
│   ├── verify_migration.py       # 迁移验证
│   └── migrate_data_final.py     # 数据迁移脚本
├── 📄 .env                       # Supabase环境配置
├── 📄 conftest.py                # pytest配置（Supabase集成版）
└── 📄 reports/                   # 测试报告目录
```

## 🔧 Supabase配置

### 环境变量配置

在 `.env` 文件中配置Supabase连接：

```bash
# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API配置
BASE_URL=https://t-stream-iq.tarsv.com
API_TOKEN=Bearer YOUR_API_TOKEN

# 记录配置
SUPABASE_RECORDING=true
TARSIGHT_EXECUTION_ID=auto-generated
```

### 数据库表结构

系统自动创建以下表：

- `test_executions`: 测试执行记录
- `test_results`: 测试结果详情
- `api_requests`: API请求记录
- `api_responses`: API响应记录

## 📊 核心功能

### 🗄️ 数据持久化

- **执行记录**: 每次测试运行的完整记录
- **结果存储**: 测试用例的详细结果
- **API日志**: 请求和响应的完整数据
- **错误追踪**: 失败测试的详细信息

### 📈 数据分析

- **趋势分析**: 测试通过率趋势
- **性能监控**: 响应时间和性能指标
- **失败统计**: 常见失败原因分析
- **模块覆盖**: 测试覆盖率统计

### 🔄 实时同步

- **云端存储**: 测试结果实时同步到Supabase
- **多端访问**: 从任何地方查看测试结果
- **团队协作**: 团队成员共享测试数据
- **历史记录**: 完整的测试历史追踪

## 🚀 数据库设置

### 自动设置

```bash
# 一键设置Supabase数据库表
python scripts/setup_supabase.py
```

### 手动设置

```bash
# 创建执行表
python database/create_execution_tables.py

# 验证迁移
python database/verify_migration.py
```

## 📋 测试执行流程

### 标准流程

1. **初始化**: 创建测试执行记录
2. **设置环境**: 配置环境变量和连接
3. **运行测试**: 执行pytest测试套件
4. **记录结果**: 实时记录测试结果到数据库
5. **生成报告**: 创建HTML报告和数据分析

### 命令示例

```bash
# 运行完整测试套件
python run.py --name "夜间回归测试"

# 调试模式运行
python run.py --verbose

# 生成数据库报告
python scripts/quick_enhanced_report_database.py
```

## 🔍 监控和调试

### 连接测试

```bash
# 测试Supabase连接
python scripts/test_supabase_connection.py

# 诊断数据库问题
python diagnose_supabase.py
```

### 数据验证

```bash
# 验证数据迁移
python database/verify_migration.py

# 快速测试Supabase集成
python quick_test_supabase.py
```

## 📊 报告功能

### 数据库增强报告

- **云端数据**: 基于Supabase数据的报告
- **历史对比**: 与历史执行记录对比
- **趋势分析**: 测试趋势图表
- **性能监控**: 响应时间分析

### 报告生成

```bash
# 生成增强HTML报告
python scripts/quick_enhanced_report_database.py
```

## 🛠️ 开发指南

### 添加新测试

1. 在 `test_cases.csv` 中添加测试数据
2. 在 `test_tarsight.py` 中实现测试逻辑
3. 运行测试并验证结果

### 自定义记录器

```python
from utils.test_execution_recorder import start_test_execution, finish_test_execution

# 自定义执行记录
execution_id = start_test_execution("自定义测试")
# ... 运行测试 ...
finish_test_execution()
```

## 🔐 安全考虑

- **密钥管理**: 使用环境变量存储敏感信息
- **权限控制**: 使用适当的Supabase角色和权限
- **数据加密**: 敏感数据传输和存储加密
- **访问控制**: 实施适当的访问控制策略

## 📋 最佳实践

1. **环境隔离**: 开发、测试、生产环境分离
2. **数据备份**: 定期备份Supabase数据
3. **监控告警**: 设置测试失败告警
4. **性能优化**: 优化数据库查询和索引
5. **日志记录**: 完整的操作日志记录

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证。