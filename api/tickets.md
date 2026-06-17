# 工单接口

工单用于管理故障报修和维护任务的全流程，支持状态流转、分配、关联设备等。

## 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `ticketId` | integer | 主键，自增 |
| `title` | string | 工单标题 |
| `description` | text | 详细描述 |
| `type` | string | 工单类型：`fault`（故障）、`maintenance`（维护） |
| `priority` | string | 优先级：`low`、`medium`、`high`、`critical` |
| `status` | string | 状态：`open`、`in_progress`、`resolved`、`closed` |
| `reporterId` | integer | 报告人 ID |
| `assigneeId` | integer | 处理人 ID |
| `deviceId` | integer | 关联设备 ID（可选） |
| `categoryId` | integer | 故障分类 ID |
| `customFields` | object | 自定义字段扩展 |
| `createdAt` | string | 创建时间 |
| `resolvedAt` | string | 解决时间 |

### 工单状态流转

```
open → in_progress → resolved → closed
                              ↘ reopened → in_progress
```

| 状态 | 说明 |
|------|------|
| `open` | 待处理，新建工单等待分配 |
| `in_progress` | 处理中，已分配处理人 |
| `resolved` | 已完成，问题已解决 |
| `closed` | 已关闭，工单归档 |

### 优先级

| 优先级 | 说明 | 响应时间 |
|--------|------|----------|
| `critical` | 紧急，严重影响业务 | 立即响应 |
| `high` | 重要问题 | 2 小时内 |
| `medium` | 一般问题 | 24 小时内 |
| `low` | 优化建议 | 一周内 |

## 获取工单列表

```http
GET /api/tickets
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 工单状态 |
| `priority` | string | 否 | 优先级 |
| `categoryId` | integer | 否 | 故障分类 ID |
| `assigneeId` | integer | 否 | 处理人 ID |
| `reporterId` | integer | 否 | 报告人 ID |
| `deviceId` | integer | 否 | 关联设备 ID |
| `keyword` | string | 否 | 标题/描述关键词 |
| `startDate` | string | 否 | 创建起始日期 |
| `endDate` | string | 否 | 创建结束日期 |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "ticketId": 1,
        "title": "服务器故障",
        "type": "fault",
        "priority": "high",
        "status": "open",
        "reporterId": 1,
        "reporter": { "userId": 1, "username": "admin" },
        "assigneeId": null,
        "categoryId": 1,
        "category": { "categoryId": 1, "name": "硬件故障" },
        "deviceId": 1,
        "createdAt": "2026-06-17T08:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

## 获取工单详情

```http
GET /api/tickets/:ticketId
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "ticketId": 1,
    "title": "服务器故障",
    "description": "服务器 Server-01 无法启动，电源指示灯异常",
    "type": "fault",
    "priority": "high",
    "status": "in_progress",
    "reporterId": 1,
    "assigneeId": 2,
    "deviceId": 1,
    "device": { "deviceId": 1, "name": "Server-01" },
    "categoryId": 1,
    "customFields": { "impactLevel": "高" },
    "createdAt": "2026-06-17T08:00:00Z",
    "resolvedAt": null,
    "timeline": [
      {
        "action": "created",
        "operatorId": 1,
        "createdAt": "2026-06-17T08:00:00Z"
      },
      {
        "action": "assigned",
        "operatorId": 1,
        "assigneeId": 2,
        "createdAt": "2026-06-17T08:15:00Z"
      }
    ]
  }
}
```

## 创建工单

```http
POST /api/tickets
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 工单标题 |
| `description` | string | 否 | 详细描述 |
| `type` | string | 是 | 类型：`fault`、`maintenance` |
| `priority` | string | 否 | 优先级，默认 `medium` |
| `categoryId` | integer | 否 | 故障分类 ID |
| `deviceId` | integer | 否 | 关联设备 ID |
| `assigneeId` | integer | 否 | 处理人 ID |
| `customFields` | object | 否 | 自定义字段 |

### 请求示例

```json
{
  "title": "服务器故障",
  "description": "服务器 Server-01 无法启动",
  "type": "fault",
  "priority": "high",
  "categoryId": 1,
  "deviceId": 1
}
```

### 响应

```json
{
  "success": true,
  "data": { "ticketId": 1 },
  "message": "创建成功"
}
```

## 更新工单

```http
PUT /api/tickets/:ticketId
```

支持部分更新，字段定义同「创建工单」。

## 分配工单

将工单分配给指定处理人，工单状态自动流转为 `in_progress`。

```http
PUT /api/tickets/:ticketId/assign
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `assigneeId` | integer | 是 | 处理人用户 ID |

### 请求示例

```json
{ "assigneeId": 2 }
```

### 响应

```json
{
  "success": true,
  "message": "分配成功"
}
```

## 处理工单

处理人提交处理结果，工单状态流转为 `resolved`。

```http
PUT /api/tickets/:ticketId/process
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `resolution` | string | 是 | 处理结果说明 |

### 请求示例

```json
{ "resolution": "已更换故障硬盘，服务器恢复正常" }
```

## 关闭工单

```http
PUT /api/tickets/:ticketId/close
```

将 `resolved` 状态的工单关闭归档。

### 响应

```json
{
  "success": true,
  "message": "工单已关闭"
}
```

## 重开工单

```http
PUT /api/tickets/:ticketId/reopen
```

将已关闭或已完成的工单重新打开，状态回到 `in_progress`。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reason` | string | 否 | 重开原因 |

## 删除工单

```http
DELETE /api/tickets/:ticketId
```

## 工单自定义字段

工单模块支持动态自定义字段，配置通过 `/api/ticket-fields` 管理，字段结构与设备自定义字段一致。

### 获取字段配置

```http
GET /api/ticket-fields
```

### 新增自定义字段

```json
{
  "fieldName": "impactLevel",
  "fieldLabel": "影响范围",
  "fieldType": "select",
  "options": ["低", "中", "高"],
  "required": true,
  "sortOrder": 1
}
```

## 故障分类

故障分类用于标准化故障类型，支持多级树形结构。

### 获取分类树

```http
GET /api/tickets/categories
```

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "categoryId": 1,
      "name": "硬件故障",
      "children": [
        { "categoryId": 11, "name": "硬盘故障" },
        { "categoryId": 12, "name": "电源故障" }
      ]
    }
  ]
}
```

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 参数缺失或非法状态流转 |
| `NOT_FOUND` | 404 | 工单不存在 |
| `FORBIDDEN` | 403 | 无工单处理权限 |
| `CONFLICT` | 409 | 非法状态流转（如已关闭工单再次关闭） |
