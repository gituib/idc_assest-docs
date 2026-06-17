# 操作日志接口

操作日志接口用于审计系统中所有用户操作记录，支持查询、统计与导出。

## 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `logId` | integer | 主键，自增 |
| `userId` | integer | 操作人 ID |
| `username` | string | 操作人用户名 |
| `module` | string | 操作模块，如 `device`、`ticket`、`user` |
| `action` | string | 操作类型，如 `create`、`update`、`delete` |
| `method` | string | HTTP 方法 |
| `path` | string | 请求路径 |
| `ip` | string | 操作 IP 地址 |
| `userAgent` | string | 客户端 User-Agent |
| `requestBody` | object | 请求体（脱敏后） |
| `responseStatus` | integer | 响应状态码 |
| `duration` | integer | 响应耗时（毫秒） |
| `createdAt` | string | 操作时间 |

## 获取操作日志列表

```http
GET /api/logs
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | integer | 否 | 按操作人筛选 |
| `module` | string | 否 | 按模块筛选 |
| `action` | string | 否 | 按操作类型筛选 |
| `method` | string | 否 | 按 HTTP 方法筛选 |
| `ip` | string | 否 | 按 IP 筛选 |
| `keyword` | string | 否 | 路径关键词 |
| `startDate` | string | 否 | 起始时间 |
| `endDate` | string | 否 | 结束时间 |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "logId": 1,
        "userId": 1,
        "username": "admin",
        "module": "device",
        "action": "create",
        "method": "POST",
        "path": "/api/devices",
        "ip": "192.168.1.100",
        "responseStatus": 201,
        "duration": 45,
        "createdAt": "2026-06-17T08:30:00Z"
      }
    ],
    "total": 1000,
    "page": 1,
    "pageSize": 20
  }
}
```

## 获取日志详情

```http
GET /api/logs/:logId
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "logId": 1,
    "userId": 1,
    "username": "admin",
    "module": "device",
    "action": "create",
    "method": "POST",
    "path": "/api/devices",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "requestBody": { "name": "Server-01", "type": "server" },
    "responseStatus": 201,
    "duration": 45,
    "createdAt": "2026-06-17T08:30:00Z"
  }
}
```

## 获取模块列表

获取系统所有操作模块，用于筛选下拉选项。

```http
GET /api/logs/modules
```

### 响应示例

```json
{
  "success": true,
  "data": [
    { "value": "device", "label": "设备管理" },
    { "value": "ticket", "label": "工单管理" },
    { "value": "user", "label": "用户管理" },
    { "value": "room", "label": "机房管理" },
    { "value": "rack", "label": "机柜管理" },
    { "value": "consumable", "label": "耗材管理" },
    { "value": "backup", "label": "备份管理" },
    { "value": "settings", "label": "系统设置" }
  ]
}
```

## 获取操作类型列表

```http
GET /api/logs/actions
```

### 响应示例

```json
{
  "success": true,
  "data": [
    { "value": "create", "label": "创建" },
    { "value": "update", "label": "更新" },
    { "value": "delete", "label": "删除" },
    { "value": "import", "label": "导入" },
    { "value": "export", "label": "导出" },
    { "value": "login", "label": "登录" },
    { "value": "logout", "label": "退出" }
  ]
}
```

## 操作统计

按维度统计操作次数，用于审计报表。

```http
GET /api/logs/statistics
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dimension` | string | 否 | 统计维度：`module`（默认）、`action`、`user` |
| `startDate` | string | 否 | 起始时间 |
| `endDate` | string | 否 | 结束时间 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "dimension": "module",
    "items": [
      { "key": "device", "label": "设备管理", "count": 320 },
      { "key": "ticket", "label": "工单管理", "count": 156 },
      { "key": "user", "label": "用户管理", "count": 45 }
    ],
    "total": 521
  }
}
```

## 导出日志

```http
GET /api/logs/export
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `format` | string | 否 | 格式：`csv`（默认）、`xlsx` |
| `module` | string | 否 | 按模块筛选 |
| `startDate` | string | 否 | 起始时间 |
| `endDate` | string | 否 | 结束时间 |

返回文件流，浏览器自动触发下载。

## 日志归档

操作日志支持自动归档机制，保障系统性能。

### 手动归档

```http
POST /api/logs/archive
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `beforeDate` | string | 是 | 归档此日期之前的日志 |

#### 请求示例

```json
{ "beforeDate": "2025-12-31" }
```

### 响应

```json
{
  "success": true,
  "data": { "archivedCount": 50000 },
  "message": "归档成功"
}
```

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 时间范围非法 |
| `NOT_FOUND` | 404 | 日志不存在 |
| `FORBIDDEN` | 403 | 无日志查看权限 |
