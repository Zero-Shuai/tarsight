# Tarsight Dashboard 云服务器部署指南

本指南介绍如何将 Tarsight Dashboard 前端部署到云服务器上。

## 📋 前置要求

### 云服务器要求
- **操作系统**: Linux (推荐 Ubuntu 20.04+ 或 CentOS 7+)
- **CPU**: 最低 1 核
- **内存**: 最低 1GB (推荐 2GB+)
- **磁盘**: 最低 10GB
- **网络**: 开放 3000 端口（或自定义端口）

### 本地要求
- Git 客户端
- SSH 访问云服务器

## 🚀 部署步骤

### 方式一: 使用部署脚本 (推荐)

#### 1. 准备环境变量文件

在本地确保你有正确的环境变量配置:

```bash
cd tarsight-dashboard
cp .env.local.example .env.local
```

编辑 `.env.local` 文件:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

获取这些值:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings → API
4. 复制 Project URL 和 anon public key

#### 2. 上传代码到服务器

```bash
# 方式 A: 使用 rsync (推荐)
rsync -avz --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env.local' \
  tarsight-dashboard/ user@your-server-ip:/opt/tarsight-dashboard/

# 方式 B: 使用 scp
scp -r tarsight-dashboard user@your-server-ip:/opt/

# 方式 C: 在服务器上 git clone
ssh user@your-server-ip
cd /opt
git clone your-repo-url tarsight-dashboard
```

#### 3. 连接到服务器

```bash
ssh user@your-server-ip
cd /opt/tarsight-dashboard/deployment
```

#### 4. 配置环境变量

```bash
# 在服务器上创建 .env 文件
cat > .env << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF
```

#### 5. 运行部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

### 方式二: 手动部署

#### 1. 安装 Docker

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt-get update

# 安装必要的包
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg

# 添加 Docker 官方 GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 验证安装
docker --version
```

**CentOS/RHEL:**
```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

#### 2. 配置环境变量

```bash
cd /opt/tarsight-dashboard/deployment

# 创建 .env 文件
cat > .env << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF
```

#### 3. 构建并启动容器

```bash
# 构建镜像
docker compose build

# 启动容器
docker compose up -d

# 查看状态
docker compose ps
```

## 🔧 配置选项

### 修改端口

如果需要使用其他端口（如 80 端口）:

编辑 `docker-compose.yml`:

```yaml
ports:
  - "80:3000"  # 将容器的 3000 端口映射到主机的 80 端口
```

### 配置域名访问

#### 使用 Nginx 反向代理

**安装 Nginx:**
```bash
sudo apt-get install -y nginx
```

**配置 Nginx:**
```bash
sudo nano /etc/nginx/sites-available/tarsight-dashboard
```

添加以下配置:
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

启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/tarsight-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 配置 HTTPS (使用 Let's Encrypt)

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 📊 监控和管理

### 查看日志

```bash
# 查看容器日志
docker logs -f tarsight-dashboard

# 查看最近 100 行日志
docker logs --tail 100 tarsight-dashboard
```

### 容器管理

```bash
# 停止容器
docker compose down

# 重启容器
docker compose restart

# 查看状态
docker compose ps

# 查看资源使用
docker stats tarsight-dashboard
```

### 更新部署

```bash
cd /opt/tarsight-dashboard

# 拉取最新代码
git pull

# 重新构建并启动
cd deployment
docker compose down
docker compose build
docker compose up -d
```

## 🔐 安全建议

### 1. 配置防火墙

**使用 ufw (Ubuntu):**
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

**使用 firewalld (CentOS):**
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 限制容器资源

编辑 `docker-compose.yml`:

```yaml
services:
  tarsight-dashboard:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 3. 定期备份数据

虽然前端不存储数据，但建议备份环境配置:

```bash
# 创建备份脚本
cat > /opt/backup-tarsight.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/tarsight"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /opt/tarsight-dashboard/deployment/.env $BACKUP_DIR/.env.$DATE
# 保留最近 30 天的备份
find $BACKUP_DIR -name "*.env.*" -mtime +30 -delete
EOF

chmod +x /opt/backup-tarsight.sh

# 添加到 crontab (每天凌晨 2 点执行)
echo "0 2 * * * /opt/backup-tarsight.sh" | sudo crontab -
```

## 🌐 常见云平台部署

### 阿里云 ECS

1. **购买 ECS 实例**
   - 镜像: Ubuntu 20.04
   - 规格: 1核2GB (按量付费)
   - 网络: VPC, 分配公网 IP

2. **配置安全组**
   - 入方向: 允许 80/443 端口
   - 入方向: 允许 22 端口 (SSH)

3. **部署应用**
   ```bash
   ssh root@your-eip
   # 按照上述步骤安装 Docker 和部署
   ```

### 腾讯云 CVM

1. **购买 CVM 实例**
   - 镜像: Ubuntu 20.04
   - 规格: 1核2GB
   - 网络: 按带宽计费

2. **配置安全组**
   - 入站规则: HTTP(80), HTTPS(443), SSH(22)

3. **部署应用**
   ```bash
   ssh root@your-ip
   # 部署步骤同上
   ```

### AWS EC2

1. **启动 EC2 实例**
   - AMI: Ubuntu Server 20.04 LTS
   - Instance Type: t2.micro (免费套餐)
   - 配置 Security Group

2. **配置 Security Group**
   - Inbound Rules:
     - HTTP (80) from 0.0.0.0/0
     - HTTPS (443) from 0.0.0.0/0
     - SSH (22) from your IP

3. **部署应用**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   # 部署步骤同上
   ```

## 🐛 故障排查

### 容器无法启动

```bash
# 查看容器日志
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

### 环境变量未生效

```bash
# 检查 .env 文件
cat deployment/.env

# 重启容器
docker compose down
docker compose up -d
```

## 📝 部署检查清单

部署前检查:
- [ ] 已准备 Supabase 项目
- [ ] 已获取 SUPABASE_URL 和 SUPABASE_ANON_KEY
- [ ] 云服务器已购买并可 SSH 连接
- [ ] 服务器防火墙已配置
- [ ] 域名已解析到服务器 IP (可选)

部署后检查:
- [ ] 容器正常运行 (`docker ps`)
- [ ] 可以通过 IP:端口访问应用
- [ ] 域名可以访问 (如果配置了)
- [ ] HTTPS 证书正常 (如果配置了)
- [ ] 日志无错误信息

## 🎯 快速部署命令汇总

```bash
# 一键部署 (在服务器上执行)
cd /opt/tarsight-dashboard/deployment
chmod +x deploy.sh
./deploy.sh

# 查看状态
docker ps
docker logs -f tarsight-dashboard

# 访问应用
# http://your-server-ip:3000
```

## 📞 技术支持

如果遇到问题:
1. 查看容器日志: `docker logs tarsight-dashboard`
2. 检查 [Next.js 官方文档](https://nextjs.org/docs/deployment)
3. 查看项目文档: [tarsight-dashboard/README.md](../README.md)

---

**最后更新**: 2025-12-30
