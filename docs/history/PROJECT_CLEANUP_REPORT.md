# Tarsight 项目清理和优化建议

生成时间: 2025-12-30

## 📊 项目结构总览

```
Tarsight/
├── csv_version/          # CSV 版本（旧版本，可能不需要）
├── shared/               # 共享代码
├── supabase_version/     # Supabase 版本（当前使用）
├── tarsight-dashboard/   # Next.js 前端
├── .venv/               # Python 虚拟环境
└── .git/                # Git 仓库
```

---

## 🧹 需要清理的内容

### 1. 临时文件和缓存文件

#### Python 缓存文件
```bash
# 在 supabase_version/ 目录下
- supabase_version/__pycache__/
- supabase_version/utils/__pycache__/
- supabase_version/.pytest_cache/
```

**建议**: 添加到 `.gitignore`，定期清理
```bash
find supabase_version -type d -name "__pycache__" -exec rm -rf {} +
find supabase_version -type d -name ".pytest_cache" -exec rm -rf {} +
```

#### 系统文件
```bash
./.DS_Store
./supabase_version/.DS_Store
./supabase_version/reports/.DS_Store
```

**建议**: 添加到 `.gitignore`（应该已经在了）

#### 重复文件
```bash
supabase_version/setup_auth_and_rls.sql  # 出现了两次（9.5k）
```

**建议**: 删除重复文件

### 2. 不需要的文档文件

#### supabase_version/ 根目录
以下文档可能已经过时或不需要保留在根目录：

- `AUTH_SETUP_GUIDE.md` - 认证设置指南（可以归档）
- `DATABASE_MIGRATION_GUIDE.md` - 数据库迁移指南（可以归档）
- `OPTIMIZATION_SUMMARY.md` - 优化总结（可以归档）
- `SUPABASE_INSTALLATION_REPORT.md` - 安装报告（可以归档）
- `test_auth_and_rls.sql` - 测试 SQL（可以删除）
- `setup_bruce_account.sql` - Bruce 账户设置（可以删除或归档）
- `test_cases.csv` - 测试用例 CSV（如果已导入数据库，可以删除）

#### tarsight-dashboard/ 根目录
- `DEPLOYMENT.md` - 部署文档（如果不需要 Docker 部署，可以删除）
- `PROJECT_OVERVIEW.md` - 项目概览（可以整合到 README.md）

### 3. 不需要的配置文件

#### supabase_version/
- `config.py` - 根目录的配置文件（应该使用 config/ 目录）
- `package-lock.json` - 为什么会有 package-lock.json？（Python 项目不需要）

#### tarsight-dashboard/
- `Dockerfile` - 如果不需要 Docker 部署
- `docker-compose.yml` - 如果不需要 Docker 部署
- `deploy.sh` - 如果不需要 Docker 部署
- `.dockerignore` - 如果不需要 Docker 部署
- `setup.sh` - 如果已经安装完成

### 4. 可能不需要的目录

#### csv_version/
- 如果这个是旧版本，确认是否还需要
- 如果不需要，可以考虑删除或移到 archive/

#### shared/
- 检查这个目录是否真正被使用
- 如果没有共享代码，可以考虑删除

---

## ✅ 推荐的项目结构

### supabase_version/
```
supabase_version/
├── README.md                    # 主要文档
├── pyproject.toml              # Python 项目配置
├── run.py                      # 主入口文件
├── .env                        # 环境变量（不提交）
├── .env.example                # 环境变量示例
│
├── config/                     # 配置文件
│   └── ...
├── database/                   # 数据库相关
│   ├── schema/                 # 数据库架构
│   ├── migrations/             # 迁移脚本
│   └── archive/                # 归档的 SQL
├── scripts/                    # 脚本文件
│   ├── archive/                # 归档的脚本
│   ├── setup_user_account.py
│   └── ...
├── utils/                      # 工具函数
│   ├── auth.py
│   ├── supabase_client.py
│   └── ...
├── testcases/                  # 测试用例
├── reports/                    # 测试报告
│   └── allure-results/
├── supabase/                   # Supabase 相关（如果需要）
│
└── docs/                       # 文档（新建）
    ├── AUTH_SETUP_GUIDE.md
    ├── DATABASE_MIGRATION_GUIDE.md
    └── ...
```

### tarsight-dashboard/
```
tarsight-dashboard/
├── README.md                   # 主要文档
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── middleware.ts               # Next.js 中间件
├── .env.local                  # 环境变量（不提交）
├── .env.local.example          # 环境变量示例
├── .gitignore
│
├── app/                        # App Router
│   ├── layout.tsx
│   ├── (auth)/                 # 认证后的页面
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── test-cases/
│   │   ├── executions/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── profile/
│   └── login/                  # 登录页
│
├── components/                 # 组件
│   ├── sidebar.tsx
│   ├── user-menu.tsx
│   └── ui/                     # UI 组件
│       ├── button.tsx
│       ├── avatar.tsx
│       └── dropdown-menu.tsx
│
├── lib/                        # 工具库
│   ├── utils.ts
│   └── supabase/
│       ├── client.ts
│       └── server.ts
│
└── public/                     # 静态文件
```

