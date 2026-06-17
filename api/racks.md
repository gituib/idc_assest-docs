# 机柜接口

机柜是机房的组成单元，用于安装设备，以标准 42U 机柜为参考模型。

## 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `rackId` | integer | 主键，自增 |
| `name` | string | 机柜名称/编号，如 "A-01" |
| `roomId` | integer | 所属机房 ID |
| `totalU` | integer | 总 U 位数，标准机柜通常为 42U |
| `usedU` | integer | 已占用 U 位数，实时计算 |
| `powerCapacity` | number | 额定功率容量（W） |
| `currentPower` | number | 当前功率消耗（W） |
| `location` | string | 位置编码 |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

## 获取机柜列表

```http
GET /api/racks
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `roomId` | integer | 否 | 按机房筛选 |
| `keyword` | string | 否 | 名称关键词 |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "rackId": 1,
        "name": "A-01",
        "roomId": 1,
        "room": { "roomId": 1, "name": "A栋机房" },
        "totalU": 42,
        "usedU": 20,
        "usageRate": 47.6,
        "powerCapacity": 5000,
        "currentPower": 1800,
        "deviceCount": 8
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 20
  }
}
```

## 获取机柜详情

```http
GET /api/racks/:rackId
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "rackId": 1,
    "name": "A-01",
    "roomId": 1,
    "room": { "roomId": 1, "name": "A栋机房" },
    "totalU": 42,
    "usedU": 20,
    "powerCapacity": 5000,
    "currentPower": 1800,
    "location": "A区1排",
    "devices": [
      {
        "deviceId": 1,
        "name": "Server-01",
        "position": 1,
        "height": 2,
        "status": "online"
      }
    ],
    "uLayout": [
      { "u": 1, "deviceId": 1, "occupied": true },
      { "u": 2, "deviceId": 1, "occupied": true },
      { "u": 3, "deviceId": null, "occupied": false }
    ]
  }
}
```

## 创建机柜

```http
POST /api/racks
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 机柜名称 |
| `roomId` | integer | 是 | 所属机房 ID |
| `totalU` | integer | 否 | 总 U 数，默认 42 |
| `powerCapacity` | number | 否 | 额定功率（W） |
| `location` | string | 否 | 位置编码 |

### 请求示例

```json
{
  "name": "A-02",
  "roomId": 1,
  "totalU": 42,
  "powerCapacity": 5000,
  "location": "A区2排"
}
```

### 响应

```json
{
  "success": true,
  "data": { "rackId": 2 },
  "message": "创建成功"
}
```

## 更新机柜

```http
PUT /api/racks/:rackId
```

支持部分更新，字段定义同「创建机柜」。

## 删除机柜

::: warning 注意
删除机柜前需确保机柜内无设备，否则返回 `CONFLICT` 错误。
:::

```http
DELETE /api/racks/:rackId
```

## U 位统计

获取机柜的 U 位使用情况，用于 3D 可视化和容量规划。

```http
GET /api/racks/:rackId/u-stats
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "rackId": 1,
    "totalU": 42,
    "usedU": 20,
    "freeU": 22,
    "usageRate": 47.6,
    "layout": [
      { "u": 1, "deviceId": 1, "deviceName": "Server-01", "occupied": true }
    ]
  }
}
```

## 批量导入导出

### 批量导入

```http
POST /api/racks/import
Content-Type: multipart/form-data
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | file | 是 | Excel/CSV 文件 |

### 下载导入模板

```http
GET /api/racks/import-template
```

### 批量导出

```http
GET /api/racks/export?format=xlsx
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `format` | string | 否 | 格式：`csv`（默认）、`xlsx` |
| `roomId` | integer | 否 | 按机房筛选导出 |

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 参数缺失或 U 数非法 |
| `NOT_FOUND` | 404 | 机柜不存在 |
| `CONFLICT` | 409 | 机柜内存在设备，无法删除 |
| `FORBIDDEN` | 403 | 无机柜管理权限 |
