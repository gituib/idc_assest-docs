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

路由不再在 `server.js` 中逐个 `app.use()` 注册，而是**配置驱动 + 自动挂载**：

```javascript
// backend/server.js
const loadRoutes = require('./utils/routeLoader');
loadRoutes(app);
```

```javascript
// backend/utils/routeLoader.js
const routesConfig = require('../config/routes');
routesConfig.forEach(routeConfig => {
  const router = require(path.join(routesDir, routeConfig.file));
  if (typeof router === 'function') {
    app.use(routeConfig.path, router);
  }
});
```

```javascript
// backend/config/routes.js —— 新增模块只需在此追加一项
const routesConfig = [
  { file: 'devices.js', path: '/api/devices' },
  { file: 'ipam.js', path: '/api/ipam' },
  // ...
];
```

**设计收益**：

| 收益 | 说明 |
|------|------|
| 单一事实来源 | 路由前缀集中定义，避免 `server.js` 膨胀 |
| 启动日志可观测 | 每个路由挂载成功/失败均输出日志 |
| 加载失败即中止 | 任一模块 `require` 失败会抛出并终止启动，避免静默漏挂 |

### 路由模块列表

| 路由文件 | 路由前缀 | 模块 | 主要接口 |
|----------|----------|------|----------|
| `routes/auth.js` | `/api/auth` | 认证 | 登录、注册、邮箱验证、找回密码、解锁、登出 |
| `routes/rooms.js` | `/api/rooms` | 机房 | CRUD + 平面图布局 |
| `routes/racks.js` | `/api/racks` | 机柜 | CRUD + U 位统计 + 导入导出 |
| `routes/devices.js` | `/api/devices` | 设备 | CRUD + 批量操作 + 导入导出 + 二维码 |
| `routes/deviceFields.js` | `/api/deviceFields` | 设备字段 | 自定义字段 CRUD 与排序 |
| `routes/devicePorts.js` | `/api/device-ports` | 设备端口 | CRUD + 分组查询 + 批量操作 |
| `routes/networkCards.js` | `/api/network-cards` | 网卡 | CRUD + 网卡端口关联 |
| `routes/portOptions.js` | `/api/port-options` | 端口选项 | 端口/速率/线缆类型枚举（免鉴权） |
| `routes/portDiscovery.js` | `/api/port-discovery` | 端口采集 | 交换机端口采集 discover / apply |
| `routes/serverDiscovery.js` | `/api/server-discovery` | 服务器采集 | Redfish 硬件清单 discover / apply |
| `routes/deviceCredentials.js` | `/api/device-credentials` | 采集凭据 | 凭据 CRUD + 连通性测试 |
| `routes/cables.js` | `/api/cables` | 线缆 | CRUD + 冲突检测 + 批量创建 |
| `routes/ipam.js` | `/api/ipam` | IPAM | 网段 / IP / 绑定 / 探测 / 调度 |
| `routes/tickets.js` | `/api/tickets` | 工单 | CRUD + 状态流转 + 快速报修 |
| `routes/ticketCategories.js` | `/api/ticket-categories` | 故障分类 | CRUD |
| `routes/ticketFields.js` | `/api/ticket-fields` | 工单字段 | 自定义字段 |
| `routes/consumables.js` | `/api/consumables` | 耗材 | CRUD + 出入库 + SN 追踪 |
| `routes/consumableRecords.js` | `/api/consumable-records` | 耗材记录 | 领用入库明细 |
| `routes/consumableCategories.js` | `/api/consumable-categories` | 耗材分类 | CRUD |
| `routes/consumableImport.js` | `/api` | 耗材导入 | 批量导入（独立挂载到 `/api`） |
| `routes/inventory.js` | `/api/inventory` | 盘点 | 计划 / 任务 / 记录 |
| `routes/idleDevices.js` | `/api/idle-devices` | 空闲设备 | 转入 / 上架 / 恢复 / 删除 |
| `routes/warehouses.js` | `/api/warehouses` | 库房 | CRUD + 库房内设备 |
| `routes/users.js` | `/api/users` | 用户 | CRUD + 审核 + 头像 |
| `routes/roles.js` | `/api/roles` | 角色 | CRUD + 权限分配 |
| `routes/permissions.js` | `/api/permissions` | 权限 | 权限字典查询 |
| `routes/topology.js` | `/api/topology` | 拓扑 | 拓扑查询 + 布局持久化 |
| `routes/systemSettings.js` | `/api/system-settings` | 系统设置 | 参数 / SMTP / 备份 / 监控 / 版本 |
| `routes/background.js` | `/api/background` | 背景设置 | 登录页背景 |
| `routes/images.js` | `/api/images` | 图片 | 设备/耗材图片上传 |
| `routes/backup.js` | `/api/backup` | 备份 | 创建 / 恢复 / 下载 / 远端备份 |
| `routes/statistics.js` | `/api/statistics` | 统计 | 仪表盘 / 趋势 / 功率 |
| `routes/operationLogs.js` | `/api/operation-logs` | 操作日志 | 查询 / 字典 / 统计 |
| `routes/dangerousOperations.js` | `/api/dangerous-operations` | 危险操作 | 高危操作审计 |
| `routes/frontendLogs.js` | `/api/frontend-logs` | 前端日志 | 前端错误上报（免鉴权） |
| `routes/public.js` | `/p` | 公开页面 | 免鉴权设备信息牌 HTML |

