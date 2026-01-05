# Ubuntu Docker 生产环境更新指南

**更新日期**: 2026-01-05
**适用场景**: 已使用Docker部署的Ubuntu生产环境
**更新内容**: 项目整理后的代码更新

---

## 📋 目录

- [更新概览](#更新概览)
- [准备工作](#准备工作)
- [更新步骤](#更新步骤)
- [验证部署](#验证部署)
- [故障排查](#故障排查)
- [回滚方案](#回滚方案)

---

## 🎯 更新概览

### 本次更新的主要变化

**代码层面**:
- ✅ 清理了Python缓存文件（940个.pyc + 117个__pycache__）
- ✅ 删除了重复和临时文档（4个）
- ✅ 删除了备份文件（3个.bak）
- ✅ 优化了文档结构（新增docs/history/）
- ✅ 更新了.gitignore规则

**功能层面**:
- ℹ️ **无功能性变更**，仅清理和优化
- ℹ️ 不影响现有功能
- ℹ️ 不需要数据库迁移

**风险评估**: 🟢 **低风险**
- 仅删除冗余文件
- 不修改核心代码
- 不影响运行逻辑

---

## 📦 准备工作

### 1. 检查当前部署状态

```bash
# SSH登录到Ubuntu服务器
ssh your-user@your-server-ip

# 检查Docker服务状态
sudo systemctl status docker

# 检查当前运行的容器
docker ps -a

# 检查当前镜像
docker images | grep tarsight

# 查看当前项目目录（假设在 /opt/tarsight）
cd /opt/tarsight
git status
git log --oneline -5
```

### 2. 创建备份（强烈推荐）

```bash
# 进入项目目录
cd /opt/tarsight

# 备份当前版本
sudo cp -r . /opt/tarsight_backup_$(date +%Y%m%d_%H%M%S)

# 或者使用git创建备份分支
git branch backup-before-update-$(date +%Y%m%d)
git push origin backup-before-update-$(date +%Y%m%d)

# 导出当前Docker镜像（可选）
docker save tarsight-frontend:latest | gzip > /tmp/tarsight_frontend_$(date +%Y%m%d).tar.gz

# 验证备份
ls -lh /opt/tarsight_backup_*
ls -lh /tmp/tarsight_frontend_*.tar.gz
```

### 3. 记录当前配置

```bash
# 备份环境变量文件
cp .env .env.backup_$(date +%Y%m%d)

# 查看当前运行的容器配置
docker compose config > /tmp/docker-compose-config-backup.yml

# 查看当前版本信息
git log -1 > /tmp/git-commit-info.txt
cat /tmp/git-commit-info.txt
```

---

## 🚀 更新步骤

### 方案A：零停机更新（推荐）

适用于需要保持服务可用性的场景。

```bash
# 1. 拉取最新代码
cd /opt/tarsight
git fetch origin
git pull origin master

# 2. 检查是否有重要变更
git log HEAD@{1}..HEAD --oneline

# 3. 构建新镜像（后台运行）
docker compose build --no-cache frontend

# 4. 验证新镜像
docker images | grep tarsight

# 5. 启动新容器（使用滚动更新）
docker compose up -d frontend --no-deps --force-recreate

# 等待新容器启动（约30秒）
sleep 30

# 6. 检查新容器状态
docker ps
docker compose logs frontend --tail 50
```

### 方案B：快速更新（会有短暂停机）

适用于非关键时段更新。

```bash
# 1. 停止当前服务
cd /opt/tarsight
docker compose down

# 2. 拉取最新代码
git pull origin master

# 3. 重新构建并启动
docker compose up -d --build

# 4. 查看启动日志
docker compose logs -f
```

### 方案C：蓝绿部署（生产推荐）

适用于生产环境，实现真正零停机。

```bash
# 1. 准备新的部署目录
cd /opt
cp -r tarsight tarsight-new

# 2. 更新新目录代码
cd tarsight-new
git pull origin master

# 3. 修改docker-compose.yml中的容器名（避免冲突）
# 将 container_name: tarsight-frontend 改为 tarsight-frontend-green

# 4. 启动新环境
docker compose up -d

# 5. 验证新环境健康
docker compose ps
curl http://localhost:3001  # 假设新环境使用3001端口

# 6. 切换Nginx代理到新环境（如果使用Nginx）
sudo vim /etc/nginx/sites-available/tarsight
# 将 proxy_pass 从 http://localhost:3000 改为 http://localhost:3001
sudo nginx -t
sudo systemctl reload nginx

# 7. 观察新环境运行情况
# 如果稳定，删除旧环境
cd /opt
docker compose -f tarsight/docker-compose.yml down
rm -rf tarsight
mv tarsight-new tarsight
```

---

## ✅ 验证部署

### 1. 检查容器状态

```bash
# 查看容器是否运行
docker ps | grep tarsight

# 查看容器资源使用
docker stats tarsight-frontend --no-stream

# 查看容器日志
docker compose logs frontend --tail 100
```

### 2. 健康检查

```bash
# 检查容器健康状态
docker inspect tarsight-frontend | grep -A 5 Health

# 手动健康检查
curl -I http://localhost:3000

# 检查响应时间
time curl http://localhost:3000
```

### 3. 功能测试

```bash
# 测试前端页面
curl http://localhost:3000 | grep -o "<title>.*</title>"

# 如果配置了域名，测试外网访问
curl http://your-domain.com

# 测试API端点
curl http://localhost:3000/api/health
```

### 4. 检查应用日志

```bash
# 查看最近的错误日志
docker compose logs frontend | grep -i error | tail -20

# 查看最近的警告日志
docker compose logs frontend | grep -i warn | tail -20

# 实时查看日志
docker compose logs -f frontend
```

---

## 🔧 故障排查

### 问题1: 容器启动失败

**症状**:
```bash
docker ps  # 看不到 tarsight-frontend 容器
```

**排查步骤**:
```bash
# 查看容器退出日志
docker compose logs frontend

# 查看详细错误信息
docker compose ps -a

# 检查配置文件
docker compose config

# 常见原因：
# 1. 环境变量配置错误 -> 检查 .env 文件
# 2. 端口被占用 -> netstat -tulpn | grep 3000
# 3. 镜像构建失败 -> docker compose build --no-cache
```

### 问题2: 页面无法访问

**症状**:
```bash
curl http://localhost:3000  # Connection refused
```

**排查步骤**:
```bash
# 检查容器是否运行
docker ps

# 检查端口映射
docker port tarsight-frontend

# 检查防火墙
sudo ufw status
sudo iptables -L -n | grep 3000

# 如果使用Nginx代理，检查Nginx配置
sudo nginx -t
sudo systemctl status nginx
```

### 问题3: 数据库连接失败

**症状**:
```bash
docker compose logs frontend | grep -i supabase
# 显示 "Supabase connection failed"
```

**排查步骤**:
```bash
# 检查环境变量
docker compose exec frontend env | grep SUPABASE

# 测试Supabase连接
docker compose exec frontend sh -c "curl $SUPABASE_URL"

# 检查.env文件配置
cat .env | grep SUPABASE
```

---

## 🔄 回滚方案

### 方案A: Git回滚

```bash
# 1. 查看历史提交
git log --oneline -10

# 2. 回滚到指定版本
git reset --hard <previous-commit-hash>

# 3. 重新构建和部署
docker compose down
docker compose up -d --build
```

### 方案B: 备份恢复

```bash
# 1. 停止当前服务
docker compose down

# 2. 恢复备份文件
sudo rm -rf /opt/tarsight
sudo cp -r /opt/tarsight_backup_YYYYMMDD_HHMMSS /opt/tarsight

# 3. 重新启动
cd /opt/tarsight
docker compose up -d
```

### 方案C: 镜像回滚

```bash
# 1. 加载备份的镜像
docker load < /tmp/tarsight_frontend_YYYYMMDD.tar.gz

# 2. 修改docker-compose.yml使用旧镜像
# 将 image: tarsight-frontend:latest 改为
# image: tarsight-frontend:backup-YYYYMMDD

# 3. 重新启动
docker compose up -d
```

### 快速回滚脚本

```bash
#!/bin/bash
# quick-rollback.sh

echo "开始快速回滚..."

# 停止当前服务
docker compose down

# 回滚到上一个git版本
git reset --hard HEAD~1

# 重新构建和启动
docker compose up -d --build

echo "回滚完成！"
echo "验证服务状态："
docker ps
docker compose logs frontend --tail 20
```

使用方法：
```bash
chmod +x quick-rollback.sh
./quick-rollback.sh
```

---

## 📊 更新后检查清单

- [ ] 容器正常运行（`docker ps`）
- [ ] 端口正常监听（`netstat -tulpn | grep 3000`）
- [ ] 前端页面可访问（`curl http://localhost:3000`）
- [ ] API端点响应正常（测试登录、测试执行等）
- [ ] 数据库连接正常（检查日志）
- [ ] 没有错误日志（`docker compose logs frontend | grep -i error`）
- [ ] 资源使用正常（`docker stats`）
- [ ] 外网访问正常（测试域名或IP）

---

## 🎯 优化建议

### 1. 自动化更新脚本

创建 `/opt/tarsight/update.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/opt/tarsight"
BACKUP_DIR="/opt/tarsight_backup_${BACKUP_DATE}"

echo "=== Tarsight 自动更新脚本 ==="
echo "备份目录: ${BACKUP_DIR}"

# 1. 创建备份
echo "[1/6] 创建备份..."
sudo cp -r ${PROJECT_DIR} ${BACKUP_DIR}

# 2. 拉取最新代码
echo "[2/6] 拉取最新代码..."
cd ${PROJECT_DIR}
git fetch origin
git pull origin master

# 3. 停止服务
echo "[3/6] 停止当前服务..."
docker compose down

# 4. 重新构建
echo "[4/6] 重新构建镜像..."
docker compose build --no-cache

# 5. 启动服务
echo "[5/6] 启动服务..."
docker compose up -d

# 6. 等待启动
echo "[6/6] 等待服务启动..."
sleep 30

# 验证
echo "=== 验证部署 ==="
docker ps
echo "容器日志（最后20行）:"
docker compose logs frontend --tail 20

echo "=== 更新完成 ==="
echo "如遇问题，备份位于: ${BACKUP_DIR}"
```

使用方法：
```bash
chmod +x /opt/tarsight/update.sh
/opt/tarsight/update.sh
```

### 2. 定时健康检查

创建 `/opt/tarsight/health-check.sh`:

```bash
#!/bin/bash

# 检查容器状态
if ! docker ps | grep -q tarsight-frontend; then
    echo "❌ 容器未运行"
    # 发送告警（例如：邮件、钉钉、企业微信）
    exit 1
fi

# 检查HTTP响应
if ! curl -f -s http://localhost:3000 > /dev/null; then
    echo "❌ 服务无响应"
    exit 1
fi

echo "✅ 服务正常"
```

添加到crontab：
```bash
# 每5分钟检查一次
*/5 * * * * /opt/tarsight/health-check.sh >> /var/log/tarsight-health.log 2>&1
```

### 3. 日志管理

```bash
# 清理旧日志（保留最近7天）
find /var/lib/docker/containers -name "*.log" -mtime +7 -delete

# 或者使用Docker自带的日志轮转（已在docker-compose.yml中配置）
# max-size: "10m"
# max-file: "3"
```

---

## 📞 需要帮助？

如果在更新过程中遇到问题：

1. **查看完整部署文档**:
   - `docs/guides/DOCKER_FULL_STACK_DEPLOYMENT.md`
   - `docs/guides/UBUNTU_DEPLOYMENT.md`

2. **查看故障排查指南**:
   - `docs/troubleshooting/INDEX.md`

3. **检查GitHub Issues**:
   - https://github.com/Zero-Shuai/tarsight/issues

---

**更新完成时间**: 2026-01-05
**文档版本**: 1.0
