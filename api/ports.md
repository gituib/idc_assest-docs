# 设备端口接口

设备端口接口用于管理设备上的物理网络接口，支持端口与网卡的绑定，是网络运维的基础数据支撑。

> **路径说明**：实际挂载前缀为 **`/api/device-ports`**（定义于 `backend/config/routes.js`），不是 `/api/ports`。

> **v2.8.2 更新**：批量创建补齐四向冲突检查；端口有接线时禁止修改端口信息。

> **v2.2.0 更新**：新增端口批量操作接口（批量编辑、批量清理），支持分组预览功能。

> **v2.1.1 更新**：端口列表支持按设备分组分页查询，解决端口数量过多时的分页问题。

## 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `portId` | string (PK) | 主键，创建时可自定义，缺省自动生成 `PORT-{时间戳}-{随机数}` |
| `deviceId` | string | 所属设备编号 |
| `nicId` | string | 所属网卡 ID（可选） |
| `portName` | string | 端口名称，如 `GigabitEthernet0/0/1`（同一设备内唯一） |
| `portType` | enum | 端口类型，默认 `RJ45`；完整枚举见 `/api/port-options`（RJ45、PoE、SFP、SFP+、SFP28、QSFP、QSFP28、QSFP56、CFP 等） |
| `portSpeed` | enum | 端口速率，默认 `1G` |
| `status` | enum | 端口状态，默认 `free` |
| `vlanId` | string | VLAN ID |
| `macAddress` | string | MAC 地址 |
| `description` | string | 备注 |
| `connectedDevice` | string | 对端设备描述 |
| `createdAt` / `updatedAt` | datetime | 时间戳 |

> **枚举来源**：端口类型与速率枚举集中维护于 `backend/config/portOptions.js`，模型 ENUM 与其保持一致。新增强类型时前端无需改动。

## 权限码

| 权限码 | 覆盖操作 |
|--------|----------|
| `port:view` | 列表、详情、分组、导出 |
| `port:create` | 创建、批量创建 |
| `port:edit` | 更新、批量绑定网卡 |
| `port:delete` | 删除、批量删除、批量清理 |

## 获取端口列表

支持两种查询模式：传统分页查询和按设备分组查询。

### 传统分页查询

```http
GET /api/device-ports
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | string | 否 | 按设备筛选 |
| `portType` | string | 否 | 按端口类型筛选，`all` 表示不筛选 |
| `portSpeed` | string | 否 | 按速率筛选，`all` 表示不筛选 |
| `status` | string | 否 | 按状态筛选，`all` 表示不筛选 |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 10 |

响应中的每条端口记录会内联关联的 `device`（`deviceId`、`name`、`type`、`rackId`）与 `networkCard`（`nicId`、`name`）。

### 按设备分组查询

v2.1.1 新增，按设备维度分页，每个设备下返回其所有端口（端口名称自然排序，`eth1` / `eth2` / `eth10` 排序正确）。

```http
GET /api/device-ports/grouped
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `roomId` | string | 否 | 按机房筛选设备 |
| `rackId` | string | 否 | 按机柜筛选设备 |
| `keyword` | string | 否 | 设备名称关键词 |
| `page` | number | 否 | 页码（设备维度），默认 1 |
| `pageSize` | number | 否 | 每页设备数 |

## 按设备获取全部端口

```http
GET /api/device-ports/device/{deviceId}
```

不分页，返回该设备的完整端口列表。适用于单台服务器或交换机的端口面板渲染。

## 导出全部端口

```http
GET /api/device-ports/export/all
```

返回可下载的端口清单，字段包含所属设备、端口名、类型、速率、状态、VLAN、MAC 等。

## 获取端口详情

```http
GET /api/device-ports/{portId}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "portId": "PORT-1730000000000-1234",
    "deviceId": "SW-0001",
    "device": { "deviceId": "SW-0001", "name": "核心交换机 01", "type": "switch", "rackId": "A-01" },
    "portName": "GigabitEthernet0/0/1",
    "portType": "RJ45",
    "portSpeed": "1G",
    "status": "used",
    "vlanId": "100",
    "networkCard": { "nicId": "NIC0001", "name": "网卡1" }
  }
}
```

## 创建端口

```http
POST /api/device-ports
Content-Type: application/json
```

权限要求：`port:create`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | string | 是 | 所属设备编号 |
| `portName` | string | 是 | 端口名称 |
| `portId` | string | 否 | 自定义主键，缺省自动生成 |
| `nicId` | string | 否 | 绑定网卡 ID |
| `portType` | string | 否 | 端口类型，默认 `RJ45` |
| `portSpeed` | string | 否 | 速率，默认 `1G` |
| `status` | string | 否 | 状态，默认 `free` |
| `vlanId` | string | 否 | VLAN ID |
| `description` | string | 否 | 备注 |

### 唯一性校验

同一 `deviceId` 下 `portName` 不可重复，冲突时返回 `400 该设备的端口名称已存在`。

### 请求示例

```json
{
  "deviceId": "SW-0001",
  "portName": "GigabitEthernet0/0/5",
  "portType": "SFP+",
  "portSpeed": "10G",
  "vlanId": "200"
}
```

## 批量创建端口

```http
POST /api/device-ports/batch
Content-Type: application/json
```

权限要求：`port:create`

