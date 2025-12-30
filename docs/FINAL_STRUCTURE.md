# Tarsight 项目最终结构

生成时间: 2025-12-30

## 📁 根目录结构

```
Tarsight/
├── supabase_version/          # 后端项目（Python + Supabase）
├── tarsight-dashboard/        # 前端项目（Next.js + TypeScript）
├── .venv/                     # Python 虚拟环境
├── .git/                      # Git 仓库
├── .claude/                   # Claude 配置
└── *.md                       # 项目文档（根目录）
```

---

## 🔧 supabase_version/ - 后端项目

### 目录结构
```
supabase_version/
├── README.md                  # 主文档
├── pyproject.toml            # Python 项目配置
├── uv.lock                   # 依赖锁定文件
├── run.py                     # 主入口文件
├── config.py                  # 配置文件
├── .env                       # 环境变量（不提交）
│
├── database/                  # 数据库相关
│   ├── schema/                # 数据库架构
│   │   └── 01_complete_schema.sql
│   ├── migrations/            # 数据库迁移脚本
│   │   ├── setup_auth_and_rls.sql
│   │   └── setup_global_configs_rls.sql
│   ├── archive/               # 归档的 SQL
│   └── README.md
│
├── docs/                      # 📚 文档
│   ├── AUTH_SETUP_GUIDE.md
│   ├── DATABASE_MIGRATION_GUIDE.md
│   ├── OPTIMIZATION_SUMMARY.md
│   └── SUPABASE_INSTALLATION_REPORT.md
│
├── scripts/                   # 脚本文件
│   ├── archive/               # 归档的脚本
│   ├── setup_user_account.py
│   └── ...
│
├── utils/                     # 工具函数
│   ├── auth.py                # 认证客户端
│   ├── supabase_client.py     # Supabase 客户端
│   ├── supabase_config_manager.py
│   ├── test_execution_recorder.py
│   └── ...
│
├── testcases/                 # 测试用例
│   └── test_cases.csv         # 测试用例数据
│
├── reports/                   # 测试报告
│   └── allure-results/        # Allure 测试结果
│
├── supabase/                  # Supabase 相关（如果需要）
│
├── .venv/                     # Python 虚拟环境
├── .vscode/                   # VS Code 配置
└── .claude/                   # Claude 配置
```

### 核心文件说明

| 文件/目录 | 说明 |
|----------|------|
| `run.py` | 主入口，执行测试 |
| `config.py` | 配置管理 |
| `utils/auth.py` | 用户认证（登录/登出） |
| `utils/supabase_client.py` | Supabase 数据库客户端 |
| `database/migrations/` | 数据库迁移和 RLS 策略 |
| `testcases/test_cases.csv` | 测试用例数据备份 |

---

## 🎨 tarsight-dashboard/ - 前端项目

### 目录结构
```
tarsight-dashboard/
├── README.md                  # 主文档
├── package.json              # Node 依赖配置
├── next.config.js            # Next.js 配置
├── tailwind.config.ts        # Tailwind CSS 配置
├── tsconfig.json             # TypeScript 配置
├── middleware.ts             # Next.js 中间件（路由保护）
│
├── .env.local                # 环境变量（不提交）
├── .env.local.example        # 环境变量示例
├── .gitignore                # Git 忽略配置
│
├── deployment/               # 🚀 Docker 部署文件
│   ├── Dockerfile            # Docker 镜像配置
│   ├── docker-compose.yml    # Docker Compose 配置
│   ├── deploy.sh             # 部署脚本
│   └── .dockerignore         # Docker 忽略配置
│
├── app/                      # Next.js App Router
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # 全局样式
│   │
│   ├── (auth)/               # 认证后的页面（需要登录）
│   │   ├── layout.tsx        # 认证布局（带侧边栏）
│   │   ├── page.tsx          # 总览页（首页）
│   │   ├── test-cases/       # 测试用例页面
│   │   ├── executions/       # 执行历史页面
│   │   ├── analytics/        # 统计分析页面
│   │   ├── settings/         # 设置页面
│   │   └── profile/          # 用户资料页面
│   │
│   └── login/                # 登录页（不需要认证）
│       └── page.tsx
│
├── components/               # React 组件
│   ├── sidebar.tsx           # 侧边栏组件
│   ├── user-menu.tsx         # 用户下拉菜单
│   └── ui/                   # UI 组件库
│       ├── button.tsx
│       ├── avatar.tsx
│       └── dropdown-menu.tsx
│
├── lib/                      # 工具库
│   ├── utils.ts              # 工具函数
│   └── supabase/             # Supabase 客户端
│       ├── client.ts         # 浏览器客户端
│       └── server.ts         # 服务器客户端
│
├── public/                   # 静态资源
│
├── node_modules/             # Node 依赖（不提交）
├── .next/                    # Next.js 构建（不提交）
└── .vscode/                  # VS Code 配置
```

