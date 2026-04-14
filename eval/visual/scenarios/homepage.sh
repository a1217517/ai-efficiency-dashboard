#!/bin/bash
set -e

# 视觉回归测试：首页

echo "[visual] 启动本地开发服务器..."
npm run dev &
DEV_PID=$!
sleep 3

echo "[visual] 打开首页并截图..."
agent-browser open http://localhost:3000
agent-browser wait --load networkidle
agent-browser screenshot --full eval/visual/snapshots/homepage-current.png

echo "[visual] 对比基线..."
if [ -f "eval/visual/baselines/homepage.png" ]; then
    npx pixelmatch \
        eval/visual/baselines/homepage.png \
        eval/visual/snapshots/homepage-current.png \
        eval/visual/diffs/homepage.png \
        0.1
    echo "[visual] 对比通过"
else
    echo "[visual] 基线不存在，将当前截图设为基线"
    cp eval/visual/snapshots/homepage-current.png eval/visual/baselines/homepage.png
fi

echo "[visual] 清理..."
kill $DEV_PID > /dev/null 2>&1 || true
wait $DEV_PID 2>/dev/null || true

echo "[visual] 完成"
