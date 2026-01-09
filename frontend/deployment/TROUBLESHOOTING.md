# Tarsight Dashboard 故障排查指南

基于实际部署遇到的问题整理的故障排查手册。

## 🔍 快速诊断

### 1. 检查容器状态

```bash
# 查看容器是否运行
docker compose ps

# 预期输出:
# NAME                 IMAGE                          STATUS
# tarsight-dashboard   deployment-tarsight-dashboard   Up X minutes
```

**问题:** 容器状态为 `Exited` 或 `Restarting`

**解决方案:**
```bash
# 查看容器日志
docker logs tarsight-dashboard

# 查看最近的日志
docker logs --tail 50 tarsight-dashboard

# 查看实时日志
docker logs -f tarsight-dashboard
```

---

## 🐛 常见错误及解决方案

### 错误 1: Docker 拉取镜像超时

**症状:**
```
failed to resolve source metadata for docker.io/library/node:20-alpine:
dial tcp 128.242.245.221:443: i/o timeout
```

**原因:** 国内服务器无法直接访问 Docker Hub

**解决方案:**
```bash
# 1. 配置镜像加速器
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://docker.nju.edu.cn"
  ]
}
EOF

# 2. 重启 Docker
systemctl daemon-reload
systemctl restart docker

# 3. 验证配置
docker info | grep -A 5 "Registry Mirrors"

# 4. 清理缓存并重新构建
docker system prune -f
docker compose build --no-cache
```

---

### 错误 2: npm ci 失败

**症状:**
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

**原因:** `package-lock.json` 不存在或被 .dockerignore 忽略

**解决方案:** 已在 Dockerfile 中修复，使用 `npm install` 替代 `npm ci`

如果仍有问题:
```bash
# 检查 .dockerignore
cat ../.dockerignore | grep package-lock

# 如果存在，删除该行
sed -i '/package-lock.json/d' ../.dockerignore

# 重新构建
docker compose build
```

---

### 错误 3: Next.js 构建时缺少 Supabase 配置

**症状:**
```
Error: Your project's URL and Key are required to create a Supabase client!
Check your Supabase project's API settings to find these values
```

**原因:** Next.js 在构建时需要访问 Supabase 环境变量以生成静态页面

**解决方案:**

1. **检查 .env 文件**
   ```bash
   cat .env
   # 应该包含:
   # NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **验证环境变量格式**
   ```bash
   # 确保没有多余的空格或引号
   grep NEXT_PUBLIC .env
   ```

3. **重新构建**
   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

---

### 错误 4: 脚本无法执行

**症状:**
```
./quick-deploy.sh: cannot execute: required file not found
```

**原因:** Windows 行结束符 (CRLF) 问题

**解决方案:**

**方式 1: 转换行结束符**
```bash
sed -i 's/\r$//' quick-deploy.sh
chmod +x quick-deploy.sh
./quick-deploy.sh
```

**方式 2: 使用 bash 直接运行**
```bash
bash quick-deploy.sh
```

**方式 3: 不使用脚本，直接用 docker-compose（推荐）**
```bash
docker compose up -d --build
```

---

### 错误 5: Git 认证失败

**症状:**
```
remote: Invalid username or token.
Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/...'
```

**原因:** GitHub 不再支持密码认证

**解决方案:**

**方式 1: 克隆公开仓库（不需要认证）**
```bash
git clone https://github.com/Zero-Shuai/tarsight.git
```

**方式 2: 使用 Personal Access Token**
```bash
# 生成 token: https://github.com/settings/tokens
git clone https://YOUR_TOKEN@github.com/Zero-Shuai/tarsight.git
```

**方式 3: 配置 SSH 密钥**
```bash
# 1. 生成密钥
ssh-keygen -t ed25519 -C "root@server" -f ~/.ssh/id_ed25519 -N ""

# 2. 复制公钥内容
cat ~/.ssh/id_ed25519.pub

# 3. 添加到 GitHub: Settings → SSH keys → New SSH key

