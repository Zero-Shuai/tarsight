# GitHub Actions 自动化部署指南

## 📋 概述

本指南介绍如何配置 GitHub Actions 实现代码推送后自动部署到生产服务器。

### 工作流程

```
开发者推送代码 → GitHub → GitHub Actions → SSH 连接生产服务器 → 执行部署脚本 → 完成
```

---

## 🔧 前置要求

### 1. 生产服务器准备

- Ubuntu 服务器（已在运行 Tarsight）
- SSH 访问权限
- Docker 和 Docker Compose 已安装
- Git 仓库已克隆到 `/opt/tarsight`

### 2. GitHub 仓库准备

- 仓库地址：https://github.com/Zero-Shuai/tarsight.git
- 需要配置 GitHub Secrets（见下文）

---

## 🚀 配置步骤

### 步骤 1: 生产服务器配置 SSH 密钥

#### 1.1 生成 SSH 密钥对（如果还没有）

**在本地机器执行**：
```bash
# 生成新的 SSH 密钥对（如果没有）
ssh-keygen -t ed25519 -C "github-actions@tarsight" -f ~/.ssh/tarsight_deploy

# 或者使用 RSA 密钥
ssh-keygen -t rsa -b 4096 -C "github-actions@tarsight" -f ~/.ssh/tarsight_deploy
```

这会生成两个文件：
- `~/.ssh/tarsight_deploy` - 私钥（配置到 GitHub Secrets）
- `~/.ssh/tarsight_deploy.pub` - 公钥（添加到服务器）

#### 1.2 添加公钥到生产服务器

**方式 A: 使用 ssh-copy-id（推荐）**
```bash
ssh-copy-id -i ~/.ssh/tarsight_deploy.pub user@your-server-ip
```

**方式 B: 手动添加**
```bash
# 1. 查看公钥内容
cat ~/.ssh/tarsight_deploy.pub

# 2. 登录到生产服务器
ssh user@your-server-ip

# 3. 添加公钥到 authorized_keys
mkdir -p ~/.ssh
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

#### 1.3 测试 SSH 连接

```bash
# 测试使用新密钥连接
ssh -i ~/.ssh/tarsight_deploy user@your-server-ip

# 如果成功连接，继续下一步
```

---

### 步骤 2: 配置 GitHub Secrets

#### 2.1 打开 GitHub仓库设置

1. 访问：https://github.com/Zero-Shuai/tarsight/settings/secrets/actions
2. 点击 "New repository secret"

#### 2.2 添加以下 Secrets

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `PRODUCTION_HOST` | 服务器 IP 地址 | `192.168.1.100` 或 `your-domain.com` |
| `PRODUCTION_USER` | SSH 登录用户名 | `root` 或 `ubuntu` |
| `PRODUCTION_SSH_KEY` | SSH 私钥内容 | 整个私钥文件内容（见下文） |
| `PRODUCTION_PORT` | SSH 端口（可选） | `22`（默认） |

#### 2.3 添加 PRODUCTION_SSH_KEY 的详细步骤

**在本地机器执行**：
```bash
# 1. 查看私钥内容（包括 BEGIN 和 END 行）
cat ~/.ssh/tarsight_deploy

# 输出示例：
# -----BEGIN OPENSSH PRIVATE KEY-----
# b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
# ...（很多行）...
# -----END OPENSSH PRIVATE KEY-----
```

**复制整个私钥内容**（包括 BEGIN 和 END 行），然后：
1. 在 GitHub 页面点击 "New repository secret"
2. Name: `PRODUCTION_SSH_KEY`
3. Value: 粘贴整个私钥内容
4. 点击 "Add secret"

**⚠️ 重要提示**：
- 确保复制了完整的私钥（包括 BEGIN 和 END 行）
- 不要修改私钥内容的格式
- 保持换行符完整

---

### 步骤 3: 验证配置

#### 3.1 检查 workflow 文件

确认 `.github/workflows/deploy-production.yml` 文件存在：
```bash
ls -la .github/workflows/deploy-production.yml
```

#### 3.2 检查自动化脚本

确认脚本有执行权限：
```bash
ls -la scripts/auto-deploy.sh
# 应该显示：-rwxr-xr-x（可执行）
```

---

## 🎯 使用方法

### 方式 1: 自动触发部署

**推送到 master 分支**：
```bash
# 本地提交代码
git add .
git commit -m "feat: 新功能"
git push origin master

