# Docker 测试执行功能修复指南

修复 Docker 部署中测试执行卡住的问题。

## 📋 问题说明

### 原始问题

在 Docker 部署环境中，测试执行功能无法正常工作，总是卡在"运行中"状态。

### 根本原因

1. **前端容器缺少 Python 环境**: Next.js 容器使用 Node.js 20 Alpine 镜像，没有安装 Python
2. **后端容器不执行测试**: 后端容器只运行 `python run.py --help` 显示帮助信息后退出
3. **API 路由无法调用 Python**: `/api/test/execute` 尝试使用 `child_process` 执行 Python，但容器内没有 Python

### 解决方案

直接在前端容器中安装 Python 3 和所有必要的依赖，使其能够直接执行测试。

## 🔧 修改内容

### 1. 修改前端 Dockerfile

**文件**: [tarsight-dashboard/deployment/Dockerfile](../../tarsight-dashboard/deployment/Dockerfile)

**主要改动**:

```dockerfile
# 在 runner 阶段添加 Python 安装
RUN apk add --no-cache python3 py3-pip py3-pip gcc musl-dev libffi-dev openssl-dev

# 复制 Python 测试代码
COPY ../supabase_version ./python

# 安装 Python 依赖
RUN pip3 install --no-cache-dir pytest pytest-html allure-pytest supabase requests python-dotenv
```

**说明**:
- `python3`: Python 3 解释器
- `py3-pip`: Python 包管理器
- `gcc musl-dev`: 编译工具（用于编译 Python 扩展包）
- `libffi-dev openssl-dev`: SSL 和 FFI 支持
- 安装测试所需的 Python 包: pytest, allure, supabase, requests

### 2. 更新 docker-compose.yml

**文件**: [docker-compose.yml](../../docker-compose.yml)

**添加环境变量**:

```yaml
environment:
  - PROJECT_ROOT=/app/python
  - PYTHON_PATH=/usr/bin/python3
  - PYTHONPATH=/app/python
```

**说明**:
- `PROJECT_ROOT`: Python 项目根目录
- `PYTHON_PATH`: Python 解释器路径
- `PYTHONPATH`: Python 模块搜索路径

## 🚀 部署步骤

### 步骤 1: 在 Ubuntu 服务器上拉取最新代码

```bash
cd /opt/tarsight
git pull origin master
```

### 步骤 2: 停止现有容器

```bash
docker compose down
```

### 步骤 3: 重新构建并启动

```bash
# 重新构建前端镜像（包含 Python）
docker compose build --no-cache frontend

# 启动所有服务
docker compose up -d

# 查看构建和启动日志
docker compose logs -f
```

### 步骤 4: 验证 Python 环境

```bash
# 进入前端容器
docker exec -it tarsight-frontend sh

# 验证 Python 版本
python3 --version
# 预期输出: Python 3.x.x

# 验证已安装的包
pip3 list | grep -E "pytest|supabase|allure"
# 预期输出应该包含:
# - pytest
# - pytest-html
# - allure-pytest
# - supabase
# - requests

# 验证 Python 代码目录
ls -la /app/python
# 预期输出应该包含:
# - run.py
# - tests/
# - utils/
# - conftest.py

# 退出容器
exit
```

### 步骤 5: 测试执行功能

1. 在浏览器中访问: `http://your-server-ip:3000`

2. 进入 **测试用例** 页面

3. 点击任意测试用例的 **执行按钮**（▶）

4. 确认测试执行对话框

5. 查看执行历史页面，验证测试是否正常完成

### 步骤 6: 检查容器日志

```bash
# 查看前端日志
docker logs -f tarsight-frontend

# 如果有问题，查看详细日志
docker logs --tail 100 tarsight-frontend
```

## 🔍 故障排查

### Python 未安装

**症状**: 执行测试时提示 "python3: not found"

**解决方案**:

```bash
# 检查镜像构建
docker images | grep tarsight-frontend

# 重新构建
docker compose build --no-cache frontend
docker compose up -d frontend

# 验证安装
docker exec -it tarsight-frontend python3 --version
```

### Python 依赖缺失

**症状**: 执行测试时提示 "ModuleNotFoundError: No module named 'pytest'"

