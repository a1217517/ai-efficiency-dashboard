# AGENTS.md - Agent 全局行为宪章

## 🧬 核心身份
你是本项目的 **AI 工程团队成员**。你的最高行为准则由本文件定义。

## 📍 工作流地图（Thin Router）

本项目的知识和规范采用 **按需加载** 模式。你的默认上下文只有：
1. `AGENTS.md`（本文件）
2. `CLAUDE.md`（项目精简上下文，≤2K tokens）
3. `.claude/commands/_router.md`（命令路由表）

当你收到具体任务时，**必须根据任务类型读取对应的 Agent 定义文件**：
- 需求澄清 → `.claude/agents/strategist.md`
- UI/设计相关 → `.claude/agents/designer.md`
- 编码实现 → `.claude/agents/builder.md`
- 代码审查 → `.claude/agents/reviewer.md`
- 测试验证 → `.claude/agents/test-lead.md`
- 安全审计 → `.claude/agents/security.md`
- 发布部署 → `.claude/agents/release.md`
- 复盘沉淀 → `.claude/agents/retro.md`
- 开发者体验 → `.claude/agents/devex.md`

## ⚙️ 强制工作流（3-Phase）

### Phase 1: 读 Spec（必须）
在执行任何代码修改前，先读取相关规范：
- 修改 UI → `design/active.md` + `specs/capabilities/` 下相关 `design.md`
- 修改功能 → `specs/capabilities/[capability]/spec.md`
- 新增功能 → 在 `specs/changes/` 下创建 `proposal.md` 和 `tasks.md`，等待确认后继续

### Phase 2: 计划（复杂任务）
如果任务涉及 ≥3 个文件修改或架构决策：
1. 输出自然语言计划，引用相关 spec 章节
2. 标记计划的"决策完成"状态
3. 等待用户确认（可配置 `AUTO_APPROVE_PLAN=true` 跳过）

### Phase 3: 实现 + 验证
1. 编写代码，严格遵守 `harness/constraints/` 中的规范
2. **必须运行相关测试**：
   - UI 变更 → `./scripts/run-skill.sh test-runner --visual`
   - 功能变更 → `npm run test:unit && npm run test:e2e`
3. 测试失败必须修复后才能标记任务完成

## 🛡️ 边界情况强制清单（每次提交前自查）
- [ ] 响应式：mobile / tablet / desktop 三种断点
- [ ] 可访问性：图片有 alt，交互元素有 aria-label，对比度 WCAG AA
- [ ] 性能：图片使用 next/image，动画使用 transform/opacity
- [ ] 错误处理：API 调用包含 loading / error / empty UI

## 🔧 工具使用优先级
1. 浏览器自动化 → `skills/core/browser-agent`
2. 设计提取 → `skills/core/design-extractor`
3. 文档转换 → `skills/core/doc-converter`
4. 代码质量 → 运行 `npm run lint && npm run type-check`

## 🔄 团队同步
如果项目根目录存在 `.scaffold/` 标记，每次会话启动时运行：
```bash
./scripts/sync.sh
```
（每小时最多执行一次，失败静默）

## 🤖 OpenClaw 集成
在 OpenClaw 环境中，本项目的 Agent 定义文件和约束规则可直接生效：
- OpenClaw 通过 ACP 调用 Claude Code 时，会自动读取 `.claude/` 目录
- 复杂任务建议先运行 `/new-feature` 或 `/review-pr` 命令
- 需要浏览器自动化时，优先使用 `agent-browser` 而非外部 MCP

## 📚 学习参考
- 驾驭工程技巧 → `vendor/claude-code-src/harness-patterns/`
- 复杂任务规划 → `vendor/codex/collaboration-mode-templates/plan.md`
- gstack 工作流 → `vendor/gstack-patterns/`
