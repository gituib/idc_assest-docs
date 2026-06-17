# 设备接口

设备是系统的核心管理对象，包含服务器、网络设备、存储设备等各类 IT 设备。

## 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `deviceId` | integer | 主键，自增 |
| `name` | string | 设备名称/别名 |
| `type` | string | 设备类型，如 `server`、`switch`、`router`、`storage` |
| `brand` | string | 品牌，如 Dell、HP、Cisco |
| `model` | string | 型号 |
| `serialNumber` | string | 序列号（唯一） |
| `rackId` | integer | 所属机柜 ID |
| `position` | integer | 在机柜中的起始 U 位（从底部 1 开始） |
| `height` | integer | 占用 U 位数（1U、2U、4U 等） |
| `ipAddress` | string | 管理 IP 地址 |
| `status` | string | 设备状态：`online`、`offline`、`maintenance`、`retired` |
| `customFields` | object | 自定义字段扩展 |
| `purchaseDate` | string | 采购日期 |
| `warrantyExpiry` | string | 保修到期日期 |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

### 设备状态流转

```
online ⇄ maintenance → retired
  ↓
offline
```

## 获取设备列表

```http
GET /api/devices
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | string | 否 | 关键词（名称、序列号、IP） |
| `status` | string | 否 | 设备状态 |
| `type` | string | 否 | 设备类型 |
| `rackId` | integer | 否 | 机柜 ID |
| `roomId` | integer | 否 | 机房 ID（按机房筛选） |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "deviceId": 1,
        "name": "Server-01",
        "type": "server",
        "brand": "Dell",
        "model": "R740",
        "serialNumber": "DL740001",
        "rackId": 1,
        "position": 1,
        "height": 2,
        "ipAddress": "192.168.1.10",
        "status": "online",
        "purchaseDate": "2025-01-15",
        "warrantyExpiry": "2028-01-15",
        "createdAt": "2025-01-15T08:00:00Z",
        "updatedAt": "2026-06-01T10:30:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

## 获取设备详情

```http
GET /api/devices/:deviceId
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `deviceId` | integer | 设备 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "deviceId": 1,
    "name": "Server-01",
    "type": "server",
    "brand": "Dell",
    "model": "R740",
    "serialNumber": "DL740001",
    "rackId": 1,
    "rack": {
      "rackId": 1,
      "name": "A-01",
      "room": { "roomId": 1, "name": "A栋机房" }
    },
    "position": 1,
    "height": 2,
    "ipAddress": "192.168.1.10",
    "status": "online",
    "customFields": { "cpu": "Intel Xeon Gold 6248", "memory": "128GB" },
    "purchaseDate": "2025-01-15",
    "warrantyExpiry": "2028-01-15"
  }
}
```

## 创建设备

```http
POST /api/devices
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 设备名称 |
| `type` | string | 是 | 设备类型 |
| `brand` | string | 否 | 品牌 |
| `model` | string | 否 | 型号 |
| `serialNumber` | string | 是 | 序列号（唯一） |
| `rackId` | integer | 否 | 所属机柜 ID |
| `position` | integer | 否 | 起始 U 位 |
| `height` | integer | 否 | 占用 U 位数 |
| `ipAddress` | string | 否 | 管理 IP |
| `status` | string | 否 | 状态，默认 `online` |
| `customFields` | object | 否 | 自定义字段 |
| `purchaseDate` | string | 否 | 采购日期 |
| `warrantyExpiry` | string | 否 | 保修到期日期 |

### 请求示例

```json
{
  "name": "Server-01",
  "type": "server",
  "brand": "Dell",
  "model": "R740",
  "serialNumber": "DL740001",
  "rackId": 1,
  "position": 1,
  "height": 2,
  "ipAddress": "192.168.1.10",
  "status": "online"
}
```

### 响应

```json
{
  "success": true,
  "data": { "deviceId": 1 },
  "message": "创建成功"
}
```

## 更新设备

```http
PUT /api/devices/:deviceId
Content-Type: application/json
```

### 请求体

支持部分更新，仅传需要修改的字段即可，字段定义同「创建设备」。

### 请求示例

```json
{
  "status": "maintenance",
  "ipAddress": "192.168.1.11"
}
```

### 响应

```json
{
  "success": true,
  "message": "更新成功"
}
```

## 删除设备

```http
DELETE /api/devices/:deviceId
```

### 响应

```json
{
  "success": true,
  "message": "删除成功"
}
```

## 批量操作

### 批量修改

```http
PUT /api/devices/batch
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deviceIds` | integer[] | 是 | 设备 ID 列表 |
| `data` | object | 是 | 需要批量修改的字段 |

#### 请求示例

```json
{
  "deviceIds": [1, 2, 3],
  "data": { "rackId": 5, "status": "offline" }
}
```

### 批量删除

```http
DELETE /api/devices/batch
Body: { "deviceIds": [1, 2, 3] }
```

## 批量导入导出

### 导入预览

上传文件后先进行预览校验，返回校验结果（成功/失败行数及错误明细），不实际写入数据。

```http
POST /api/devices/import-preview
Content-Type: multipart/form-data
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | file | 是 | Excel/CSV 文件 |

### 执行导入

预览校验通过后，提交确认导入。

```http
POST /api/devices/import
Content-Type: application/json
```

```json
{
  "confirmToken": "preview_returned_token",
  "overwrite": false
}
```

### 下载导入模板

```http
GET /api/devices/import-template
```

返回 Excel/CSV 模板文件流。

## 设备导出

```http
GET /api/devices/export
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `format` | string | 否 | 导出格式：`csv`（默认）、`xlsx` |
| `keyword` | string | 否 | 按关键词筛选导出范围 |
| `status` | string | 否 | 按状态筛选 |
| `ids` | string | 否 | 指定设备 ID 列表，逗号分隔（如 `1,2,3`） |

### 响应

返回文件流，`Content-Type: application/octet-stream`，浏览器自动触发下载。

## 设备自定义字段

设备模块支持动态自定义字段，字段配置通过 `/api/device-fields` 管理。

### 获取字段配置

```http
GET /api/device-fields
```

### 新增自定义字段

```http
POST /api/device-fields
```

```json
{
  "fieldName": "cpu",
  "fieldLabel": "CPU型号",
  "fieldType": "text",
  "required": false,
  "sortOrder": 1
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `fieldName` | string | 字段标识（英文） |
| `fieldLabel` | string | 显示标签（中文） |
| `fieldType` | string | 类型：`text`、`number`、`select`、`date`、`boolean` |
| `options` | array | 选项列表（`select` 类型时使用） |
| `required` | boolean | 是否必填 |
| `sortOrder` | integer | 排序序号 |

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 序列号重复或参数缺失 |
| `NOT_FOUND` | 404 | 设备不存在 |
| `CONFLICT` | 409 | 序列号已被占用 |
| `FORBIDDEN` | 403 | 无设备管理权限 |