**解决方案**:

```bash
# 进入容器检查
docker exec -it tarsight-frontend sh
pip3 list

# 手动安装缺失的包
pip3 install pytest pytest-html allure-pytest supabase requests
```

### 找不到 Python 代码

**症状**: 执行测试时提示找不到 run.py 或测试文件

**解决方案**:

```bash
# 检查代码目录
docker exec -it tarsight-frontend ls -la /app/python

# 检查环境变量
docker exec -it tarsight-frontend env | grep PYTHON

# 如果目录不存在，检查 Dockerfile
# COPY ../supabase_version ./python
```

### 权限问题

**症状**: 执行测试时提示权限不足

**解决方案**:

```bash
# 进入容器
docker exec -it tarsight-frontend sh

# 修改权限
chmod +x /app/python/run.py
chmod -R 755 /app/python/

# 退出并重启
exit
docker compose restart frontend
```

### 测试执行超时

**症状**: 测试一直处于"运行中"状态

**解决方案**:

```bash
# 查看详细日志
docker logs -f tarsight-frontend

# 检查 Python 进程
docker exec -it tarsight-frontend ps aux | grep python

# 手动测试 Python 执行
docker exec -it tarsight-frontend python3 /app/python/run.py --help
```

## 📊 验证清单

部署完成后，请验证以下项目:

- [ ] Docker 容器正常运行 (`docker compose ps`)
- [ ] 前端容器已安装 Python 3 (`python3 --version`)
- [ ] 所有 Python 依赖已安装 (`pip3 list`)
- [ ] Python 代码目录正确挂载 (`ls /app/python`)
- [ ] 环境变量配置正确 (`env | grep PYTHON`)
- [ ] 浏览器可以访问前端界面
- [ ] 测试执行功能正常工作
- [ ] 测试结果正确保存到数据库
- [ ] 容器日志无错误信息

## 🎯 架构说明

修改后的 Docker 架构:

```
┌─────────────────────────────────────────────────────┐
│                  Docker Network                     │
│              (tarsight-network)                     │
│                                                      │
│  ┌──────────────────────────┐                       │
│  │   Frontend Container     │                       │
│  │   (Next.js + Python)     │                       │
│  │                          │                       │
│  │  - Node.js 20 Alpine     │                       │
│  │  - Python 3              │  ← 新增               │
│  │  - Pytest + Allure       │  ← 新增               │
│  │  - Next.js 14            │                       │
│  │  - Port: 3000            │                       │
│  │                          │                       │
│  │  直接执行 Python 测试     │  ← 修改               │
│  └──────────────────────────┘                       │
│              │                                       │
│              └───────────────────────────────────────┤
│                      │                                │
└──────────────────────┼────────────────────────────────┘
                       │
               ┌───────▼────────┐
               │  Supabase Cloud │
               │   (PostgreSQL)  │
               └─────────────────┘
```

**关键变化**:
1. 前端容器内置 Python 3 和所有测试依赖
2. Python 代码复制到容器内的 `/app/python`
3. API 路由直接调用容器内的 Python 执行测试
4. 不再依赖后端容器执行测试

## 📝 后续优化建议

1. **镜像大小优化**: 当前镜像包含完整 Python 环境，大小约 200-300MB
   - 可以考虑使用多阶段构建优化
   - 或者使用 Alpine Python 镜像

2. **依赖管理**: 当前使用 pip 直接安装
   - 可以使用 `uv` 包管理器加快安装速度
   - 或者使用 requirements.txt 固定版本

3. **代码更新**: 当 Python 代码更新时
   - 需要重新构建前端镜像
   - 考虑使用 volume 挂载实现热更新

4. **监控和日志**:
   - 添加更详细的执行日志
   - 集成 Allure 报告查看

## 🔗 相关文档

- **[Docker 完整部署指南](DOCKER_FULL_STACK_DEPLOYMENT.md)** - Docker 部署总览
- **[故障排查索引](../troubleshooting/INDEX.md)** - 常见问题解决
- **[项目主文档](../../README.md)** - 项目总览

---

**最后更新**: 2025-12-31
**版本**: 1.0
**维护**: Tarsight Team
