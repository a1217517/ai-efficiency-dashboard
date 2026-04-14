#!/usr/bin/env bash
set -uo pipefail

# =============================================================================
# verify-phase0.sh - Phase 0 核心假设验证脚本
# 企业级 AI-Native 脚手架 v4.0
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(pwd)"
REPORT_DIR="$REPO_DIR/.scaffold/phase0-reports"
REPORT_FILE="$REPORT_DIR/phase0-report-$(date +%Y%m%d-%H%M%S).md"
mkdir -p "$REPORT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass()  { echo -e "${GREEN}[PASS]${NC} $1"; ((PASS_COUNT++)); echo "- ✅ $1" >> "$REPORT_FILE"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; ((FAIL_COUNT++)); echo "- ❌ $1" >> "$REPORT_FILE"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; ((WARN_COUNT++)); echo "- ⚠️ $1" >> "$REPORT_FILE"; }
info()  { echo -e "${BLUE}[INFO]${NC} $1"; }

# -----------------------------------------------------------------------------
# 初始化报告
# -----------------------------------------------------------------------------
cat > "$REPORT_FILE" <<EOF
# Phase 0 验证报告

生成时间: $(date -Iseconds)
项目目录: $REPO_DIR

EOF

info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "  Phase 0 核心假设验证启动"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "" >> "$REPORT_FILE"
echo "## 验证项清单" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# =============================================================================
# 假设 1: Thin Router 在 Claude Code / Codex / OpenClaw 上的兼容性
# =============================================================================
echo ""
info "━━━ 假设 1: Thin Router 兼容性 ━━━"
echo "" >> "$REPORT_FILE"
echo "### 假设 1: Thin Router 兼容性" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1.1 检查核心路由文件存在
if [ -f "$REPO_DIR/.claude/commands/_router.md" ]; then
    pass "_router.md 路由表存在"
else
    fail "_router.md 路由表缺失 — Thin Router 无法工作"
fi

# 1.2 检查 CLAUDE.md 是否过大（>3KB 警告，>5KB 失败）
if [ -f "$REPO_DIR/CLAUDE.md" ]; then
    CLAUDE_SIZE=$(wc -c < "$REPO_DIR/CLAUDE.md")
    if [ "$CLAUDE_SIZE" -gt 5120 ]; then
        fail "CLAUDE.md 过大 (${CLAUDE_SIZE} bytes > 5120)，Thin Router 瘦身失败"
    elif [ "$CLAUDE_SIZE" -gt 3072 ]; then
        warn "CLAUDE.md 偏大 (${CLAUDE_SIZE} bytes > 3072)，建议继续压缩"
    else
        pass "CLAUDE.md 体积控制良好 (${CLAUDE_SIZE} bytes)"
    fi
else
    fail "CLAUDE.md 缺失"
fi

# 1.3 检查 Agent 定义文件是否采用按需加载模式（不把所有内容塞进一个文件）
AGENT_COUNT=0
for agent in "$REPO_DIR/.claude/agents/"*.md; do
    [ -f "$agent" ] || continue
    ((AGENT_COUNT++))
done

if [ "$AGENT_COUNT" -ge 9 ]; then
    pass "Agent 定义文件数量达标 ($AGENT_COUNT 个)，角色化拆分完成"
else
    fail "Agent 定义文件不足 ($AGENT_COUNT 个)，期望 ≥9"
fi

# 1.4 检查 harness/constraints/ 是否有过大文件
CONSTRAINT_MAX=0
for f in "$REPO_DIR/harness/constraints/"*.md; do
    [ -f "$f" ] || continue
    size=$(wc -c < "$f")
    if [ "$size" -gt "$CONSTRAINT_MAX" ]; then
        CONSTRAINT_MAX=$size
    fi
done

if [ "$CONSTRAINT_MAX" -gt 8192 ]; then
    warn "单个约束文件最大 ${CONSTRAINT_MAX} bytes，建议拆分为多个小文件"
else
    pass "约束文件体积控制良好 (最大 ${CONSTRAINT_MAX} bytes)"
fi

