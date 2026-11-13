# 系统架构

## 整体架构

```
┌─────────────────────────────────────────────┐
│              客户端层 (Client)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  浏览器   │  │  移动端   │  │  Web App │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│             前端层 (React + Vite)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ 页面组件  │ │ 通用组件  │ │ 状态管理  │     │
│  └──────────┘ └──────────┘ └──────────┘     │
└──────────────────┬──────────────────────────┘
                   │ RESTful API
                   ▼
┌─────────────────────────────────────────────┐
│             后端层 (Express.js)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ 中间件层  │ │  路由层   │ │ 业务逻辑  │     │
│  └──────────┘ └──────────┘ └──────────┘     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           数据层 (Sequelize ORM)             │
│        SQLite (开发) / MySQL (生产)          │
└─────────────────────────────────────────────┘
```

## 前端架构

- **框架**: React 18 (18.2.0) + Vite 4 (4.4.9)
- **UI**: Ant Design 5 (5.8.6)
- **3D**: Three.js (0.183.2) + @react-three/fiber (8.18.0)
- **状态管理**: React Context + Zustand
- **数据请求**: SWR + Axios
- **路由**: React Router 6

### 前端项目结构

```
frontend/
├── public/                    # 静态公共资源
│   ├── assets/3d/            # 3D环境贴图
│   └── png/                   # 设备图标
├── src/
│   ├── api/                   # API接口封装
│   ├── components/            # React组件库
│   │   ├── 3d/               # 3D可视化组件
│   │   ├── dashboard/        # 数据看板组件
│   │   ├── device/           # 设备管理组件
│   │   ├── floorplan/        # 机房平面图组件
│   │   ├── rack/             # 机柜组件
│   │   └── topology/         # 网络拓扑组件
│   ├── config/                # 配置文件
│   ├── constants/             # 常量定义
│   ├── context/               # React Context（状态管理）
│   ├── hooks/                 # 自定义Hooks
│   ├── pages/                 # 页面组件
│   ├── styles/                # 样式文件
│   └── utils/                 # 工具函数
```

## 后端架构

- **框架**: Express.js (4.18.2)
- **ORM**: Sequelize 6 (6.37.8)
- **认证**: JWT (jsonwebtoken 9.0.3)
- **验证**: Joi
- **日志**: Winston
- **定时任务**: node-cron

### 后端项目结构

```
backend/
├── config/                    # 配置模块
├── middleware/                # 中间件
├── models/                    # Sequelize数据模型
├── routes/                    # API路由
├── scripts/                   # 数据库脚本
├── utils/                     # 工具函数
├── validation/                # Joi验证Schema
├── tests/                     # 测试文件
├── server.js                  # 服务入口
└── db.js                      # 数据库连接
```

### 中间件链

实际注册顺序（`backend/server.js`）：

```
请求
  → sanitizeServerErrors     错误脱敏
  → apiRateLimitMiddleware   写接口频率限制
  → CORS
  → express.json / fileUpload
  → requestLogger            请求日志
  → [启动完成后] 认证中间件（含公开端点白名单）
  → maintenanceMiddleware    维护模式
  → loadRoutes(app)          业务路由（按 config/routes.js 挂载）
  → /api 404 JSON 兜底
  → errorHandlerMiddleware   统一错误处理
```

| 中间件 | 功能描述 |
|--------|----------|
| **sanitizeServerErrors** | 拦截服务端异常，避免 `error.message` 原文返回客户端 |
| **apiRateLimitMiddleware** | 按 IP + 路由分组的滑动窗口限流（15 分钟窗口，单路由 300 次 / 单 IP 1000 次），仅作用于 POST/PUT/PATCH/DELETE |
| **CORS** | 跨域配置，由 `CORS_ORIGINS` 环境变量控制白名单 |
| **requestLogger** | HTTP 请求日志记录（方法、路径、状态码、耗时） |
| **authMiddleware** | JWT 令牌验证与用户身份解析，挂在 `app.use('/api', ...)` |
| **maintenanceMiddleware** | 系统维护模式拦截，非管理员无法访问业务接口 |
| **requirePermission** | 路由级权限码校验（`模块:操作`），支持 `*` 与 `模块:*` 通配 |
| **requireAdmin** | 超管专属校验 |
| **validation（Joi）** | `validateBody` / `validateQuery` 校验请求体与查询参数 |
| **errorHandlerMiddleware** | 统一错误出口，必须在所有路由之后注册 |

### 认证白名单机制

