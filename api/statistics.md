# 统计接口

统计接口为仪表盘和报表分析提供数据支撑，包含设备统计、工单统计、功率监控、趋势分析等。

## 仪表盘概览

获取仪表盘首页所需的汇总数据。

```http
GET /api/statistics/dashboard
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "roomCount": 5,
    "rackCount": 50,
    "deviceCount": 320,
    "deviceStatus": {
      "online": 300,
      "offline": 10,
      "maintenance": 8,
      "retired": 2
    },
    "rackUsage": {
      "totalU": 2100,
      "usedU": 1200,
      "usageRate": 57.1
    },
    "pendingTickets": 12,
    "lowStockConsumables": 5,
    "totalPower": 15.6,
    "powerCapacity": 250.0
  }
}
```

## 设备统计

### 设备状态分布

```http
GET /api/statistics/devices/status
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `roomId` | integer | 否 | 按机房筛选 |

#### 响应示例

```json
{
  "success": true,
  "data": [
    { "status": "online", "count": 300 },
    { "status": "offline", "count": 10 },
    { "status": "maintenance", "count": 8 },
    { "status": "retired", "count": 2 }
  ]
}
```

### 设备类型分布

```http
GET /api/statistics/devices/type
```

#### 响应示例

```json
{
  "success": true,
  "data": [
    { "type": "server", "count": 200 },
    { "type": "switch", "count": 50 },
    { "type": "router", "count": 20 },
    { "type": "storage", "count": 50 }
  ]
}
```

## 机柜容量统计

### 机柜使用率概览

```http
GET /api/statistics/racks/usage
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `roomId` | integer | 否 | 按机房筛选 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRacks": 50,
      "totalU": 2100,
      "usedU": 1200,
      "freeU": 900,
      "usageRate": 57.1
    },
    "rooms": [
      {
        "roomId": 1,
        "roomName": "A栋机房",
        "rackCount": 20,
        "usageRate": 65.2
      }
    ],
    "racks": [
      {
        "rackId": 1,
        "rackName": "A-01",
        "roomId": 1,
        "totalU": 42,
        "usedU": 20,
        "usageRate": 47.6,
        "level": "normal"
      }
    ]
  }
}
```

#### 使用率等级

| 等级 | 范围 | 颜色标识 |
|------|------|----------|
| `normal` | < 60% | 🟢 绿色 |
| `warning` | 60% - 85% | 🟡 黄色 |
| `critical` | > 85% | 🔴 红色 |

## 功率监控

### 总功率

```http
GET /api/statistics/power/total
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "totalPower": 15.6,
    "totalCapacity": 250.0,
    "usageRate": 6.2,
    "pue": 1.5
  }
}
```

### 机柜功率排行

```http
GET /api/statistics/power/ranking
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `limit` | integer | 否 | 返回条数，默认 10 |
| `order` | string | 否 | 排序：`desc`（默认，从高到低）、`asc` |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "rackId": 1,
      "rackName": "A-01",
      "currentPower": 1800,
      "powerCapacity": 5000,
      "usageRate": 36.0
    }
  ]
}
```

### 功率趋势

```http
GET /api/statistics/power/trend
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `granularity` | string | 否 | 粒度：`hour`、`day`（默认）、`week`、`month` |
| `startDate` | string | 否 | 起始日期 |
| `endDate` | string | 否 | 结束日期 |

#### 响应示例

```json
{
  "success": true,
  "data": [
    { "date": "2026-06-10", "totalPower": 14.5, "avgPower": 14.2 },
    { "date": "2026-06-11", "totalPower": 15.0, "avgPower": 14.8 },
    { "date": "2026-06-12", "totalPower": 15.6, "avgPower": 15.3 }
  ]
}
```

## 趋势分析

### 设备数量趋势

```http
GET /api/statistics/devices/trend
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `granularity` | string | 否 | 粒度：`day`、`week`、`month`（默认）、`year` |
| `startDate` | string | 否 | 起始日期 |
| `endDate` | string | 否 | 结束日期 |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-04",
      "total": 310,
      "online": 290,
      "offline": 8,
      "maintenance": 10,
      "retired": 2
    },
    {
      "date": "2026-05",
      "total": 315,
      "online": 295,
      "offline": 10,
      "maintenance": 8,
      "retired": 2
    }
  ]
}
```

### 工单趋势

```http
GET /api/statistics/tickets/trend
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `granularity` | string | 否 | 粒度：`day`、`week`、`month`（默认） |
| `startDate` | string | 否 | 起始日期 |
| `endDate` | string | 否 | 结束日期 |

#### 响应示例

```json
{
  "success": true,
  "data": [
    { "date": "2026-05", "created": 45, "resolved": 42, "closed": 40 },
    { "date": "2026-06", "created": 38, "resolved": 35, "closed": 33 }
  ]
}
```

## 工单统计

### 工单分类统计

```http
GET /api/statistics/tickets/category
```

#### 响应示例

```json
{
  "success": true,
  "data": [
    { "categoryId": 1, "categoryName": "硬件故障", "count": 25 },
    { "categoryId": 2, "categoryName": "网络故障", "count": 18 }
  ]
}
```

### 工单处理效率

```http
GET /api/statistics/tickets/efficiency
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `startDate` | string | 否 | 起始日期 |
| `endDate` | string | 否 | 结束日期 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "totalTickets": 100,
    "resolvedTickets": 95,
    "avgResponseTime": 1.5,
    "avgResolveTime": 8.2,
    "onTimeRate": 92.5
  }
}
```

### 人员处理统计

```http
GET /api/statistics/tickets/assignee
```

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "userId": 2,
      "username": "operator01",
      "total": 30,
      "resolved": 28,
      "avgResolveTime": 6.5,
      "completionRate": 93.3
    }
  ]
}
```

## 耗材统计

### 库存总览

```http
GET /api/statistics/consumables/overview
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "totalTypes": 50,
    "totalStock": 5000,
    "lowStockCount": 5,
    "outOfStockCount": 2,
    "totalValue": 125000.00
  }
}
```

### 领用趋势

```http
GET /api/statistics/consumables/trend
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `granularity` | string | 否 | 粒度：`day`、`week`、`month`（默认） |
| `startDate` | string | 否 | 起始日期 |
| `endDate` | string | 否 | 结束日期 |

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 时间范围或粒度参数非法 |
| `FORBIDDEN` | 403 | 无统计查看权限 |
