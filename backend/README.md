# AI-Efficiency 后台管理系统

基于 **Golang + Gin + PostgreSQL** 的后台管理 API 服务。

## 技术栈

- **语言**: Go 1.23+
- **Web 框架**: Gin
- **ORM**: GORM
- **数据库**: PostgreSQL
- **认证**: JWT (golang-jwt)
- **密码加密**: bcrypt

## 项目结构

```
backend/
├── cmd/server/          # 入口
├── internal/
│   ├── config/          # 配置
│   ├── handler/         # HTTP 处理器
│   ├── middleware/      # 中间件
│   ├── model/           # 数据模型
│   ├── repository/      # 数据访问层
│   └── service/         # 业务逻辑层
├── Dockerfile
├── docker-compose.yml
├── go.mod
└── Makefile
```

## 快速启动

### 方式一：Docker Compose（推荐）

```bash
cd backend
cp .env.example .env
docker-compose up -d
```

### 方式二：本地开发

```bash
# 1. 安装依赖
cd backend
go mod download

# 2. 配置环境
cp .env.example .env
# 编辑 .env 配置数据库连接

# 3. 启动服务
go run cmd/server/main.go
```

## API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |

### 用户管理（需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/users` | 用户列表（支持分页、搜索） |
| GET | `/api/v1/users/:id` | 用户详情 |
| POST | `/api/v1/users` | 创建用户 |
| PUT | `/api/v1/users/:id` | 更新用户 |
| DELETE | `/api/v1/users/:id` | 删除用户 |

## 认证方式

所有需要认证的接口需在 Header 中携带：

```
Authorization: Bearer <token>
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| DB_HOST | localhost | 数据库主机 |
| DB_PORT | 5432 | 数据库端口 |
| DB_USER | postgres | 数据库用户 |
| DB_PASSWORD | postgres | 数据库密码 |
| DB_NAME | ai_efficiency | 数据库名 |
| JWT_SECRET | ai-efficiency-secret-key-2026 | JWT 密钥 |
| JWT_EXPIRE | 24 | Token 过期时间（小时） |
| PORT | 8080 | 服务端口 |

## 后续计划

- [ ] Excel/CSV 数据导入功能
- [ ] 团队管理
- [ ] 角色权限（RBAC）
- [ ] 操作日志
