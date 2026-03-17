#!/usr/bin/env bash
# 用途: 更新仓库中的业务发布版本号
# 用法:
#   bash scripts/set-release-version.sh 1.0
#   bash scripts/set-release-version.sh 1.1

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "用法: bash scripts/set-release-version.sh <major.minor>"
  exit 1
fi

VERSION="$1"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+$ ]]; then
  echo "版本号格式错误，应为 major.minor，例如 1.0 或 1.1"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
printf '%s\n' "$VERSION" > "$REPO_ROOT/RELEASE_VERSION"

echo "已更新 RELEASE_VERSION: $VERSION"
echo "下一步建议: 提交代码后，再执行发布 tag，例如 v${VERSION}.0"
