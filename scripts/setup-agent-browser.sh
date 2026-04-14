#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# setup-agent-browser.sh - agent-browser 安装与配置脚本
# 支持：Linux (x64), macOS (x64/arm64)
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[SETUP]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[SETUP]${NC} $1"; }
log_error() { echo -e "${RED}[SETUP]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[SETUP]${NC} $1"; }

INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/agent-browser}"
OS="$(uname -s)"
ARCH="$(uname -m)"

# -----------------------------------------------------------------------------
# 1. 检测操作系统和架构
# -----------------------------------------------------------------------------
log_info "检测环境: OS=$OS, ARCH=$ARCH"

case "$OS" in
    Linux)
        case "$ARCH" in
            x86_64) PLATFORM="linux-x64" ;;
            aarch64|arm64) PLATFORM="linux-arm64" ;;
            *) log_error "不支持的架构: $ARCH"; exit 1 ;;
        esac
        ;;
    Darwin)
        case "$ARCH" in
            x86_64) PLATFORM="macos-x64" ;;
            arm64) PLATFORM="macos-arm64" ;;
            *) log_error "不支持的架构: $ARCH"; exit 1 ;;
        esac
        ;;
    *)
        log_error "不支持的操作系统: $OS"
        exit 1
        ;;
esac

log_ok "平台检测通过: $PLATFORM"

# -----------------------------------------------------------------------------
# 2. 检查/安装依赖
# -----------------------------------------------------------------------------
log_info "检查系统依赖..."

MISSING_DEPS=()

# 检查 curl
if ! command -v curl >/dev/null 2>&1; then
    MISSING_DEPS+=("curl")
fi

# 检查 Chrome/Chromium（agent-browser 需要它）
CHROME_FOUND=false
for chrome in google-chrome chromium chromium-browser "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    if command -v "$chrome" >/dev/null 2>&1 || [ -x "$chrome" ]; then
        CHROME_FOUND=true
        log_ok "找到浏览器: $chrome"
        break
    fi
done

if [ "$CHROME_FOUND" = false ]; then
    log_warn "未找到 Chrome/Chromium。agent-browser 需要它来运行。"
    log_info "安装建议："
    if [ "$OS" = "Linux" ]; then
        echo "  Debian/Ubuntu: sudo apt-get install -y chromium-browser"
        echo "  CentOS/RHEL:   sudo yum install -y chromium"
        echo "  或使用 Docker: docker run -it --rm --cap-add=SYS_ADMIN zenika/alpine-chrome"
    else
        echo "  macOS: brew install --cask google-chrome"
    fi
    MISSING_DEPS+=("chrome")
fi

# 检查 node/npm（用于 pixelmatch 等工具）
if ! command -v npm >/dev/null 2>&1; then
    log_warn "未找到 npm。视觉回归对比工具 pixelmatch 需要 Node.js 环境。"
    MISSING_DEPS+=("nodejs")
fi

if [ "${#MISSING_DEPS[@]}" -gt 0 ]; then
    log_warn "缺少以下依赖: ${MISSING_DEPS[*]}"
    log_info "你可以先安装缺失依赖，然后重新运行本脚本。"
    log_info "如果你确认要继续（可能 agent-browser 已能通过其他方式工作），请传入 --skip-deps"
fi

# -----------------------------------------------------------------------------
# 3. 下载 agent-browser
# -----------------------------------------------------------------------------
log_info "准备安装 agent-browser..."

# 目前 agent-browser 可能是 npm 包或独立二进制
# 这里提供两种安装路径

# 路径 A：尝试从 npm 安装（推荐，因为 OpenClaw 的 agent-browser 通常是 npm 包）
if command -v npm >/dev/null 2>&1; then
    log_info "尝试通过 npm 全局安装 agent-browser..."
    if npm install -g @openclaw/agent-browser 2>/dev/null; then
        log_ok "npm 全局安装成功"
    else
        log_warn "npm 全局安装失败，尝试从 GitHub release 下载二进制..."
        
        # 路径 B：从 GitHub release 下载（备用）
        mkdir -p "$INSTALL_DIR"
        DOWNLOAD_URL="https://github.com/openclaw/agent-browser/releases/latest/download/agent-browser-${PLATFORM}"
        
        if curl -fsSL "$DOWNLOAD_URL" -o "$INSTALL_DIR/agent-browser"; then
            chmod +x "$INSTALL_DIR/agent-browser"
            log_ok "二进制下载成功: $INSTALL_DIR/agent-browser"
        else
            log_error "下载失败。请手动安装 agent-browser。"
            log_info "备用安装方式："
            echo "  1. npm: npm install -g @openclaw/agent-browser"
            echo "  2. cargo: cargo install agent-browser"
            echo "  3. 源码: git clone https://github.com/openclaw/agent-browser.git && cd agent-browser && cargo build --release"
            exit 1
        fi
    fi
