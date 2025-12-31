# Tarsight API 测试平台

一个现代化的 API 测试管理和执行平台，基于 Next.js 14 和 Python 构建。

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Python 3.10+
- Supabase 账户

### 安装步骤

\`\`\`bash
# 1. 克隆项目
git clone <repository-url>
cd Tarsight

# 2. 安装前端依赖
cd tarsight-dashboard
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 Supabase 配置

# 4. 安装 Python 依赖
cd ../supabase_version
pip install -r requirements.txt

# 5. 配置 Python 环境
cp .env.example .env
# 编辑 .env 填入配置

# 6. 启动前端
cd ../tarsight-dashboard
npm run dev

# 7. 访问应用
open http://localhost:3000
\`\`\`

## 📚 文档

### 核心文档
- **[快速参考](docs/architecture/QUICK_REFERENCE.md)** - 快速开始和常用命令
- **[架构分析](docs/architecture/ARCHITECTURE_REVIEW.md)** - 完整的架构分析
- **[优化报告](docs/architecture/FINAL_OPTIMIZATION_COMPLETE.md)** - 所有优化说明

### 故障排查
- **[故障排查索引](docs/troubleshooting/INDEX.md)** - 常见问题解决方案

## 🎯 主要功能

### 1. 测试用例管理
- ✅ 创建、编辑、删除测试用例
- ✅ 模块化组织
- ✅ 支持多种 API 请求类型

### 2. 测试执行
- ✅ 单个用例执行
- ✅ 批量执行
- ✅ 实时执行状态

### 3. 结果分析
- ✅ 执行历史记录
- ✅ 统计分析
- ✅ 趋势图表

## 📁 项目结构

\`\`\`
Tarsight/
├── tarsight-dashboard/      # Next.js 前端
│   ├── app/                 # 页面和 API
│   ├── components/          # React 组件
│   └── lib/                 # 工具库
│
├── supabase_version/        # Python 测试框架
│   ├── utils/               # 工具模块
│   ├── testcases/           # 测试用例
│   └── run.py               # 主执行器
│
└── docs/                    # 文档
    ├── architecture/        # 架构文档
    └── troubleshooting/     # 故障排查
\`\`\`

## 🛠️ 技术栈

### 前端
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase

### 后端
- Python 3.10+
- Pytest
- Supabase (PostgreSQL)

## 📊 项目评分

**总体评分**: ⭐⭐⭐⭐⭐ **4.8/5.0**

## 📞 获取帮助

- 查看文档: [docs/](docs/)
- 故障排查: [docs/troubleshooting/](docs/troubleshooting/)
- 快速参考: [docs/architecture/QUICK_REFERENCE.md](docs/architecture/QUICK_REFERENCE.md)

---

**Tarsight API 测试平台** - 让 API 测试更简单、更高效！ 🚀
