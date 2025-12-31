# Tarsight Ubuntu 部署指南

完整的 Ubuntu 服务器部署指南，涵盖前端、后端和数据库配置。

## 📋 目录

- [系统要求](#系统要求)
- [前置准备](#前置准备)
- [方案一：Docker 部署（推荐）](#方案一docker-部署推荐)
- [方案二：手动部署](#方案二手动部署)
- [生产环境优化](#生产环境优化)
- [监控和维护](#监控和维护)
- [故障排查](#故障排查)

## 系统要求

### 硬件要求

- **CPU**: 2 核心及以上
- **内存**: 4GB 及以上（推荐 8GB）
- **磁盘**: 20GB 及以上可用空间

### 软件要求

- **操作系统**: Ubuntu 20.04 LTS / 22.04 LTS
- **Node.js**: 18.x 或更高
- **Python**: 3.10 或更高
- **数据库**: Supabase Cloud（推荐）或自建 PostgreSQL
- **Web 服务器**: Nginx（可选但推荐）

## 前置准备

### 1. 更新系统

```bash
# 更新包管理器
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim ufw
```

### 2. 配置防火墙

```bash
# 启用防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许应用端口（开发模式）
sudo ufw allow 3000/tcp

# 查看状态
sudo ufw status
```

### 3. 创建部署用户

```bash
# 创建专用用户（可选但推荐）
sudo adduser tarsight
sudo usermod -aG sudo tarsight

# 切换到部署用户
su - tarsight
```

## 方案一：Docker 部署（推荐）

### 优势

- 环境隔离，避免依赖冲突
- 部署快速，一键启动
- 易于维护和迁移
- 支持容器编排（Kubernetes）

### 1. 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 添加当前用户到 docker 组（免 sudo）
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker

# 验证安装
docker --version
```

### 2. 创建项目目录

```bash
# 克隆项目
cd ~
git clone <your-repository-url> tarsight
cd tarsight
```

### 3. 创建 Docker Compose 配置

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Next.js 前端
  frontend:
    build:
      context: ./tarsight-dashboard
      dockerfile: Dockerfile
    container_name: tarsight-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_PROJECT_ID=${PROJECT_ID}
      - PROJECT_ROOT=/app/supabase_version
      - PYTHON_PATH=/usr/bin/python3
    volumes:
      - ./tarsight-dashboard:/app
      - /app/node_modules
      - ./supabase_version:/app/supabase_version
    networks:
      - tarsight-network

  # Python 后端（如果需要独立运行）
  backend:
    build:
      context: ./supabase_version
      dockerfile: Dockerfile
    container_name: tarsight-backend
    restart: unless-stopped
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - BASE_URL=${BASE_URL}
      - API_TOKEN=${API_TOKEN}
    volumes:
      - ./supabase_version:/app
    networks:
      - tarsight-network

networks:
  tarsight-network:
    driver: bridge
```

### 4. 创建前端 Dockerfile

创建 `tarsight-dashboard/Dockerfile`:

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY .npmrc* ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:18-alpine AS runner

WORKDIR /app

# 安装 Python（用于执行测试）
RUN apk add --no-cache python3 py3-pip

# 复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

### 5. 创建后端 Dockerfile

创建 `supabase_version/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY pyproject.toml ./

# 安装 uv（快速的 Python 包管理器）
RUN pip install --no-cache-dir uv

# 安装 Python 依赖
RUN uv pip install --system -r pyproject.toml

# 复制源代码
COPY . .

# 创建报告目录
RUN mkdir -p reports

# 暴露端口（如果需要 API 服务）
# EXPOSE 8000

# 默认命令
CMD ["python", "run.py"]
```

### 6. 配置环境变量

```bash
# 复制环境变量模板
cp tarsight-dashboard/.env.example .env
cp supabase_version/.env.example supabase_version/.env

# 编辑环境变量
vim .env
```

### 7. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

### 8. 配置 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建站点配置
sudo vim /etc/nginx/sites-available/tarsight
```

添加以下配置:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 日志配置
    access_log /var/log/nginx/tarsight-access.log;
    error_log /var/log/nginx/tarsight-error.log;

    # 反向代理到 Next.js
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
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
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/tarsight /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 方案二：手动部署

### 1. 安装 Node.js

```bash
# 使用 NodeSource 仓库安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装 Python

```bash
# 安装 Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# 验证安装
python3.11 --version

# 创建软链接（可选）
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
```

### 3. 安装 PM2（进程管理器）

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 --version
```

### 4. 克隆项目

```bash
# 克隆代码
cd ~
git clone <your-repository-url> tarsight
cd tarsight
```

### 5. 部署前端

```bash
# 进入前端目录
cd tarsight-dashboard

# 安装依赖
npm install

# 构建生产版本
npm run build

# 配置环境变量
cp .env.example .env.local
vim .env.local

# 使用 PM2 启动
pm2 start npm --name "tarsight-frontend" -- start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 6. 部署后端

```bash
# 返回项目根目录
cd ~/tarsight

# 进入后端目录
cd supabase_version

# 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 安装 uv
pip install uv

# 安装依赖
uv pip install -r pyproject.toml

# 配置环境变量
cp .env.example .env
vim .env

# 测试运行
python run.py --help

# 使用 PM2 启动（如果需要独立后端服务）
# pm2 start python --name "tarsight-backend" -- run.py
```

### 7. 配置 Nginx

参考 Docker 部署方案中的 Nginx 配置部分。

## 生产环境优化

### 1. 配置 HTTPS（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期（已自动配置）
sudo certbot renew --dry-run
```

### 2. 配置自动重启

使用 PM2 的生态系统文件:

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'tarsight-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/tarsight/tarsight-dashboard',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/tarsight-frontend-error.log',
      out_file: '/var/log/pm2/tarsight-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
        max_memory_restart: '1G'
      }
    }
  ]
}
```

启动:

```bash
# 创建日志目录
sudo mkdir -p /var/log/pm2
sudo chown -R tarsight:tarsight /var/log/pm2

# 使用配置文件启动
pm2 start ecosystem.config.js

# 保存配置
pm2 save
```

### 3. 数据库优化

#### Supabase Cloud（推荐）

无需额外配置，Supabase 提供自动备份和高可用性。

#### 自建 PostgreSQL

如果使用自建数据库:

```bash
# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 配置远程访问
sudo vim /etc/postgresql/14/main/postgresql.conf
```

修改配置:

```ini
listen_addresses = '*'
```

配置权限:

```bash
sudo vim /etc/postgresql/14/main/pg_hba.conf
```

添加:

```ini
host    all    all    0.0.0.0/0    md5
```

重启服务:

```bash
sudo systemctl restart postgresql
```

### 4. 日志管理

```bash
# 配置 logrotate
sudo vim /etc/logrotate.d/tarsight
```

添加配置:

```
/var/log/pm2/*.log
{
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
}
```

### 5. 备份策略

```bash
# 创建备份脚本
vim ~/tarsight/scripts/backup.sh
```

添加内容:

```bash
#!/bin/bash

BACKUP_DIR="/home/tarsight/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份环境变量
cp ~/tarsight/tarsight-dashboard/.env.local $BACKUP_DIR/env.frontend.$DATE.bak
cp ~/tarsight/supabase_version/.env $BACKUP_DIR/env.backend.$DATE.bak

# 备份数据库（如果使用 Supabase，使用 Supabase 的备份功能）
# pg_dump -h localhost -U username -d tarsight > $BACKUP_DIR/db_$DATE.sql

# 保留最近 7 天的备份
find $BACKUP_DIR -name "*.bak" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
```

设置定时任务:

```bash
chmod +x ~/tarsight/scripts/backup.sh

# 添加到 crontab
crontab -e

# 每天凌晨 2 点执行备份
0 2 * * * /home/tarsight/tarsight/scripts/backup.sh
```

## 监控和维护

### 1. 系统监控

安装监控工具:

```bash
# 安装 htop
sudo apt install -y htop

# 安装 net-tools
sudo apt install -y net-tools

# 监控资源使用
htop
```

### 2. PM2 监控

```bash
# 实时监控
pm2 monit

# 查看日志
pm2 logs tarsight-frontend

# 查看状态
pm2 status

# 重启服务
pm2 restart tarsight-frontend
```

### 3. 日志查看

```bash
# Nginx 日志
sudo tail -f /var/log/nginx/tarsight-access.log
sudo tail -f /var/log/nginx/tarsight-error.log

# PM2 日志
pm2 logs

# 系统日志
sudo journalctl -u nginx -f
```

### 4. 性能监控（可选）

```bash
# 安装 Node.js 监控
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 故障排查

### 前端无法访问

```bash
# 1. 检查 PM2 状态
pm2 status

# 2. 检查 Nginx 状态
sudo systemctl status nginx

# 3. 检查端口占用
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :80

# 4. 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

### Python 测试执行失败

```bash
# 1. 检查 Python 环境
cd ~/tarsight/supabase_version
source .venv/bin/activate
python --version

# 2. 手动测试
python run.py --help

# 3. 检查环境变量
cat .env

# 4. 查看错误日志
pm2 logs tarsight-frontend --err
```

### 数据库连接问题

```bash
# 1. 测试 Supabase 连接
curl -I https://your-project.supabase.co

# 2. 检查环境变量配置
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# 3. 查看应用日志
pm2 logs
```

### Docker 容器问题

```bash
# 查看容器日志
docker-compose logs -f frontend

# 重启容器
docker-compose restart frontend

# 重建容器
docker-compose up -d --build

# 进入容器调试
docker exec -it tarsight-frontend sh
```

### 性能问题

```bash
# 1. 检查系统资源
htop
df -h
free -h

# 2. 检查 Node.js 内存
pm2 monit

# 3. 启用 PM2 集群模式
pm2 delete tarsight-frontend
pm2 start npm --name "tarsight-frontend" -i max -- start
pm2 save
```

## 更新部署

### Docker 部署更新

```bash
cd ~/tarsight

# 拉取最新代码
git pull origin main

# 重建并重启
docker-compose down
docker-compose up -d --build

# 查看日志
docker-compose logs -f
```

### 手动部署更新

```bash
cd ~/tarsight

# 拉取最新代码
git pull origin main

# 更新前端
cd tarsight-dashboard
npm install
npm run build
pm2 restart tarsight-frontend

# 更新后端
cd ~/tarsight/supabase_version
source .venv/bin/activate
uv pip install -r pyproject.toml
```

## 安全建议

1. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **配置 Fail2Ban（防暴力破解）**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   ```

3. **限制 SSH 访问**
   ```bash
   sudo vim /etc/ssh/sshd_config

   # 禁用密码登录，仅允许密钥
   PasswordAuthentication no
   PubkeyAuthentication yes

   # 重启 SSH
   sudo systemctl restart sshd
   ```

4. **定期备份**（参考备份策略部分）

5. **监控异常访问**
   ```bash
   sudo tail -f /var/log/auth.log
   ```

## 总结

### 推荐方案对比

| 特性 | Docker 部署 | 手动部署 |
|------|------------|---------|
| 部署难度 | ⭐⭐ 简单 | ⭐⭐⭐⭐ 较难 |
| 环境隔离 | ✅ 完全隔离 | ❌ 共享环境 |
| 资源占用 | ⭐⭐⭐ 较高 | ⭐⭐ 较低 |
| 迁移性 | ⭐⭐⭐⭐⭐ 极好 | ⭐⭐ 一般 |
| 维护成本 | ⭐⭐ 低 | ⭐⭐⭐⭐ 较高 |

### 快速启动检查清单

- [ ] 系统已更新
- [ ] 防火墙已配置
- [ ] Docker/Node.js/Python 已安装
- [ ] 项目已克隆
- [ ] 环境变量已配置
- [ ] 服务已启动
- [ ] Nginx 已配置
- [ ] HTTPS 已启用
- [ ] 监控已配置
- [ ] 备份策略已设置

### 下一步

- 查看 [快速参考](../architecture/QUICK_REFERENCE.md) 了解常用命令
- 参考 [架构分析](../architecture/ARCHITECTURE_REVIEW.md) 优化系统
- 查看 [故障排查索引](../troubleshooting/INDEX.md) 解决常见问题

---

**部署支持**: 如遇到问题，请查看 [故障排查](../troubleshooting/) 文档或提交 Issue。
