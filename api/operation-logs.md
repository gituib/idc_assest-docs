# 操作日志接口

操作日志接口用于审计系统中所有用户操作记录，支持查询、模块与类型字典、统计分析。

> **路径说明**：实际挂载前缀为 **`/api/operation-logs`**（定义于 `backend/config/routes.js`），不是 `/api/logs`。

## 接口前缀

```
/api/operation-logs
```

## 权限码

| 权限码 | 覆盖操作 |
|--------|----------|
| `log:view` | 列表、详情、模块字典、类型字典、统计 |

## 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `recordId` | string (PK) | 主键 |
| `operatorId` | string | 操作人 ID |
| `operatorName` | string | 操作人姓名 |
| `module` | string | 操作模块，如 `device`、`ticket`、`user` |
| `operationType` | string | 操作类型，如 `create`、`update`、`delete`、`login` |
| `targetId` | string | 目标对象 ID |
| `targetName` | string | 目标对象名称 |
| `description` | string | 操作描述（中文可读文案） |
| `result` | string | 操作结果：`success`、`failed` |
| `ip` | string | 操作来源 IP |
| `userAgent` | string | 客户端 UA |
| `requestPath` | string | 请求路径 |
| `beforeState` / `afterState` | json | 操作前后状态快照（用于危险操作追溯） |
| `metadata` | json | 附加信息（如空闲原因、批量条数、错误信息） |
| `createdAt` | datetime | 操作时间 |

> **与旧版差异**：模型使用 `operationType` 而非 `action`，使用 `recordId` 而非 `logId`，`result` 为显式字段。对接时需注意字段命名。

## 获取操作日志列表

```http
GET /api/operation-logs
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20，**上限 100** |
| `module` | string | 否 | 按模块筛选 |
| `operationType` | string | 否 | 按操作类型筛选 |
| `targetId` | string | 否 | 按目标对象 ID 筛选 |
| `operatorId` | string | 否 | 按操作人 ID 筛选 |
| `keyword` | string | 否 | 关键词模糊搜索（描述、目标名称等） |
| `startDate` | string | 否 | 起始时间（ISO 8601） |
| `endDate` | string | 否 | 结束时间（ISO 8601） |
| `result` | string | 否 | 按结果筛选：`success`、`failed` |

> `pageSize` 由后端强制截断为 `min(pageSize, 100)`，超出部分不生效。

### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "recordId": "LOG0001",
        "operatorId": "USR0001",
        "operatorName": "系统管理员",
        "module": "device",
        "operationType": "create",
        "targetId": "SRV-0001",
        "targetName": "计算节点 01",
        "description": "创建设备 计算节点 01",
        "result": "success",
        "ip": "192.168.1.100",
        "createdAt": "2026-06-17T08:30:00.000Z"
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
GET /api/operation-logs/{recordId}
```

返回完整记录，含 `beforeState`、`afterState` 与 `metadata`。

## 获取模块字典

```http
GET /api/operation-logs/modules
```

返回数据库中实际出现过的模块及其中文名称，用于前端筛选下拉。

已覆盖模块包括：设备管理、机房管理、机柜管理、端口管理、线缆管理、网卡管理、耗材管理、库房管理、工单管理、盘点管理、空闲设备、认证管理、用户管理、权限管理、系统设置、备份管理、IPAM 等。

### 响应示例

```json
{
  "success": true,
  "data": [
    { "value": "device", "label": "设备管理" },
    { "value": "ticket", "label": "工单管理" }
  ]
}
```

## 获取操作类型字典

```http
GET /api/operation-logs/types
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `module` | string | 否 | 仅返回该模块下出现过的操作类型，`all` 表示全部 |

### 响应示例

```json
{
  "success": true,
  "data": [
    { "value": "create", "label": "创建" },
    { "value": "to_idle", "label": "转入空闲" },
    { "value": "restore", "label": "恢复上架" },
    { "value": "login", "label": "登录" }
  ]
}
```

> **路径说明**：端点为 `/types`，**不存在 `/actions`**。字典基于数据库中已出现的实际类型动态生成，而非固定枚举。

### 主要操作类型

| 分类 | 类型示例 |
|------|----------|
| 基础 CRUD | `create`、`update`、`delete`、`batch_delete`、`batch_update` |
| 导入导出 | `import`、`export`、`batch_import` |
| 认证 | `login`、`logout`、`register`、`unlock`、`change_password`、`reset_password` |
| 资产流转 | `to_idle`、`shelve`、`restore`、`batch_idle`、`batch_restore` |
| 库存 | `in`（入库）、`out`（出库）、`adjust`（库存调整） |
| 备份 | `backup_create`、`backup_restore`、`backup_upload`、`backup_download`、`backup_delete`、`backup_clean` |
| 采集 | `port_discovery`、`port_discovery_apply`、`server_discovery`、`credential_test` |

## 操作统计

```http
GET /api/operation-logs/statistics
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `startDate` | string | 否 | 起始时间 |
| `endDate` | string | 否 | 结束时间 |

统计结果按模块、操作类型、操作人等维度聚合，日期分组表达式同时兼容 MySQL 与 SQLite。

### 响应示例

```json
{
  "success": true,
  "data": {
    "items": [
      { "key": "device", "label": "设备管理", "count": 320 },
      { "key": "ticket", "label": "工单管理", "count": 156 }
    ],
    "total": 521
  }
}
```

## 日志归档

操作日志的归档通过 `ConsumableLogArchive` 同类机制与数据库维护脚本完成，**本路由未提供 `/export` 与 `/archive` 端点**。

如需导出，建议通过数据库直接导出或使用备份功能。日志保留策略在系统设置中配置。

## 危险操作审计

除常规操作日志外，系统另有独立的高危操作审计通道，记录删除、批量删除、全量删除、数据恢复等操作的完整前后快照与风险等级。

详见 [观测与审计辅助接口 - 危险操作审计](./system-observability#危险操作审计)。

## 错误码

| HTTP | 说明 |
|------|------|
| `403` | 无 `log:view` 权限 |
| `404` | 日志记录不存在 |
| `500` | 查询失败 |
