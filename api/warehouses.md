# 库房与空闲设备接口

本组接口管理「不在机柜内」的设备资产：库房（Warehouse）作为存放地点，空闲设备（Idle Device）作为设备生命周期中的暂存状态。

> **概念澄清**：系统的空闲设备**并未使用独立的 `idle_devices` 表**，而是复用 `devices` 表并通过 `isIdle = true` 标记。`/api/idle-devices` 是该标记数据集的专用视图接口。

## 库房接口

### 接口前缀

```
/api/warehouses
```

### 数据模型（Warehouse）

| 字段 | 类型 | 说明 |
|------|------|------|
| `warehouseId` | string (PK) | 主键，自动生成为 `WH{随机串}` |
| `name` | string | 库房名称（必填） |
| `location` | string | 位置描述 |
| `capacity` | integer | 容量，默认 100 |
| `status` | enum | `active`、`inactive` |
| `description` | string | 备注 |
| `createdAt` / `updatedAt` | datetime | 时间戳 |

### 获取库房列表

```http
GET /api/warehouses
```

权限要求：`warehouse:view`

#### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `keyword` | string | - | 按库房编号 / 名称 / 位置模糊匹配 |
| `status` | string | `all` | 按状态筛选，`all` 表示不筛选 |
| `page` | number | 1 | 页码 |
| `pageSize` | number | 10 | 每页条数 |

#### 响应结构

```json
{
  "total": 3,
  "warehouses": [
    {
      "warehouseId": "WH8F2K1M4P",
      "name": "A 栋一层备件库",
      "location": "A 栋 1F 东侧",
      "capacity": 200,
      "status": "active",
      "deviceCount": 12
    }
  ],
  "page": 1,
  "pageSize": 10
}
```

> **响应格式差异**：库房与空闲设备接口**不使用**系统通用的 `{ success, data }` 包装，而是直接返回业务字段；错误时返回 `{ error: "..." }`。对接时需单独处理。

`deviceCount` 为该库房内 `isIdle = true` 的设备数量。

### 获取库房详情

```http
GET /api/warehouses/{warehouseId}
```

权限要求：`warehouse:view`

### 获取库房内设备

```http
GET /api/warehouses/{warehouseId}/devices
```

权限要求：`warehouse:view`

#### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `pageSize` | number | 10 | 每页条数 |

按 `idleDate` 倒序返回，响应结构为 `{ total, devices, page, pageSize }`。

### 创建库房

```http
POST /api/warehouses
```

权限要求：`warehouse:create`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 库房名称 |
| `location` | string | 否 | 位置 |
| `capacity` | integer | 否 | 容量 |
| `description` | string | 否 | 备注 |

### 更新库房

```http
PUT /api/warehouses/{warehouseId}
```

权限要求：`warehouse:edit`

### 删除库房

```http
DELETE /api/warehouses/{warehouseId}
```

权限要求：`warehouse:delete`。库房内仍有空闲设备时需先转移或清理。

---

## 空闲设备接口

### 接口前缀

```
/api/idle-devices
```

### 核心字段（Device 模型中的空闲相关字段）

| 字段 | 类型 | 说明 |
|------|------|------|
| `isIdle` | boolean | 是否为空闲设备，`true` 即进入空闲数据集 |
| `status` | string | 转入空闲时置为 `idle` |
| `idleDate` | datetime | 转入空闲的时间，列表默认按其倒序 |
| `idleReason` | string | 空闲原因（v2.5.1 起支持填写） |
| `warehouseId` | string | 存放库房编号（自由文本，无强外键约束） |
| `sourceType` | enum | 来源：`rack`（从机柜转入）、`warehouse`（库房直接入库） |

### 获取空闲设备列表

```http
GET /api/idle-devices
```

权限要求：`idle:view`

#### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `keyword` | string | - | 按资产编号 / 设备名称 / 序列号模糊匹配 |
| `sourceType` | string | `all` | 按来源筛选：`rack`、`warehouse` |
| `idleReason` | string | - | 按空闲原因模糊匹配 |
| `page` | number | 1 | 页码 |
| `pageSize` | number | 10 | 每页条数 |

#### 响应结构

```json
{
  "total": 8,
  "idleDevices": [
    {
      "deviceId": "SRV-0031",
      "name": "待报废计算节点",
      "serialNumber": "SN2023XXXX",
      "isIdle": true,
      "idleDate": "2026-10-20T09:12:00.000Z",
      "idleReason": "硬盘故障，待报废审批",
      "sourceType": "rack",
      "Rack": { "rackId": "A-01", "name": "A-01", "roomId": "ROOM1", "Room": { "roomId": "ROOM1", "name": "A 栋机房" } }
    }
  ],
  "page": 1,
  "pageSize": 10
}
```

### 获取空闲设备详情

