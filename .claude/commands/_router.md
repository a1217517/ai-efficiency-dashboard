# Command Router — 命令路由表

本文件定义用户输入到 Agent 的映射规则。Agent 在收到指令后，先匹配本路由表，再加载对应 Agent 的定义文件。

## 路由规则

| 用户输入关键词 | 目标 Agent | 需额外读取的文件 |
|---------------|-----------|-----------------|
| `office-hours`, `需求`, `产品`, `战略`, `plan-ceo`, `plan-eng` | strategist | `specs/01-project/project-brief.md` |
| `设计`, `design`, `UI`, `UX`, `颜色`, `排版`, `样式审查` | designer | `design/active.md` |
| `写代码`, `实现`, `build`, `coding`, `开发`, `新增功能` | builder | `harness/constraints/01-coding.constraints.md` |
| `review`, `审查`, `code review`, `CR`, `看看这段代码` | reviewer | `specs/changes/[active]/tasks.md` |
| `qa`, `测试`, `test`, `bug`, `回归`, `e2e` | test-lead | `specs/08-testing/test-strategy.md` |
| `安全`, `security`, `cso`, `owasp`, `stride`, `审计` | security | `harness/constraints/00-security.constraints.md` |
| `ship`, `发布`, `deploy`, `部署`, `canary`, `上线` | release | `specs/01-project/tech-stack.md` |
| `retro`, `复盘`, `总结`, `回顾`, `investigate` | retro | `memory/YYYY-MM-DD.md`（最近 7 天） |
| `devex`, `体验`, `onboarding`, `文档`, `脚本坏了` | devex | `AGENTS.md` + `CLAUDE.md` |

## 默认行为
如果输入无法匹配任何规则，**默认唤醒 builder**，但 builder 必须先：
1. 询问用户本次任务的核心目标
2. 读取相关 Spec
3. 输出计划（如果复杂）

## 复合任务路由
如果一句话包含多个关键词（如"设计并开发一个新页面"），按顺序执行：
1. strategist（如需求不清晰）
2. designer（如含 UI）
3. builder（编码）
4. reviewer（自动审查）
5. test-lead（自动测试）
