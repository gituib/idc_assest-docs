# 端口采集与设备凭据接口

本组接口支撑「设备端口自动采集」能力：通过 SSH / SNMP / Telnet / Redfish 等协议登录设备，读取真实端口与硬件清单，与系统内记录做差异比对后选择性落库。

> **版本说明**：v2.8.0 新增交换机端口自动采集、设备凭据管理与设备/耗材图片上传；v2.8.4 新增前端错误日志上报。

## 模块与接口前缀

| 模块 | 接口前缀 | 说明 |
|------|----------|------|
| 设备凭据 | `/api/device-credentials` | 采集凭据（SSH / SNMP / Telnet / Redfish）的增删改查与连通性测试 |
| 端口采集 | `/api/port-discovery` | 交换机端口自动发现与差异落库 |
| 服务器采集 | `/api/server-discovery` | 服务器 BMC 带外（Redfish）硬件清单与网卡端口采集 |
| 端口选项 | `/api/port-options` | 端口类型 / 速率 / 线缆类型下拉选项（免鉴权） |
| 设备端口 | `/api/device-ports` | 端口记录 CRUD（注意前缀为 `device-ports`，非 `ports`） |
| 网卡 | `/api/network-cards` | 网卡记录 CRUD |

> **重要**：早期文档中使用的 `/api/ports` **并非实际挂载路径**，实际前缀为 `/api/device-ports`。

---

## 设备凭据

### 数据模型（DeviceCredential）

| 字段 | 类型 | 说明 |
|------|------|------|
| `credentialId` | string (PK) | 主键，自动生成为 `DCRE{随机4位}` |
| `deviceId` | string | 关联设备编号（必填） |
| `protocol` | enum | 采集协议：`ssh`、`snmp`、`telnet`、`redfish`（`api` 为历史预留，已不再对外提供） |
| `host` | string | 目标地址；Redfish 为 BMC 管理地址 |
| `port` | integer | 协议端口，留空使用协议默认端口 |
| `username` | string | 登录用户名（ssh / telnet / redfish） |
| `password` | string | 登录口令（**加密存储，接口输出掩码**） |
| `community` | string | SNMP 团体名（**加密存储，接口输出掩码**） |
| `vendor` | string | 设备厂商（可选），用于驱动适配 |
| `isDefault` | boolean | 是否为该设备该协议的默认凭据 |

### 安全约束

1. **加密存储**：`password`、`community` 通过 AES-256-GCM 加密落库，密钥来源于环境变量 `REMOTE_BACKUP_KEY` 或由 `JWT_SECRET` 派生。
2. **输出掩码**：列表与详情接口返回的敏感字段统一显示为 `********`。
3. **原文读取**：仅超级管理员可通过 `/raw` 端点获取明文，且受 `rawCredentialGuard` 限流与审计保护。
4. **默认凭据唯一**：同一设备同一协议下最多一条 `isDefault = true`，创建新默认凭据时自动取消旧默认标记。

### 创建凭据

```http
POST /api/device-credentials
```

权限要求：`port:edit`

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | string | 是 | 设备编号 |
| `protocol` | string | 否 | 默认 `ssh` |
| `host` | string | 条件必填 | `ssh`/`telnet`/`snmp`/`redfish` 必填 |
| `port` | integer | 否 | 端口 |
| `username` | string | 条件必填 | `ssh`/`telnet`/`redfish` 必填 |
| `password` | string | 条件必填 | `ssh`/`telnet`/`redfish` 必填 |
| `community` | string | 条件必填 | `snmp` 必填 |
| `vendor` | string | 否 | 厂商标识 |
| `isDefault` | boolean | 否 | 设为默认凭据，默认 `false` |

#### 校验错误

字段缺失时返回 `400`，`message` 为所有缺失项的拼接提示，例如：

```
host 必填; username 必填; password 必填
```

#### 请求示例

```json
{
  "deviceId": "SW-0001",
  "protocol": "ssh",
  "host": "10.10.1.11",
  "port": 22,
  "username": "netadmin",
  "password": "your_password",
  "vendor": "huawei",
  "isDefault": true
}
```

### 查询凭据列表

```http
GET /api/device-credentials
```

权限要求：`port:view`

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | string | 否 | 按设备筛选 |
| `protocol` | string | 否 | 按协议筛选 |

响应中的敏感字段均为掩码值。

### 读取凭据明文（超管）

```http
GET /api/device-credentials/{credentialId}/raw
```

权限要求：超级管理员（`requireAdmin`）+ 原始凭据访问守卫。

用于采集任务排障，调用会记录操作日志。前端界面默认不暴露该端点。

### 更新凭据

```http
PUT /api/device-credentials/{credentialId}
```

权限要求：`port:edit`。未传的敏感字段保持原值（不会因掩码回传而覆盖为 `********`）。

### 删除凭据

```http
DELETE /api/device-credentials/{credentialId}
```

