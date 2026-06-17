# 盘点接口

盘点接口用于资产盘点全流程管理，包括盘点计划、盘点任务、盘点记录及暂存设备管理。

## 数据模型

盘点功能采用三层结构：

```
InventoryPlan (盘点计划) ──1:N──► InventoryTask (盘点任务) ──1:N──► InventoryRecord (盘点记录)
                                                                        │
                                                                        ▼
                                                                  IdleDevice (暂存设备)
```

### 盘点计划 (InventoryPlan)

| 字段 | 类型 | 说明 |
|------|------|------|
| `planId` | integer | 主键，自增 |
| `name` | string | 计划名称 |
| `scope` | object | 盘点范围（机房/机柜范围） |
| `status` | string | 状态：`draft`、`in_progress`、`completed` |
| `startDate` | string | 计划开始日期 |
| `endDate` | string | 计划结束日期 |
| `createdAt` | string | 创建时间 |

### 盘点任务 (InventoryTask)

| 字段 | 类型 | 说明 |
|------|------|------|
| `taskId` | integer | 主键，自增 |
| `planId` | integer | 所属盘点计划 ID |
| `assigneeId` | integer | 负责人 ID |
| `rackId` | integer | 盘点机柜 ID |
| `status` | string | 状态：`pending`、`in_progress`、`completed` |

### 盘点记录 (InventoryRecord)

| 字段 | 类型 | 说明 |
|------|------|------|
| `recordId` | integer | 主键，自增 |
| `taskId` | integer | 所属盘点任务 ID |
| `deviceId` | integer | 盘点设备 ID |
| `actualPosition` | integer | 实际 U 位位置 |
| `status` | string | 盘点结果：`matched`、`mismatched`、`missing`、`unexpected` |

## 盘点计划

### 获取盘点计划列表

```http
GET /api/inventory/plans
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 计划状态 |
| `keyword` | string | 否 | 计划名称关键词 |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "planId": 1,
        "name": "2026年Q2全面盘点",
        "status": "in_progress",
        "scope": { "type": "room", "roomIds": [1, 2] },
        "startDate": "2026-06-01",
        "endDate": "2026-06-30",
        "taskCount": 20,
        "completedTaskCount": 8,
        "createdAt": "2026-05-20T08:00:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20
  }
}
```

### 获取盘点计划详情

```http
GET /api/inventory/plans/:planId
```

### 创建盘点计划

```http
POST /api/inventory/plans
Content-Type: application/json
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 计划名称 |
| `scope` | object | 是 | 盘点范围 |
| `startDate` | string | 是 | 开始日期 |
| `endDate` | string | 否 | 结束日期 |
| `assigneeIds` | integer[] | 否 | 参与人员 ID 列表 |

#### scope 字段说明

| 类型 | 说明 | 示例 |
|------|------|------|
| `all` | 全部范围 | `{ "type": "all" }` |
| `room` | 指定机房 | `{ "type": "room", "roomIds": [1, 2] }` |
| `rack` | 指定机柜 | `{ "type": "rack", "rackIds": [1, 2, 3] }` |

#### 请求示例

```json
{
  "name": "2026年Q2全面盘点",
  "scope": { "type": "room", "roomIds": [1, 2] },
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "assigneeIds": [2, 3]
}
```

### 更新盘点计划

```http
PUT /api/inventory/plans/:planId
```

### 删除盘点计划

```http
DELETE /api/inventory/plans/:planId
```

仅 `draft` 状态的计划可删除。

### 启动盘点

将 `draft` 状态的计划启动，自动生成盘点任务。

```http
POST /api/inventory/plans/:planId/start
```

### 完成盘点

将 `in_progress` 状态的计划标记为完成。

```http
POST /api/inventory/plans/:planId/complete
```

## 盘点任务

### 获取任务列表

```http
GET /api/inventory/tasks
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `planId` | integer | 否 | 按计划筛选 |
| `assigneeId` | integer | 否 | 按负责人筛选 |
| `status` | string | 否 | 任务状态 |
| `page` | number | 否 | 页码 |
| `pageSize` | number | 否 | 每页条数 |

### 获取任务详情

```http
GET /api/inventory/tasks/:taskId
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "taskId": 1,
    "planId": 1,
    "assigneeId": 2,
    "assignee": { "userId": 2, "username": "operator" },
    "rackId": 1,
    "rack": { "rackId": 1, "name": "A-01" },
    "status": "in_progress",
    "totalDevices": 8,
    "checkedDevices": 5,
    "records": [
      {
        "recordId": 1,
        "deviceId": 1,
        "deviceName": "Server-01",
        "expectedPosition": 1,
        "actualPosition": 1,
        "status": "matched"
      }
    ]
  }
}
```

### 提交盘点结果

```http
POST /api/inventory/tasks/:taskId/submit
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `records` | array | 是 | 盘点记录列表 |

#### 请求示例

```json
{
  "records": [
    {
      "deviceId": 1,
      "actualPosition": 1,
      "status": "matched",
      "remark": "正常"
    },
    {
      "deviceId": 2,
      "actualPosition": 5,
      "status": "mismatched",
      "remark": "U位与系统不符"
    },
    {
      "deviceName": "Unknown-Server",
      "serialNumber": "UNKNOWN001",
      "actualPosition": 10,
      "status": "unexpected",
      "remark": "系统未登记设备"
    }
  ]
}
```

## 暂存设备

盘点过程中发现的未在册设备或信息不完整设备，归入暂存管理。

### 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `idleDeviceId` | integer | 主键，自增 |
| `name` | string | 设备名称 |
| `serialNumber` | string | 序列号 |
| `type` | string | 设备类型 |
| `foundInRack` | integer | 发现时所在机柜 ID |
| `status` | string | 状态：`pending`、`in_use`、`disposed` |
| `remark` | text | 备注说明 |

### 获取暂存设备列表

```http
GET /api/inventory/idle-devices
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 状态筛选 |
| `keyword` | string | 否 | 名称/序列号关键词 |
| `page` | number | 否 | 页码 |
| `pageSize` | number | 否 | 每页条数 |

### 转为正式设备

将暂存设备转为正式设备，纳入设备管理。

```http
POST /api/inventory/idle-devices/:idleDeviceId/activate
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `rackId` | integer | 是 | 安装机柜 ID |
| `position` | integer | 是 | 安装 U 位 |
| `height` | integer | 否 | 占用 U 位数 |
| `type` | string | 否 | 设备类型 |

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 参数缺失或日期范围非法 |
| `NOT_FOUND` | 404 | 计划/任务/记录不存在 |
| `CONFLICT` | 409 | 计划状态不允许该操作 |
| `FORBIDDEN` | 403 | 无盘点管理权限 |