# 4. 克隆
git clone git@github.com:Zero-Shuai/tarsight.git
```

---

### 错误 6: 无法访问应用

**症状:** 浏览器无法打开 http://server-ip:3000

**诊断步骤:**

1. **检查容器是否运行**
   ```bash
   docker compose ps
   ```

2. **检查端口是否监听**
   ```bash
   netstat -tlnp | grep 3000
   # 或
   ss -tlnp | grep 3000
   ```

3. **检查防火墙**
   ```bash
   # Ubuntu/Debian
   ufw status

   # CentOS/RHEL
   firewall-cmd --list-all
   ```

4. **测试本地访问**
   ```bash
   curl http://localhost:3000
   ```

**解决方案:**

**如果防火墙阻止:**
```bash
# Ubuntu/Debian
ufw allow 3000/tcp

# CentOS/RHEL
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

**如果容器未运行:**
```bash
docker logs tarsight-dashboard
# 根据日志排查问题
```

---

### 错误 7: 构建上下文错误

**症状:**
```
failed to compute cache key: "/package.json": not found
```

**原因:** docker-compose.yml 的 build context 配置错误

**解决方案:** 已修复 - docker-compose.yml 使用 `context: ..`

确保目录结构正确:
```
/opt/tarsight/tarsight-dashboard/
├── deployment/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env
├── package.json
├── app/
└── ...
```

---

## 🔧 诊断命令清单

### 容器相关

```bash
# 查看所有容器
docker ps -a

# 查看容器详情
docker inspect tarsight-dashboard

# 查看容器资源使用
docker stats tarsight-dashboard

# 进入容器
docker exec -it tarsight-dashboard sh

# 查看容器日志
docker logs -f --tail 100 tarsight-dashboard
```

### 网络相关

```bash
# 测试容器网络
docker exec tarsight-dashboard wget -O- http://localhost:3000

# 查看端口监听
netstat -tlnp | grep 3000

# 测试外部访问
curl -I http://$(hostname -I | awk '{print $1}'):3000
```

### Docker 系统相关

```bash
# 查看 Docker 系统信息
docker info

# 查看磁盘使用
docker system df

# 清理未使用的资源
docker system prune -a

# 查看镜像
docker images | grep tarsight
```

## 📊 性能问题

### 问题: 应用启动慢

**诊断:**
```bash
# 查看容器启动时间
docker inspect tarsight-dashboard | grep -A 5 State
```

**优化:**
1. 确保 Docker 镜像已正确构建
2. 检查服务器资源（CPU、内存）
3. 查看 Docker 日志是否有错误

### 问题: 内存使用过高

**诊断:**
```bash
docker stats tarsight-dashboard --no-stream
```

**解决方案:**
在 docker-compose.yml 中限制内存:
```yaml
services:
  tarsight-dashboard:
    deploy:
      resources:
        limits:
          memory: 1G
```

## 🔄 重建和更新

### 完全重建

```bash
# 停止并删除容器
docker compose down

# 删除镜像
docker rmi deployment-tarsight-dashboard

# 清理缓存
docker system prune -f

# 重新构建
docker compose build --no-cache

# 启动
docker compose up -d
```

### 更新代码

```bash
cd /opt/tarsight
git pull
cd tarsight-dashboard/deployment
docker compose down
docker compose build
docker compose up -d
```

## 🆘 获取帮助

### 收集诊断信息

```bash
# 创建诊断报告
cat > /tmp/tarsight-diagnostic.txt <<'EOF'
=== 容器状态 ===
docker compose ps

=== 容器日志 ===
docker logs --tail 50 tarsight-dashboard

=== 环境变量 ===
cat .env

=== Docker 版本 ===
docker --version
docker compose version

=== 系统资源 ===
free -h
df -h

=== 网络状态 ===
netstat -tlnp | grep 3000
EOF

cat /tmp/tarsight-diagnostic.txt
```

### 获取支持

1. 查看 [部署指南](DEPLOYMENT_GUIDE.md)
2. 查看 [云部署完整指南](CLOUD_DEPLOYMENT_GUIDE.md)
3. 搜索错误信息
4. 提交 Issue 到 GitHub

## 📝 预防措施

1. **定期备份配置**
   ```bash
   cp .env .env.backup.$(date +%Y%m%d)
   ```

2. **监控日志**
   ```bash
   # 设置日志轮转
   docker compose down
   docker compose up -d --log-opt max-size=10m --log-opt max-file=3
   ```

3. **健康检查**
   ```bash
   # 定期检查应用状态
   curl -f http://localhost:3000 || echo "Application down!"
   ```

---

**最后更新**: 2025-12-31
**基于实际部署经验**