权限要求：`port:edit`

### 连接测试

```http
POST /api/device-credentials/{credentialId}/test
```

权限要求：`port:view`

按协议发起真实连接，返回连通性结果与设备识别信息。异常路径统一返回固定文案：

```json
{
  "success": false,
  "message": "连接测试失败，详细信息已记录到服务端日志"
}
```

服务端日志中包含真实失败原因（超时、认证失败、协议不匹配等）。

---

## 端口自动采集（交换机）

适用于交换机、路由器、防火墙、存储等网络设备，协议通常为 SSH 或 SNMP。

### 执行采集（差异预览）

```http
POST /api/port-discovery/discover
```

权限要求：`port:view`

**该接口不写数据库**，仅返回系统内记录与设备实际端口的差异。

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | string | 是 | 目标设备编号 |
| `credentialId` | string | 否 | 指定凭据；不传则自动使用该设备 `protocol=ssh` 的默认凭据 |

#### 响应结构

```json
{
  "success": true,
  "data": {
    "diff": {
      "added": [{ "portName": "GigabitEthernet0/0/5", "portType": "RJ45", "portSpeed": "1G" }],
      "changed": [{ "portId": "PORTxxxx", "portName": "GigabitEthernet0/0/1", "fieldChanges": { "portSpeed": "10G" } }],
      "removed": [{ "portId": "PORTyyyy", "portName": "GigabitEthernet0/0/9" }]
    }
  }
}
```

| 差异分区 | 含义 |
|----------|------|
| `added` | 设备上有、系统内无的端口 |
| `changed` | 两侧都有但属性不一致的端口，`fieldChanges` 仅包含变化字段 |
| `removed` | 系统内有、设备上已不存在的端口（可能为已拆板卡或改配） |

### 应用差异落库

```http
POST /api/port-discovery/apply
```

权限要求：`port:create`

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | string | 是 | 目标设备编号 |
| `diff` | object | 是 | `discover` 返回的差异对象原样回传 |
| `options.applyAdded` | boolean | 否 | 是否落库新增端口，默认 `true` |
| `options.applyChanged` | boolean | 否 | 是否落库变更端口，默认 `true` |
| `options.applyRemoved` | boolean | 否 | 是否删除多余端口，**默认 `false`** |

#### 安全校验

| 校验项 | 说明 |
|--------|------|
| 结构校验 | Joi 校验 `deviceId` 与 `diff` 结构，`diff` 内业务字段不做 strip |
| 字段白名单 | `diff.changed[].fieldChanges` 的 key 必须属于端口可变更字段白名单，非法 key 直接 `400`，**数据库不做任何变更** |
| 事务 | 全部落库操作在单个事务内完成，任一步失败整体回滚 |

#### 错误响应

```json
{
  "success": false,
  "message": "非法的端口字段变更：portId,deviceId"
}
```

---

## 服务器带外采集（Redfish）

适用于服务器，通过 BMC 管理口（Redfish API）读取硬件清单与网卡端口。

### 执行采集

```http
POST /api/server-discovery/discover
```

权限要求：`port:view`

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceId` | string | 是 | 目标服务器编号 |
| `credentialId` | string | 否 | 指定 Redfish 凭据；不传则使用该设备 `protocol=redfish` 的默认凭据 |

#### 响应内容

| 区域 | 说明 |
|------|------|
| `hardware` | CPU、内存、硬盘、电源、风扇、网络适配器等硬件清单 |
| `hardware.networkAdapters` | 网卡适配器列表（含 `index`、型号、厂家、序列号、端口列表） |
| `diff` | 与系统内端口记录的差异（`added` / `changed` / `removed`） |

### 应用采集结果

```http
POST /api/server-discovery/apply
```

权限要求：`port:create`

#### 落库行为

1. 硬件清单写入 `Device.customFields.hardware`（JSON 字段）
2. 网卡适配器同步为 `NetworkCard` 记录，命名规则固定为 `网卡{N}`（`N` 从 1 开始，对应 `hardware.networkAdapters[].index + 1`）
3. 同名网卡执行**更新**（型号 / 厂商 / 端口数 / 描述），不删除用户手工创建的其他网卡
4. 端口按 `diff` 与 `options` 落库，规则与端口采集一致

#### 网卡字段映射

| NetworkCard 字段 | 来源 |
|------------------|------|
| `name` | `网卡{index + 1}` |
| `model` | `adapter.model` |
| `manufacturer` | `adapter.manufacturer` |
| `slotNumber` | `adapter.index` |
| `portCount` | `adapter.ports.length` |
| `description` | `位置: {location} / SN: {serialNumber}` |

---

## 端口选项

### 获取端口类型 / 速率 / 线缆类型选项

```http
GET /api/port-options
```

**免鉴权**（位于公开端点白名单），供前端在登录页之外或 Token 失效时仍能渲染下拉选项。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "portTypes": [
      { "value": "RJ45", "label": "RJ45", "cnName": "电口", "group": "电口", "symbol": "⬡" },
      { "value": "SFP+", "label": "SFP+", "cnName": "增强型 SFP 光模块", "group": "10G 光模块", "symbol": "▭" }
    ],
    "portSpeeds": [{ "value": "1G", "label": "1Gbps" }],
    "cableTypes": [{ "value": "fiber", "label": "光纤" }]
  }
}
```

