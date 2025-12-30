# Tarsight Dashboard Docker 部署

本目录包含 Tarsight Dashboard 的 Docker 部署配置文件。

## 📁 文件说明

- **Dockerfile** - Docker 镜像构建配置
- **docker-compose.yml** - Docker Compose 编排配置
- **deploy.sh** - 本地部署脚本
- **quick-deploy.sh** - 云服务器快速部署脚本 (自动安装 Docker)
- **.dockerignore** - Docker 构建时忽略的文件
- **CLOUD_DEPLOYMENT_GUIDE.md** - 详细的云服务器部署指南

## 🚀 快速开始

### 方式一: 云服务器快速部署 (推荐)

适合直接在云服务器上部署,会自动安装 Docker。

```bash
# 1. 上传代码到服务器
rsync -avz --exclude='node_modules' \
  --exclude='.next' \
  tarsight-dashboard/ user@your-server:/opt/tarsight-dashboard/

# 2. 连接到服务器
ssh user@your-server

# 3. 进入部署目录
cd /opt/tarsight-dashboard/deployment

# 4. 运行快速部署脚本
chmod +x quick-deploy.sh
./quick-deploy.sh
```

脚本会自动:
- ✅ 检测并安装 Docker
- ✅ 配置环境变量
- ✅ 构建镜像
- ✅ 启动容器

### 方式二: 使用 Docker Compose

适合已经有 Docker 环境的服务器。

```bash
# 1. 配置环境变量
cat > .env << EOF
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EOF

# 2. 构建并启动
docker compose up -d

# 3. 查看状态
docker compose ps
docker logs -f tarsight-dashboard
```

### 方式三: 使用部署脚本

适合在本地或已有 Docker 环境中使用。

```bash
# 确保已有 .env.local 文件
cd tarsight-dashboard
cp .env.local.example .env.local
# 编辑 .env.local 填入你的 Supabase 配置

# 运行部署脚本
cd deployment
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ 环境变量配置

必需的环境变量:

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

获取 Supabase 配置:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制 **Project URL** 和 **anon public key**

## 🌐 访问应用

部署完成后,访问:

```
http://your-server-ip:3000
```

如果配置了域名和 Nginx,访问:

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

# 重新构建镜像
docker compose build

# 更新部署
git pull
docker compose down
docker compose build
docker compose up -d
```

## 🔧 配置选项

### 修改端口

编辑 `docker-compose.yml`:

```yaml
ports:
  - "80:3000"  # 使用 80 端口
```

### 配置 Nginx 反向代理

详见 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)

### 配置 HTTPS

使用 Let's Encrypt:

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

## 📊 资源限制

编辑 `docker-compose.yml` 限制资源使用:

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

# 检查容器状态
docker inspect tarsight-dashboard
```

### 无法访问应用

```bash
# 检查容器是否运行
docker ps | grep tarsight-dashboard

# 检查端口是否监听
sudo netstat -tlnp | grep 3000

# 检查防火墙
sudo ufw status
```

### 环境变量问题

```bash
# 确认 .env 文件内容
cat .env

# 重新构建容器
docker compose down
docker compose up -d
```

## 🔐 安全建议

1. **配置防火墙**
   ```bash
   sudo ufw allow 22/tcp  # SSH
   sudo ufw allow 80/tcp  # HTTP
   sudo ufw allow 443/tcp # HTTPS
   sudo ufw enable
   ```

2. **使用 HTTPS**
   - 配置 SSL 证书
   - 强制 HTTPS 重定向

3. **定期更新**
   ```bash
   # 定期更新 Docker 镜像
   docker compose pull
   docker compose up -d
   ```

4. **备份环境配置**
   ```bash
   cp .env .env.backup
   ```

## 🌍 不同云平台部署

- **阿里云 ECS**: 详见 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md#阿里云-ecs)
- **腾讯云 CVM**: 详见 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md#腾讯云-cvm)
- **AWS EC2**: 详见 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md#aws-ec2)

## 📚 更多文档

- [云服务器部署完整指南](CLOUD_DEPLOYMENT_GUIDE.md)
- [前端项目 README](../README.md)
- [项目主文档](../../README.md)

## 💡 提示

- 首次构建可能需要 5-10 分钟
- 确保服务器至少有 1GB 可用内存
- 生产环境建议配置域名和 HTTPS
- 定期查看日志确保应用正常运行

---

**需要帮助?** 查看 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md) 获取详细指南。
