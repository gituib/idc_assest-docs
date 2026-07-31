# 网络拓扑接口

> v2.0.0 新增，v2.4.0 重构。提供网络拓扑查询与布局持久化能力。

## 接口概览

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/topology/switch/:deviceId` | GET | 查询交换机拓扑，展示设备间连接关系 |
| `/api/topology/device/:deviceId` | GET | 查询单设备网络连接 |
| `/api/topology/rack/:rackId` | GET | 查询机柜内设备拓扑关系 |

## 拓扑数据模型

### Node（节点）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 节点 ID（设备 ID） |
| `type` | string | 节点类型：`server`、`switch`、`router`、`firewall`、`storage`、`generic` |
| `label` | string | 设备名称 |
| `deviceType` | string | 设备类型标识 |
| `model` | string | 设备型号 |
| `serialNumber` | string | 序列号 |
| `status` | string | 设备状态 |
| `ipAddress` | string | IP 地址 |
| `position` | object | ReactFlow 画布坐标 `{ x, y }`（仅返回端有效） |
| `isCenter` | boolean | 是否为拓扑中心设备 |
| `rackName` | string | 所在机柜名称 |
| `roomName` | string | 所在机房名称 |

### Edge（连线）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 连线 ID |
| `source` | string | 源设备 ID |
| `target` | string | 目标设备 ID |
| `sourcePort` | string | 源设备端口号 |
| `targetPort` | string | 目标设备端口号 |
| `cableType` | string | 线缆类型：`ethernet`（以太网）、`fiber`（光纤）、`copper`（铜缆） |
| `cableLength` | number | 线缆长度（米） |
| `cableLabel` | string | 线缆标签 |
| `status` | string | 连接状态 |

### TopologyLayout（布局持久化）

| 字段 | 类型 | 说明 |
|------|------|------|
| `layoutId` | integer | 主键 |
| `deviceId` | string | 设备 ID |
| `positionX` | float | X 坐标 |
| `positionY` | float | Y 坐标 |
| `zoom` | float | 缩放级别 |

### 查询交换机拓扑

```http
GET /api/topology/switch/:deviceId
```

获取指定交换机设备及其关联设备的网络拓扑关系。

### 查询设备拓扑

```http
GET /api/topology/device/:deviceId
```

获取指定设备的网络连接拓扑。

### 查询机柜拓扑

```http
GET /api/topology/rack/:rackId
```

获取指定机柜内所有设备的拓扑关系。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "DEV001",
        "type": "switch",
        "label": "核心交换机-01",
        "deviceType": "switch",
        "model": "Cisco 9300",
        "serialNumber": "SN123456",
        "status": "active",
        "ipAddress": "192.168.1.1",
        "isCenter": true,
        "rackName": "A-01",
        "roomName": "机房A"
      },
      {
        "id": "DEV002",
        "type": "server",
        "label": "计算节点-01",
        "isCenter": false,
        "rackName": "A-02",
        "roomName": "机房A"
      }
    ],
    "edges": [
      {
        "id": "CBL001",
        "source": "DEV001",
        "target": "DEV002",
        "sourcePort": "GigabitEthernet1/0/1",
        "targetPort": "eth0",
        "cableType": "fiber",
        "cableLength": 10,
        "cableLabel": "光纤-01",
        "status": "active"
      }
    ]
  }
}
```

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `NOT_FOUND` | 404 | 设备或拓扑数据不存在 |
| `UNAUTHORIZED` | 401 | 未登录 |