# 1.5 检查 OpenClaw 集成声明
if grep -q "OpenClaw" "$REPO_DIR/AGENTS.md" 2>/dev/null || grep -q "openclaw" "$REPO_DIR/CLAUDE.md" 2>/dev/null; then
    pass "AGENTS.md / CLAUDE.md 包含 OpenClaw 集成说明"
else
    warn "未找到 OpenClaw 集成说明，多 Agent 兼容性需手动验证"
fi

# =============================================================================
# 假设 2: team-init.sh 团队分发体验
# =============================================================================
echo ""
info "━━━ 假设 2: 团队分发体验 ━━━"
echo "" >> "$REPORT_FILE"
echo "### 假设 2: 团队分发体验" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 2.1 检查脚本存在与可执行
if [ -x "$REPO_DIR/scripts/team-init.sh" ]; then
    pass "team-init.sh 存在且可执行"
else
    fail "team-init.sh 不存在或没有执行权限 (运行 chmod +x scripts/*.sh)"
fi

if [ -x "$REPO_DIR/scripts/sync.sh" ]; then
    pass "sync.sh 存在且可执行"
else
    fail "sync.sh 不存在或没有执行权限"
fi

# 2.2 检查项目标记
if [ -f "$REPO_DIR/.scaffold/mode" ]; then
    MODE=$(cat "$REPO_DIR/.scaffold/mode")
    pass "项目已标记 (mode=$MODE)"
else
    warn "项目尚未标记，建议先运行 ./scripts/team-init.sh"
fi

# 2.3 检查 package.json 是否注入 scaffold 脚本
if [ -f "$REPO_DIR/package.json" ]; then
    if grep -q '"scaffold:sync"' "$REPO_DIR/package.json"; then
        pass "package.json 已注入 scaffold:sync 脚本"
    else
        warn "package.json 未找到 scaffold:sync，建议运行 team-init.sh"
    fi
else
    warn "未找到 package.json（可能不是 Node 项目）"
fi

# 2.4 模拟新成员接入计时（仅测量脚本执行时间，不重新 clone 全局模板）
if [ -x "$REPO_DIR/scripts/team-init.sh" ]; then
    info "正在模拟 team-init 执行时间..."
    START_TIME=$(date +%s%N)
    # 用 optional 模式重新执行，验证幂等性
    if bash "$REPO_DIR/scripts/team-init.sh" optional > /dev/null 2>&1; then
        END_TIME=$(date +%s%N)
        ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))
        if [ "$ELAPSED_MS" -lt 60000 ]; then
            pass "team-init.sh 执行时间 ${ELAPSED_MS}ms，符合 10 分钟接入目标"
        else
            warn "team-init.sh 执行时间 ${ELAPSED_MS}ms，建议优化"
        fi
    else
        fail "team-init.sh 执行失败"
    fi
fi

# =============================================================================
# 假设 3: 9 个 Agent Token 消耗评估框架
# =============================================================================
echo ""
info "━━━ 假设 3: Agent Token 消耗框架 ━━━"
echo "" >> "$REPORT_FILE"
echo "### 假设 3: Agent Token 消耗框架" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 3.1 估算每个 Agent 定义文件的 token 数（按 1 token ≈ 4 bytes 英文粗略估算）
TOKEN_REPORT="$REPORT_DIR/agent-tokens-$(date +%Y%m%d-%H%M%S).txt"
echo "Agent Token 估算报告 - $(date -Iseconds)" > "$TOKEN_REPORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$TOKEN_REPORT"

TOTAL_AGENT_TOKENS=0
for agent in "$REPO_DIR/.claude/agents/"*.md; do
    [ -f "$agent" ] || continue
    name=$(basename "$agent" .md)
    bytes=$(wc -c < "$agent")
    # 粗略估算：英文 Markdown 约 4 bytes/token，中文约 3 bytes/token
    # 保守取 3.5
    tokens=$(( bytes / 35 * 10 ))
    TOTAL_AGENT_TOKENS=$((TOTAL_AGENT_TOKENS + tokens))
    printf "%-20s %8d bytes ≈ %6d tokens\n" "$name" "$bytes" "$tokens" >> "$TOKEN_REPORT"
