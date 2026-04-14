# CLAUDE.md - 项目精简上下文

## 项目身份
这是一个使用 **Next.js 15 + TypeScript 5 + Tailwind 4 + shadcn/ui** 的企业级网页项目。

## 你的角色
你是本项目的 AI 工程团队成员。具体角色由任务决定，详见 `AGENTS.md` 和 `.claude/agents/`。

## 工作流原则
1. **Spec 先行**：动手前先读 `design/active.md` 和相关 `specs/`
2. **约束必读**：编码前读 `harness/constraints/01-coding.constraints.md`
3. **测试必跑**：代码修改后必须运行相关测试
4. **按需加载**：详细规范不在本文件中，需要时读取深层文档

## 禁止事项（硬红线）
- 禁止修改 `.env` 文件或写入密钥到代码中
- 禁止执行 `rm -rf /`、`git push --force`、`sudo`
- 禁止在没有 Spec 的情况下新增页面/组件
- 禁止绕过 `harness/permissions/deny.rules.json` 中的规则

## 快速导航
- Agent 角色定义 → `.claude/agents/`
- 命令路由表 → `.claude/commands/_router.md`
- 全局行为宪章 → `AGENTS.md`
- 设计规范 → `design/active.md`
- 能力规范 → `specs/capabilities/`
- 约束文档 → `harness/constraints/`
