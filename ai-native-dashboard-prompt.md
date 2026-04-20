# AI-Native 效能看板 —— 完整构建提示词

---

## 🎯 项目背景与目标

你是一名资深全栈工程师，需要为一个拥有 100+ 成员的技术部门构建一套 **AI-Native 开发效能晾晒看板**。

**核心目标**：
1. 通过数据晾晒（公开排名与统计），激励部门成员积极使用 AI 工具，提升 AI-Native 开发效率
2. 统计每个人的 Token 使用量、AI 辅助代码提交占比等关键指标
3. 平台后续可扩展，支持构建**模拟员工数字形象**，实时观察员工工作状态

---

## 🏗️ 技术栈参考

参考 [velodb/ai-observe-stack](https://github.com/velodb/ai-observe-stack) 项目架构，该项目集成了：
- **Apache Doris** — 高性能 MPP 分析型数据库，用于存储可观测性数据
- **OpenTelemetry Collector** — 遥测数据收集（Traces / Metrics / Logs）
- **Grafana + Doris App Plugin** — 数据可视化与仪表板
- **部署方式**：Docker Compose / Kubernetes Helm Charts

> 请在此基础上，结合以下业务需求，设计并实现本项目的技术方案。

---

## 📊 看板模块详细需求

### 模块一：实时全员 Token 使用量排行榜

| 属性 | 说明 |
|------|------|
| **展示形式** | 排行榜（实时滚动） |
| **数据来源** | Costrict OpenAPI |
| **刷新频率** | 每 60 秒刷新一次 |
| **重置策略** | 每天 0 点重置每人的 Token 累计使用量 |
| **展示内容** | 姓名、头像/工号、当日 Token 累计使用总量、排名变化趋势 |

**实现要求**：
- Costrict 需提供 OpenAPI 接口，支持查询每个人的 Token 使用量
- 后端服务每 60 秒通过定时任务拉取最新数据并写入 Doris
- 前端通过 WebSocket 或轮询获取最新排行数据，实时展示
- 排行榜样式参考 B 站、抖音等产品的实时榜单 UI，要有动效

---

### 模块二：PR 硅含量统计

| 属性 | 说明 |
|------|------|
| **展示形式** | 饼状图 |
| **数据来源** | GitLab Merged MR API |
| **统计周期** | 最近 30 天 |
| **核心指标** | AI 协助完成的代码改动行数 vs 非 AI 的代码改动行数 |

**PR 硅含量定义**：由 AI 协助完成、并最终在 GitLab 合入的代码

**实现要求**：
- GitLab 合并请求标题中需包含 `[AI]` 标签（示例：`[AI] feat: 新增用户登录功能`）
- 后端定时拉取 GitLab Merged MR 列表，识别带 `[AI]` 标签的 MR，统计其 `additions + deletions` 行数
- 饼状图展示：
  - 🔵 AI 协助代码行数（硅含量）
  - ⚪ 非 AI 代码行数
  - 中间显示硅含量百分比

---

### 模块三：AI 开发环境部署耗时

| 属性 | 说明 |
|------|------|
| **展示形式** | 折线图 |
| **数据来源** | 部署脚本上报的 Hook 数据 |
| **统计内容** | 每个 AI 开发环境的历次部署耗时趋势 |

**支持场景**：通过 K8S 或 Docker 部署的 AI 开发环境

**实现要求**：
- 部署脚本增加 Hook 功能，在部署开始/结束时上报指标到看板服务接口
- 上报数据格式：
  ```json
  {
    "env_name": "ai-env-prod-001",
    "deploy_id": "uuid",
    "start_time": "ISO8601",
    "end_time": "ISO8601",
    "duration_seconds": 120,
    "status": "success|failed",
    "trigger_by": "username"
  }
  ```
- 折线图展示各环境最近 N 次部署的耗时曲线，支持多环境对比
- 支持按环境名称筛选

---

### 模块四：各团队 AI 使用比例

| 属性 | 说明 |
|------|------|
| **展示形式** | 百分比堆叠柱状图 |
| **数据来源** | Costrict OpenAPI |
| **统计周期** | 当天（每日 0 点重置） |
| **使用 AI 判定阈值** | 当日 Token 使用量 ≥ 10,000 |

**实现要求**：
- 从 Costrict API 获取每人当天 Token 使用量，按团队（一级/二级部门）分组
- 每个柱子代表一个团队，分为：
  - 🟢 已使用 AI（Token ≥ 10,000）的人数比例
  - 🔴 未使用 AI 的人数比例
- 支持悬浮 Tooltip 显示具体人数
- 每天 0 点后第一次查询时自动重置并重新统计

---

### 模块五：项目提效估算

| 属性 | 说明 |
|------|------|
| **展示形式** | 分组柱状图（每 10 秒轮播切换项目） |
| **数据来源** | 企微文档《AI Native 项目提效估算表》 |
| **统计维度** | 需求 / 设计 / 编码 / 测试 / 端到端 |

**实现要求**：
- 解析企微文档（腾讯文档）中的《AI Native 项目提效估算表》结构化数据
- 每个项目展示一组分组柱状图，对比各阶段：
  - 🔵 AI 协助方式的人天数
  - 🟠 传统方式的人天数
- 每 10 秒自动轮播切换到下一个项目，支持手动翻页
- 柱状图顶部显示提效百分比（如 "节省 35%"）

---

## 🛠️ 后台管理系统

**目的**：用于纠偏指标，管理员可手动修正异常数据

**功能列表**：

| 功能模块 | 说明 |
|----------|------|
| **数据纠偏** | 手动修正某人某天的 Token 使用量（防止数据异常影响排行） |
| **黑名单管理** | 将机器人账号、测试账号从排行榜中排除 |
| **团队管理** | 维护成员与团队的对应关系，支持增删改查 |
| **PR 标签审核** | 查看并手动标记/取消某个 MR 的 AI 标签 |
| **阈值配置** | 动态调整"AI使用判定阈值"（默认 10,000 Token） |
| **数据源配置** | 配置 Costrict API Key、GitLab Access Token 等 |
| **公告管理** | 在看板首页发布激励公告/周报 |

---

## 🚀 整体技术架构设计

请参照以下架构进行设计：

```
┌─────────────────────────────────────────────────────────┐
│                    数据源层                              │
│  Costrict API  │  GitLab API  │  K8S/Docker Hook  │  腾讯文档 API │
└────────────────────────┬────────────────────────────────┘
                         │ 数据采集
┌────────────────────────▼────────────────────────────────┐
│              OpenTelemetry Collector                     │
│  （负责接收 Hook 上报数据，统一格式化后写入 Doris）        │
└────────────────────────┬────────────────────────────────┘
                         │ 存储
┌────────────────────────▼────────────────────────────────┐
│                  Apache Doris                            │
│  token_usage_daily | pr_silicon | deploy_metrics | ...  │
└────────────────────────┬────────────────────────────────┘
                         │ 查询 / API
┌────────────────────────▼────────────────────────────────┐
│              后端服务（Go / Python / Node.js）           │
│  REST API + 定时任务调度（Cron）+ WebSocket 推送         │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌──────────┐   ┌──────────┐   ┌──────────────┐
   │  前端看板  │   │  Grafana  │   │  后台管理系统 │
   │ (React)  │   │ Dashboard │   │  (React Admin)│
   └──────────┘   └──────────┘   └──────────────┘
```

---

## 📦 前端看板 UI 规范

### 整体风格
- 深色科技风格（Dark Theme），背景色 `#0D1117` 或 `#0A0E1A`
- 主色调：电光蓝 `#00D4FF`，辅色：紫色 `#7C3AED`，警示色：橙色 `#F59E0B`
- 字体：数字使用等宽字体（如 JetBrains Mono），文本使用 Inter 或 PingFang SC
- 卡片式布局，带发光边框效果（glow border）

### 看板布局（大屏 1920×1080）
```
┌────────────────────────────────────────────────┐
│              顶部：标题 + 时间 + 跑马灯公告      │
├─────────────────┬──────────────────────────────┤
│                 │   模块二：PR 硅含量（饼图）    │
│  模块一：        ├──────────────────────────────┤
│  Token 排行榜   │   模块四：各团队 AI 使用比例   │
│  （左侧主角）   │   （百分比柱状图）            │
├─────────────────┼──────────────────────────────┤
│  模块三：AI 开发环境部署耗时（折线图）           │
├────────────────────────────────────────────────┤
│  模块五：项目提效估算（分组柱状图，10s轮播）      │
└────────────────────────────────────────────────┘
```

### 图表库推荐
- **ECharts 5.x**（首选，适合大屏可视化，支持丰富动效）
- 排行榜使用自定义滚动动画组件

---

## 🗄️ 数据库表设计（Apache Doris）

```sql
-- Token 使用量每日明细
CREATE TABLE token_usage_daily (
    user_id       VARCHAR(64),
    user_name     VARCHAR(128),
    team_id       VARCHAR(64),
    team_name     VARCHAR(128),
    date          DATE,
    total_tokens  BIGINT DEFAULT 0,
    updated_at    DATETIME,
    PRIMARY KEY (user_id, date)
) ENGINE=OLAP UNIQUE KEY(user_id, date);

-- PR 硅含量明细
CREATE TABLE pr_silicon (
    mr_id         BIGINT,
    project_id    BIGINT,
    title         VARCHAR(512),
    is_ai         BOOLEAN DEFAULT FALSE,
    additions     INT DEFAULT 0,
    deletions     INT DEFAULT 0,
    merged_at     DATETIME,
    author_name   VARCHAR(128),
    PRIMARY KEY (mr_id)
) ENGINE=OLAP UNIQUE KEY(mr_id);

-- AI 开发环境部署耗时
CREATE TABLE deploy_metrics (
    deploy_id         VARCHAR(64),
    env_name          VARCHAR(256),
    duration_seconds  INT,
    status            VARCHAR(32),
    trigger_by        VARCHAR(128),
    start_time        DATETIME,
    end_time          DATETIME,
    PRIMARY KEY (deploy_id)
) ENGINE=OLAP UNIQUE KEY(deploy_id);

-- 项目提效估算
CREATE TABLE project_efficiency (
    project_id    VARCHAR(64),
    project_name  VARCHAR(256),
    phase         VARCHAR(64),  -- 需求/设计/编码/测试/端到端
    ai_days       DECIMAL(10,2),
    traditional_days DECIMAL(10,2),
    updated_at    DATETIME,
    PRIMARY KEY (project_id, phase)
) ENGINE=OLAP UNIQUE KEY(project_id, phase);
```

---

## 🔌 API 接口设计

### 看板数据接口

```
GET  /api/v1/ranking/token-today          # 当日 Token 排行榜（Top N）
GET  /api/v1/charts/pr-silicon            # PR 硅含量饼图数据
GET  /api/v1/charts/deploy-metrics        # AI 开发环境部署耗时
GET  /api/v1/charts/team-ai-usage         # 各团队 AI 使用比例
GET  /api/v1/charts/project-efficiency    # 项目提效估算数据
WS   /ws/ranking/token-today              # 实时 Token 排行 WebSocket
```

### 数据上报接口（供脚本调用）

```
POST /api/v1/ingest/deploy-metrics        # 上报部署耗时
POST /api/v1/ingest/project-efficiency    # 上报项目提效数据
```

### 后台管理接口

```
PUT  /api/admin/token-correction          # 纠偏 Token 数据
POST /api/admin/blacklist                 # 添加黑名单账号
GET  /api/admin/config                    # 获取系统配置
PUT  /api/admin/config                    # 更新系统配置
```

---

## 🌱 未来扩展：员工数字形象

> 后续阶段可扩展的能力，请在架构设计时预留接口：

- **数字员工画像**：基于 Token 使用量、代码提交频率、活跃时间段等数据，为每位成员生成实时"工作状态"可视化形象
- **工作状态推断**：通过 AI 分析工作模式（如：高 Token 使用 + 大量提交 = "高强度编码中"），生成状态标签
- **3D/2D 虚拟形象**：使用 Three.js 或 Lottie 动画，在排行榜中显示员工的动态虚拟形象
- **实时协作地图**：可视化展示各团队当前的工作热度地图

---

## ✅ 执行要求

1. **完整实现**以上所有看板模块，包含前端 + 后端 + 数据库
2. **Docker Compose 一键部署**，参照 velodb/ai-observe-stack 的部署方式
3. 前端使用 **React + TypeScript + ECharts**，支持全屏展示
4. 后端提供完整的 **OpenAPI (Swagger) 文档**
5. 包含 **Mock 数据模式**，在没有真实数据源时可展示演示效果
6. 数据库使用 **Apache Doris**，参照参考仓库的集成方式
7. 后台管理系统使用 **React Admin** 或类似框架快速搭建
8. 代码需包含详细注释，关键配置通过**环境变量**注入

---

*本提示词生成时间：2026-03-30*