支持「单端口」与「范围模式」两种录入方式（如 `GigabitEthernet0/0/1` 至 `GigabitEthernet0/0/24`）。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ports` | array | 是 | 端口对象数组，每项需含 `portId`、`deviceId`（或 `deviceSn`）、`portName` |
| `skipExisting` | boolean | 否 | 遇同名端口时跳过，默认 `false` |
| `updateExisting` | boolean | 否 | 遇同名端口时更新，默认 `false` |

### 响应结构

```json
{
  "success": true,
  "data": {
    "total": 24,
    "success": 22,
    "failed": 1,
    "skipped": 1,
    "updated": 0,
    "errors": [{ "index": 7, "portName": "Gi0/0/8", "message": "缺少必填字段" }]
  }
}
```

整批在单个事务中执行；单条失败会记入 `errors` 而不中断其他条目。

## 更新端口

```http
PUT /api/device-ports/{portId}
Content-Type: application/json
```

权限要求：`port:edit`

### 可更新字段白名单

仅以下字段允许更新，其余字段提交后会被**静默忽略**：

```
portName, portType, portSpeed, status, vlanId, description, connectedDevice, macAddress
```

未提交任何可更新字段时返回 `400 没有可更新的字段`。

### 接线保护

> **v2.8.2 新增**：端口存在关联接线时，**拒绝修改端口任何信息**，避免绕过 `Cable` 表直接改端口造成数据不一致。需先删除对应接线。

## 删除端口

```http
DELETE /api/device-ports/{portId}
```

权限要求：`port:delete`

## 批量删除端口

```http
POST /api/device-ports/batch-delete
Content-Type: application/json
```

权限要求：`port:delete`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `portIds` | string[] | 是 | 端口 ID 列表 |

### 接线前置校验

批量删除前会校验关联接线。存在接线时整批拒绝并返回明细：

```json
{
  "error": "部分端口存在关联的接线记录，请先删除关联的接线",
  "relatedCables": [
    {
      "cableId": "CBL0001",
      "sourceDeviceId": "SW-0001",
      "sourcePort": "PORT001",
      "targetDeviceId": "SRV-0001",
      "targetPort": "PORT088"
    }
  ]
}
```

## 批量清理端口

```http
DELETE /api/device-ports/batch
Content-Type: application/json
```

权限要求：`port:delete`

与批量删除的区别：批量清理用于端口回收重置场景，清除端口的绑定关系与备注信息，保留端口记录本身。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `portIds` | string[] | 是 | 端口 ID 列表 |

若端口存在关联接线，返回结构与批量删除一致。

## 绑定网卡

```http
PUT /api/device-ports/{portId}
```

网卡绑定通过更新端口的 `nicId` 字段实现（同一端点，无单独的 `bind-card` 子路径）。

## 网卡管理

### 数据模型（NetworkCard）

| 字段 | 类型 | 说明 |
|------|------|------|
| `nicId` | string (PK) | 主键 |
| `deviceId` | string | 所属设备编号 |
| `name` | string | 网卡名称，如「网卡1」「eth0」「Primary NIC」 |
| `description` | string | 描述 |
| `slotNumber` | integer | 插槽编号 |
| `portCount` | integer | 端口数量，默认 0 |
| `model` | string | 网卡型号 |
| `manufacturer` | string | 制造商 |
| `status` | enum | `normal`、`warning`、`fault`、`offline`，默认 `normal` |

### 接口清单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/network-cards` | 网卡分页列表 |
| GET | `/api/network-cards/devices-summary` | 按设备汇总网卡与端口数量 |
| GET | `/api/network-cards/device/{deviceId}` | 某设备的全部网卡 |
| GET | `/api/network-cards/device/{deviceId}/with-ports` | 某设备的网卡及挂载端口 |
| GET | `/api/network-cards/find` | 按条件查找网卡 |
| GET | `/api/network-cards/{nicId}` | 网卡详情 |
| GET | `/api/network-cards/{nicId}/ports` | 网卡下的端口列表 |
| POST | `/api/network-cards` | 创建网卡 |
| POST | `/api/network-cards/batch` | 批量创建网卡 |
| PUT | `/api/network-cards/{nicId}` | 更新网卡（v2.2.1 新增） |
| DELETE | `/api/network-cards/{nicId}` | 删除网卡 |

### 创建网卡请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | string | 是 | 所属设备编号 |
| `name` | string | 是 | 网卡名称 |
| `description` | string | 否 | 描述 |
| `slotNumber` | integer | 否 | 插槽编号 |
| `portCount` | integer | 否 | 端口数量 |
| `model` | string | 否 | 型号 |
| `manufacturer` | string | 否 | 制造商 |
| `status` | string | 否 | 状态，默认 `normal` |

> 服务器带外采集（Redfish）会自动将硬件清单中的网络适配器同步为网卡记录，命名规则为 `网卡{index + 1}`。详见 [端口采集与设备凭据](./port-collection)。

## 自动采集与手动维护的关系

端口数据有两条来源路径，二者共用同一张 `device_ports` 表：

| 来源 | 入口 | 说明 |
|------|------|------|
| 手动维护 | 端口管理页面，调用本页接口 | 适用于逐条录入或有机柜规划的场景 |
| 自动采集 | `/api/port-discovery/apply`、`/api/server-discovery/apply` | 从设备实际配置同步，需先 `discover` 预览差异 |

采集落库时会复用批量创建/更新逻辑，因此手动添加的端口不会被无意覆盖（`removed` 默认不落库）。

## 相关文档

- [端口采集与设备凭据](./port-collection)
- [线缆接口](./cables)
- [IPAM 接口](./ipam)

## 错误码

| HTTP | 说明 |
|------|------|
| `400` | 参数缺失、端口名称重复、无可用更新字段、存在关联接线 |
| `403` | 无对应端口权限码 |
| `404` | 端口或网卡不存在 |
| `409` | 资源冲突 |
