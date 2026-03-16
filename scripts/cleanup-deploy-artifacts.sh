#!/bin/bash
# 清理历史部署备份和 Docker 残留资源
# 使用方法: bash scripts/cleanup-deploy-artifacts.sh [--keep-backups 10]

set -euo pipefail

KEEP_BACKUPS=10
BACKUP_ROOT="/opt/tarsight-deploy-backups"

while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-backups)
            KEEP_BACKUPS="$2"
            shift 2
            ;;
        *)
            echo "未知选项: $1"
            exit 1
            ;;
    esac
done

echo "清理部署备份目录: ${BACKUP_ROOT}"
mkdir -p "${BACKUP_ROOT}"
find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d | sort | head -n "-${KEEP_BACKUPS}" | xargs -r rm -rf

echo "清理 Docker dangling images"
docker image prune -f

echo "清理 Docker build cache"
docker builder prune -f

echo "完成"
