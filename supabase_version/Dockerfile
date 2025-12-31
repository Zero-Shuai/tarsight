# Tarsight Python 测试框架 Dockerfile
# 多阶段构建优化镜像大小

# ==========================================
# 基础阶段 - 安装系统依赖
# ==========================================
FROM python:3.12-slim AS base

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    git \
    curl \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# ==========================================
# 依赖阶段 - 安装 Python 包
# ==========================================
FROM base AS dependencies

# 复制依赖配置文件
COPY pyproject.toml ./

# 安装 uv（快速的 Python 包管理器）
RUN pip install --no-cache-dir uv

# 使用 uv 安装 Python 依赖到系统目录
RUN uv pip install --system \
    --no-cache \
    -r pyproject.toml

# ==========================================
# 开发阶段 - 包含完整源代码和开发工具
# ==========================================
FROM dependencies AS development

# 复制源代码
COPY . .

# 创建报告目录
RUN mkdir -p reports

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# 暴露端口（如果需要 API 服务）
# EXPOSE 8000

# 默认命令
CMD ["python", "run.py", "--help"]

# ==========================================
# 生产阶段 - 优化的生产环境镜像
# ==========================================
FROM dependencies AS production

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p reports \
    && mkdir -p reports/allure-results

# 创建非 root 用户
RUN groupadd -r tarsight && useradd -r -g tarsight tarsight

# 设置目录权限
RUN chown -R tarsight:tarsight /app

# 切换到非 root 用户
USER tarsight

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV REPORTS_DIR=/app/reports

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)" || exit 1

# 默认命令（可以被 docker-compose 覆盖）
CMD ["python", "run.py", "--help"]
