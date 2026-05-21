#!/bin/bash
set -e

# ============================================================
# AI Efficiency Dashboard — 宿主机部署启动脚本
# Postgres 用 Docker 容器，前后端直接在宿主机运行
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[x]${NC} $1"; }

# 1. 启动/检查 Postgres 容器
log "Step 1: 启动 Postgres 容器..."
cd "$PROJECT_DIR"
if docker compose ps | grep -q "ai-efficiency-db.*Up"; then
    log "  Postgres 容器已在运行"
else
    docker compose up -d postgres
    sleep 3
    # 等待 postgres ready
    for i in {1..30}; do
        if docker exec ai-efficiency-db pg_isready -U postgres -d ai_efficiency >/dev/null 2>&1; then
            log "  Postgres 就绪"
            break
        fi
        sleep 1
    done
fi

# 2. 检查 5432 端口是否可连
if ! nc -z localhost 5432 2>/dev/null; then
    warn "  宿主机 5432 端口未开放，请检查 docker-compose 端口映射"
fi

# 3. 构建并启动后端（Go）
log "Step 2: 构建后端服务..."
cd "$BACKEND_DIR"
if [ ! -d "bin" ]; then
    mkdir -p bin
fi
if command -v go &> /dev/null; then
    go build -ldflags="-s -w" -o bin/ai-efficiency-admin ./cmd/server/main.go
    log "  后端构建完成"
else
    err "  Go 未安装，无法编译后端"
    exit 1
fi

log "Step 3: 启动后端服务 (端口 8082)..."
# 使用 nohup 后台运行
export PORT=8082
nohup "$BACKEND_DIR/bin/ai-efficiency-admin" > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 2
if kill -0 $BACKEND_PID 2>/dev/null; then
    log "  后端启动成功 PID=$BACKEND_PID"
else
    err "  后端启动失败，查看 backend.log"
    exit 1
fi

# 4. 构建并启动前端（Vite 静态站点）
log "Step 4: 构建前端..."
cd "$PROJECT_DIR"
if command -v npm &> /dev/null; then
    npm run build > "$PROJECT_DIR/frontend-build.log" 2>&1
    log "  前端构建完成"
else
    err "  npm 未安装"
    exit 1
fi

log "Step 5: 启动前端静态服务器 (端口 8081)..."
# 用 npx serve 提供 dist 目录
nohup npx serve -s dist -l 8081 > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 2
if kill -0 $FRONTEND_PID 2>/dev/null; then
    log "  前端启动成功 PID=$FRONTEND_PID"
else
    err "  前端启动失败，查看 frontend.log"
    exit 1
fi

# 6. 状态汇总
log "=========================================="
log "  🚀 服务启动完成！"
log "=========================================="
echo -e "  Postgres  : ${GREEN}容器 localhost:5432${NC}"
echo -e "  后端 API  : ${GREEN}http://localhost:8082${NC}"
echo -e "  前端看板  : ${GREEN}http://localhost:8081${NC}"
echo -e "  公网访问  : ${GREEN}http://47.103.58.81:8081${NC}"
log "=========================================="
echo ""
warn "停止服务："
echo "  kill $BACKEND_PID"
echo "  kill $FRONTEND_PID"
echo "  docker compose down"

# 写入 PID 文件方便后续管理
echo "$BACKEND_PID" > "$PROJECT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$PROJECT_DIR/.frontend.pid"
