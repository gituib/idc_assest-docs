# 后端架构

## 服务入口

后端入口文件为 `server.js`，通过 `initializeApp()` 函数完成服务启动前的所有初始化工作。

### 服务初始化流程

```javascript
async function initializeApp() {
  // 1. 数据库同步
  await syncDatabase();
  // 2. 初始化设备自定义字段
  await initDeviceFields();
  // 3. 初始化工单自定义字段
  await initTicketFields();
  // 4. 同步耗材模型
  await syncConsumableModels();
  // 5. 同步盘点模型
  await syncInventoryModels();
  // 6. 初始化系统设置
  await initDefaultSystemSettings();
  // 7. 初始化故障分类
  await initFaultCategories();
  // 8. 初始化自动备份调度器
  await initAutoBackupScheduler();
}
```

**各步骤说明：**

| 步骤 | 函数 | 说明 |
|------|------|------|
| 1 | `syncDatabase()` | 同步 Sequelize 模型到数据库，创建/更新表结构 |
| 2 | `initDeviceFields()` | 写入设备模块的默认自定义字段配置到数据库 |
| 3 | `initTicketFields()` | 写入工单模块的默认自定义字段配置到数据库 |
| 4 | `syncConsumableModels()` | 同步耗材相关模型的表结构 |
| 5 | `syncInventoryModels()` | 同步盘点相关模型的表结构 |
| 6 | `initDefaultSystemSettings()` | 写入系统默认设置参数到数据库 |
| 7 | `initFaultCategories()` | 初始化预定义的故障分类数据 |
| 8 | `initAutoBackupScheduler()` | 根据配置启动自动备份的定时任务 |

> 所有初始化操作完成后，控制台输出 `所有初始化完成，服务器准备就绪` 表示服务已就绪。

### 启动流程时序

```
npm start → server.js
              │
              ▼
        加载环境变量 (.env)
              │
              ▼
        初始化数据库连接 (db.js)
              │
              ▼
        注册中间件链
              │
              ▼
        注册路由模块
              │
              ▼
        initializeApp()
              │
              ▼
        服务监听端口 :8000
              │
              ▼
        API 服务就绪
```

## 中间件层

系统使用 Express 中间件机制，请求按注册顺序依次经过各中间件处理。

### 中间件链

```
请求 → CORS → auth → maintenance → validation → requestLogger → routes → response
```

### 中间件详情

| 中间件 | 文件 | 功能描述 |
|--------|------|----------|
| **CORS** | 内置 | 配置跨域资源共享，允许前端域名跨域访问 API |
| **authMiddleware** | `middleware/auth.js` | JWT 令牌解析和验证，从请求头 `Authorization: Bearer <token>` 提取 Token，验证签名和有效期，将用户信息附加到 `req.user` |
| **maintenanceMiddleware** | `middleware/maintenance.js` | 系统维护模式拦截器，从数据库读取维护模式状态，非管理员在维护模式下无法访问系统 |
| **validationMiddleware** | `middleware/validation.js` | 使用 Joi 验证请求参数，匹配预定义的验证 Schema，对 body/query/params 进行格式校验 |
| **requestLogger** | `middleware/logger.js` | 使用 Winston 记录 HTTP 请求，记录请求方法、路径、状态码、响应耗时 |

### 中间件执行顺序

```
1. CORS — 处理跨域请求头
2. express.json() — 解析 JSON 请求体
3. express.urlencoded() — 解析 URL-encoded 请求体
4. authMiddleware — 验证用户身份（公开路由跳过）
5. maintenanceMiddleware — 检查维护模式
6. validationMiddleware — 校验请求参数
7. requestLogger — 记录请求日志
8. 路由处理 — 执行业务逻辑
9. 错误处理中间件 — 全局异常捕获
```

### 全局错误处理

系统在中间件链末尾注册了全局错误处理中间件，统一捕获所有未被处理的异常，返回标准 JSON 格式的错误响应：

```json
{ "success": false, "message": "错误描述", "code": "ERROR_CODE" }
```

## 数据库连接

### 配置方式

数据库连接管理在 `db.js` 中，通过 `DB_TYPE` 环境变量切换数据库类型。

| 数据库 | 环境变量 | 适用场景 |
|--------|----------|----------|
| **SQLite** | `DB_TYPE=sqlite` | 开发环境、单机部署、小型站点 |
| **MySQL** | `DB_TYPE=mysql` | 生产环境、多机部署、高并发场景 |

