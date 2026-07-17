# 线缆接口

线缆接口用于管理设备端口之间的物理链路连接，支撑网络拓扑可视化与链路追踪。

> **v2.2.0 更新**：优化线缆管理流程，新增跳线引导接口，支持根据源端口智能推荐可用目标端口，提升接线操作体验。

## 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `cableId` | integer | 主键，自增 |
| `cableName` | string | 线缆名称/标签 |
| `cableType` | string | 线缆类型，如 `Cat6`、`Cat6a`、`OM3`、`OS2` |
| `length` | number | 线缆长度（米） |
| `sourceDeviceId` | integer | 源端设备 ID |
| `sourcePortId` | integer | 源端端口 ID |
| `targetDeviceId` | integer | 目标端设备 ID |
| `targetPortId` | integer | 目标端端口 ID |
| `status` | string | 状态：`connected`、`disconnected`、`faulty` |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

## 获取线缆列表

```http
GET /api/cables
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `cableType` | string | 否 | 按线缆类型筛选 |
| `status` | string | 否 | 按状态筛选 |
| `deviceId` | integer | 否 | 按设备筛选（源端或目标端） |
| `roomId` | integer | 否 | 按机房筛选 |
| `keyword` | string | 否 | 线缆名称关键词 |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "cableId": 1,
        "cableName": "Cable-01",
        "cableType": "Cat6",
        "length": 5.0,
        "status": "connected",
        "sourceDeviceId": 1,
        "sourceDevice": { "deviceId": 1, "name": "Server-01" },
        "sourcePortId": 1,
        "sourcePort": { "portId": 1, "portName": "eth0" },
        "targetDeviceId": 2,
        "targetDevice": { "deviceId": 2, "name": "Switch-01" },
        "targetPortId": 10,
        "targetPort": { "portId": 10, "portName": "GigabitEthernet0/1" }
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 20
  }
}
```

## 获取线缆详情

```http
GET /api/cables/:cableId
```

## 跳线引导

v2.2.0 新增，根据源端口智能推荐可用的目标端口，引导用户完成跳线操作。

```http
GET /api/cables/guide
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sourcePortId` | integer | 是 | 源端口 ID |
| `cableType` | string | 否 | 线缆类型，用于筛选匹配的目标端口类型 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "sourcePort": {
      "portId": 1,
      "portName": "eth0",
      "portType": "network",
      "deviceId": 1,
      "deviceName": "Server-01"
    },
    "availableTargets": [
      {
        "deviceId": 2,
        "deviceName": "Switch-01",
        "ports": [
          {
            "portId": 10,
            "portName": "GigabitEthernet0/1",
            "portType": "network",
            "speed": "1Gbps",
            "status": "active"
          }
        ]
      }
    ]
  }
}
```

### 说明

- 接口返回的均为**未建立连接**的可用端口，已连接端口会被自动过滤
- 当指定 `cableType` 时，系统会根据线缆类型匹配对应类型的端口（如光纤匹配光口）
- 前端可基于返回结果渲染端口选择器，引导用户逐步完成跳线

## 创建线缆

```http
POST /api/cables
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `cableName` | string | 是 | 线缆名称 |
| `cableType` | string | 否 | 线缆类型 |
| `length` | number | 否 | 长度（米） |
| `sourceDeviceId` | integer | 是 | 源端设备 ID |
| `sourcePortId` | integer | 是 | 源端端口 ID |
| `targetDeviceId` | integer | 是 | 目标端设备 ID |
| `targetPortId` | integer | 是 | 目标端端口 ID |
| `status` | string | 否 | 状态，默认 `connected` |

### 请求示例

```json
{
  "cableName": "Cable-02",
  "cableType": "OM3",
  "length": 3.0,
  "sourceDeviceId": 1,
  "sourcePortId": 2,
  "targetDeviceId": 3,
  "targetPortId": 5
}
```

### 响应

```json
{
  "success": true,
  "data": { "cableId": 2 },
  "message": "创建成功"
}
```

## 更新线缆

```http
PUT /api/cables/:cableId
```

支持部分更新，字段定义同「创建线缆」。

## 删除线缆

```http
DELETE /api/cables/:cableId
```

## 链路追踪

查询指定设备或端口的完整链路连接关系。

```http
GET /api/cables/trace
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | integer | 否 | 设备 ID（与 portId 二选一） |
| `portId` | integer | 否 | 端口 ID（与 deviceId 二选一） |

### 响应示例

```json
{
  "success": true,
  "data": {
    "start": {
      "deviceId": 1,
      "deviceName": "Server-01",
      "portId": 1,
      "portName": "eth0"
    },
    "end": {
      "deviceId": 2,
      "deviceName": "Switch-01",
      "portId": 10,
      "portName": "GigabitEthernet0/1"
    },
    "cable": {
      "cableId": 1,
      "cableName": "Cable-01",
      "cableType": "Cat6",
      "length": 5.0
    }
  }
}
```

## 网络拓扑

获取网络拓扑数据，用于前端 ReactFlow 可视化渲染。

```http
GET /api/topology
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `roomId` | integer | 否 | 按机房筛选 |
| `rackId` | integer | 否 | 按机柜筛选 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "nodes": [
      { "id": "device-1", "type": "device", "label": "Server-01", "data": { "deviceId": 1 } },
      { "id": "device-2", "type": "switch", "label": "Switch-01", "data": { "deviceId": 2 } }
    ],
    "edges": [
      {
        "id": "cable-1",
        "source": "device-1",
        "target": "device-2",
        "label": "Cable-01"
      }
    ]
  }
}
```

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 端口已被占用或参数缺失 |
| `NOT_FOUND` | 404 | 线缆不存在 |
| `CONFLICT` | 409 | 端口已连接其他线缆 |
| `FORBIDDEN` | 403 | 无线缆管理权限 |