done

# 加上 CLAUDE.md 和 AGENTS.md
CLAUDE_TOKENS=$(( $(wc -c < "$REPO_DIR/CLAUDE.md") / 35 * 10 ))
AGENTS_TOKENS=$(( $(wc -c < "$REPO_DIR/AGENTS.md") / 35 * 10 ))
TOTAL_BASE_TOKENS=$((CLAUDE_TOKENS + AGENTS_TOKENS + TOTAL_AGENT_TOKENS))

printf "%-20s %8s        ≈ %6d tokens\n" "CLAUDE.md" "" "$CLAUDE_TOKENS" >> "$TOKEN_REPORT"
printf "%-20s %8s        ≈ %6d tokens\n" "AGENTS.md" "" "$AGENTS_TOKENS" >> "$TOKEN_REPORT"
printf "%-20s %8s        ≈ %6d tokens\n" "TOTAL_BASE" "" "$TOTAL_BASE_TOKENS" >> "$TOKEN_REPORT"

if [ "$TOTAL_BASE_TOKENS" -lt 30000 ]; then
    pass "基础上下文 Token 估算 ${TOTAL_BASE_TOKENS}，Thin Router 生效"
else
    warn "基础上下文 Token 估算 ${TOTAL_BASE_TOKENS}，可能仍需瘦身"
fi
info "  详细报告: $TOKEN_REPORT"

# 3.2 检查是否存在 Token 测量机制
if [ -f "$REPO_DIR/scripts/measure-tokens.sh" ]; then
    pass "已存在 Token 测量脚本"
else
    warn "尚未创建 Token 测量脚本（可用 tiktoken / claude token counter 补充）"
fi

# =============================================================================
# 假设 4: agent-browser CI 稳定性
# =============================================================================
echo ""
info "━━━ 假设 4: agent-browser CI 稳定性 ━━━"
echo "" >> "$REPORT_FILE"
echo "### 假设 4: agent-browser CI 稳定性" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 4.1 检查 agent-browser 是否安装
if command -v agent-browser >/dev/null 2>&1; then
    pass "agent-browser CLI 已安装"
else
    warn "agent-browser CLI 未找到，视觉回归测试无法自动执行"
fi

# 4.2 检查 eval/visual/ 目录结构
if [ -d "$REPO_DIR/eval/visual" ]; then
    pass "eval/visual/ 目录已创建"
else
    warn "eval/visual/ 目录缺失"
fi

# 4.3 检查是否存在视觉回归测试脚本
VISUAL_SCRIPTS=0
for s in "$REPO_DIR/eval/visual/scenarios/"*.sh; do
    [ -f "$s" ] || continue
    ((VISUAL_SCRIPTS++))
done

if [ "$VISUAL_SCRIPTS" -gt 0 ]; then
    pass "找到 $VISUAL_SCRIPTS 个视觉回归测试脚本"
else
    warn "未找到视觉回归测试脚本，CI 稳定性需后续补充"
fi

# 4.4 检查 CI 配置文件
if [ -f "$REPO_DIR/.github/workflows/visual-regression.yml" ]; then
    pass "GitHub Actions 视觉回归工作流已配置"
else
    warn "未找到 .github/workflows/visual-regression.yml"
fi

