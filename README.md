# Tarsight - API 测试平台

一个现代化的 API 测试和监控系统,提供强大的测试执行、数据分析和可视化功能。

## 项目概述

Tarsight 是一个全栈 API 测试解决方案,结合了 Python 后端和 Next.js 前端,通过 Supabase 提供云端数据存储和实时协作功能。

### 主要特性

- **API 测试执行**: 基于 pytest 的强大测试框架
- **数据驱动**: CSV 格式的测试用例管理
- **云端存储**: Supabase 数据库,支持多用户协作
- **实时分析**: 测试结果可视化和趋势分析
- **用户认证**: 完整的身份验证和授权系统
- **Row Level Security**: 数据隔离和安全保护

## 项目结构

```
Tarsight/
├── supabase_version/          # Python 后端 (API 测试引擎)
├── tarsight-dashboard/        # Next.js 前端 (Web UI)
├── docs/                      # 项目文档
└── README.md                  # 本文件
```

### 后端 (supabase_version/)

- **技术栈**: Python 3.13+, pytest, Supabase
- **入口文件**: [run.py](supabase_version/run.py)
- **文档**: [supabase_version/README.md](supabase_version/README.md)

### 前端 (tarsight-dashboard/)

- **技术栈**: Next.js 14, TypeScript, Tailwind CSS
- **主要功能**: 测试管理、结果可视化、数据分析
- **文档**: [tarsight-dashboard/README.md](tarsight-dashboard/README.md)

## 快速开始

### 环境要求

- Python 3.13+
- Node.js 18+
- Supabase 账号
- uv (推荐的 Python 包管理器)

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd Tarsight
```

### 2. 设置后端

```bash
cd supabase_version

# 安装依赖
uv sync

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件,添加你的 Supabase 配置

# 设置数据库
python scripts/setup_supabase.py

# 运行测试
python run.py
```

### 3. 设置前端

```bash
cd tarsight-dashboard

# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 文件,添加你的 Supabase 配置

# 运行开发服务器
npm run dev
```

访问 http://localhost:3000 查看前端界面。

## 文档

- [项目结构详情](docs/FINAL_STRUCTURE.md)
- [认证设置指南](docs/guides/AUTHENTICATION_SETUP.md)
- [历史文档归档](docs/archive/)

## 技术栈

### 后端

- **Python 3.13+**: 现代化的 Python 开发
- **pytest 8.4+**: 强大的测试框架
- **Supabase**: 云端数据库和认证
- **Allure**: 测试报告生成
- **aiohttp/httpx**: 异步 HTTP 客户端

### 前端

- **Next.js 14**: React 框架 (App Router)
- **TypeScript**: 类型安全
- **Tailwind CSS**: 现代化 UI 样式
- **Supabase Auth**: 用户认证
- **shadcn/ui**: UI 组件库

## 数据库架构

项目使用 Supabase PostgreSQL 数据库,包含以下主要表:

- `projects` - 项目管理
- `modules` - 模块管理
- `test_cases` - 测试用例
- `test_executions` - 测试执行记录
- `test_results` - 测试结果详情
- `global_configs` - 全局配置

所有表都配置了 Row Level Security (RLS),确保数据安全隔离。

## 开发指南

### 添加新测试用例

编辑 [supabase_version/testcases/test_cases.csv](supabase_version/testcases/test_cases.csv):

```csv
module,case_id,test_name,description,method,url,request_body,expected_status,headers,variables,tags
quickSearch,TS001,热门趋势,测试获取热门音频数据,POST,/api/rank/popular_trend/list,"{""period"":7}",200,,,"basic,sound"
```

### 运行测试

```bash
cd supabase_version
python run.py
```

### 查看测试报告

- **Allure 报告**: 运行 `allure serve reports/allure-results`
- **Web Dashboard**: 访问前端界面的统计分析页面

## 部署

### 前端部署

前端支持 Docker 部署,详见 [tarsight-dashboard/deployment/](tarsight-dashboard/deployment/)

```bash
cd tarsight-dashboard/deployment
./deploy.sh
```

### 后端部署

后端可以部署到任何支持 Python 3.13+ 的服务器:

```bash
cd supabase_version
uv sync
python run.py
```

## 常见问题

### 1. 如何重置数据库?

使用 Supabase Dashboard 或运行迁移脚本:

```bash
cd supabase_version
python scripts/setup_supabase.py
```

### 2. 如何添加新用户?

参考 [认证设置指南](docs/guides/AUTHENTICATION_SETUP.md)

### 3. 测试报告在哪里?

- Allure 报告: `supabase_version/reports/allure-results/`
- Web Dashboard: 前端界面的统计分析页面

## 贡献指南

欢迎贡献! 请遵循以下步骤:

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议,请创建 Issue 或联系项目维护者。

---

**开始使用 Tarsight,提升你的 API 测试效率!** 🚀
