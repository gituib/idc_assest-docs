# 数据模型

## 核心模型关系

```
Room (机房) ──1:N──► Rack (机柜) ──1:N──► Device (设备)
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
              NetworkCard (网卡)         DevicePort (端口)         DeviceField (字段)
                    │                         │
                    └─────────────────────────┘
                                              │
                                              ▼
                                          Cable (线缆)

User (用户) ──N:M──► Role (角色)
Consumable (耗材) ──N:1──► ConsumableCategory (耗材分类)
InventoryPlan (盘点计划) ──1:N──► InventoryTask (盘点任务) ──1:N──► InventoryRecord (盘点记录)
                                                                        │
                                                                        ▼
                                                                  IdleDevice (暂存设备)
```

## 主要模型

### 机房模型 (Room)

机房是系统的顶层物理空间单元，代表一个独立的数据中心机房或设备间。

| 字段 | 类型 | 说明 |
|------|------|------|
| `roomId` | INTEGER (PK) | 主键，自增 |
| `name` | STRING | 机房名称，如 "A栋机房"、"B栋3F机房" |
| `location` | STRING | 位置描述，如 "A栋3楼" |
| `area` | FLOAT | 机房面积（平方米） |
| `manager` | STRING | 机房负责人姓名 |

**关联关系：**
- `hasMany Rack` — 一个机房可包含多个机柜

### 机柜模型 (Rack)

机柜是机房的组成单元，用于安装设备。以标准 42U 机柜为参考模型。

| 字段 | 类型 | 说明 |
|------|------|------|
| `rackId` | INTEGER (PK) | 主键，自增 |
| `name` | STRING | 机柜名称/编号，如 "A-01"、"A-02" |
| `roomId` | INTEGER (FK) | 所属机房 ID，关联 Room |
| `totalU` | INTEGER | 总 U 位数，标准机柜通常为 42U |
| `usedU` | INTEGER | 已占用 U 位数，实时计算更新 |
| `powerCapacity` | FLOAT | 额定功率容量（W） |

**关联关系：**
- `belongsTo Room` — 属于一个机房
- `hasMany Device` — 可安装多个设备

### 设备模型 (Device)

设备是系统的核心管理对象，包含服务器、网络设备、存储设备等各类 IT 设备。

| 字段 | 类型 | 说明 |
|------|------|------|
| `deviceId` | INTEGER (PK) | 主键，自增 |
| `name` | STRING | 设备名称/别名 |
| `type` | STRING | 设备类型，如 server、switch、router、storage 等 |
| `brand` | STRING | 品牌，如 Dell、HP、Cisco 等 |
| `model` | STRING | 型号 |
| `serialNumber` | STRING | 序列号（唯一） |
| `rackId` | INTEGER (FK) | 所属机柜 ID，关联 Rack |
| `position` | INTEGER | 在机柜中的起始 U 位（从底部 1 开始） |
| `height` | INTEGER | 占用 U 位数（1U、2U、4U 等） |
| `ipAddress` | STRING | 管理 IP 地址 |
| `status` | ENUM | 设备状态：online、offline、maintenance、retired |
| `customFields` | JSON | 自定义字段扩展，存储用户自定义属性 |
| `purchaseDate` | DATEONLY | 采购日期 |
| `warrantyExpiry` | DATEONLY | 保修到期日期 |

**关联关系：**
- `belongsTo Rack` — 安装在某个机柜中
- `hasMany DevicePort` — 有多个端口
- `hasMany NetworkCard` — 有多块网卡
- `hasMany Cable` — 涉及多条线缆

### 端口模型 (DevicePort)

端口是设备上的物理网络接口，用于连接线缆实现网络通信。

| 字段 | 类型 | 说明 |
|------|------|------|
| `portId` | INTEGER (PK) | 主键，自增 |
| `deviceId` | INTEGER (FK) | 所属设备 ID，关联 Device |
| `portName` | STRING | 端口名称/编号，如 "GigabitEthernet0/1" |
| `portType` | STRING | 端口类型，如 RJ45、SFP、SFP+、QSFP 等 |
| `speed` | STRING | 速率，如 "1Gbps"、"10Gbps"、"25Gbps" |
| `status` | ENUM | 状态：active、inactive、disabled |
| `networkCardId` | INTEGER (FK) | 绑定的网卡 ID，关联 NetworkCard（可选） |

**关联关系：**
- `belongsTo Device` — 属于某个设备
- `belongsTo NetworkCard` — 可绑定到一块网卡（可选）
- `hasMany Cable` — 可能连接多条线缆

