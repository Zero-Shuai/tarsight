# Ubuntu 部署补充指南 - 已部署前端

针对已部署前端的情况，配置 Python 测试执行环境。

## 当前环境信息

- **项目路径**: `/opt/tarsight`
- **Python 版本**: 3.12.3 ✅
- **用户**: tarsight
- **前端状态**: 已部署

## 快速配置步骤

### 1. 上传配置脚本到服务器

在本地 Mac 执行:

```bash
# 方法1: 使用 scp
scp /Users/zhangshuai/WorkSpace/Tarsight/scripts/setup_python_env.sh tarsight@your-server-ip:/tmp/

# 方法2: 直接在服务器上创建
ssh tarsight@your-server-ip
# 然后手动创建文件
```

### 2. 在服务器上执行配置

```bash
# SSH 登录服务器
ssh tarsight@your-server-ip

# 执行配置脚本
cd /opt/tarsight
bash /tmp/setup_python_env.sh

# 或者手动执行以下步骤
```

### 3. 手动配置步骤（如果脚本不可用）

#### 3.1 创建 Python 虚拟环境

```bash
cd /opt/tarsight/supabase_version

# 创建虚拟环境
python3 -m venv .venv

# 激活虚拟环境
source .venv/bin/activate
```

#### 3.2 安装依赖

```bash
# 升级 pip
pip install --upgrade pip

# 安装 uv（快速包管理器）
pip install uv

# 安装项目依赖
uv pip install --system -r pyproject.toml
```

#### 3.3 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

必须配置的变量:

```bash
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 项目配置
TARGET_PROJECT=your-project-id

# API 测试配置
BASE_URL=https://t-stream-iq.tarsv.com
API_TOKEN=your-api-token

# 数据源
DATA_SOURCE=supabase
```

#### 3.4 创建报告目录

```bash
mkdir -p reports
mkdir -p reports/allure-results
```

#### 3.5 测试 Python 环境

```bash
# 确保在虚拟环境中
source .venv/bin/activate

# 测试运行
python run.py --help
```

如果看到帮助信息，说明环境配置成功！

### 4. 配置前端环境变量

前端需要知道 Python 环境的位置，以便执行测试。

```bash
cd /opt/tarsight/tarsight-dashboard

# 编辑环境变量文件
vim .env.local
```

添加或修改以下内容:

```bash
# Python 项目根目录（绝对路径）
PROJECT_ROOT=/opt/tarsight/supabase_version

# Python 解释器路径（虚拟环境中的 Python）
PYTHON_PATH=/opt/tarsight/supabase_version/.venv/bin/python
```

### 5. 重启前端服务

```bash
# 如果使用 PM2
pm2 restart tarsight-frontend

# 查看日志
pm2 logs tarsight-frontend
```

## 验证部署

### 1. 检查 Python 环境

```bash
cd /opt/tarsight/supabase_version
source .venv/bin/activate

# 检查 Python 版本
python --version
# 应该显示: Python 3.12.3

# 检查已安装的包
pip list | grep -E "(pytest|supabase|allure)"
```

### 2. 测试数据库连接

```bash
# 在虚拟环境中执行
python -c "
from utils.supabase_client import get_client
client = get_client()
print('✅ Supabase 连接成功！')
"
```

### 3. 在前端界面测试执行

1. 打开浏览器访问您的服务器地址
2. 进入测试用例页面
3. 选择一个测试用例
4. 点击执行按钮
5. 观察是否正常执行

## 常见问题

### Q1: 执行测试时报错 "python: not found"

**原因**: 前端找不到 Python 解释器

**解决方案**:

1. 检查 `.env.local` 中的 `PYTHON_PATH` 是否正确
2. 确保路径使用绝对路径: `/opt/tarsight/supabase_version/.venv/bin/python`
3. 检查文件是否存在: `ls -la /opt/tarsight/supabase_version/.venv/bin/python`
4. 重启前端服务: `pm2 restart tarsight-frontend`

### Q2: 执行测试时报错 "Permission denied"

**原因**: 文件权限问题

**解决方案**:

```bash
# 确保所有文件属于 tarsight 用户
sudo chown -R tarsight:tarsight /opt/tarsight

# 确保虚拟环境有执行权限
chmod +x /opt/tarsight/supabase_version/.venv/bin/python
```

### Q3: 执行测试时卡住不动

**原因**: 可能是 Supabase 连接问题或 API 请求超时

**解决方案**:

1. 检查 Supabase 配置是否正确
2. 检查 `BASE_URL` 是否可访问
3. 查看 PM2 日志: `pm2 logs tarsight-frontend`
4. 测试手动执行:

```bash
cd /opt/tarsight/supabase_version
source .venv/bin/activate
python run.py --case-ids <test-case-id>
```

### Q4: 依赖安装失败

**原因**: 网络问题或 Python 版本不兼容

**解决方案**:

```bash
# 使用国内镜像源
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple uv

# 或修改 uv 配置
mkdir -p ~/.config/uv
echo "[global]"
echo "index-url = https://pypi.tuna.tsinghua.edu.cn/simple" > ~/.config/uv/uv.toml
```