---

## 🔧 清理脚本

### 1. 清理临时文件
```bash
#!/bin/bash
# cleanup.sh

echo "清理 Python 缓存..."
find . -type d -name "__pycache__" -not -path "*/\.venv/*" -exec rm -rf {} +
find . -type d -name ".pytest_cache" -not -path "*/\.venv/*" -exec rm -rf {} +
find . -type f -name "*.pyc" -not -path "*/\.venv/*" -delete

echo "清理系统文件..."
find . -type f -name ".DS_Store" -delete

echo "清理日志文件..."
find . -type f -name "*.log" -delete

echo "✅ 清理完成！"
```

### 2. 更新 .gitignore

#### supabase_version/.gitignore
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Testing
.pytest_cache/
.coverage
htmlcov/
allure-results/
allure-report/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Project specific
*.log
test_cases.csv
*.bak
```

#### tarsight-dashboard/.gitignore
```
# Dependencies
node_modules/

# Next.js
.next/
out/
build/

# Production
*.log

# Environment
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

---

## 📝 需要手动处理的事项

### 1. 删除或归档以下文件

#### 可以删除的文件：
- `supabase_version/test_auth_and_rls.sql`
- `supabase_version/setup_bruce_account.sql`
- `supabase_version/test_cases.csv`（如果已导入）
- `supabase_version/config.py`（如果有 config/ 目录）
- `supabase_version/package-lock.json`
- `tarsight-dashboard/Dockerfile`（如果不需要 Docker）
- `tarsight-dashboard/docker-compose.yml`（如果不需要 Docker）
- `tarsight-dashboard/deploy.sh`（如果不需要 Docker）
- `tarsight-dashboard/.dockerignore`（如果不需要 Docker）
- `tarsight-dashboard/setup.sh`（如果已安装）

#### 可以归档到 docs/ 的文档：
- `supabase_version/AUTH_SETUP_GUIDE.md`
- `supabase_version/DATABASE_MIGRATION_GUIDE.md`
- `supabase_version/OPTIMIZATION_SUMMARY.md`
- `supabase_version/SUPABASE_INSTALLATION_REPORT.md`

### 2. 创建 docs/ 目录

```bash
mkdir -p supabase_version/docs
mv supabase_version/AUTH_SETUP_GUIDE.md supabase_version/docs/
mv supabase_version/DATABASE_MIGRATION_GUIDE.md supabase_version/docs/
mv supabase_version/OPTIMIZATION_SUMMARY.md supabase_version/docs/
mv supabase_version/SUPABASE_INSTALLATION_REPORT.md supabase_version/docs/
```

### 3. 更新 README.md

确保每个 README.md 包含：
- 项目简介
- 安装说明
- 使用说明
- 环境变量说明
- 常见问题

---

## 🎯 优先级建议

### 高优先级（立即处理）
1. ✅ 清理临时文件（__pycache__, .DS_Store, *.pyc）
2. ✅ 删除重复文件
3. ✅ 更新 .gitignore

### 中优先级（有空时处理）
4. ✅ 创建 docs/ 目录并归档文档
5. ✅ 删除不需要的配置文件
6. ✅ 清理不需要的 Docker 相关文件

### 低优先级（可选）
7. 考虑是否需要 csv_version/ 目录
8. 考虑是否需要 shared/ 目录
9. 优化 README.md 文档

---

## 📋 清理清单

- [ ] 清理 Python 缓存文件
- [ ] 删除 .DS_Store 文件
- [ ] 删除重复的 setup_auth_and_rls.sql
- [ ] 删除 test_auth_and_rls.sql
- [ ] 删除 setup_bruce_account.sql
- [ ] 确认是否需要 test_cases.csv
- [ ] 删除 config.py（如果不需要）
- [ ] 删除 package-lock.json（Python 项目）
- [ ] 创建 docs/ 目录
- [ ] 移动文档文件到 docs/
- [ ] 删除 Docker 相关文件（如果不需要）
- [ ] 删除 setup.sh（如果不需要）
- [ ] 更新 .gitignore
- [ ] 确认是否需要 csv_version/ 目录
- [ ] 确认是否需要 shared/ 目录
- [ ] 清理前端不必要的文件
- [ ] 更新 README.md

---

## 🎉 总结

主要问题：
1. **临时文件未清理**: Python 缓存、系统文件
2. **重复文件**: setup_auth_and_rls.sql 出现两次
3. **文档散乱**: 多个文档在根目录
4. **不需要的配置**: Docker、setup.sh 等可能不需要
5. **项目结构**: csv_version 和 shared 目录的用途不明确

建议的清理步骤：
1. 先清理临时文件（最安全）
2. 删除明确不需要的文件
3. 归档文档到 docs/ 目录
4. 更新 .gitignore
5. 考虑是否需要 csv_version 和 shared 目录

执行后项目会更清晰、更易维护！
