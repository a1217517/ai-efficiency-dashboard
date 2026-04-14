#!/usr/bin/env bash
set -euo pipefail

# verify-harness.sh - 验证 Harness 六层防御是否完整

ERRORS=0

check_file() {
    if [ ! -f "$1" ]; then
        echo "❌ 缺失: $1"
        ((ERRORS++))
    else
        echo "✅ 存在: $1"
    fi
}

echo "验证 Harness 六层防御..."
check_file "AGENTS.md"
check_file "harness/constraints/00-security.constraints.md"
check_file "harness/permissions/allow.rules.json"
check_file "harness/hooks/pre-commit.hook.sh"
check_file ".claude/settings.json"
check_file "scripts/verify-harness.sh"

if [ "$ERRORS" -gt 0 ]; then
    echo ""
    echo "发现 $ERRORS 处缺失，请补全后再试。"
    exit 1
fi

echo ""
echo "✅ Harness 六层防御验证通过"
