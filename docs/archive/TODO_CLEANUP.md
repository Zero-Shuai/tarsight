# Tarsight 项目清理清单

## ✅ 已完成的清理

- [x] Python 缓存文件已清理
- [x] .DS_Store 文件已清理
- [x] 日志文件已清理

---

## 🔍 需要手动确认的项目

### 1. 可以删除的文件（需要确认）

#### supabase_version/
```bash
# 测试 SQL 文件
rm supabase_version/test_auth_and_rls.sql

# Bruce 账户设置（如果不需要）
rm supabase_version/setup_bruce_account.sql

# test_cases.csv（如果已经导入到数据库）
rm supabase_version/test_cases.csv

# 根目录的 config.py（如果有 config/ 目录）
rm supabase_version/config.py

# package-lock.json（Python 项目不需要）
rm supabase_version/package-lock.json
```

#### tarsight-dashboard/
```bash
# Docker 相关（如果不需要 Docker 部署）
rm tarsight-dashboard/Dockerfile
rm tarsight-dashboard/docker-compose.yml
rm tarsight-dashboard/deploy.sh
rm tarsight-dashboard/.dockerignore

# 安装脚本（如果已经安装完成）
rm tarsight-dashboard/setup.sh
```

### 2. 需要归档的文档

```bash
# 创建 docs 目录
mkdir -p supabase_version/docs

# 移动文档到 docs/
mv supabase_version/AUTH_SETUP_GUIDE.md supabase_version/docs/
mv supabase_version/DATABASE_MIGRATION_GUIDE.md supabase_version/docs/
mv supabase_version/OPTIMIZATION_SUMMARY.md supabase_version/docs/
mv supabase_version/SUPABASE_INSTALLATION_REPORT.md supabase_version/docs/
```

### 3. 需要确认的目录

- `csv_version/` - 这是旧版本吗？如果不需要可以删除或归档
- `shared/` - 这个目录有什么用途？如果没用到可以删除

---

## 🛠️ 一键清理脚本（可选）

创建一个文件 `auto_cleanup.sh`，包含以上所有清理操作：

```bash
#!/bin/bash

echo "开始清理..."

# 删除不需要的文件
rm -f supabase_version/test_auth_and_rls.sql
rm -f supabase_version/setup_bruce_account.sql
rm -f supabase_version/test_cases.csv
rm -f supabase_version/config.py
rm -f supabase_version/package-lock.json

# 创建 docs 目录并归档文档
mkdir -p supabase_version/docs
mv -f supabase_version/AUTH_SETUP_GUIDE.md supabase_version/docs/ 2>/dev/null
mv -f supabase_version/DATABASE_MIGRATION_GUIDE.md supabase_version/docs/ 2>/dev/null
mv -f supabase_version/OPTIMIZATION_SUMMARY.md supabase_version/docs/ 2>/dev/null
mv -f supabase_version/SUPABASE_INSTALLATION_REPORT.md supabase_version/docs/ 2>/dev/null

# 删除 Docker 相关文件
rm -f tarsight-dashboard/Dockerfile
rm -f tarsight-dashboard/docker-compose.yml
rm -f tarsight-dashboard/deploy.sh
rm -f tarsight-dashboard/.dockerignore
rm -f tarsight-dashboard/setup.sh

echo "清理完成！"
```

使用方法：
```bash
chmod +x auto_cleanup.sh
./auto_cleanup.sh
```

---

## 📊 清理前后对比

### 清理前的问题：
1. ❌ `__pycache__` 目录到处都是
2. ❌ `.DS_Store` 文件散布各处
3. ❌ 根目录有 8 个文档文件
4. ❌ 有不需要的配置文件
5. ❌ 有重复或测试文件

### 清理后的效果：
1. ✅ 没有缓存文件
2. ✅ 没有系统文件
3. ✅ 文档归档到 `docs/` 目录
4. ✅ 只保留必要的配置文件
5. ✅ 项目结构更清晰

---

## 🎯 建议的清理顺序

### 第一步：安全清理（已完成）
- ✅ Python 缓存
- ✅ 系统文件
- ✅ 日志文件

### 第二步：删除明确不需要的文件
```bash
rm supabase_version/test_auth_and_rls.sql
rm supabase_version/setup_bruce_account.sql
rm supabase_version/package-lock.json
```

### 第三步：归档文档
```bash
mkdir -p supabase_version/docs
mv supabase_version/*.md supabase_version/docs/
mv supabase_version/README.md supabase_version/  # 移回主文档
```

### 第四步：删除不需要的配置（可选）
```bash
# 前端 Docker 相关（如果不需要）
rm tarsight-dashboard/Dockerfile
rm tarsight-dashboard/docker-compose.yml
rm tarsight-dashboard/deploy.sh
```

### 第五步：确认目录用途
- 确认是否需要 `csv_version/`
- 确认是否需要 `shared/`

---

## 📝 注意事项

1. **备份重要数据**：删除文件前先备份
2. **Git 提交**：清理前先提交当前状态
3. **分批清理**：不要一次删除太多，分步进行
4. **测试功能**：清理后测试项目是否正常运行

---

## 🔗 相关文件

- 详细清理报告：[PROJECT_CLEANUP_REPORT.md](./PROJECT_CLEANUP_REPORT.md)