### 网卡模型 (NetworkCard)

网卡是设备内部的网络接口卡，一个设备可包含多块网卡。

| 字段 | 类型 | 说明 |
|------|------|------|
| `cardId` | INTEGER (PK) | 主键，自增 |
| `deviceId` | INTEGER (FK) | 所属设备 ID，关联 Device |
| `cardName` | STRING | 网卡名称，如 "eth0"、"eth1" |
| `macAddress` | STRING | MAC 地址 |
| `model` | STRING | 网卡型号 |
| `firmwareVersion` | STRING | 固件版本 |

**关联关系：**
- `belongsTo Device` — 属于某个设备
- `hasMany DevicePort` — 可包含多个端口

### 线缆模型 (Cable)

线缆连接两个设备（或端口与网卡之间），实现网络拓扑的物理链路。

| 字段 | 类型 | 说明 |
|------|------|------|
| `cableId` | INTEGER (PK) | 主键，自增 |
| `cableName` | STRING | 线缆名称/标签 |
| `cableType` | STRING | 线缆类型，如 Cat6、Cat6a、OM3、OS2 等 |
| `length` | FLOAT | 线缆长度（米） |
| `sourceDeviceId` | INTEGER (FK) | 源端设备 ID |
| `sourcePortId` | INTEGER (FK) | 源端端口 ID |
| `targetDeviceId` | INTEGER (FK) | 目标端设备 ID |
| `targetPortId` | INTEGER (FK) | 目标端端口 ID |

**关联关系：**
- `belongsTo Device`（sourceDevice / targetDevice）— 涉及两个设备
- `belongsTo DevicePort`（sourcePort / targetPort）— 连接两个端口

### 字段模型 (DeviceField / TicketField)

自定义字段模型允许用户动态扩展设备和工单的属性，无需修改数据库结构。

| 字段 | 类型 | 说明 |
|------|------|------|
| `fieldId` | INTEGER (PK) | 主键，自增 |
| `module` | ENUM | 所属模块：device、ticket |
| `fieldName` | STRING | 字段名称（英文标识） |
| `fieldLabel` | STRING | 字段显示标签（中文） |
| `fieldType` | ENUM | 字段类型：text、number、select、date、boolean |
| `options` | JSON | 选项列表（select 类型时使用） |
| `required` | BOOLEAN | 是否必填 |
| `sortOrder` | INTEGER | 排序序号 |

### 工单模型 (Ticket)

工单管理故障报修和维护任务的全流程。

| 字段 | 类型 | 说明 |
|------|------|------|
| `ticketId` | INTEGER (PK) | 主键，自增 |
| `title` | STRING | 工单标题 |
| `description` | TEXT | 详细描述 |
| `type` | ENUM | 工单类型：fault（故障）、maintenance（维护）|
| `priority` | ENUM | 优先级：low、medium、high、critical |
| `status` | ENUM | 状态：open、in_progress、resolved、closed |
| `reporterId` | INTEGER (FK) | 报告人（用户 ID）|
| `assigneeId` | INTEGER (FK) | 处理人（用户 ID）|
| `deviceId` | INTEGER (FK) | 关联设备 ID（可选）|
| `customFields` | JSON | 自定义字段扩展 |
| `createdAt` | DATE | 创建时间 |
| `resolvedAt` | DATE | 解决时间 |

### 耗材模型 (Consumable)

耗材管理数据中心使用的各类消耗品，支持 SN 序列号追踪。

| 字段 | 类型 | 说明 |
|------|------|------|
| `consumableId` | INTEGER (PK) | 主键，自增 |
| `name` | STRING | 耗材名称 |
| `categoryId` | INTEGER (FK) | 所属分类 ID |
| `sku` | STRING | 库存单位编码 |
| `unit` | STRING | 计量单位，如 "个"、"箱"、"米" |
| `stock` | INTEGER | 当前库存数量 |
| `minStock` | INTEGER | 最低库存告警阈值 |
| `location` | STRING | 存放位置 |
| `snList` | JSON | SN 序列号列表，用于精确追踪每个耗材 |
| `version` | INTEGER | 乐观锁版本号，用于并发控制 |

**关联关系：**
- `belongsTo ConsumableCategory` — 属于某个耗材分类

### 耗材分类模型 (ConsumableCategory)

| 字段 | 类型 | 说明 |
|------|------|------|
| `categoryId` | INTEGER (PK) | 主键，自增 |
| `name` | STRING | 分类名称，如 "光纤跳线"、"电源线"、"扎带" |
| `parentId` | INTEGER (FK) | 父分类 ID（支持树形分类）|

