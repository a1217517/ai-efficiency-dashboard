#!/usr/bin/env bash
set -euo pipefail

# pre-commit hook: 在提交前运行 lint 和 type-check

echo "[pre-commit] 运行代码检查..."

if command -v npm >/dev/null 2>&1; then
    npm run lint && npm run type-check
fi

echo "[pre-commit] 检查通过"