### SQLite 配置

```bash
DB_TYPE=sqlite
DB_PATH=./idc_management.db  # 数据库文件路径
```

- 零配置，无需额外安装数据库服务
- 数据库文件存储在项目根目录

### MySQL 配置

```bash
DB_TYPE=mysql
MYSQL_HOST=localhost          # Docker 部署时使用服务名: mysql
MYSQL_PORT=3306
MYSQL_USERNAME=idc_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=idc_management
```

- 生产环境推荐，支持高并发和多用户访问
- Docker 部署时 `MYSQL_HOST` 需设为 Docker 服务名 `mysql`
- 数据库需提前创建：`CREATE DATABASE idc_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

### 连接管理

`db.js` 负责创建 Sequelize 实例，根据配置选择 SQLite 或 MySQL 驱动，并处理连接池管理（MySQL 模式）：

- 默认连接池大小：5
- 连接超时：15000ms
- 查询超时：15000ms

## 路由模块

### 注册机制

路由模块在 `routes/` 目录下按业务模块拆分，每个模块独立文件。在 `server.js` 中通过以下方式统一注册：

```javascript
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/racks', rackRoutes);
app.use('/api/devices', deviceRoutes);
// ... 其他模块
```

### 路由模块列表

| 路由文件 | 路由前缀 | 模块 | 主要接口 |
|----------|----------|------|----------|
| `routes/auth.js` | `/api/auth` | 认证 | POST login, POST register, POST refresh |
| `routes/rooms.js` | `/api/rooms` | 机房 | CRUD + 平面图布局 |
| `routes/racks.js` | `/api/racks` | 机柜 | CRUD + U 位统计 |
| `routes/devices.js` | `/api/devices` | 设备 | CRUD + 批量导入/导出 + 自定义字段 |
| `routes/ports.js` | `/api/ports` | 端口 | CRUD + 网卡绑定 |
| `routes/cables.js` | `/api/cables` | 线缆 | CRUD + 连接管理 |
| `routes/tickets.js` | `/api/tickets` | 工单 | CRUD + 状态流转 |
| `routes/consumables.js` | `/api/consumables` | 耗材 | CRUD + 入库/领用 + SN 追踪 |
| `routes/inventory.js` | `/api/inventory` | 盘点 | 计划/任务/记录 CRUD |
| `routes/backup.js` | `/api/backup` | 备份 | 创建/恢复/下载/配置 |
| `routes/users.js` | `/api/users` | 用户 | CRUD + 角色权限 |
| `routes/settings.js` | `/api/settings` | 系统设置 | 系统参数 |
| `routes/logs.js` | `/api/logs` | 操作日志 | 查询/统计/导出 |

### 统一响应格式

所有 API 响应统一使用以下 JSON 格式：

```javascript
// 成功响应
{ "success": true, "data": { ... }, "message": "操作成功" }

// 失败响应
{ "success": false, "message": "错误描述", "code": "ERROR_CODE" }

// 分页响应
{ "success": true, "data": { "list": [...], "total": 100, "page": 1, "pageSize": 20 } }
```

## 后端项目结构

```
backend/
├── config/                    # 配置模块
│   ├── database.js            # 数据库配置
│   └── remote-backup-configs.json  # 远程备份配置
├── middleware/                # 中间件
│   ├── auth.js                # JWT 身份验证
│   ├── maintenance.js         # 维护模式拦截
│   ├── validation.js          # 参数校验
│   └── logger.js              # 请求日志
├── models/                    # Sequelize 数据模型
│   ├── Room.js                # 机房模型
│   ├── Rack.js                # 机柜模型
│   ├── Device.js              # 设备模型
│   ├── Ticket.js              # 工单模型
│   ├── Consumable.js          # 耗材模型
│   └── ...                    # 其他模型
├── routes/                    # API 路由
│   ├── auth.js                # 认证路由
│   ├── rooms.js               # 机房路由
│   ├── devices.js             # 设备路由
│   └── ...                    # 其他路由
├── scripts/                   # 数据库脚本
├── utils/                     # 工具函数
├── validation/                # Joi 验证 Schema
├── tests/                     # 测试文件
├── server.js                  # 服务入口
└── db.js                      # 数据库连接
```