```http
GET /api/idle-devices/{deviceId}
```

权限要求：`idle:view`

### 新建空闲设备（库房直接入库）

```http
POST /api/idle-devices
```

权限要求：`idle:shelve`

用于从未上架过机柜的备件直接登记入库。可提交名称、类型、型号、序列号、功耗等字段；创建后 `isIdle = true`、`sourceType = warehouse`。

### 从设备管理转入空闲

```http
POST /api/idle-devices/from-device/{deviceId}
```

权限要求：`idle:shelve`

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `idleReason` | string | 否 | 空闲原因，缺省为「从设备管理转入」 |

#### 关键行为

| 行为 | 说明 |
|------|------|
| 状态变更 | `isIdle = true`、`status = idle`、`idleDate = 当前时间`、`sourceType = rack` |
| 功耗扣减 | 从原机柜 `currentPower` 中扣减该设备功耗（下限 0），空闲设备不计入机柜功耗 |
| 操作日志 | 记录 `to_idle` 操作，含前后状态快照与空闲原因 |

#### 错误响应

| HTTP | 场景 |
|------|------|
| `404` | `设备不存在` |
| `400` | `设备已经标记为空闲设备` |

### 批量转入空闲

```http
POST /api/idle-devices/batch-from-devices
```

权限要求：`idle:shelve`

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceIds` | array | 是 | 设备编号数组 |
| `idleReason` | string | 否 | 统一空闲原因 |

已处于空闲状态的设备会被跳过，不中断整批处理。

### 空闲设备上架

```http
PUT /api/idle-devices/{deviceId}/shelve
```

权限要求：`idle:shelve`

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 设备名称 |
| `type` | string | 否 | 设备类型 |
| `model` | string | 否 | 型号 |
| `serialNumber` | string | 否 | 序列号 |
| `height` | integer | 否 | 占机柜 U 数 |
| `powerConsumption` | number | 否 | 功耗 |
| `rackId` | string | **是** | 目标机柜 |
| `position` | integer | **是** | 起始 U 位，须为正整数 |
| `description` | string | 否 | 备注 |

#### 校验规则

| 校验 | 错误提示 |
|------|----------|
| 目标机柜必填 | `请选择目标机柜` |
| U 位必填且 > 0 | `请选择可用的U位位置` |
| 机柜存在 | `目标机柜不存在` |
| **U 位冲突** | 不得与在位设备占用同一 U 位段（v2.8.2 新增） |
| **U 位越界** | U 位范围不得超过机柜物理高度（如 42U 机柜不允许 U50） |

> U 位为必填项是刻意的设计约束：历史版本中上架时未填 U 位会导致原 U 位信息被覆盖丢失，v2.5.1 起已改为强制校验，前端会自动回填原 U 位作为默认值。

### 编辑空闲设备

```http
PUT /api/idle-devices/{deviceId}
```

权限要求：`idle:edit`

仅修改设备属性，不改变空闲状态。

### 恢复上架

```http
PUT /api/idle-devices/{deviceId}/restore
```

权限要求：`idle:restore`

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `targetRackId` | string | 是 | 目标机柜 |
| `targetPosition` | integer | 是 | 目标起始 U 位 |

与「上架」的区别：`shelve` 用于从库房入库后首次装机，`restore` 用于设备回到原机房继续使用，两者的 U 位冲突校验一致。

### 批量恢复上架

```http
PUT /api/idle-devices/batch-restore
```

权限要求：`idle:restore`

### 删除空闲设备

```http
DELETE /api/idle-devices/{deviceId}
```

权限要求：`idle:delete`

#### 级联与前置校验

| 规则 | 说明 |
|------|------|
| 接线前置校验 | 存在关联接线时拒绝删除，返回关联接线清单 |
| 级联清理 | 删除时级联清理该设备的端口、网卡、工单、盘点记录，避免外键约束失败（v2.8.2 修复） |
| 操作日志 | 记录 `delete` 操作及删除前完整快照 |

#### 接线冲突响应示例

```json
{
  "error": "该设备存在 2 条关联接线，请先删除接线后再删除设备",
  "relatedCables": [
    { "cableId": "CBL0001", "sourcePort": "PORT001", "targetPort": "PORT088" }
  ]
}
```

## 权限码汇总

| 权限码 | 说明 |
|--------|------|
| `warehouse:view` | 查看库房及库房内设备 |
| `warehouse:create` | 创建库房 |
| `warehouse:edit` | 编辑库房 |
| `warehouse:delete` | 删除库房 |
| `idle:view` | 查看空闲设备 |
| `idle:shelve` | 新建、转入、上架空闲设备 |
| `idle:edit` | 编辑空闲设备 |
| `idle:restore` | 恢复上架 |
| `idle:delete` | 删除空闲设备 |
