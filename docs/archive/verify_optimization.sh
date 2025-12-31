#!/bin/bash
# 架构优化验证脚本

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Tarsight 架构优化验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PASS=0
FAIL=0

# 检查函数
check() {
  if [ $? -eq 0 ]; then
    echo "  ✅ $1"
    ((PASS++))
  else
    echo "  ❌ $1"
    ((FAIL++))
  fi
}

echo "1️⃣  检查临时脚本清理"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "supabase_version/fix_stuck_executions.py" ] && \
   [ ! -f "supabase_version/run_simple.py" ] && \
   [ -d "supabase_version/scripts/debug" ]; then
  echo "  ✅ 临时脚本已移动到 scripts/debug/"
  ((PASS++))
else
  echo "  ❌ 临时脚本未正确移动"
  ((FAIL++))
fi

if [ -f "supabase_version/scripts/debug/README.md" ]; then
  echo "  ✅ scripts/debug/README.md 存在"
  ((PASS++))
else
  echo "  ❌ 缺少 scripts/debug/README.md"
  ((FAIL++))
fi

echo ""
echo "2️⃣  检查 .gitignore 配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "/reports/allure-results/" .gitignore && \
   grep -q "/reports/test_results_*.json" .gitignore; then
  echo "  ✅ 报告文件已添加到 .gitignore"
  ((PASS++))
else
  echo "  ❌ .gitignore 配置不完整"
  ((FAIL++))
fi

if [ -f "supabase_version/scripts/cleanup_reports.sh" ]; then
  echo "  ✅ 清理脚本存在"
  ((PASS++))
  if [ -x "supabase_version/scripts/cleanup_reports.sh" ]; then
    echo "  ✅ 清理脚本可执行"
    ((PASS++))
  else
    echo "  ⚠️  清理脚本不可执行，运行: chmod +x supabase_version/scripts/cleanup_reports.sh"
    ((FAIL++))
  fi
else
  echo "  ❌ 清理脚本不存在"
  ((FAIL++))
fi

echo ""
echo "3️⃣  检查文档整合"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "docs/troubleshooting" ]; then
  echo "  ✅ docs/troubleshooting/ 目录存在"
  ((PASS++))

  TROUBLESHOOTING_COUNT=$(find docs/troubleshooting -name "*.md" | wc -l)
  if [ $TROUBLESHOOTING_COUNT -ge 5 ]; then
    echo "  ✅ 故障排查文档已整合 ($TROUBLESHOOTING_COUNT 个文件)"
    ((PASS++))
  else
    echo "  ⚠️  故障排查文档数量不足 ($TROUBLESHOOTING_COUNT 个文件)"
    ((FAIL++))
  fi

  if [ -f "docs/troubleshooting/INDEX.md" ]; then
    echo "  ✅ 文档索引存在"
    ((PASS++))
  else
    echo "  ❌ 缺少文档索引"
    ((FAIL++))
  fi
else
  echo "  ❌ docs/troubleshooting/ 目录不存在"
  ((FAIL++))
fi

echo ""
echo "4️⃣  检查环境变量配置化"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "process.env.PROJECT_ROOT" tarsight-dashboard/app/api/test/execute/route.ts && \
   grep -q "process.env.PYTHON_PATH" tarsight-dashboard/app/api/test/execute/route.ts; then
  echo "  ✅ route.ts 已使用环境变量"
  ((PASS++))
else
  echo "  ❌ route.ts 环境变量未配置化"
  ((FAIL++))
fi

if grep -q "process.env.PROJECT_ROOT" tarsight-dashboard/app/api/test/execute/single/route.ts && \
   grep -q "process.env.PYTHON_PATH" tarsight-dashboard/app/api/test/execute/single/route.ts; then
  echo "  ✅ single/route.ts 已使用环境变量"
  ((PASS++))
else
  echo "  ❌ single/route.ts 环境变量未配置化"
  ((FAIL++))
fi

echo ""
echo "5️⃣  检查环境变量示例文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "tarsight-dashboard/.env.example" ]; then
  echo "  ✅ 前端 .env.example 存在"
  ((PASS++))
  if grep -q "PROJECT_ROOT" tarsight-dashboard/.env.example && \
     grep -q "PYTHON_PATH" tarsight-dashboard/.env.example; then
    echo "  ✅ 包含必需的环境变量"
    ((PASS++))
  else
    echo "  ⚠️  缺少必需的环境变量定义"
    ((FAIL++))
  fi
else
  echo "  ❌ 前端 .env.example 不存在"
  ((FAIL++))
fi

if [ -f "supabase_version/.env.example" ]; then
  echo "  ✅ Python .env.example 存在"
  ((PASS++))
else
  echo "  ❌ Python .env.example 不存在"
  ((FAIL++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   验证结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✅ 通过: $PASS 项"
echo "  ❌ 失败: $FAIL 项"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  🎉 所有优化项验证通过！"
  echo ""
  exit 0
else
  echo "  ⚠️  有 $FAIL 项未通过，请检查上述问题"
  echo ""
  exit 1
fi
