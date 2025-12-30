# Docker 部署指南

本文档介绍如何使用 Docker 部署 Tarsight Dashboard 到服务器。

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+（可选，用于简化部署）
- 服务器至少 1GB 内存

## 快速部署

### 方法 1: 使用部署脚本（推荐）

1. **确保 `.env.local` 文件存在并配置正确**

```bash
cd /Users/zhangshuai/WorkSpace/Tarsight/tarsight-dashboard
```

检查 `.env.local` 文件内容：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_PROJECT_ID=your_project_id
```

2. **运行部署脚本**

```bash
./deploy.sh
```

脚本会自动：
- 检查 Docker 环境
- 创建 `.env` 文件
- 构建 Docker 镜像
- 启动容器

3. **访问应用**

访问 `http://your-server-ip:3000`

---

### 方法 2: 手动使用 Docker Compose

1. **准备环境变量文件**

```bash
# 如果使用 .env.local，复制一份为 .env
cp .env.local .env
```

2. **构建并启动**

```bash
# 构建镜像
docker compose build

# 启动服务（后台运行）
docker compose up -d

# 查看日志
docker compose logs -f
```

3. **停止服务**

```bash
docker compose down
```

---

### 方法 3: 使用纯 Docker 命令

1. **构建镜像**

```bash
docker build -t tarsight-dashboard:latest .
```

2. **运行容器**

```bash
docker run -d \
  --name tarsight-dashboard \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
  -e NEXT_PUBLIC_PROJECT_ID=your_project_id \
  --restart unless-stopped \
  tarsight-dashboard:latest
```

3. **查看日志**

```bash
docker logs -f tarsight-dashboard
```

---

## 部署到生产服务器

### 1. 上传代码到服务器

```bash
# 在本地打包项目（排除 node_modules）
tar -czf tarsight-dashboard.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  .

# 上传到服务器
scp tarsight-dashboard.tar.gz user@your-server:/path/to/deploy/

# 在服务器上解压
ssh user@your-server
cd /path/to/deploy
tar -xzf tarsight-dashboard.tar.gz
```

### 2. 在服务器上配置环境变量

```bash
# 创建 .env 文件
cat > .env << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_PROJECT_ID=your_project_id
EOF
```

### 3. 在服务器上运行部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 配置反向代理（Nginx）

如果需要使用域名和 HTTPS，建议配置 Nginx 反向代理。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 配置 HTTPS（使用 Let's Encrypt）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 常用运维命令

### 查看容器状态

```bash
docker ps
docker compose ps
```

### 查看日志

```bash
# 实时日志
docker logs -f tarsight-dashboard

# 最近 100 行日志
docker logs --tail 100 tarsight-dashboard
```

### 进入容器

```bash
docker exec -it tarsight-dashboard sh
```

### 重启服务

```bash
docker restart tarsight-dashboard
# 或
docker compose restart
```

### 停止并删除容器

```bash
docker stop tarsight-dashboard
docker rm tarsight-dashboard
# 或
docker compose down
```

### 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
docker compose build

# 3. 重启容器
docker compose up -d
```

---

## 监控和健康检查

容器已配置健康检查，每 30 秒检查一次应用状态。

查看健康状态：

```bash
docker inspect --format='{{.State.Health.Status}}' tarsight-dashboard
```

---

## 性能优化建议

### 1. 镜像优化

Dockerfile 已采用多阶段构建：
- 使用 `node:20-alpine` 基础镜像（体积小）
- 分离构建和运行环境
- 只复制必要的文件

### 2. 运行时优化

- 设置 `NODE_ENV=production`
- 使用 Next.js standalone 模式（已在 `next.config.js` 中配置）
- 非 root 用户运行（提高安全性）

### 3. 资源限制

可以在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  tarsight-dashboard:
    # ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker logs tarsight-dashboard

# 检查端口占用
sudo netstat -tlnp | grep 3000
```

### 环境变量未生效

确保 `.env` 文件存在且格式正确：

```bash
cat .env
docker compose config
```

### 应用无法连接 Supabase

1. 检查环境变量是否正确
2. 确认 Supabase 项目的 RLS 策略
3. 检查服务器网络和防火墙设置

---

## 安全建议

1. **不要提交 `.env` 文件到版本控制**
   - `.gitignore` 已包含此规则

2. **使用 secrets 管理敏感信息**
   - Docker Swarm secrets
   - Kubernetes secrets
   - 第三方密钥管理服务

3. **定期更新基础镜像**
   ```bash
   docker pull node:20-alpine
   docker compose build --no-cache
   ```

4. **限制容器资源**
   - 防止资源耗尽攻击

5. **配置防火墙**
   - 只开放必要的端口
   - 使用 fail2ban 防止暴力破解

---

## 备份和恢复

### 备份部署文件

```bash
tar -czf tarsight-dashboard-backup-$(date +%Y%m%d).tar.gz \
  docker-compose.yml \
  Dockerfile \
  .env \
  deploy.sh
```

### 恢复部署

```bash
tar -xzf tarsight-dashboard-backup-YYYYMMDD.tar.gz
./deploy.sh
```

---

## 支持

如有问题，请检查：
1. Docker 日志
2. 容器健康状态
3. 环境变量配置
4. 网络连接
