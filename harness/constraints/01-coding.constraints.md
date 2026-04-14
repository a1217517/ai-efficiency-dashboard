# 编码规范约束

## TypeScript
- 必须启用严格模式（`strict: true`）
- 禁止使用 `any` 类型，除非在 `.d.ts` 声明文件中
- 所有函数必须声明返回类型（公共 API）
- 禁止使用非空断言操作符 `!` 绕过类型检查

## React / Next.js
- 优先使用 Server Components，只在需要客户端交互时使用 `'use client'`
- 禁止在 Server Component 中直接使用浏览器 API（`window`, `document`）
- 所有 `useEffect` 必须包含清理函数（如果需要）
- 表单提交必须同时处理客户端校验和服务端校验

## 代码组织
- 业务逻辑必须放在 `src/lib/` 或 `src/hooks/`，禁止在组件中写复杂逻辑
- 常量必须提取到 `src/lib/constants.ts` 或同级 `constants.ts`
- 禁止出现魔法数字和魔法字符串

## 质量门禁
- 提交前必须跑通 `npm run lint`
- 提交前必须跑通 `npm run type-check`
- 新增功能必须附带单元测试
