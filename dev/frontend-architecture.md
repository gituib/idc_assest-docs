# 前端架构

## 组件架构

前端采用组件化架构，核心组件分类如下：

### 页面组件

| 页面组件 | 功能描述 |
|----------|----------|
| Dashboard | 数据看板主页，展示机房、设备、工单等核心统计数据和趋势图表 |
| RoomManagement | 机房增删改查，支持多机房分类管理 |
| RackManagement | 机柜管理，支持机柜 CRUD、U 位容量统计 |
| DeviceManagement | 设备全生命周期管理，含批量导入导出、Excel 导入、自定义字段 |
| PortManagement | 设备端口配置管理，支持端口类型、状态、绑定网卡 |
| CableManagement | 线缆连接管理，机柜间线缆连接可视化追踪 |
| NetworkTopology | 基于 ReactFlow 的网络拓扑可视化 |
| TicketManagement | 工单全流程管理，含故障报修、维护工单、状态流转 |
| ConsumableManagement | 耗材库存管理，含入库、领用、SN 序列号追踪 |
| InventoryManagement | 盘点计划与执行，含任务分配、盘点记录、盘盈设备 |
| IdleDeviceManagement | 空闲设备管理，盘点发现的未使用设备管理 |
| Rack3DVisualization | Three.js 3D 机柜可视化，支持 LOD 优化 |
| RoomFloorPlan | Canvas 机房平面图，可视化展示机柜布局 |
| BackupManagement | 数据库备份恢复，含本地备份、自动备份、远程备份 |
| OperationLogs | 操作审计日志，支持按模块、操作人、时间筛选和统计分析 |
| UserManagement | 用户与权限管理，RBAC 角色权限分配 |
| SystemSettings | 系统参数配置，含密码策略、登录安全等全局设置 |

### 组件目录结构

```
frontend/src/
├── api/                          # API 接口封装层
│   ├── auth.js                   # 认证相关接口
│   ├── devices.js                # 设备相关接口
│   ├── rooms.js                  # 机房相关接口
│   ├── racks.js                  # 机柜相关接口
│   ├── tickets.js                # 工单相关接口
│   ├── consumables.js            # 耗材相关接口
│   └── ...                       # 其他模块接口
│
├── components/                   # 可复用组件库
│   ├── 3d/                      # 3D 可视化子组件
│   │   ├── Rack3D.jsx           # 机柜 3D 渲染组件
│   │   ├── Device3D.jsx         # 设备 3D 模型组件
│   │   └── Scene3D.jsx          # 3D 场景容器
│   ├── common/                  # 通用组件
│   │   ├── PageHeader.jsx       # 页面标题组件
│   │   ├── SearchForm.jsx       # 搜索表单组件
│   │   └── ConfirmModal.jsx     # 确认弹窗组件
│   ├── dashboard/               # 数据看板子组件
│   │   ├── StatCard.jsx         # 统计卡片
│   │   ├── TrendChart.jsx       # 趋势图表
│   │   └── RecentActivity.jsx   # 最近活动列表
│   ├── device/                  # 设备管理子组件
│   │   ├── DeviceForm.jsx       # 设备表单
│   │   ├── DeviceTable.jsx      # 设备列表表格
│   │   └── DeviceImport.jsx     # 设备导入组件
│   ├── floorplan/               # 机房平面图子组件
│   │   ├── FloorPlan.jsx        # 平面图画布
│   │   └── RackBlock.jsx        # 机柜方块组件
│   ├── rack/                    # 机柜管理子组件
│   │   ├── RackView.jsx         # 机柜正面视图
│   │   └── RackSlot.jsx         # 机柜 U 位插槽
│   └── topology/                # 网络拓扑子组件
│       ├── TopologyCanvas.jsx   # 拓扑画布
│       └── DeviceNode.jsx       # 设备节点
│
├── config/                      # 配置文件
│   ├── api.js                   # API 基础配置
│   └── constants.js             # 应用常量
│
├── constants/                   # 常量定义
│   ├── menuConfig.js            # 菜单配置
│   ├── deviceTypes.js           # 设备类型枚举
│   └── statusMap.js             # 状态映射表
│
├── context/                     # React Context
│   ├── AuthContext.jsx          # 认证状态管理
│   ├── ConfigContext.jsx        # 全局配置管理
│   ├── Scene3DContext.jsx       # 3D 场景状态
│   └── FloorPlanContext.jsx     # 平面图状态
│
├── hooks/                       # 自定义 Hooks
│   ├── useApi.js                # 封装 API 请求
│   ├── useSWR.js                # SWR 数据获取与缓存
│   ├── useDebounce.js           # 防抖处理
│   ├── useIdleTimeout.js        # 空闲超时检测
│   ├── useDangerousOperation.js # 危险操作二次确认
│   ├── useDesignTokens.js       # Ant Design 主题令牌
│   └── useResponsiveLayout.js   # 响应式布局
│
├── pages/                       # 页面级组件
│   ├── Dashboard.jsx            # 仪表盘页面
│   ├── RoomManagement.jsx       # 机房管理页面
│   ├── DeviceManagement.jsx     # 设备管理页面
│   ├── TicketManagement.jsx     # 工单管理页面
│   └── ...                      # 其他页面
│
├── styles/                      # 全局样式
│   ├── global.css               # 全局样式
│   └── theme.js                 # Ant Design 主题配置
│
└── utils/                       # 工具函数
    ├── request.js               # Axios 请求封装
    ├── format.js                # 格式化工具
    └── secureStorage.js         # 安全存储工具
```

### Context 状态管理

系统使用 React Context 管理全局状态，各 Context 职责分明：

| Context | 管理状态 | 用途 |
|---------|----------|------|
| **AuthContext** | 用户认证信息、Token、权限 | 提供 `useAuth()` Hook，暴露登录、登出、注册方法，全局校验用户身份和权限 |
| **ConfigContext** | 系统配置参数 | 提供 `useConfig()` Hook，管理 Ant Design 主题、应用标题、全局设置等 |
| **Scene3DContext** | 3D 场景状态 | 提供 `useScene3D()` Hook，管理 Three.js 场景的相机位置、选中对象、渲染状态 |
| **FloorPlanContext** | 平面图编辑状态 | 提供 `useFloorPlan()` Hook，管理平面图的缩放、拖拽、选中机柜等交互状态 |

### 关键 Hooks

| Hook | 功能描述 |
|------|----------|
| **useApi** | 封装 Axios 请求，自动注入 Token，统一错误处理，支持请求/响应拦截器 |
| **useSWR** | 基于 SWR 库的数据获取和缓存管理，支持自动重新验证、缓存更新、错误重试 |
| **useDebounce** | 防抖处理 Hook，用于搜索输入等高频触发场景，降低请求频率 |
| **useIdleTimeout** | 用户空闲超时检测，30 分钟无操作自动登出，前 1 分钟弹出警告提示 |
| **useDangerousOperation** | 危险操作二次确认，删除等敏感操作前弹出 Modal 确认对话框 |
| **useDesignTokens** | 读取 Ant Design 5 的 Design Token，用于自定义主题和样式变量覆盖 |
| **useResponsiveLayout** | 响应式布局检测 Hook，根据屏幕宽度动态调整组件布局和菜单显示 |

### 数据请求流程

```
用户操作 → 页面组件 → useSWR / useApi → Axios 实例
                                              │
                                    (自动注入 JWT Token)
                                              │
                                              ▼
                                        API 接口层
                                              │
                                              ▼
                                        后端服务
                                              │
                                    (返回 JSON 响应)
                                              │
                                              ▼
                                   useSWR 缓存更新 → 组件重新渲染
```
