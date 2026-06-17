# API 概览

## 接口基础规范

| 项目 | 规范 |
|------|------|
| 基础URL | `http://localhost:8000/api` |
| 认证方式 | JWT Bearer Token |
| Content-Type | `application/json` |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601（如 `2026-06-17T08:30:00Z`） |

## 认证流程

系统采用 JWT（JSON Web Token）进行身份认证，整体流程如下：

```
1. 客户端 POST /api/auth/login 提交账号密码
2. 服务端校验通过后返回 accessToken 和 refreshToken
3. 客户端将 accessToken 存储在本地
4. 后续请求在请求头携带：Authorization: Bearer <accessToken>
5. accessToken 过期后，使用 refreshToken 调用 /api/auth/refresh 获取新令牌
```

### 请求头示例

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Token 说明

| 字段 | 说明 | 有效期 |
|------|------|--------|
| `accessToken` | 访问令牌，用于接口鉴权 | 默认 2 小时 |
| `refreshToken` | 刷新令牌，用于获取新的 accessToken | 默认 7 天 |

> 实际有效期由后端 JWT 配置决定，可通过环境变量 `JWT_EXPIRES_IN` 和 `JWT_REFRESH_EXPIRES_IN` 调整。

## 主要 API 模块

| 模块 | 基础路径 | 功能描述 |
|------|----------|----------|
| [认证](./auth) | `/api/auth` | 登录、注册、Token 刷新 |
| [机房](./rooms) | `/api/rooms` | 机房 CRUD、平面图布局 |
| [机柜](./racks) | `/api/racks` | 机柜 CRUD、U 位统计 |
| [设备](./devices) | `/api/devices` | 设备 CRUD、批量导入导出、自定义字段 |
| [端口](./ports) | `/api/ports` | 设备端口管理、网卡绑定 |
| [线缆](./cables) | `/api/cables` | 线缆连接管理 |
| [工单](./tickets) | `/api/tickets` | 工单全流程、状态流转 |
| [耗材](./consumables) | `/api/consumables` | 耗材 CRUD、入库/领用、SN 追踪 |
| [盘点](./inventory) | `/api/inventory` | 盘点计划/任务/记录 |
| [用户](./users) | `/api/users` | 用户管理、角色权限 |
| [系统设置](./system-settings) | `/api/settings` | 系统参数配置 |
| [备份](./backup) | `/api/backup` | 备份恢复、自动备份 |
| [统计](./statistics) | `/api/statistics` | 仪表盘、统计分析 |
| [操作日志](./operation-logs) | `/api/logs` | 操作审计、查询导出 |

## 通用约定

### 分页参数

所有列表接口统一支持以下分页查询参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 当前页码，从 1 开始 |
| `pageSize` | number | 20 | 每页条数，最大 100 |

### 分页响应格式

```json
{
  "success": true,
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### 列表筛选

列表接口普遍支持以下通用筛选参数（具体以各模块文档为准）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `keyword` | string | 关键词模糊搜索（名称、编号等） |
| `status` | string | 状态筛选 |
| `startDate` | string | 起始日期（ISO 8601） |
| `endDate` | string | 结束日期（ISO 8601） |
| `sort` | string | 排序字段，格式 `field:asc` 或 `field:desc` |

## 响应格式

所有接口统一返回以下 JSON 结构：

### 成功响应

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 失败响应

```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE"
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

## 状态码

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| `200` | 请求成功 |
| `201` | 资源创建成功 |
| `400` | 请求参数错误 |
| `401` | 未认证或 Token 失效 |
| `403` | 无权限访问 |
| `404` | 资源不存在 |
| `409` | 资源冲突（如唯一性校验失败） |
| `423` | 系统维护中（维护模式拦截） |
| `500` | 服务器内部错误 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| `VALIDATION_ERROR` | 参数校验失败 |
| `UNAUTHORIZED` | 未登录或 Token 失效 |
| `FORBIDDEN` | 无操作权限 |
| `NOT_FOUND` | 资源不存在 |
| `CONFLICT` | 资源冲突 |
| `MAINTENANCE_MODE` | 系统维护中 |
| `ACCOUNT_LOCKED` | 账号已锁定 |
| `ACCOUNT_DISABLED` | 账号已禁用 |
| `TOKEN_EXPIRED` | Token 已过期 |
| `INTERNAL_ERROR` | 服务器内部错误 |

## 维护模式

当系统开启维护模式后，除管理员外的所有用户将无法访问业务接口，接口会返回：

```json
{
  "success": false,
  "message": "系统维护中，请稍后再试",
  "code": "MAINTENANCE_MODE"
}
```

HTTP 状态码为 `423`。

## Swagger 文档

完整的 Swagger 文档可在启动后端服务后访问：

```
http://localhost:8000/api-docs
```

支持在线调试和 Schema 查看，便于接口对接与联调。