#### 维护约定

选项集中维护于 `backend/config/portOptions.js`，新增类型时必须同步修改对应模型（`DevicePort.portType`、`DevicePort.portSpeed`、`Cable.cableType`）的 ENUM 定义，前端无需改动。

---

## 设备端口

### 数据模型（DevicePort）

| 字段 | 类型 | 说明 |
|------|------|------|
| `portId` | string (PK) | 主键 |
| `deviceId` | string | 所属设备编号 |
| `nicId` | string | 所属网卡 ID（可选） |
| `portName` | string | 端口名称，如 `GigabitEthernet0/0/1` |
| `portType` | enum | 端口类型，取值见 `/api/port-options` |
| `portSpeed` | enum | 端口速率 |
| `macAddress` | string | MAC 地址 |
| `status` | enum | 端口状态 |
| `description` | string | 备注 |

### 接口清单

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/device-ports` | `port:view` | 端口分页列表，支持 `deviceId`、`status`、`portType`、`portSpeed` 筛选 |
| GET | `/api/device-ports/device/{deviceId}` | `port:view` | 按设备获取全部端口 |
| GET | `/api/device-ports/grouped` | `port:view` | 按设备维度分组分页，端口名自然排序（`eth1`、`eth2`、`eth10` 正确排序） |
| GET | `/api/device-ports/export/all` | `port:view` | 导出全部端口 |
| GET | `/api/device-ports/{portId}` | `port:view` | 端口详情 |
| POST | `/api/device-ports` | `port:create` | 创建单个端口 |
| POST | `/api/device-ports/batch` | `port:create` | 批量创建端口（支持单端口与范围模式） |
| PUT | `/api/device-ports/{portId}` | `port:edit` | 更新端口；**端口存在接线时禁止修改端口信息**（v2.8.1） |
| DELETE | `/api/device-ports/{portId}` | `port:delete` | 删除单个端口 |
| POST | `/api/device-ports/batch-delete` | `port:delete` | 批量删除 |
| DELETE | `/api/device-ports/batch` | `port:delete` | 批量清理 |

### 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `deviceId` | string | - | 按设备筛选 |
| `status` | string | `all` | 按状态筛选，`all` 表示不筛选 |
| `portType` | string | `all` | 按端口类型筛选 |
| `portSpeed` | string | `all` | 按速率筛选 |
| `page` | number | 1 | 页码 |
| `pageSize` | number | 10 | 每页条数 |

---

## 网卡

### 接口清单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/network-cards` | 网卡分页列表 |
| GET | `/api/network-cards/devices-summary` | 按设备维度汇总网卡与端口数量 |
| GET | `/api/network-cards/device/{deviceId}` | 某设备的全部网卡 |
| GET | `/api/network-cards/device/{deviceId}/with-ports` | 某设备的网卡及挂载端口 |
| GET | `/api/network-cards/find` | 按条件查找网卡 |
| GET | `/api/network-cards/{nicId}` | 网卡详情 |
| GET | `/api/network-cards/{nicId}/ports` | 网卡下的端口列表 |
| POST | `/api/network-cards` | 创建网卡 |
| POST | `/api/network-cards/batch` | 批量创建网卡 |
| PUT | `/api/network-cards/{nicId}` | 更新网卡（v2.2.1 新增编辑能力） |
| DELETE | `/api/network-cards/{nicId}` | 删除网卡 |

## 采集失败的常见原因

| 现象 | 可能原因 | 排查方向 |
|------|----------|----------|
| 连接超时 | 采集主机与设备网络不通，或防火墙拦截 | 从采集主机 `telnet {host} {port}` 验证 |
| 认证失败 | 用户名口令错误，或设备限制登录源 IP | 使用 `/raw` 端点核对凭据，检查设备 ACL |
| 协议不匹配 | 设备仅支持 SNMP 而凭据配置为 SSH | 核对 `protocol` 字段 |
| 采集结果为空 | 驱动未适配该厂商或型号 | 确认 `vendor` 字段，查看服务端日志中的驱动识别结果 |
| 应用差异被拒 | `fieldChanges` 含非法字段 | 检查返回的 `message` 中列出的非法字段名 |

> **安全提示**：内网采集受 SSRF 防护约束，系统设置项 `allow_intranet_collection`（默认 `true`）与 `target_whitelist`（CIDR 数组）控制目标地址范围。关闭 `allow_intranet_collection` 将拒绝所有私网目标，会中断核心采集业务。
