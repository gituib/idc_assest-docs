# 端口接口

端口接口用于管理设备上的物理网络接口，支持端口与网卡的绑定，是网络运维的基础数据支撑。

> **v2.1.1 更新**：端口列表支持按设备分组分页查询，解决端口数量过多时的分页问题。

## 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `portId` | integer | 主键，自增 |
| `deviceId` | integer | 所属设备 ID |
| `portName` | string | 端口名称，如 "GigabitEthernet0/1" |
| `portType` | string | 端口类型：`network`（网口）、`optical`（光口）、`management`（管理口）、`other`（其他） |
| `speed` | string | 速率，如 "1Gbps"、"10Gbps" |
| `macAddress` | string | MAC 地址 |
| `status` | string | 状态：`active`、`inactive`、`disabled` |
| `networkCardId` | integer | 绑定的网卡 ID（可选） |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

## 获取端口列表

支持两种查询模式：传统分页查询和按设备分组查询。

### 传统分页查询

```http
GET /api/ports
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | integer | 否 | 按设备筛选 |
| `portType` | string | 否 | 按端口类型筛选 |
| `status` | string | 否 | 按状态筛选 |
| `keyword` | string | 否 | 端口名称关键词 |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

### 按设备分组查询

v2.1.1 新增，按设备维度分页，每个设备下返回其所有端口（端口名称自然排序）。

```http
GET /api/ports/grouped
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `roomId` | integer | 否 | 按机房筛选设备 |
| `rackId` | integer | 否 | 按机柜筛选设备 |
| `keyword` | string | 否 | 设备名称关键词 |
| `page` | number | 否 | 页码（设备维度），默认 1 |
| `pageSize` | number | 否 | 每页设备数，默认 10 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "deviceId": 1,
        "deviceName": "Server-01",
        "ports": [
          {
            "portId": 1,
            "portName": "eth0",
            "portType": "network",
            "speed": "1Gbps",
            "macAddress": "00:1A:2B:3C:4D:5E",
            "status": "active",
            "networkCardId": 1
          }
        ]
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

## 获取端口详情

```http
GET /api/ports/:portId
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "portId": 1,
    "deviceId": 1,
    "device": { "deviceId": 1, "name": "Server-01" },
    "portName": "eth0",
    "portType": "network",
    "speed": "1Gbps",
    "macAddress": "00:1A:2B:3C:4D:5E",
    "status": "active",
    "networkCardId": 1,
    "networkCard": { "cardId": 1, "cardName": "eth0" },
    "cables": [
      { "cableId": 1, "cableName": "Cable-01" }
    ]
  }
}
```

## 创建端口

```http
POST /api/ports
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | integer | 是 | 所属设备 ID |
| `portName` | string | 是 | 端口名称 |
| `portType` | string | 否 | 端口类型，默认 `network` |
| `speed` | string | 否 | 速率 |
| `macAddress` | string | 否 | MAC 地址 |
| `status` | string | 否 | 状态，默认 `active` |
| `networkCardId` | integer | 否 | 绑定网卡 ID |

### 请求示例

```json
{
  "deviceId": 1,
  "portName": "eth1",
  "portType": "network",
  "speed": "10Gbps",
  "macAddress": "00:1A:2B:3C:4D:5F"
}
```

## 更新端口

```http
PUT /api/ports/:portId
```

支持部分更新，字段定义同「创建端口」。

## 删除端口

```http
DELETE /api/ports/:portId
```

## 绑定网卡

将端口绑定到指定的网卡。

```http
PUT /api/ports/:portId/bind-card
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `networkCardId` | integer | 是 | 网卡 ID |

### 解绑网卡

```http
PUT /api/ports/:portId/unbind-card
```

## 网卡管理

### 获取网卡列表

```http
GET /api/network-cards
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | integer | 否 | 按设备筛选 |

### 创建网卡

```http
POST /api/network-cards
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | integer | 是 | 所属设备 ID |
| `cardName` | string | 是 | 网卡名称，如 "eth0" |
| `macAddress` | string | 否 | MAC 地址 |
| `model` | string | 否 | 网卡型号 |
| `firmwareVersion` | string | 否 | 固件版本 |

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 参数缺失或 MAC 地址格式错误 |
| `NOT_FOUND` | 404 | 端口/网卡不存在 |
| `FORBIDDEN` | 403 | 无端口管理权限 |