### 盘点模型

盘点功能包括计划、任务和记录三层结构。

#### 盘点计划 (InventoryPlan)

| 字段 | 类型 | 说明 |
|------|------|------|
| `planId` | INTEGER (PK) | 主键，自增 |
| `name` | STRING | 计划名称 |
| `scope` | JSON | 盘点范围（机房/机柜范围）|
| `status` | ENUM | 状态：draft、in_progress、completed |
| `startDate` | DATE | 计划开始日期 |
| `endDate` | DATE | 计划结束日期 |

#### 盘点任务 (InventoryTask)

| 字段 | 类型 | 说明 |
|------|------|------|
| `taskId` | INTEGER (PK) | 主键，自增 |
| `planId` | INTEGER (FK) | 所属盘点计划 ID |
| `assigneeId` | INTEGER (FK) | 负责人（用户 ID）|
| `rackId` | INTEGER (FK) | 盘点机柜 ID |
| `status` | ENUM | 状态：pending、in_progress、completed |

#### 盘点记录 (InventoryRecord)

| 字段 | 类型 | 说明 |
|------|------|------|
| `recordId` | INTEGER (PK) | 主键，自增 |
| `taskId` | INTEGER (FK) | 所属盘点任务 ID |
| `deviceId` | INTEGER (FK) | 盘点设备 ID |
| `actualPosition` | INTEGER | 实际 U 位位置 |
| `status` | ENUM | 盘点结果：matched、mismatched、missing、unexpected |

#### 暂存设备 (IdleDevice)

盘点过程中发现的未在册设备或不使用的设备，归入暂存管理。

| 字段 | 类型 | 说明 |
|------|------|------|
| `idleDeviceId` | INTEGER (PK) | 主键，自增 |
| `name` | STRING | 设备名称 |
| `serialNumber` | STRING | 序列号 |
| `type` | STRING | 设备类型 |
| `foundInRack` | INTEGER (FK) | 发现时所在机柜 ID |
| `status` | ENUM | 状态：pending、in_use、disposed |
| `remark` | TEXT | 备注说明 |

### 用户与角色模型

#### 用户模型 (User)

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId` | INTEGER (PK) | 主键，自增 |
| `username` | STRING | 用户名，唯一 |
| `password` | STRING | 密码（bcrypt 加密存储）|
| `email` | STRING | 邮箱 |
| `status` | ENUM | 状态：active、locked、disabled |
| `loginAttempts` | INTEGER | 连续登录失败次数 |
| `lockUntil` | DATE | 锁定截止时间 |

#### 角色模型 (Role)

| 字段 | 类型 | 说明 |
|------|------|------|
| `roleId` | INTEGER (PK) | 主键，自增 |
| `name` | STRING | 角色名，如 admin、operator、viewer |
| `description` | STRING | 角色描述 |

## 关联关系汇总

| 关系类型 | 源模型 | 目标模型 | 外键 |
|----------|--------|----------|------|
| 1:N | Room | Rack | Rack.roomId → Room.roomId |
| 1:N | Rack | Device | Device.rackId → Rack.rackId |
| 1:N | Device | DevicePort | DevicePort.deviceId → Device.deviceId |
| 1:N | Device | NetworkCard | NetworkCard.deviceId → Device.deviceId |
| 1:N | Device | Cable（两端） | Cable.sourceDeviceId / Cable.targetDeviceId → Device.deviceId |
| 1:N | DevicePort | Cable（两端） | Cable.sourcePortId / Cable.targetPortId → DevicePort.portId |
| 1:N | NetworkCard | DevicePort | DevicePort.networkCardId → NetworkCard.cardId |
| N:M | User | Role | user_roles 中间表 |
| 1:N | ConsumableCategory | Consumable | Consumable.categoryId → ConsumableCategory.categoryId |
| 1:N | InventoryPlan | InventoryTask | InventoryTask.planId → InventoryPlan.planId |
| 1:N | InventoryTask | InventoryRecord | InventoryRecord.taskId → InventoryTask.taskId |

## 数据库建表约定

| 项目 | 约定 |
|------|------|
| 表命名 | snake_case（如 `device_ports`） |
| 主键命名 | modelId 格式（如 `deviceId`） |
| 外键命名 | 关联表名 + Id（如 `rackId`） |
| 时间戳 | 自动添加 `createdAt`、`updatedAt` |
| 字符集（MySQL） | `utf8mb4` / `utf8mb4_unicode_ci` |
| 软删除 | 使用 `paranoid: true` 添加 `deletedAt` 字段 |