全局认证通过 `PUBLIC_ENDPOINTS` 实现**精确 `method + path` 匹配**的免鉴权白名单：

| 方法 | 路径 |
|------|------|
| POST | `/api/auth/login` |
| POST | `/api/auth/register` |
| POST | `/api/auth/check-admin` |
| POST | `/api/auth/forgot-password/send-code` |
| POST | `/api/auth/forgot-password/reset` |
| POST | `/api/auth/unlock` |
| GET | `/api/port-options` |
| GET | `/api/maintenance/status` |
| GET | `/api/system-settings/system/info` |
| POST | `/api/frontend-logs` |

> **安全约束**：白名单**不可**改回前缀匹配。旧实现按整棵子树放行，导致 `/api/maintenance/disable` 等写端点可匿名访问。当前实现要求精确匹配，新增免鉴权端点须显式登记。

### 路由挂载机制

路由不再逐个 `app.use()` 注册，而是由 `utils/routeLoader.js` 读取 `config/routes.js` 集中挂载：

```js
// backend/config/routes.js
const routesConfig = [
  { file: 'devices.js', path: '/api/devices' },
  { file: 'ipam.js', path: '/api/ipam' },
  // ...
];
```

新增路由模块只需在此数组追加一项，`routeLoader` 会自动 `require` 并挂载，同时输出启动日志便于确认。

### 服务初始化流程

```javascript
async function initializeApp() {
  // 1. 数据库同步
  await syncDatabase();
  // 2. 自定义字段初始化
  await initDeviceFields();      // 初始化设备扩展字段
  await initTicketFields();      // 初始化工单扩展字段
  // 3. 数据模型同步
  await syncConsumableModels();  // 同步耗材模型
  await syncInventoryModels();   // 同步盘点模型
  // 4. 系统基础数据初始化
  await initDefaultSystemSettings(); // 初始化系统设置
  await initFaultCategories();       // 初始化故障分类
  // 5. 定时任务启动
  await initAutoBackupScheduler();   // 初始化自动备份调度器
}
```

### 路由模块

完整的 RESTful API 路由，覆盖所有业务模块（以 `backend/config/routes.js` 为准）：

| 路由前缀 | 模块 | 功能 |
|----------|------|------|
| `/api/auth` | 认证 | 登录、注册、邮箱验证、找回密码、注销 |
| `/api/rooms` | 机房 | 机房 CRUD |
| `/api/racks` | 机柜 | 机柜 CRUD、容量统计、导入导出 |
| `/api/devices` | 设备 | 设备全生命周期 CRUD、批量操作、导入导出、二维码 |
| `/api/deviceFields` | 设备字段 | 自定义字段管理 |
| `/api/device-ports` | 设备端口 | 端口 CRUD、分组查询、批量操作、导出 |
| `/api/network-cards` | 网卡 | 网卡 CRUD、网卡端口关联 |
| `/api/port-options` | 端口选项 | 端口/线缆类型枚举（免鉴权） |
| `/api/port-discovery` | 端口采集 | 交换机端口自动采集与差异落库 |
| `/api/server-discovery` | 服务器采集 | Redfish 带外硬件清单采集 |
| `/api/device-credentials` | 采集凭据 | SSH/SNMP/Telnet/Redfish 凭据管理 |
| `/api/cables` | 线缆 | 接线管理、冲突检测 |
| `/api/ipam` | IPAM | 网段规划、IP 分配与绑定、在线探测、定时调度 |
| `/api/tickets` | 工单 | 工单全流程 |
| `/api/ticket-categories` | 故障分类 | 工单分类管理 |
| `/api/ticket-fields` | 工单字段 | 工单自定义字段 |
| `/api/consumables` | 耗材 | 耗材库存、出入库、SN 追踪 |
| `/api/consumable-records` | 耗材记录 | 领用/入库明细 |
| `/api/consumable-categories` | 耗材分类 | 分类管理 |
| `/api/inventory` | 盘点 | 盘点计划、任务、记录 |
| `/api/idle-devices` | 空闲设备 | 转入、上架、恢复、删除 |
| `/api/warehouses` | 库房 | 库房 CRUD 与库房内设备 |
| `/api/users` | 用户 | 用户管理、审核、头像 |
| `/api/roles` | 角色 | 角色 CRUD 与权限分配 |
| `/api/permissions` | 权限 | 权限树查询 |
| `/api/topology` | 拓扑 | 网络拓扑查询与布局持久化 |
| `/api/system-settings` | 系统设置 | 系统参数、SMTP、备份、监控、版本检查 |
| `/api/background` | 背景设置 | 登录页背景 |
| `/api/images` | 图片 | 设备/耗材图片上传 |
| `/api/backup` | 备份 | 本地/远端备份管理与恢复 |
| `/api/statistics` | 统计 | 仪表盘、趋势、功率分析 |
| `/api/operation-logs` | 操作日志 | 审计日志查询、字典、统计 |
| `/api/dangerous-operations` | 危险操作 | 高危操作审计与风险评估 |
| `/api/frontend-logs` | 前端日志 | 前端错误上报（免鉴权 + IP 限流） |
| `/p` | 公开页面 | 免鉴权设备信息牌 |

