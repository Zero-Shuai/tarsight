#!/usr/bin/env bash
# 用途: 为生产发布创建并推送版本 tag
# 用法:
#   bash scripts/create-release-tag.sh 1.0.0
#   bash scripts/create-release-tag.sh v1.0.0

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "用法: bash scripts/create-release-tag.sh <version>"
  exit 1
fi

RAW_VERSION="$1"
VERSION="${RAW_VERSION#v}"
TAG="v${VERSION}"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "版本号格式错误，应为 x.y.z，例如 1.0.0"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "工作区不干净，请先提交或清理后再发版"
  exit 1
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag 已存在: $TAG"
  exit 1
fi

git fetch origin

echo "即将基于当前 HEAD 创建发布 tag: $TAG"
echo "当前提交: $(git rev-parse --short HEAD)"

git tag "$TAG"
git push origin "$TAG"

echo "发布 tag 已推送: $TAG"
echo "下一步: 到 GitHub Actions 手动确认发布结果，或等待 tag 触发生产发布"
