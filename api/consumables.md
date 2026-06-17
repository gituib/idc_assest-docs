# 耗材接口

耗材接口用于管理数据中心使用的各类消耗品，支持库存管理、入库/领用流转、SN 序列号追踪及乐观锁并发控制。

## 数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `consumableId` | integer | 主键，自增 |
| `name` | string | 耗材名称 |
| `categoryId` | integer | 所属分类 ID |
| `sku` | string | 库存单位编码 |
| `unit` | string | 计量单位，如 "个"、"箱"、"米" |
| `stock` | integer | 当前库存数量 |
| `minStock` | integer | 最低库存告警阈值 |
| `location` | string | 存放位置 |
| `snList` | array | SN 序列号列表 |
| `version` | integer | 乐观锁版本号 |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

## 获取耗材列表

```http
GET /api/consumables
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | string | 否 | 名称/SKU 关键词 |
| `categoryId` | integer | 否 | 分类 ID |
| `lowStock` | boolean | 否 | 仅返回库存预警的耗材 |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "consumableId": 1,
        "name": "光纤跳线 LC-LC OM3",
        "categoryId": 1,
        "category": { "categoryId": 1, "name": "光纤跳线" },
        "sku": "FIBER-LC-OM3-3M",
        "unit": "根",
        "stock": 50,
        "minStock": 20,
        "location": "A仓3架",
        "lowStock": false,
        "version": 3
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

## 获取耗材详情

```http
GET /api/consumables/:consumableId
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "consumableId": 1,
    "name": "光纤跳线 LC-LC OM3",
    "categoryId": 1,
    "sku": "FIBER-LC-OM3-3M",
    "unit": "根",
    "stock": 50,
    "minStock": 20,
    "location": "A仓3架",
    "snList": [
      { "sn": "SN001", "status": "in_stock", "inboundAt": "2026-01-01" },
      { "sn": "SN002", "status": "used", "outboundAt": "2026-03-15", "recipient": "张三" }
    ],
    "version": 3
  }
}
```

## 创建耗材

```http
POST /api/consumables
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 耗材名称 |
| `categoryId` | integer | 否 | 分类 ID |
| `sku` | string | 否 | SKU 编码 |
| `unit` | string | 否 | 计量单位 |
| `stock` | integer | 否 | 初始库存，默认 0 |
| `minStock` | integer | 否 | 最低库存阈值 |
| `location` | string | 否 | 存放位置 |

### 请求示例

```json
{
  "name": "网线 Cat6 3米",
  "categoryId": 2,
  "sku": "CAT6-3M",
  "unit": "根",
  "stock": 100,
  "minStock": 30,
  "location": "A仓1架"
}
```

## 更新耗材

```http
PUT /api/consumables/:consumableId
```

支持部分更新，字段定义同「创建耗材」。

## 删除耗材

```http
DELETE /api/consumables/:consumableId
```

## 库存操作

### 入库

增加耗材库存数量，支持 SN 序列号录入。

```http
POST /api/consumables/:consumableId/inbound
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `quantity` | integer | 是 | 入库数量 |
| `snList` | string[] | 否 | SN 序列号列表（需精确追踪时填写） |
| `remark` | string | 否 | 备注 |
| `version` | integer | 是 | 当前版本号（乐观锁） |

#### 请求示例

```json
{
  "quantity": 10,
  "snList": ["SN010", "SN011", "SN012"],
  "remark": "采购入库",
  "version": 3
}
```

### 出库/领用

减少耗材库存数量，记录领用人。

```http
POST /api/consumables/:consumableId/outbound
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `quantity` | integer | 是 | 出库数量 |
| `recipient` | string | 是 | 领用人 |
| `snList` | string[] | 否 | 指定出库的 SN 序列号 |
| `remark` | string | 否 | 备注 |
| `version` | integer | 是 | 当前版本号（乐观锁） |

#### 请求示例

```json
{
  "quantity": 2,
  "recipient": "张三",
  "snList": ["SN010", "SN011"],
  "remark": "设备维护领用",
  "version": 4
}
```

### 盘点

更新实际库存数量，用于账实校准。

```http
POST /api/consumables/:consumableId/stocktake
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `actualStock` | integer | 是 | 实际库存数量 |
| `remark` | string | 否 | 备注 |
| `version` | integer | 是 | 当前版本号（乐观锁） |

## 乐观锁说明

耗材模块所有修改库存的操作均需携带 `version` 字段：

- 执行操作时，服务端校验请求中的 `version` 与数据库当前版本是否一致
- 一致则执行操作并将版本号 +1
- 不一致则返回 `409 CONFLICT`，提示"数据已被其他操作修改，请刷新后重试"

## 分类管理

### 获取分类树

```http
GET /api/consumables/categories
```

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "categoryId": 1,
      "name": "光纤跳线",
      "parentId": null,
      "children": []
    }
  ]
}
```

### 创建分类

```http
POST /api/consumables/categories
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 分类名称 |
| `parentId` | integer | 否 | 父分类 ID（支持多级） |

## 操作记录

查询耗材的出入库操作历史。

```http
GET /api/consumables/:consumableId/records
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 否 | 操作类型：`inbound`、`outbound`、`stocktake` |
| `startDate` | string | 否 | 起始日期 |
| `endDate` | string | 否 | 结束日期 |
| `page` | number | 否 | 页码 |
| `pageSize` | number | 否 | 每页条数 |

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 参数缺失或 SN 数量与出库数量不符 |
| `NOT_FOUND` | 404 | 耗材不存在 |
| `CONFLICT` | 409 | 乐观锁版本冲突或库存不足 |
| `FORBIDDEN` | 403 | 无耗材管理权限 |
