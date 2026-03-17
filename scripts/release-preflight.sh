#!/usr/bin/env bash
# 用途: 发版前做一致性检查
# 用法:
#   bash scripts/release-preflight.sh 1.0.0

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "用法: bash scripts/release-preflight.sh <version>"
  exit 1
fi

RAW_VERSION="$1"
VERSION="${RAW_VERSION#v}"
RELEASE_LINE="${VERSION%.*}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKFLOW_FILE="$REPO_ROOT/.github/workflows/deploy-production.yml"
RELEASE_VERSION_FILE="$REPO_ROOT/RELEASE_VERSION"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "[FAIL] 版本号格式错误，应为 x.y.z，例如 1.0.0"
  exit 1
fi

cd "$REPO_ROOT"

echo "[INFO] 检查目标版本: v$VERSION"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "[FAIL] 工作区不干净，请先提交或清理改动"
  exit 1
fi
echo "[PASS] 工作区干净"

if [ ! -f "$RELEASE_VERSION_FILE" ]; then
  echo "[FAIL] 缺少 RELEASE_VERSION 文件"
  exit 1
fi

CURRENT_RELEASE_VERSION="$(tr -d '\r\n' < "$RELEASE_VERSION_FILE")"
if [ "$CURRENT_RELEASE_VERSION" != "$RELEASE_LINE" ]; then
  echo "[FAIL] RELEASE_VERSION=$CURRENT_RELEASE_VERSION 与目标 tag v$VERSION 不一致"
  echo "       请先执行: bash scripts/set-release-version.sh $RELEASE_LINE"
  exit 1
fi
echo "[PASS] RELEASE_VERSION 与目标 tag 一致 ($CURRENT_RELEASE_VERSION)"

if git rev-parse "v$VERSION" >/dev/null 2>&1; then
  echo "[FAIL] Tag 已存在: v$VERSION"
  exit 1
fi
echo "[PASS] Tag 不存在"

if ! grep -q "workflow_dispatch:" "$WORKFLOW_FILE"; then
  echo "[FAIL] deploy workflow 缺少 workflow_dispatch"
  exit 1
fi

if ! grep -q "tags:" "$WORKFLOW_FILE" || ! grep -q "'v\*'" "$WORKFLOW_FILE"; then
  echo "[FAIL] deploy workflow 未配置 v* tag 发布"
  exit 1
fi

if grep -q "branches:" "$WORKFLOW_FILE" && grep -q "master" "$WORKFLOW_FILE"; then
  echo "[FAIL] deploy workflow 仍包含 master 自动发布配置"
  exit 1
fi
echo "[PASS] 生产 workflow 已切到手动/标签发布模式"

echo "[INFO] 执行前端构建检查..."
cd "$REPO_ROOT/frontend"
npm run build >/tmp/tarsight-release-build.log 2>&1 || {
  echo "[FAIL] 前端构建失败，日志如下:"
  tail -n 80 /tmp/tarsight-release-build.log
  exit 1
}
echo "[PASS] 前端构建通过"
rm -f /tmp/tarsight-release-build.log

cd "$REPO_ROOT"
echo "[PASS] 发版前检查全部通过，可以创建 tag: v$VERSION"