fi

# -----------------------------------------------------------------------------
# 4. 验证安装
# -----------------------------------------------------------------------------
if command -v agent-browser >/dev/null 2>&1; then
    AGENT_BROWSER_PATH=$(command -v agent-browser)
    log_ok "agent-browser 已可用: $AGENT_BROWSER_PATH"
    
    # 尝试获取版本
    if agent-browser --version >/dev/null 2>&1; then
        VERSION=$(agent-browser --version 2>&1 || echo "unknown")
        log_ok "版本: $VERSION"
    fi
else
    log_warn "agent-browser 不在 PATH 中"
    
    # 检查 ~/.local/bin 是否在 PATH
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        log_info "请将以下行添加到你的 ~/.bashrc 或 ~/.zshrc："
        echo 'export PATH="$HOME/.local/bin:$PATH"'
    fi
fi

# -----------------------------------------------------------------------------
# 5. 安装 pixelmatch（视觉回归对比工具）
# -----------------------------------------------------------------------------
if command -v npm >/dev/null 2>&1; then
    log_info "安装 pixelmatch..."
    if npm list -g pixelmatch >/dev/null 2>&1; then
        log_ok "pixelmatch 已安装"
    else
        npm install -g pixelmatch
        log_ok "pixelmatch 安装成功"
    fi
fi

# -----------------------------------------------------------------------------
# 6. 创建默认配置文件
# -----------------------------------------------------------------------------
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/config.json" <<EOF
{
  "viewport": {
    "width": 1280,
    "height": 720
  },
  "deviceScaleFactor": 1,
  "fullPage": true,
  "waitForNetworkIdle": true,
  "timeout": 30000,
  "browser": {
    "executablePath": "",
    "headless": true,
    "args": [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  }
}
EOF

log_ok "配置文件已创建: $CONFIG_DIR/config.json"

# -----------------------------------------------------------------------------
# 7. 创建项目级视觉回归脚本模板
# -----------------------------------------------------------------------------
REPO_DIR="$(pwd)"
if [ -d "$REPO_DIR/eval/visual/scenarios" ]; then
    cat > "$REPO_DIR/eval/visual/scenarios/profile.sh" <<'EOF'
#!/bin/bash
set -e

echo "[visual] 启动本地开发服务器..."
npm run dev &
DEV_PID=$!
sleep 3

echo "[visual] 打开个人中心页并截图..."
agent-browser open http://localhost:3000/profile
agent-browser wait --load networkidle
agent-browser screenshot --full eval/visual/snapshots/profile-current.png

echo "[visual] 对比基线..."
if [ -f "eval/visual/baselines/profile.png" ]; then
    npx pixelmatch \
        eval/visual/baselines/profile.png \
        eval/visual/snapshots/profile-current.png \
        eval/visual/diffs/profile.png \
        0.1
    echo "[visual] 对比通过"
else
    echo "[visual] 基线不存在，将当前截图设为基线"
    cp eval/visual/snapshots/profile-current.png eval/visual/baselines/profile.png
fi

echo "[visual] 清理..."
kill $DEV_PID > /dev/null 2>&1 || true
wait $DEV_PID 2>/dev/null || true

echo "[visual] 完成"
EOF
    chmod +x "$REPO_DIR/eval/visual/scenarios/profile.sh"
    log_ok "已创建示例视觉回归脚本: eval/visual/scenarios/profile.sh"
fi

# -----------------------------------------------------------------------------
# 8. 完成提示
# -----------------------------------------------------------------------------
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  agent-browser 安装完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if command -v agent-browser >/dev/null 2>&1; then
    echo "✅ agent-browser: $(command -v agent-browser)"
else
    echo "⚠️  agent-browser 已安装但不在 PATH 中"
    echo "   请运行: export PATH=\"$HOME/.local/bin:\$PATH\""
fi
if command -v pixelmatch >/dev/null 2>&1; then
    echo "✅ pixelmatch: 已安装"
else
    echo "⚠️  pixelmatch: 可能需要重新加载终端后使用"
fi
echo ""
echo "测试命令:"
echo "  agent-browser --version"
echo ""
