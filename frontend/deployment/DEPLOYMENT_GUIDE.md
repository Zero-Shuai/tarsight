# Tarsight Dashboard Docker 部署指南

基于实际部署经验优化，包含常见问题和解决方案。

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 服务器: 1GB+ RAM, 10GB+ 磁盘
- Supabase 项目（用于环境变量）

## 🚀 快速部署（推荐）

### 1. 准备环境变量

```bash
cd /opt/tarsight/tarsight-dashboard/deployment

# 创建 .env 文件
cat > .env << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EOF
```

**获取 Supabase 配置:**
1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制 **Project URL** 和 **anon public key**

### 2. 配置 Docker 镜像加速（国内服务器必需）

```bash
# 创建 Docker 配置
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

# 重启 Docker
systemctl daemon-reload
systemctl restart docker

# 验证配置
docker info | grep -A 5 "Registry Mirrors"
```

### 3. 构建并启动

```bash
# 构建镜像（首次需要 5-10 分钟）
docker compose build

# 启动容器
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker logs -f tarsight-dashboard
```

### 4. 验证部署

访问: `http://your-server-ip:3000`

## ⚠️ 常见问题及解决方案

### 问题 1: Docker 无法拉取镜像（timeout）

**错误信息:**
```
failed to resolve source metadata for docker.io/library/node:20-alpine:
dial tcp 128.242.245.221:443: i/o timeout
```

**解决方案:**
配置国内镜像加速器（见上面的"配置 Docker 镜像加速"部分）

### 问题 2: npm ci 失败 - 找不到 package-lock.json

**错误信息:**
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

**解决方案:**
已修复 - Dockerfile 现在使用 `npm install` 而不是 `npm ci`

### 问题 3: Next.js 构建失败 - 缺少 Supabase 环境变量

**错误信息:**
```
Error: Your project's URL and Key are required to create a Supabase client!
```

**解决方案:**
1. 确保 `.env` 文件包含正确的 Supabase 配置
2. Dockerfile 现在接受构建参数（ARG），在构建时注入环境变量
3. docker-compose.yml 正确传递构建参数

### 问题 4: 脚本行结束符错误（Windows）

**错误信息:**
```
./quick-deploy.sh: cannot execute: required file not found
```

**解决方案:**
```bash
# 转换行结束符
sed -i 's/\r$//' quick-deploy.sh

# 或直接使用 bash 运行
bash quick-deploy.sh
```

**更推荐直接使用 docker-compose 命令，不依赖脚本:**
```bash
docker compose up -d --build
```

### 问题 5: Git 克隆需要认证

**错误信息:**
```
Password authentication is not supported for Git operations
```

**解决方案:**

**方式 1: 使用 HTTPS 克隆公开仓库**
```bash
git clone https://github.com/Zero-Shuai/tarsight.git
```

**方式 2: 配置 SSH 密钥**
```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "root@server" -f ~/.ssh/id_ed25519 -N ""

# 查看公钥
cat ~/.ssh/id_ed25519.pub

# 复制公钥到 GitHub: https://github.com/settings/keys

# 使用 SSH 克隆
git clone git@github.com:Zero-Shuai/tarsight.git
```

## 🔧 高级配置

### 修改端口

编辑 `docker-compose.yml`:
```yaml
ports:
  - "80:3000"  # 将 80 端口映射到容器的 3000 端口
```

### 资源限制

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

### 配置域名和 HTTPS

详见 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)

## 📊 监控和维护

### 查看日志

```bash
# 实时日志
docker logs -f tarsight-dashboard

# 最近 100 行
docker logs --tail 100 tarsight-dashboard
```

### 容器管理

```bash
# 查看状态
docker compose ps

# 停止
docker compose down

# 重启
docker compose restart

# 查看资源使用
docker stats tarsight-dashboard
```

### 更新部署

```bash
cd /opt/tarsight
git pull
cd tarsight-dashboard/deployment
docker compose down
docker compose build
docker compose up -d
```

## 🔐 安全建议

1. **配置防火墙**
   ```bash
   ufw allow 22/tcp   # SSH
   ufw allow 80/tcp   # HTTP
   ufw allow 443/tcp  # HTTPS
   ufw enable
   ```

2. **使用非 root 用户运行 Docker**
   ```bash
   # 添加用户到 docker 组
   usermod -aG docker your-user
   ```

3. **定期更新镜像**
   ```bash
   docker compose pull
   docker compose up -d
   ```

4. **备份环境配置**
   ```bash
   cp .env .env.backup
   ```

## 📝 部署检查清单

部署前:
- [ ] 已获取 Supabase URL 和 Anon Key
- [ ] 已创建 `.env` 文件
- [ ] 已配置 Docker 镜像加速（国内服务器）
- [ ] 服务器防火墙已配置

部署后:
- [ ] 容器正常运行 (`docker ps`)
- [ ] 可以通过 IP:端口访问
- [ ] 日志无错误信息
- [ ] 健康检查通过

## 🆘 获取帮助

如果遇到问题:
1. 查看容器日志: `docker logs tarsight-dashboard`
2. 检查环境变量: `cat .env`
3. 验证 Supabase 配置是否正确
4. 查看 [故障排查文档](TROUBLESHOOTING.md)

## 📚 相关文档

- [云服务器完整部署指南](CLOUD_DEPLOYMENT_GUIDE.md)
- [故障排查指南](TROUBLESHOOTING.md)
- [前端项目 README](../README.md)
- [项目主文档](../../README.md)

---

**最后更新**: 2025-12-31
**基于实际部署经验优化**
