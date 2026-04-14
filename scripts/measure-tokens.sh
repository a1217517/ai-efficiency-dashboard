#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# measure-tokens.sh - Agent 上下文 Token 测量工具
# 使用 tiktoken 或 wc 进行粗略/精确测量
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(pwd)"
REPORT_DIR="$REPO_DIR/.scaffold/phase0-reports"
mkdir -p "$REPORT_DIR"

OUTPUT_FILE="$REPORT_DIR/token-measurement-$(date +%Y%m%d-%H%M%S).md"

# 检测 tiktoken
USE_TIKTOKEN=false
TIKTOKEN_CMD=""

if command -v tiktoken >/dev/null 2>&1; then
    USE_TIKTOKEN=true
    TIKTOKEN_CMD="tiktoken"
elif python3 -c "import tiktoken" 2>/dev/null; then
    USE_TIKTOKEN=true
    TIKTOKEN_CMD="python3 -c 'import tiktoken,sys; enc=tiktoken.get_encoding(\"cl100k_base\"); print(len(enc.encode(sys.stdin.read())))'"
fi

count_tokens() {
    local file="$1"
    if [ "$USE_TIKTOKEN" = true ]; then
        if [ "$TIKTOKEN_CMD" = "tiktoken" ]; then
            tiktoken < "$file"
        else
            python3 -c "import tiktoken,sys; enc=tiktoken.get_encoding('cl100k_base'); print(len(enc.encode(open('$file').read())))"
        fi
    else
        # 粗略估算：混合文本取 3.5 bytes/token
        local bytes
        bytes=$(wc -c < "$file")
        echo $(( bytes * 10 / 35 ))
    fi
}

cat > "$OUTPUT_FILE" <<EOF
# Agent 上下文 Token 测量报告

生成时间: $(date -Iseconds)
测量工具: $([ "$USE_TIKTOKEN" = true ] && echo "tiktoken (cl100k_base)" || echo "wc 粗略估算 (3.5 bytes/token)")

## 基础上下文（每次会话必加载）

| 文件 | 路径 | Tokens |
|------|------|--------|
EOF

TOTAL=0

measure_and_report() {
    local name="$1"
    local path="$2"
    if [ -f "$path" ]; then
        local tokens
        tokens=$(count_tokens "$path")
        TOTAL=$((TOTAL + tokens))
        echo "| $name | $path | $tokens |" >> "$OUTPUT_FILE"
    else
        echo "| $name | $path | *缺失* |" >> "$OUTPUT_FILE"
    fi
}

measure_and_report "AGENTS.md" "$REPO_DIR/AGENTS.md"
measure_and_report "CLAUDE.md" "$REPO_DIR/CLAUDE.md"

# 测量 .claude/agents/
if [ -d "$REPO_DIR/.claude/agents" ]; then
    for agent in "$REPO_DIR/.claude/agents/"*.md; do
        [ -f "$agent" ] || continue
        name=$(basename "$agent")
        measure_and_report "$name" "$agent"
    done
fi

# 测量 .claude/commands/
if [ -d "$REPO_DIR/.claude/commands" ]; then
    for cmd in "$REPO_DIR/.claude/commands/"*.md; do
        [ -f "$cmd" ] || continue
        name=$(basename "$cmd")
        measure_and_report "$name" "$cmd"
    done
fi

# 测量 harness/constraints/（这些是按需加载的，但也统计一下）
CONSTRAINT_TOTAL=0
if [ -d "$REPO_DIR/harness/constraints" ]; then
    for f in "$REPO_DIR/harness/constraints/"*.md; do
        [ -f "$f" ] || continue
        local t
        t=$(count_tokens "$f")
        CONSTRAINT_TOTAL=$((CONSTRAINT_TOTAL + t))
    done
fi

cat >> "$OUTPUT_FILE" <<EOF

## 按需加载上下文（不常驻会话）

| 分类 | Tokens |
|------|--------|
| harness/constraints/ | $CONSTRAINT_TOTAL |

## 汇总

| 指标 | Tokens | 评估 |
|------|--------|------|
| 基础上下文合计 | $TOTAL | $([ "$TOTAL" -lt 15000 ] && echo "✅ 优秀" || ([ "$TOTAL" -lt 25000 ] && echo "⚠️ 尚可" || echo "❌ 过重")) |
| 含按需加载 | $((TOTAL + CONSTRAINT_TOTAL)) | — |

### 参考标准

- < 15,000 tokens: 优秀，可直接全量加载
- 15,000 ~ 25,000 tokens: 尚可，建议监控
- > 25,000 tokens: 过重，必须瘦身或强化 Thin Router

EOF

echo "Token 测量报告已生成: $OUTPUT_FILE"
cat "$OUTPUT_FILE"