### Q5: Nginx 504 Gateway Timeout

**原因**: 测试执行时间超过 Nginx 超时限制

**解决方案**:

编辑 Nginx 配置:

```bash
sudo vim /etc/nginx/sites-available/tarsight
```

增加超时设置:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_read_timeout 600s;      # 10分钟
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
}
```

重启 Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 性能优化

### 1. 使用 PM2 集群模式

```bash
# 停止单进程模式
pm2 delete tarsight-frontend

# 启动集群模式（根据 CPU 核心数）
pm2 start npm --name "tarsight-frontend" -i max -- start

# 保存配置
pm2 save
```

### 2. 配置日志轮转

```bash
# 安装 logrotate
pm2 install pm2-logrotate

# 配置日志大小
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 3. 优化 Python 执行

编辑 `/opt/tarsight/supabase_version/.env`:

```bash
# 减少日志级别
LOG_LEVEL=WARNING

# 如果不需要 Allure 报告，可以禁用
# ALLURE_RESULTS_DIR=/dev/null
```

## 监控和维护

### 每日检查脚本

创建 `/opt/tarsight/scripts/daily_check.sh`:

```bash
#!/bin/bash

echo "=== Tarsight 每日检查 ==="
echo "时间: $(date)"

# 检查磁盘空间
echo ""
echo "磁盘使用情况:"
df -h | grep -E "Filesystem|/$"

# 检查内存
echo ""
echo "内存使用情况:"
free -h

# 检查 PM2 状态
echo ""
echo "PM2 状态:"
pm2 status

# 检查最近的错误日志
echo ""
echo "最近的错误日志 (最近10条):"
pm2 logs --err --lines 10 --nostream

# 检查 Python 环境
echo ""
echo "Python 环境:"
cd /opt/tarsight/supabase_version
source .venv/bin/activate
python --version
pip list | grep -E "(pytest|supabase)" || echo "⚠️  Python 包未安装"

echo ""
echo "=== 检查完成 ==="
```

设置定时任务:

```bash
chmod +x /opt/tarsight/scripts/daily_check.sh

# 添加到 crontab
crontab -e

# 每天早上 8 点执行
0 8 * * * /opt/tarsight/scripts/daily_check.sh >> /var/log/tarsight_check.log 2>&1
```

## 备份策略

### 备份脚本

创建 `/opt/tarsight/scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/tarsight/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份环境变量
cp /opt/tarsight/tarsight-dashboard/.env.local $BACKUP_DIR/frontend.env.$DATE.bak
cp /opt/tarsight/supabase_version/.env $BACKUP_DIR/backend.env.$DATE.bak

# 压缩备份
cd /opt/tarsight
tar -czf $BACKUP_DIR/tarsight_config_$DATE.tar.gz \
    tarsight-dashboard/.env.local \
    supabase_version/.env \
    supabase_version/.venv

# 保留最近 7 天的备份
find $BACKUP_DIR -name "*.bak" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $DATE"
ls -lh $BACKUP_DIR/tarsight_config_$DATE.tar.gz
```

## 更新部署

### 更新代码

```bash
cd /opt/tarsight

# 拉取最新代码
git pull origin main

# 更新前端
cd tarsight-dashboard
npm install
npm run build
pm2 restart tarsight-frontend

# 更新后端
cd /opt/tarsight/supabase_version
source .venv/bin/activate
uv pip install --system -r pyproject.toml
```

## 安全建议

1. **限制文件权限**

```bash
# 保护敏感配置
chmod 600 /opt/tarsight/tarsight-dashboard/.env.local
chmod 600 /opt/tarsight/supabase_version/.env

# 设置合适的目录权限
chmod 755 /opt/tarsight
chmod 755 /opt/tarsight/supabase_version
```

2. **定期更新系统**

```bash
sudo apt update
sudo apt upgrade -y
```

3. **配置防火墙**

```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 总结

### 完成检查清单

- [ ] Python 虚拟环境已创建
- [ ] Python 依赖已安装
- [ ] 环境变量已配置
- [ ] 前端环境变量已更新
- [ ] 前端服务已重启
- [ ] 测试执行功能正常
- [ ] Nginx 超时已配置
- [ ] 监控脚本已设置
- [ ] 备份策略已配置

### 关键路径

| 项目 | 路径 |
|------|------|
| 项目根目录 | `/opt/tarsight` |
| Python 目录 | `/opt/tarsight/supabase_version` |
| 虚拟环境 | `/opt/tarsight/supabase_version/.venv` |
| Python 解释器 | `/opt/tarsight/supabase_version/.venv/bin/python` |
| 前端目录 | `/opt/tarsight/tarsight-dashboard` |
| 前端配置 | `/opt/tarsight/tarsight-dashboard/.env.local` |
| Python 配置 | `/opt/tarsight/supabase_version/.env` |

### 下一步

1. 测试执行一个测试用例
2. 查看执行日志确认正常工作
3. 配置监控和告警
4. 设置定期备份

---

**遇到问题?** 查看 [故障排查索引](../troubleshooting/INDEX.md)