# 4.5 尝试启动本地开发服务器并截图（如果 agent-browser 和 dev 脚本都存在）
if command -v agent-browser >/dev/null 2>&1 && [ -f "$REPO_DIR/package.json" ]; then
    if grep -q '"dev"' "$REPO_DIR/package.json"; then
        info "尝试启动本地服务器进行冒烟测试..."
        cd "$REPO_DIR"
        
        # 后台启动 dev server
        npm run dev > /tmp/phase0-dev.log 2>&1 &
        DEV_PID=$!
        
        # 等待服务器启动（最多 15 秒）
        SERVER_READY=false
        for i in {1..15}; do
            if curl -s http://localhost:3000 >/dev/null 2>&1; then
                SERVER_READY=true
                break
            fi
            sleep 1
        done
        
        if [ "$SERVER_READY" = true ]; then
            pass "本地开发服务器可在 15 秒内启动"
            
            # 尝试截图
            mkdir -p "$REPO_DIR/eval/visual/snapshots"
            if agent-browser screenshot --full "$REPO_DIR/eval/visual/snapshots/phase0-smoke.png" > /tmp/phase0-browser.log 2>&1; then
                pass "agent-browser 截图成功"
            else
                warn "agent-browser 截图失败，查看 /tmp/phase0-browser.log"
            fi
            
            # 清理
            kill $DEV_PID > /dev/null 2>&1 || true
            wait $DEV_PID 2>/dev/null || true
        else
            fail "本地开发服务器 15 秒内未就绪"
            kill $DEV_PID > /dev/null 2>&1 || true
        fi
    else
        warn "package.json 中无 dev 脚本，跳过服务器冒烟测试"
    fi
fi

# =============================================================================
# 假设 5: 约束执行有效性（额外验证）
# =============================================================================
echo ""
info "━━━ 假设 5: 约束执行有效性 ━━━"
echo "" >> "$REPORT_FILE"
echo "### 假设 5: 约束执行有效性" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 5.1 检查 harness 六层防御的覆盖度
LAYERS_OK=0
[ -f "$REPO_DIR/AGENTS.md" ] && ((LAYERS_OK++))
[ -d "$REPO_DIR/harness/constraints" ] && [ "$(ls -A "$REPO_DIR/harness/constraints")" ] && ((LAYERS_OK++))
[ -f "$REPO_DIR/harness/permissions/allow.rules.json" ] && ((LAYERS_OK++))
[ -f "$REPO_DIR/harness/hooks/pre-commit.hook.sh" ] && ((LAYERS_OK++))
[ -f "$REPO_DIR/.claude/settings.json" ] && ((LAYERS_OK++))
[ -f "$REPO_DIR/scripts/verify-harness.sh" ] && ((LAYERS_OK++))

if [ "$LAYERS_OK" -eq 6 ]; then
    pass "Harness 六层防御全部覆盖"
else
    warn "Harness 六层防御覆盖度 $LAYERS_OK/6"
fi

# 5.2 检查 deny.rules.json 是否存在
if [ -f "$REPO_DIR/harness/permissions/deny.rules.json" ]; then
    pass "deny.rules.json 存在"
else
    warn "deny.rules.json 缺失"
fi

# 5.3 检查 .gitignore 是否忽略了敏感文件
if [ -f "$REPO_DIR/.gitignore" ]; then
    if grep -q "\.env" "$REPO_DIR/.gitignore"; then
        pass ".gitignore 已忽略 .env 文件"
    else
        warn ".gitignore 未忽略 .env 文件"
    fi
else
    warn "未找到 .gitignore"
fi

# =============================================================================
# 汇总报告
# =============================================================================
echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "  Phase 0 验证完成"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

printf "  ${GREEN}PASS${NC}: %d\n" "$PASS_COUNT"
printf "  ${YELLOW}WARN${NC}: %d\n" "$WARN_COUNT"
printf "  ${RED}FAIL${NC}: %d\n" "$FAIL_COUNT"

# 写入报告尾部
cat >> "$REPORT_FILE" <<EOF

## 汇总

- ✅ PASS: $PASS_COUNT
- ⚠️ WARN: $WARN_COUNT
- ❌ FAIL: $FAIL_COUNT

EOF

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "" >> "$REPORT_FILE"
    echo "> **结论**: 存在 $FAIL_COUNT 项失败，建议修复后重新运行验证。" >> "$REPORT_FILE"
    echo ""
    fail "存在 $FAIL_COUNT 项失败，请查看报告: $REPORT_FILE"
    exit 1
else
    echo "" >> "$REPORT_FILE"
    echo "> **结论**: Phase 0 验证通过，可进入 Phase 1 核心骨架搭建。" >> "$REPORT_FILE"
    echo ""
    pass "Phase 0 验证通过！报告: $REPORT_FILE"
    exit 0
fi