> **路径易错点**：端口、日志、系统设置的实际前缀分别为 `/api/device-ports`、`/api/operation-logs`、`/api/system-settings`，早期文档中的 `/api/ports`、`/api/logs`、`/api/settings` 并不存在。

## 数据模型关系

```
Room (机房) ──1:N──► Rack (机柜) ──1:N──► Device (设备)
                                              │
        ┌─────────────────────┬───────────────┼───────────────┬──────────────────┐
        ▼                     ▼               ▼               ▼                  ▼
  NetworkCard (网卡)   DevicePort (端口)  DeviceField    DeviceCredential    IpAddress (IP)
        │                     │          (自定义字段)    (采集凭据)              │
        └─────────────────────┘                                               ▼
                    │                                                      Subnet (网段)
                    ▼                                                       │
                Cable (线缆)                                          parentId 自嵌套

Device ──N:1──► Warehouse (库房)          [isIdle=true 时进入空闲设备数据集]

User (用户) ──N:M──► Role (角色) ──1:N──► Permission (权限)
User ──1:N──► OperationLog (操作日志)

Consumable (耗材) ──N:1──► ConsumableCategory (耗材分类)
Consumable ──1:N──► ConsumableLog (耗材操作日志)

Ticket (工单) ──N:1──► FaultCategory (故障分类)
Ticket ──1:N──► TicketOperationRecord (流转记录)

InventoryPlan (盘点计划) ──1:N──► InventoryTask (盘点任务) ──1:N──► InventoryRecord (盘点记录)
PendingDevice (盘盈设备) 独立表，确认后转入 Device
```

### 核心模型关系说明

| 关系 | 说明 |
|------|------|
| Room → Rack | 一个机房包含多个机柜，`Room.roomId` → `Rack.roomId` |
| Rack → Device | 一个机柜可安装多个设备，`Rack.rackId` → `Device.rackId` |
| Device → NetworkCard | 一个设备可有多块网卡，`NetworkCard.deviceId` → `Device.deviceId` |
| NetworkCard → DevicePort | 网卡下有多个端口，`DevicePort.nicId` → `NetworkCard.nicId` |
| DevicePort ↔ DevicePort | 通过 `Cable` 建立四向连接关系（源地址/源端口/目标地址/目标端口） |
| Device → DeviceCredential | 一台设备可对每种采集协议各有一条默认凭据 |
| Device → IpAddress | 一台设备可绑定多个 IP（管理/业务/存储），其中最多一个主 IP |
| Subnet → Subnet | 通过 `parentId` 无限层级自嵌套 |
| Subnet → IpAddress | 一个网段包含多个 IP 记录 |
| Device → Warehouse | 空闲设备记录所属库房编号（`warehouseId` 为自由文本，无强外键） |
| Device（isIdle=true） | 空闲设备**复用 devices 表**，通过 `isIdle` 标记区分，无独立表 |
| User ↔ Role | 多对多关系，通过 `UserRole` 关联表 |
| Role → Permission | 角色持有权限码数组，`admin` 为通配 `*` |
| ConsumableCategory → Consumable | 一个分类下有多个耗材 |
| InventoryPlan → Task → Record | 盘点计划分解为任务，任务产生记录 |

### 不使用独立表的业务视图

以下接口组虽有自己的路由前缀，但**不映射到独立数据表**：

| 接口前缀 | 实际数据来源 |
|----------|--------------|
| `/api/idle-devices` | `devices` 表中 `isIdle = true` 的记录 |
| `/api/dangerous-operations` | `dangerous_operations` 日志表 + `operation_logs` |
| `/api/statistics` | 跨表实时聚合，无存储 |
| `/api/topology` | `devices` + `cables` + `topology_layouts` |

这一设计避免了 `devices` 与 `idle_devices` 两表间的数据同步与状态漂移问题。