### 统一响应格式

多数 API 响应使用以下 JSON 格式：

```javascript
// 成功响应
{ "success": true, "data": { ... }, "message": "操作成功" }

// 失败响应
{ "success": false, "message": "错误描述" }

// 分页响应
{ "success": true, "data": { "list": [...], "total": 100, "page": 1, "pageSize": 20 } }
```

> **已知不一致**：以下模块不使用上述包装格式，对接时需单独处理
>
> | 模块 | 实际格式 |
> |------|----------|
> | 系统设置单键读取 | `{ key, value, type, category, isEditable, updatedAt }` |
> | 库房 / 空闲设备 | `{ total, warehouses\\|idleDevices\\|devices, page, pageSize }` |
> | IPAM 分页 | `data.pagination.{page, pageSize, total, totalPages}` |
> | `/api` 404 兜底 | `{ success: false, error: { code, message } }` |
>
> 这是历史演进遗留问题，新增模块应统一使用标准包装格式。

## 后端项目结构

```
backend/
├── config/
│   ├── routes.js              # 路由挂载配置（routeLoader 消费）
│   ├── portOptions.js         # 端口/线缆类型枚举（单一来源）
│   └── remote-backup-configs.json
├── middleware/
│   ├── auth.js                # JWT 验证 + requireAdmin
│   ├── requirePermission.js   # 权限码校验，支持通配
│   ├── maintenance.js         # 维护模式拦截
│   ├── apiRateLimit.js        # 写接口滑动窗口限流
│   ├── errorSanitizer.js      # 错误脱敏
│   ├── validation.js          # Joi 参数校验
│   └── requestLogger.js       # 请求日志
├── models/                    # Sequelize 模型（35 个）
│   ├── Device.js / Rack.js / Room.js
│   ├── DevicePort.js / NetworkCard.js / Cable.js
│   ├── DeviceCredential.js    # 采集凭据（加密字段）
│   ├── Subnet.js / IpAddress.js  # IPAM
│   ├── Ticket.js / FaultCategory.js
│   ├── Consumable.js / ConsumableLog.js
│   ├── InventoryPlan.js / InventoryTask.js / InventoryRecord.js
│   ├── Warehouse.js / PendingDevice.js
│   ├── User.js / Role.js / Permission.js / UserRole.js
│   ├── OperationLog.js / SystemSetting.js / BackupLog.js
│   └── TopologyLayout.js
├── routes/                    # 36 个路由模块
├── services/
│   ├── portDiscovery/         # 交换机端口采集（drivers / parser / mapper / vendorDetect）
│   ├── serverDiscovery/       # Redfish 采集
│   ├── ipProbe.js             # IP 在线探测（Ping + TCP）
│   ├── mailer.js              # SMTP 邮件
│   └── verifyCode.js          # 验证码（进程内，分 scene 隔离）
├── scripts/
│   ├── migrate-all.js         # 迁移汇总（幂等可重跑）
│   ├── migrations/            # 各版本迁移脚本
│   ├── init-permissions.js    # 权限种子（幂等 upsert）
│   ├── init-database.js
│   └── create-admin.js
├── utils/
│   ├── routeLoader.js         # 路由自动挂载
│   ├── crypto.js              # AES-256-GCM 加解密
│   ├── logger.js              # Winston 封装（支持模块级与采样）
│   ├── operationLogger.js     # 操作日志记录
│   ├── dangerousOperationLogger.js
│   ├── maintenanceMode.js
│   └── healthCheck.js
├── validation/                # Joi Schema
├── tests/                     # Jest 单测
├── server.js                  # 服务入口
└── db.js                      # 数据库连接
```
