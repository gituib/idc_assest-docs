# 前端架构

## 组件架构

前端采用组件化架构，核心组件分类如下：

### 页面组件

| 页面组件 | 功能描述 |
|----------|----------|
| Dashboard | 数据看板主页 |
| RoomManagement | 机房增删改查 |
| RackManagement | 机柜管理 |
| DeviceManagement | 设备全生命周期管理 |
| PortManagement | 设备端口配置管理 |
| CableManagement | 线缆连接管理 |
| TicketManagement | 工单全流程管理 |
| ConsumableManagement | 耗材库存管理 |
| InventoryManagement | 盘点计划与执行 |
| Rack3DVisualization | Three.js 3D可视化 |
| RoomFloorPlan | Canvas机房平面图 |
| BackupManagement | 数据库备份恢复 |
| UserManagement | 用户与权限管理 |

### Context状态管理

- **AuthContext**: 认证状态管理
- **ConfigContext**: 全局配置管理
- **Scene3DContext**: 3D场景状态
- **FloorPlanContext**: 平面图状态

### 关键Hooks

| Hook | 功能描述 |
|------|----------|
| useApi | 封装API请求 |
| useSWR | SWR数据获取与缓存 |
| useDebounce | 防抖处理 |
| useIdleTimeout | 空闲超时检测 |
| useDangerousOperation | 危险操作二次确认 |
| useDesignTokens | Ant Design主题令牌 |
| useResponsiveLayout | 响应式布局 |