### 核心文件说明

| 文件/目录 | 说明 |
|----------|------|
| `middleware.ts` | 路由保护，未登录用户重定向到登录页 |
| `app/(auth)/layout.tsx` | 认证页面布局，包含侧边栏 |
| `app/login/page.tsx` | 登录页面，现代化分屏设计 |
| `components/user-menu.tsx` | 用户下拉菜单，包含登出功能 |
| `lib/supabase/client.ts` | Supabase 浏览器客户端 |
| `lib/supabase/server.ts` | Supabase 服务器客户端 |
| `deployment/` | Docker 部署相关文件 |

---

## 🚀 部署相关

### tarsight-dashboard/deployment/

#### Dockerfile
Next.js 应用的 Docker 镜像配置

#### docker-compose.yml
完整的 Docker Compose 配置，包括：
- Next.js 应用
- Nginx 反向代理
- 环境变量配置

#### deploy.sh
一键部署脚本

#### 使用方法
```bash
cd tarsight-dashboard/deployment
chmod +x deploy.sh
./deploy.sh
```

或使用 Docker Compose：
```bash
cd tarsight-dashboard/deployment
docker-compose up -d
```

---

## 📊 数据库

### RLS 策略配置

所有表都已配置 Row Level Security（行级安全）：

| 表名 | 说明 | RLS 策略 |
|-----|------|---------|
| `projects` | 项目表 | 用户只能访问自己的项目 |
| `modules` | 模块表 | 用户只能访问自己项目的模块 |
| `test_cases` | 测试用例表 | 用户只能访问自己项目的测试用例 |
| `test_executions` | 执行记录表 | 用户只能访问自己项目的执行记录 |
| `test_results` | 测试结果表 | 用户只能访问自己项目的测试结果 |
| `global_configs` | 全局配置表 | 所有认证用户可读写 |

### 迁移脚本位置
```
supabase_version/database/migrations/
├── setup_auth_and_rls.sql          # 主要表的 RLS 策略
└── setup_global_configs_rls.sql    # global_configs 表的 RLS 策略
```

---

## 🔄 已删除的内容

### 已删除的目录
- ✅ `csv_version/` - 旧版本，已删除
- ✅ `shared/` - 共享目录，已删除
- ✅ `supabase_version/config/` - 空目录，已删除

### 已删除的文件
- ✅ `test_auth_and_rls.sql` - 测试 SQL
- ✅ `setup_bruce_account.sql` - Bruce 账户设置
- ✅ `package-lock.json` - Python 项目不需要
- ✅ `.env.backup` - 备份环境变量
- ✅ 重复的 `setup_auth_and_rls.sql`
- ✅ 所有 Python 缓存文件（`__pycache__`, `*.pyc`）
- ✅ 所有系统文件（`.DS_Store`）
- ✅ 所有日志文件（`*.log`）

---

## 📝 文档归档

以下文档已归档到 `supabase_version/docs/`：

- `AUTH_SETUP_GUIDE.md` - 认证设置指南
- `DATABASE_MIGRATION_GUIDE.md` - 数据库迁移指南
- `OPTIMIZATION_SUMMARY.md` - 优化总结
- `SUPABASE_INSTALLATION_REPORT.md` - 安装报告

---

## 🎯 项目特点

### 后端（supabase_version）
- ✅ Python 3.13
- ✅ Supabase 作为后端服务
- ✅ 用户认证和授权
- ✅ Row Level Security（RLS）
- ✅ 测试用例执行和报告
- ✅ Allure 测试报告集成

### 前端（tarsight-dashboard）
- ✅ Next.js 14 (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Supabase Auth
- ✅ 现代化 UI 设计
- ✅ Docker 部署支持

---

## 🔗 快速链接

- **后端 README**: [supabase_version/README.md](supabase_version/README.md)
- **前端 README**: [tarsight-dashboard/README.md](tarsight-dashboard/README.md)
- **数据库架构**: [supabase_version/database/schema/01_complete_schema.sql](supabase_version/database/schema/01_complete_schema.sql)
- **RLS 配置**: [supabase_version/database/migrations/](supabase_version/database/migrations/)
- **部署文档**: [tarsight-dashboard/deployment/README.md](tarsight-dashboard/deployment/README.md)（如果存在）

---

## ✨ 总结

项目结构现在更加清晰和专业：

1. **前后端分离**: `supabase_version/` 和 `tarsight-dashboard/` 各自独立
2. **文件归档**: SQL 脚本、文档都已归类到相应目录
3. **部署集中**: Docker 相关文件统一放在 `deployment/` 目录
4. **清理彻底**: 删除了所有不需要的临时文件和旧版本
5. **结构清晰**: 目录命名和分类更加合理

项目现在可以直接使用了！🎉
