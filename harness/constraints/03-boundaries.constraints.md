# 边界情况处理规则

## 文件操作边界
- 禁止修改 `.git/` 目录内容
- 禁止删除 `specs/capabilities/` 和 `harness/` 中的规范文件（除非通过 `changes/` 流程）
- 大文件（>1MB）操作前需在提案中说明
- 禁止在代码库中提交二进制资源（图片、视频），使用 CDN 或 `public/` 目录并配置 `.gitattributes`

## 网络请求边界
- API 调用域名白名单：`api.example.com`, `*.vercel.app`
- 禁止在客户端代码中硬编码密钥
- 敏感数据传输需加密
- 外部 API 失败必须有降级策略（fallback UI 或缓存数据）

## 代码生成边界
- 生成的代码必须通过 ESLint + type-check
- 不得生成 `any` 类型（TypeScript 严格模式）
- 组件必须考虑 loading / error / empty 三种状态

## UI 生成边界
- 必须遵循 `design/active.md` 中定义的设计 Token
- 必须支持暗色模式（如 `design/active.md` 有定义）
- 必须考虑 mobile / tablet / desktop 三种响应式断点
- 图片必须有 alt，交互元素必须有 aria-label

## 运行时边界
- 禁止阻塞主线程超过 50ms 的计算
- 禁止在 `useEffect` 中进行无限制的轮询
- 错误边界（Error Boundary）必须覆盖所有路由级别组件
