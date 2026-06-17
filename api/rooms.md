# 机房接口

机房是系统的顶层物理空间单元，代表一个独立的数据中心机房或设备间。

## 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `roomId` | integer | 主键，自增 |
| `name` | string | 机房名称，如 "A栋机房" |
| `location` | string | 位置描述，如 "A栋3楼" |
| `area` | number | 机房面积（平方米） |
| `manager` | string | 机房负责人姓名 |
| `phone` | string | 联系电话 |
| `remark` | string | 备注 |
| `imageUrl` | string | 机房图片 URL |
| `floorplan` | object | 平面图布局数据 |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

## 获取机房列表

```http
GET /api/rooms
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | string | 否 | 名称/位置关键词 |
| `manager` | string | 否 | 负责人 |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "roomId": 1,
        "name": "A栋机房",
        "location": "A栋3楼",
        "area": 200.5,
        "manager": "张三",
        "phone": "13800000000",
        "rackCount": 20,
        "deviceCount": 156,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20
  }
}
```

## 获取机房详情

```http
GET /api/rooms/:roomId
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "roomId": 1,
    "name": "A栋机房",
    "location": "A栋3楼",
    "area": 200.5,
    "manager": "张三",
    "phone": "13800000000",
    "remark": "主机房",
    "imageUrl": "/uploads/rooms/1.jpg",
    "floorplan": {
      "width": 800,
      "height": 600,
      "zones": [
        { "id": "z1", "name": "服务器区", "x": 0, "y": 0, "w": 400, "h": 300 }
      ],
      "racks": [
        { "rackId": 1, "name": "A-01", "x": 50, "y": 50 }
      ]
    },
    "stats": {
      "rackCount": 20,
      "deviceCount": 156,
      "onlineCount": 150,
      "usedU": 320,
      "totalU": 840
    }
  }
}
```

## 创建机房

```http
POST /api/rooms
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 机房名称 |
| `location` | string | 否 | 位置描述 |
| `area` | number | 否 | 面积 |
| `manager` | string | 否 | 负责人 |
| `phone` | string | 否 | 联系电话 |
| `remark` | string | 否 | 备注 |
| `imageUrl` | string | 否 | 机房图片 URL |

### 请求示例

```json
{
  "name": "B栋机房",
  "location": "B栋2楼",
  "area": 150.0,
  "manager": "李四",
  "phone": "13900000000"
}
```

### 响应

```json
{
  "success": true,
  "data": { "roomId": 2 },
  "message": "创建成功"
}
```

## 更新机房

```http
PUT /api/rooms/:roomId
```

支持部分更新，字段定义同「创建机房」。

## 删除机房

::: warning 注意
删除机房前需确保该机房下没有机柜和设备，否则将返回 `CONFLICT` 错误。
:::

```http
DELETE /api/rooms/:roomId
```

### 响应

```json
{
  "success": true,
  "message": "删除成功"
}
```

## 平面图管理

### 更新平面图

```http
PUT /api/rooms/:roomId/floorplan
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `floorplan` | object | 是 | 平面图布局数据（机柜位置、区域标注等） |

#### 请求示例

```json
{
  "floorplan": {
    "width": 800,
    "height": 600,
    "zones": [
      { "id": "z1", "name": "服务器区", "x": 0, "y": 0, "w": 400, "h": 300 }
    ],
    "racks": [
      { "rackId": 1, "x": 50, "y": 50 }
    ]
  }
}
```

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 参数缺失 |
| `NOT_FOUND` | 404 | 机房不存在 |
| `CONFLICT` | 409 | 机房下存在机柜/设备，无法删除 |
| `FORBIDDEN` | 403 | 无机房管理权限 |
