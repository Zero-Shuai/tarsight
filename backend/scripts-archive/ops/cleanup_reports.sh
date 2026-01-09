#!/bin/bash
# 清理旧的测试报告文件
# 用法: ./cleanup_reports.sh [--keep-days N] [--dry-run]

KEEP_DAYS=7
DRY_RUN=false

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --keep-days)
      KEEP_DAYS="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "未知参数: $1"
      exit 1
      ;;
  esac
done

REPORTS_DIR="/Users/zhangshuai/WorkSpace/Tarsight/supabase_version/reports"

echo "🧹 清理测试报告 (保留最近 $KEEP_DAYS 天)"
echo "==========================================="

if [ "$DRY_RUN" = true ]; then
  echo "⚠️  DRY RUN 模式 - 不会实际删除文件"
  echo ""
fi

# 清理旧的 JSON 结果
echo "📄 检查 JSON 测试结果..."
if [ "$DRY_RUN" = true ]; then
  find "$REPORTS_DIR" -name "test_results_*.json" -mtime +$KEEP_DAYS -ls
else
  DELETED=$(find "$REPORTS_DIR" -name "test_results_*.json" -mtime +$KEEP_DAYS -delete -print | wc -l)
  echo "✅ 已删除 $DELETED 个旧 JSON 文件"
fi

# 清理旧的 allure 结果
echo ""
echo "📊 检查 Allure 结果..."
if [ "$DRY_RUN" = true ]; then
  find "$REPORTS_DIR/allure-results" -type f -mtime +$KEEP_DAYS -ls 2>/dev/null | head -10
else
  if [ -d "$REPORTS_DIR/allure-results" ]; then
    find "$REPORTS_DIR/allure-results" -type f -mtime +$KEEP_DAYS -delete
    echo "✅ 已清理旧的 Allure 结果"
  fi
fi

# 清理旧的 HTML 报告
echo ""
echo "🌐 检查 HTML 报告..."
if [ "$DRY_RUN" = true ]; then
  find "$REPORTS_DIR" -name "test_report.html" -mtime +$KEEP_DAYS -ls
else
  find "$REPORTS_DIR" -name "test_report.html" -mtime +$KEEP_DAYS -delete -print
  echo "✅ 已删除旧的 HTML 报告"
fi

echo ""
echo "==========================================="
if [ "$DRY_RUN" = true ]; then
  echo "🔍 DRY RUN 完成 - 使用 --keep-days $KEEP_DAYS 实际执行"
else
  echo "✅ 清理完成！"
fi
