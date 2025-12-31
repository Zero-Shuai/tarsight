# Tarsight Docker 完整部署指南 - 前端 + 后端

完整的 Docker 容器化部署方案，包含 Next.js 前端和 Python 后端。

## 📋 目录

- [部署架构](#部署架构)
- [前置要求](#前置要求)
- [快速部署](#快速部署)
- [详细配置](#详细配置)
- [访问应用](#访问应用)
- [常用命令](#常用命令)
- [故障排查](#故障排查)
- [更新部署](#更新部署)

## 🏗️ 部署架构

```
┌─────────────────────────────────────────────────────┐
│                  Docker Network                     │
│              (tarsight-network)                     │
│                                                      │
│  ┌──────────────────────────┐  ┌──────────────────┐ │
│  │   Frontend Container     │  │ Backend Container│ │
│  │   (Next.js)              │  │   (Python 3.12)  │ │
│  │                          │  │                  │ │
│  │  - Node.js 20 Alpine     │  │  - Python 3.12   │ │
│  │  - Next.js 14            │  │  - Pytest        │ │
│  │  - Port: 3000            │  │  - Supabase      │ │
│  │                          │  │  - Allure        │ │
│  │  调用 Python 执行测试     │  │                  │ │
│  └──────────────────────────┘  └──────────────────┘ │
│              │                        │              │
│              └────────────────────────┘              │
│                       │                             │
└───────────────────────┼─────────────────────────────┘
                        │
                ┌───────▼────────┐
                │  Supabase Cloud │
                │   (PostgreSQL)  │
                └─────────────────┘
```

## 📦 前置要求

### 服务器要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **CPU**: 2 核心及以上
- **内存**: 4GB 及以上（推荐 8GB）
- **磁盘**: 20GB 及以上可用空间

### 软件要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 添加当前用户到 docker 组（可选）
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker compose version
```

### 国内服务器 - 配置镜像加速（必需）

```bash
# 创建 Docker 配置目录
sudo mkdir -p /etc/docker

# 配置镜像加速器
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# 重启 Docker 服务
sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证配置
docker info | grep -A 10 "Registry Mirrors"
```

## 🚀 快速部署

### 步骤 1: 克隆代码

```bash
# 克隆项目
git clone <your-repository-url> tarsight
cd tarsight
```

### 步骤 2: 配置环境变量

```bash
# 复制环境变量模板
cp docker-compose.env.example .env

# 编辑环境变量
vim .env
```

**必需配置**:

```bash
# Supabase 配置（从 Supabase Dashboard 获取）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API 测试配置
BASE_URL=https://t-stream-iq.tarsv.com
API_TOKEN=your-api-token

# 端口配置（可选）
FRONTEND_PORT=3000
```

### 步骤 3: 启动服务

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看构建和启动日志
docker compose logs -f
```

### 步骤 4: 验证部署

```bash
# 查看容器状态
docker compose ps

# 预期输出:
# NAME                IMAGE                              STATUS
# tarsight-frontend   tarsight-frontend                  running (healthy)
# tarsight-backend    tarsight-backend                   running (healthy)

# 查看前端日志
docker logs tarsight-frontend

# 查看后端日志
docker logs tarsight-backend
```

### 步骤 5: 访问应用

浏览器访问: `http://your-server-ip:3000`

## ⚙️ 详细配置

### 环境变量说明

| 变量名 | 说明 | 是否必需 | 示例值 |
|--------|------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ✅ 必需 | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公开密钥 | ✅ 必需 | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥 | ✅ 必需 | `eyJhbGc...` |
| `NEXT_PUBLIC_PROJECT_ID` | 项目 ID | ❌ 可选 | `8786c21f-...` |
| `BASE_URL` | 测试目标 API URL | ✅ 必需 | `https://api.example.com` |
| `API_TOKEN` | API 访问 Token | ✅ 必需 | `your-token` |
| `FRONTEND_PORT` | 前端端口 | ❌ 可选 | `3000` |
| `LOG_LEVEL` | 日志级别 | ❌ 可选 | `INFO` |

### 获取 Supabase 配置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制以下信息:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ 保密

### 资源限制配置

默认资源限制（可在 `docker-compose.yml` 中调整）:

**前端容器**:
- CPU 限制: 1.0 核心
- 内存限制: 1GB
- CPU 保留: 0.5 核心
- 内存保留: 512MB

**后端容器**:
- CPU 限制: 2.0 核心
- 内存限制: 2GB
- CPU 保留: 0.5 核心
- 内存保留: 512MB

## 🌐 访问应用

### 直接访问

```
http://your-server-ip:3000
```

### 配置域名（推荐）

编辑 `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "80:3000"  # 使用 80 端口
```

重启服务:

```bash
docker compose down
docker compose up -d
```

访问: `http://your-domain.com`

### 配置 Nginx 反向代理

创建 Nginx 配置 `/etc/nginx/sites-available/tarsight`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 日志配置
    access_log /var/log/nginx/tarsight-access.log;
    error_log /var/log/nginx/tarsight-error.log;

    # 前端代理
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

        # 超时配置（测试执行可能需要较长时间）
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

启用站点:

```bash
sudo ln -s /etc/nginx/sites-available/tarsight /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 配置 HTTPS（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 📋 常用命令

### 容器管理

```bash
# 查看容器状态
docker compose ps

# 查看所有日志
docker compose logs

# 查看前端日志
docker logs -f tarsight-frontend

# 查看后端日志
docker logs -f tarsight-backend

# 查看资源使用
docker stats

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 停止并删除数据卷
docker compose down -v
```

### 构建和部署

```bash
# 重新构建镜像
docker compose build --no-cache

# 重新构建并启动
docker compose up -d --build

# 仅重新构建前端
docker compose build frontend
docker compose up -d frontend

# 仅重新构建后端
docker compose build backend
docker compose up -d backend
```

### 进入容器调试

```bash
# 进入前端容器
docker exec -it tarsight-frontend sh

# 进入后端容器
docker exec -it tarsight-backend bash

# 在后端容器中执行测试
docker exec -it tarsight-backend python run.py --help
```

### 数据管理

```bash
# 查看数据卷
docker volume ls | grep tarsight

# 查看数据卷详情
docker volume inspect tarsight_python-code
docker volume inspect tarsight_test-reports

# 备份数据卷
docker run --rm -v tarsight_python-code:/data -v $(pwd):/backup \
    ubuntu tar czf /backup/python-code-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v tarsight_python-code:/data -v $(pwd):/backup \
    ubuntu tar xzf /backup/python-code-backup.tar.gz -C /data
```

## 🔧 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker compose logs frontend
docker compose logs backend

# 检查配置文件
cat .env

# 验证环境变量
docker compose config

# 重新构建
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 前端无法访问

```bash
# 1. 检查容器状态
docker compose ps frontend

# 2. 检查端口监听
netstat -tlnp | grep 3000

# 3. 检查防火墙
sudo ufw status
sudo ufw allow 3000/tcp

# 4. 查看前端日志
docker logs tarsight-frontend

# 5. 测试容器内部
docker exec -it tarsight-frontend wget -O- http://localhost:3000
```

### 后端测试执行失败

```bash
# 1. 检查环境变量
docker exec -it tarsight-backend env | grep SUPABASE

# 2. 测试 Python 环境
docker exec -it tarsight-backend python --version
docker exec -it tarsight-backend pip list | grep pytest

# 3. 手动执行测试
docker exec -it tarsight-backend bash
cd /app
python run.py --help

# 4. 测试 Supabase 连接
docker exec -it tarsight-backend python -c "
from utils.supabase_client import get_client
client = get_client()
print('✅ Supabase 连接成功')
"
```

### 镜像拉取超时

```bash
# 1. 配置镜像加速器（见上面"快速部署"章节）

# 2. 使用国内基础镜像
# 编辑 Dockerfile，将第一行改为:
FROM python:3.12-slim

# 3. 重启 Docker
sudo systemctl restart docker

# 4. 清理缓存重新拉取
docker system prune -a
docker compose build --no-cache
```

### 容器资源不足

```bash
# 查看资源使用
docker stats --no-stream

# 编辑 docker-compose.yml，增加资源限制
# 例如:
# deploy:
#   resources:
#     limits:
#       cpus: '2.0'
#       memory: 4G

# 重启服务
docker compose down
docker compose up -d
```

## 🔄 更新部署

### 更新代码

```bash
# 1. 拉取最新代码
git pull origin master

# 2. 停止服务
docker compose down

# 3. 重新构建并启动
docker compose up -d --build

# 4. 查看日志
docker compose logs -f
```

### 仅更新前端

```bash
# 重新构建前端
docker compose build frontend

# 重启前端
docker compose up -d frontend
```

### 仅更新后端

```bash
# 重新构建后端
docker compose build backend

# 重启后端
docker compose up -d backend
```

### 滚动更新（零停机）

```bash
# 先启动新容器
docker compose up -d --build --no-deps --scale frontend=2

# 等待新容器健康后，停止旧容器
docker compose up -d --no-recreate --scale frontend=1
```

## 📊 监控和维护

### 健康检查

```bash
# 查看健康状态
docker inspect tarsight-frontend | grep -A 5 Health
docker inspect tarsight-backend | grep -A 5 Health

# 手动触发健康检查
docker exec -it tarsight-frontend wget -O- http://localhost:3000
docker exec -it tarsight-backend python -c "import sys; sys.exit(0)"
```

### 日志管理

```bash
# 实时日志
docker logs -f tarsight-frontend
docker logs -f tarsight-backend

# 最近 100 行
docker logs --tail 100 tarsight-frontend

# 带时间戳
docker logs -t tarsight-frontend

# 导出日志
docker logs tarsight-frontend > frontend.log
docker logs tarsight-backend > backend.log
```

### 性能监控

```bash
# 实时资源使用
docker stats

# 查看容器详细信息
docker inspect tarsight-frontend
docker inspect tarsight-backend

# 查看进程
docker exec -it tarsight-frontend ps aux
docker exec -it tarsight-backend ps aux
```

### 备份策略

```bash
# 创建备份脚本
cat > /opt/tarsight/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/tarsight/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份环境变量
cp /opt/tarsight/.env $BACKUP_DIR/.env.$DATE.bak

# 备份数据卷
docker run --rm \
  -v tarsight_python-code:/data \
  -v $BACKUP_DIR:/backup \
  ubuntu tar czf /backup/python-code-$DATE.tar.gz -C /data .

echo "备份完成: $DATE"
ls -lh $BACKUP_DIR
EOF

chmod +x /opt/tarsight/scripts/backup.sh

# 设置定时任务
crontab -e
# 添加: 0 2 * * * /opt/tarsight/scripts/backup.sh
```

## 🔐 安全建议

### 1. 网络安全

```bash
# 配置防火墙
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 2. 容器安全

```bash
# 使用非 root 用户运行（已在 Dockerfile 中配置）
# 定期更新基础镜像
docker compose pull
docker compose up -d

# 扫描漏洞
docker scan tarsight-frontend:latest
docker scan tarsight-backend:latest
```

### 3. 密钥管理

- ✅ 使用 `.env` 文件，不要在代码中硬编码
- ✅ `.env` 文件已添加到 `.gitignore`
- ✅ SERVICE_ROLE_KEY 仅在服务端使用
- ✅ 定期轮换 API Token

### 4. 访问控制

```bash
# 配置 Nginx 基本认证（可选）
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

Nginx 配置添加:
```nginx
auth_basic "Restricted Access";
auth_basic_user_file /etc/nginx/.htpasswd;
```

## 📈 性能优化

### 1. 使用多阶段构建

已在 `Dockerfile` 中实现，减少最终镜像大小。

### 2. 启用 BuildKit

```bash
# 设置环境变量
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 构建镜像
docker compose build
```

### 3. 使用镜像缓存

```bash
# 利用 Docker 层缓存
# Dockerfile 中已将依赖安装在前
# 只有代码变化时才重新构建
```

### 4. 限制日志大小

已在 `docker-compose.yml` 中配置:
```yaml
logging:
  options:
    max-size: "10m"
    max-file: "3"
```

## 💡 提示和最佳实践

### 部署建议

- ✅ 使用国内镜像加速器（国内服务器必需）
- ✅ 首次构建需要 10-15 分钟，请耐心等待
- ✅ 生产环境配置域名和 HTTPS
- ✅ 定期查看日志和监控资源使用
- ✅ 设置自动备份策略
- ✅ 使用 `.env` 文件管理配置

### 维护建议

- 🔄 代码更新后需要重新构建镜像
- 📊 定期检查容器健康状态
- 🧹 定期清理未使用的镜像和容器: `docker system prune -a`
- 📝 记录重要的配置和变更
- 🚨 设置监控告警

### 故障处理建议

- 🔍 优先查看容器日志: `docker logs`
- 🔧 使用 `docker compose config` 验证配置
- 🧪 使用 `docker exec -it` 进入容器调试
- 💾 出现问题时先备份再操作
- 📚 参考文档: [故障排查索引](../troubleshooting/INDEX.md)

## 🆘 获取帮助

### 文档资源

- **[完整部署指南](UBUNTU_DEPLOYMENT.md)** - 详细的手动部署指南
- **[故障排查索引](../troubleshooting/INDEX.md)** - 常见问题解决
- **[项目主文档](../../README.md)** - 项目总览
- **[架构分析](../architecture/ARCHITECTURE_REVIEW.md)** - 了解系统架构

### 常用资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)

---

**最后更新**: 2025-12-31
**版本**: 1.0
**维护**: Tarsight Team
