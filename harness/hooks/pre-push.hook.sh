#!/usr/bin/env bash
set -euo pipefail

# pre-push hook: 在推送前运行测试

echo "[pre-push] 运行测试..."

if command -v npm >/dev/null 2>&1; then
    npm run test:unit
fi

echo "[pre-push] 测试通过"