# GitHub Actions 自动触发部署
```

### 方式 2: 手动触发部署

1. 访问：https://github.com/Zero-Shuai/tarsight/actions
2. 选择 "Deploy to Production" workflow
3. 点击 "Run workflow"
4. 选择分支（master）
5. 点击 "Run workflow"

### 方式 3: 使用 [no-lint] 标记

在提交信息中添加 `[no-lint]` 或 `[skip lint]` 标记，自动禁用类型检查：
```bash
git commit -m "feat: 新功能 [no-lint]"
git push origin master
```

---

## 📊 监控部署

### 查看部署状态

1. **GitHub Actions 页面**：
   - 访问：https://github.com/Zero-Shuai/tarsight/actions
   - 查看最新的 workflow run

2. **部署详情**：
   - 点击具体的 run
   - 查看 "Deploy to Production Server" job
   - 展开各个步骤查看详细日志

### 常见部署状态

| 状态 | 说明 | 操作 |
|------|------|------|
| ⏳ Queued | 队列中等待 | 等待前面任务完成 |
| 🔄 In progress | 运行中 | 查看实时日志 |
| ✅ Success | 成功 | 访问生产环境验证 |
| ❌ Failure | 失败 | 查看日志，修复后重试 |

---

## 🔧 故障排查

### 问题 1: SSH 连接失败

**错误信息**：
```
ssh: connect to host <ip> port 22: Connection refused
```

**解决方案**：
1. 检查服务器 IP 地址是否正确
2. 检查 SSH 服务是否运行：`sudo systemctl status sshd`
3. 检查防火墙是否开放 22 端口
4. 验证 GitHub Secrets 中的 `PRODUCTION_HOST`

### 问题 2: SSH 认证失败

**错误信息**：
```
Permission denied (publickey)
```

**解决方案**：
1. 验证私钥内容是否完整（包括 BEGIN/END 行）
2. 检查服务器的 `~/.ssh/authorized_keys` 文件
3. 确认私钥对应的公钥已添加到服务器
4. 测试：`ssh -i ~/.ssh/tarsight_deploy user@server`

### 问题 3: 部署脚本执行失败

**错误信息**：
```
bash: scripts/auto-deploy.sh: No such file or directory
```

**解决方案**：
1. 确认脚本文件存在于服务器：`ls -la /opt/tarsight/scripts/auto-deploy.sh`
2. 检查文件权限：`chmod +x /opt/tarsight/scripts/auto-deploy.sh`
3. 确认项目目录正确：`pwd` 应该是 `/opt/tarsight`

### 问题 4: Docker 构建失败

**错误信息**：
```
ERROR [builder X/Y] ERROR: failed to solve
```

**解决方案**：
1. 在提交信息中使用 `[no-lint]` 标记
2. 手动 SSH 到服务器查看详细日志：`cat /tmp/auto-build.log`
3. 清理 Docker 缓存：`docker system prune -a`
4. 手动运行测试：`docker compose build --no-cache frontend`

### 问题 5: 容器启动失败

**错误信息**：
```
Container exited with code 1
```

**解决方案**：
1. 查看容器日志：`docker compose logs frontend --tail 100`
2. 检查环境变量配置：`docker compose config`
3. 验证 .env 文件是否存在
4. 手动测试：`docker compose up -d frontend`

---

## 🛡️ 安全最佳实践

### 1. 使用专用部署用户

**创建部署用户**（在服务器上）：
```bash
# 创建专用用户
sudo adduser deploy

# 添加到 sudo 组
sudo usermod -aG sudo deploy

# 配置免密 sudo
sudo visudo
# 添加以下行：
# deploy ALL=(ALL) NOPASSWD: /opt/tarsight/scripts/auto-deploy.sh
```

### 2. 限制 SSH 密钥权限

```bash
# 仅允许特定命令执行
# 在 ~/.ssh/authorized_keys 中添加：
command="cd /opt/tarsight && bash scripts/auto-deploy.sh" ssh-rsa AAAAB3...
```

### 3. 定期轮换密钥

```bash
# 每 90 天生成新密钥
ssh-keygen -t ed25519 -C "github-actions@tarsight-$(date +%Y%m%d)" -f ~/.ssh/tarsight_deploy_$(date +%Y%m%d)
```

### 4. 启用 GitHub Actions 日志保留

在仓库设置中：
- Settings → Actions → General
- Workflow run retention: 90 天
- Artifact retention: 30 天

---

## 📝 维护和监控

### 日常维护

1. **每周检查**：
   - 查看 GitHub Actions 运行历史
   - 检查服务器磁盘空间
   - 验证容器运行状态

2. **每月检查**：
   - 测试 SSH 连接
   - 验证备份完整性
   - 清理旧的 Docker 镜像

### 监控指标

- 部署成功率（目标：> 95%）
- 平均部署时间（目标：< 10 分钟）
- 容器重启次数
- 错误日志数量

---

## 🔄 回滚流程

### 自动回滚

`auto-deploy.sh` 脚本在以下情况自动回滚：
- Docker 构建失败
- 容器启动失败
- 健康检查失败

回滚位置：`/opt/tarsight_backup_YYYYMMDD_HHMMSS`

### 手动回滚

```bash
# SSH 到服务器
ssh user@server

# 查看备份目录
ls -la /opt/ | grep tarsight_backup

# 使用备份恢复
cd /opt/tarsight_backup_20260106_120000
docker compose up -d frontend
```

---

## 📚 相关文档

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [SSH Action 使用指南](https://github.com/appleboy/ssh-action)
- [部署脚本说明](../OPTIMIZED_MIGRATION_GUIDE.md)
- [生产环境更新指南](./PRODUCTION_UPDATE_GUIDE.md)

---

## ❓ 常见问题

### Q: 如何禁用自动部署？

**A**: 删除或重命名 workflow 文件：
```bash
mv .github/workflows/deploy-production.yml .github/workflows/deploy-production.yml.disabled
```

### Q: 如何在特定分支不触发部署？

**A**: 修改 `.github/workflows/deploy-production.yml`：
```yaml
on:
  push:
    branches:
      - master  # 只在 master 分支触发
```

### Q: 部署需要多长时间？

**A**: 通常 5-10 分钟：
- 拉取代码：< 1 分钟
- 构建镜像：3-5 分钟
- 重启容器：1-2 分钟
- 健康检查：1 分钟

### Q: 可以同时部署多个环境吗？

**A**: 可以，创建多个 workflow 文件：
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

---

**创建时间**: 2026-01-06
**最后更新**: 2026-01-06
**维护者**: Tarsight Team
