# Tarsight Dashboard Docker 部署

基于实际部署经验优化的 Docker 配置和部署文档。

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| **Dockerfile** | 优化的多阶段构建配置，支持构建时环境变量 |
| **docker-compose.yml** | 容器编排配置，已修复构建上下文问题 |
| **.dockerignore** | 构建时忽略的文件 |
| **DEPLOYMENT_GUIDE.md** | ⭐ 快速部署指南（推荐首先阅读） |
| **TROUBLESHOOTING.md** | ⭐ 故障排查手册（遇到问题时查看） |
| **CLOUD_DEPLOYMENT_GUIDE.md** | 完整的云服务器部署指南 |
| **deploy.sh** | 本地部署脚本 |
| **quick-deploy.sh** | 云服务器快速部署脚本 |

## 🚀 快速开始

### 方式一：云服务器快速部署（推荐）

```bash
# 1. 克隆代码
git clone https://github.com/Zero-Shuai/tarsight.git
cd tarsight/tarsight-dashboard/deployment

# 2. 配置环境变量
cat > .env << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF

# 3. 配置 Docker 镜像加速（国内服务器必需）
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com"
  ]
}
EOF
systemctl daemon-reload && systemctl restart docker

# 4. 构建并启动
docker compose up -d --build

# 5. 查看状态
docker compose ps
docker logs -f tarsight-dashboard
```

访问: `http://your-server-ip:3000`

### 方式二：本地 Docker 部署

```bash
# 1. 配置环境变量
cd tarsight-dashboard/deployment
cp ../.env.local .env

# 2. 启动
docker compose up -d

# 3. 查看日志
docker logs -f tarsight-dashboard
```

## ⚙️ 环境变量配置

必需的环境变量（在 `.env` 文件中）:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

**获取 Supabase 配置:**
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制 **Project URL** 和 **anon public key**

## 🔧 已修复的问题

本部署配置已解决以下实际部署中遇到的问题:

### ✅ 问题 1: Docker Hub 拉取镜像超时
**解决:** 配置国内镜像加速器

### ✅ 问题 2: npm ci 需要 package-lock.json
**解决:** Dockerfile 改用 `npm install`

### ✅ 问题 3: Next.js 构建缺少环境变量
**解决:** Dockerfile 接受构建参数 (ARG)，docker-compose.yml 传递环境变量

### ✅ 问题 4: 构建上下文找不到 package.json
**解决:** docker-compose.yml 使用 `context: ..`

### ✅ 问题 5: 脚本行结束符错误
**解决:** 使用 `docker compose` 直接部署，不依赖脚本

## 🌐 访问应用

部署成功后访问:

```
http://your-server-ip:3000
```

如果配置了 Nginx + 域名:

```
http://your-domain.com
```

## 📋 常用命令

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker logs -f tarsight-dashboard

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 重新构建
docker compose build --no-cache
docker compose up -d

# 查看资源使用
docker stats tarsight-dashboard
```

## 🔧 配置选项

### 修改端口

编辑 `docker-compose.yml`:

```yaml
ports:
  - "80:3000"  # 使用 80 端口
```

### 限制资源使用

编辑 `docker-compose.yml`:

```yaml
services:
  tarsight-dashboard:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
```

## 🐛 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker logs tarsight-dashboard

# 检查环境变量
cat .env

# 重新构建
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 无法访问应用

```bash
# 检查容器状态
docker compose ps

# 检查端口监听
netstat -tlnp | grep 3000

# 检查防火墙
ufw status  # Ubuntu
firewall-cmd --list-all  # CentOS
```

### 详细故障排查

查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 获取完整的故障排查指南。

## 📚 完整文档

- **⭐ [部署指南](DEPLOYMENT_GUIDE.md)** - 快速部署步骤，包含常见问题
- **⭐ [故障排查](TROUBLESHOOTING.md)** - 详细的错误诊断和解决方案
- **[云服务器部署指南](CLOUD_DEPLOYMENT_GUIDE.md)** - 完整的云部署教程
- **[前端项目 README](../README.md)** - 前端项目文档
- **[项目主文档](../../README.md)** - Tarsight 项目总览

## 🔐 安全建议

1. **配置防火墙**
   ```bash
   ufw allow 22/tcp   # SSH
   ufw allow 80/tcp   # HTTP
   ufw allow 443/tcp  # HTTPS
   ufw enable
   ```

2. **使用 HTTPS**
   - 配置 Let's Encrypt SSL 证书
   - 详见 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)

3. **定期更新**
   ```bash
   cd /opt/tarsight
   git pull
   docker compose build
   docker compose up -d
   ```

4. **备份配置**
   ```bash
   cp .env .env.backup
   ```

## 📊 监控和维护

### 健康检查

容器已配置健康检查，自动监控应用状态:

```bash
# 查看健康状态
docker inspect tarsight-dashboard | grep -A 5 Health
```

### 日志管理

```bash
# 实时日志
docker logs -f tarsight-dashboard

# 最近日志
docker logs --tail 100 tarsight-dashboard

# 日志带时间戳
docker logs -t tarsight-dashboard
```

## 🌍 不同云平台部署

- **阿里云 ECS**: 详见 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md#阿里云-ecs)
- **腾讯云 CVM**: 详见 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md#腾讯云-cvm)
- **AWS EC2**: 详见 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md#aws-ec2)

## 💡 提示

- ⏱️ 首次构建需要 5-10 分钟
- 💾 确保服务器至少有 1GB 可用内存
- 🌐 生产环境建议配置域名和 HTTPS
- 📊 定期查看日志确保应用正常运行
- 🔄 代码更新后需要重新构建镜像

## 🆘 需要帮助？

1. 查看 [部署指南](DEPLOYMENT_GUIDE.md)
2. 查看 [故障排查](TROUBLESHOOTING.md)
3. 检查容器日志: `docker logs tarsight-dashboard`
4. 查看完整指南: [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)

---

**最后更新**: 2025-12-31
**基于实际部署经验优化** ✨
