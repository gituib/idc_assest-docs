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

```
请求 → CORS → auth → maintenance → validation → requestLogger → routes → response
```

| 中间件 | 功能描述 |
|--------|----------|
| **CORS** | 跨域资源共享配置，允许前端跨域访问 |
| **authMiddleware** | JWT 令牌验证、用户身份认证、权限校验 |
| **maintenanceMiddleware** | 系统维护模式拦截，非管理员无法访问 |
| **validationMiddleware** | 使用 Joi 对请求参数进行格式校验 |
| **requestLogger** | HTTP 请求日志记录（方法、路径、状态码、耗时） |

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

完整的 RESTful API 路由，覆盖所有业务模块：

| 路由前缀 | 模块 | 功能 |
|----------|------|------|
| `/api/auth` | 认证 | 登录、注册、Token 刷新 |
| `/api/rooms` | 机房 | 机房 CRUD |
| `/api/racks` | 机柜 | 机柜 CRUD、容量统计 |
| `/api/devices` | 设备 | 设备全生命周期 CRUD、批量导入导出 |
| `/api/ports` | 端口 | 设备端口配置、网卡绑定 |
| `/api/cables` | 线缆 | 线缆连接管理 |
| `/api/tickets` | 工单 | 工单全流程 CRUD |
| `/api/consumables` | 耗材 | 耗材库存、领用、SN 追踪 |
| `/api/inventory` | 盘点 | 盘点计划、任务、记录 |
| `/api/backup` | 备份 | 本地/远程备份管理 |
| `/api/users` | 用户 | 用户管理、角色权限 |
| `/api/settings` | 系统设置 | 系统参数配置 |
| `/api/logs` | 操作日志 | 审计日志查询 |

## 数据模型关系

```
Room (机房) ──1:N──► Rack (机柜) ──1:N──► Device (设备)
                                              │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                    NetworkCard (网卡)    DevicePort (端口)    DeviceField (字段)
                          │                    │
                          └────────────────────┘
                                              │
                                              ▼
                                          Cable (线缆)

User (用户) ──N:M──► Role (角色) ──1:N──► Permission (权限)

Consumable (耗材) ──N:1──► ConsumableCategory (耗材分类)

InventoryPlan (盘点计划) ──1:N──► InventoryTask (盘点任务)
                                        │
                                        ▼
                                  InventoryRecord (盘点记录)
                                        │
                                        ▼
                                  IdleDevice (暂存空闲设备)
```

### 核心模型关系说明

| 关系 | 说明 |
|------|------|
| Room → Rack | 一个机房包含多个机柜，`Room.roomId` → `Rack.roomId` |
| Rack → Device | 一个机柜可安装多个设备，`Rack.rackId` → `Device.rackId` |
| Device → NetworkCard | 一个设备可有多块网卡 |
| Device → DevicePort | 一个设备可有多个端口 |
| DevicePort + NetworkCard → Cable | 端口和网卡之间通过线缆连接 |
| User ↔ Role | 多对多关系，一个用户可有多个角色 |
| ConsumableCategory → Consumable | 一个分类下有多个耗材 |
| InventoryPlan → Task → Record | 盘点计划分解为任务，任务产生记录 |
