# API 概览

## 接口基础规范

| 项目 | 规范 |
|------|------|
| 基础URL | `http://localhost:8000/api`（开发环境） / `https://<域名>/api`（生产环境，Nginx 反向代理） |
| 认证方式 | JWT Bearer Token（单一访问令牌） |
| Content-Type | `application/json` |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601（如 `2026-06-17T08:30:00Z`） |
| 接口版本 | 与项目版本一致，当前 `v2.8.4` |

## 认证流程

系统采用 JWT 进行身份认证，整体流程如下：

```
1. 客户端 POST /api/auth/login 提交账号密码
2. 服务端校验通过后返回 token 与用户信息（含角色权限码）
3. 客户端将 token 持久化存储
4. 后续请求在请求头携带：Authorization: Bearer <token>
5. 令牌有效期由 TOKEN_EXPIRY 控制（默认 24h），过期后需重新登录
6. 改密 / 重置密码 / 禁用 / 退出登录会递增 tokenVersion，此前令牌立即失效
```

> **重要**：系统**不使用双令牌（accessToken + refreshToken）模型，不存在 `/api/auth/refresh` 端点**。令牌过期后客户端应清除本地状态并跳转登录页。

### 请求头示例

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### 免鉴权端点白名单

全局认证中间件挂在 `app.use('/api', authMiddleware)`，仅以下精确匹配的 `method + path` 组合可匿名访问：

| 方法 | 路径 |
|------|------|
| POST | `/api/auth/login` |
| POST | `/api/auth/register` |
| POST | `/api/auth/check-admin` |
| POST | `/api/auth/forgot-password/send-code` |
| POST | `/api/auth/forgot-password/reset` |
| POST | `/api/auth/unlock` |
| GET | `/api/port-options` |
| GET | `/api/maintenance/status` |
| GET | `/api/system-settings/system/info` |
| POST | `/api/frontend-logs` |

另有 `/p/devices/:deviceId`（公开设备信息牌）与 `/health` 不在 `/api` 前缀下，天然免鉴权。

> **设计说明**：白名单使用**精确匹配**而非前缀匹配。旧实现按整棵子树放行，导致 `/api/maintenance/disable` 等写端点可被匿名调用；现在改为精确匹配以修复该缺陷。

### 多层校验模型

| 层级 | 实现 | 作用 |
|------|------|------|
| 全局认证 | `app.use('/api', authMiddleware)` | 校验令牌有效性，解析 `req.user` |
| 维护模式 | `maintenanceMiddleware` | 维护期间拦截非管理员业务请求 |
| 写接口限流 | `apiRateLimitMiddleware` | 按 IP + 路由分组的滑动窗口限流（15 分钟窗口，单路由 300 次 / 单 IP 1000 次） |
| 模块权限 | `requirePermission('xxx:yyy')` | 按三级权限码校验（模块:操作） |
| 超级管理员 | `requireAdmin` | 仅 `admin` 角色可用 |
| 参数校验 | Joi Schema (`validateBody` / `validateQuery`) | 请求体与查询参数格式校验 |

## 主要 API 模块

| 模块 | 基础路径 | 功能描述 |
|------|----------|----------|
| [认证](./auth) | `/api/auth` | 登录、注册、邮箱验证、验证码、找回密码、自助解锁、登出 |
| [机房](./rooms) | `/api/rooms` | 机房 CRUD、平面图布局 |
| [机柜](./racks) | `/api/racks` | 机柜 CRUD、U 位统计、导入导出 |
| [设备](./devices) | `/api/devices` | 设备 CRUD、批量操作、批量导入导出、自定义字段、二维码 |
| [设备端口](./port-collection) | `/api/device-ports` | 端口 CRUD、分组查询、批量创建/清理、导出 |
| [端口采集与凭据](./port-collection) | `/api/port-discovery`、`/api/server-discovery`、`/api/device-credentials` | 交换机端口采集、服务器 BMC 带外采集、采集凭据管理 |
| [网卡](./port-collection) | `/api/network-cards` | 网卡 CRUD、网卡与端口关联 |
| [端口选项](./port-collection) | `/api/port-options` | 端口类型 / 速率 / 线缆类型枚举（免鉴权） |
| [线缆](./cables) | `/api/cables` | 接线管理、冲突检测、批量创建 |
| [IPAM](./ipam) | `/api/ipam` | 网段规划、IP 分配与设备绑定、在线探测、定时调度 |
| [工单](./tickets) | `/api/tickets`、`/api/ticket-categories`、`/api/ticket-fields` | 工单全流程、故障分类、自定义字段、快速报修 |
| [耗材](./consumables) | `/api/consumables`、`/api/consumable-records`、`/api/consumable-categories` | 耗材 CRUD、出入库、SN 追踪、批量导入 |
| [盘点](./inventory) | `/api/inventory` | 盘点计划 / 任务 / 记录、盘点员分配 |
| [空闲设备与库房](./warehouses) | `/api/idle-devices`、`/api/warehouses` | 空闲设备转入/上架/恢复、库房管理 |
| [用户与角色](./users) | `/api/users`、`/api/roles` | 用户管理、角色管理、审核、头像 |
| [权限](./permissions) | `/api/permissions` | 权限树查询（模块 → 菜单 → 按钮） |
| [拓扑](./topology) | `/api/topology` | 网络拓扑查询、布局持久化 |
| [系统设置](./system-settings) | `/api/system-settings` | 系统参数、SMTP 邮件、备份、CPU 监控、版本检查、开源许可 |
| [备份](./backup) | `/api/backup` | 备份恢复、自动备份、远端备份 |
| [统计](./statistics) | `/api/statistics` | 仪表盘、趋势分析、功率统计 |
| [操作日志](./operation-logs) | `/api/operation-logs` | 操作审计、模块与类型字典、统计 |
| [观测与审计](./system-observability) | `/api/frontend-logs`、`/api/dangerous-operations`、`/p` | 前端错误上报、危险操作审计、公开信息牌 |

> **路径易错点**：早期文档中的 `/api/ports`、`/api/logs`、`/api/settings` **均非实际路径**，实际为 `/api/device-ports`、`/api/operation-logs`、`/api/system-settings`。挂载关系定义于 `backend/config/routes.js`。

## 通用约定

### 分页参数

多数列表接口支持以下分页参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 当前页码，从 1 开始 |
| `pageSize` | number | 20 | 每页条数 |

::: warning 每页上限并非全局统一
`MAX_PAGE_SIZE`（`backend/config/constants.js`，默认 `1000`）目前只被 `GET /api/users` 使用（`routes/users.js` 中 `Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE)`）。`/api/inventory`、`/api/consumables` 等接口只用到 `DEFAULT_PAGE_SIZE`，**没有上限钳制**。

也就是说「上限 500」是旧文档的误写，实际既不是 500、也不是全局限定。需要稳定行为时请在请求侧自行限制 `pageSize`。
:::

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

> **注意**：并非所有接口都遵循该结构。以下为已知差异：
>
> - IPAM 接口：`data.list` + `data.pagination.{page, pageSize, total, totalPages}`
> - 库房 / 空闲设备接口：**不使用 `success` 包装**，直接返回 `{ total, warehouses|idleDevices|devices, page, pageSize }`，错误时返回 `{ error: "..." }`
> - 设备端口接口：字段名依具体端点而定，`device-ports` 列表返回 `{ success, data: { list, pagination } }`
>
> 对接具体接口时请以对应文档为准。

### 列表筛选

列表接口普遍支持以下通用筛选参数（具体以各模块文档为准）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `keyword` | string | 关键词模糊搜索（名称、编号、序列号等） |
| `status` | string | 状态筛选，传 `all` 表示不筛选 |
| `startDate` / `endDate` | string | 时间范围（ISO 8601） |

## 响应格式

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
  "message": "错误描述"
}
```

> **404 兜底**：未匹配任何路由的 `/api` 请求返回统一 JSON（替代 Express 默认 HTML）：
>
> ```json
> {
>   "success": false,
>   "error": { "code": "NOT_FOUND", "message": "请求的资源不存在" }
> }
> ```

### 错误脱敏

生产环境下，服务端**不会**将 `error.message` 原文回显给客户端（除驱动层已明确定义的业务诊断信息外），真实原因仅写入服务端日志。对接时应以 HTTP 状态码与固定文案判断错误类型。

## 状态码

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| `200` | 请求成功 |
| `201` | 资源创建成功 |
| `400` | 请求参数错误 |
| `401` | 未认证或令牌失效 |
| `403` | 无权限访问 / 账号锁定 / 账号禁用 |
| `404` | 资源不存在 |
| `409` | 资源冲突（如唯一性校验失败、U 位冲突、端口已被接线占用） |
| `423` | 系统维护中 |
| `429` | 触发频率限制 |
| `500` | 服务器内部错误 |
| `503` | 服务不可用（维护模式登录拦截、健康检查异常） |

## 维护模式

系统开启维护模式后，除管理员外的所有用户无法访问业务接口：

```json
{
  "success": false,
  "message": "系统维护中，请稍后再试",
  "code": "MAINTENANCE_MODE"
}
```

相关端点：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/maintenance/status` | 查询维护状态（免鉴权） |
| POST | `/api/maintenance/disable` | 手动解除维护模式（**仅超管**） |

## 健康检查

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/health` | 免鉴权 | 仅返回 `{ "status": "ok" }`；生产环境不暴露时间戳、Node 版本、内存等指纹信息 |
| GET | `/api/health/detail` | 超管 | 返回完整健康检查结果（数据库、JWT 配置、磁盘、内存等） |

## Swagger 文档

后端启动后，**仅在非生产环境**可访问 Swagger UI：

```
http://localhost:8000/api-docs
```

| 端点 | 说明 |
|------|------|
| `/api-docs` | Swagger UI 交互式界面 |
| `/api-docs.json` | OpenAPI 规格 JSON |

> **生产环境不挂载 Swagger**：完整 OpenAPI 规格包含全部端点与参数，属信息泄露风险，`server.js` 中通过 `NODE_ENV !== 'production'` 条件排除。需要在线调试时请在开发或预发环境进行。

## 端点地图

已认证用户可通过 `GET /api` 获取端点地图：

```json
{
  "name": "IDC设备管理系统 API",
  "version": "1.0.0",
  "description": "数据中心设备管理平台后端服务",
  "endpoints": { "auth": "/api/auth", "rooms": "/api/rooms", "devices": "/api/devices" },
  "health": "/health"
}
```

> 该端点已移入鉴权保护范围，不再匿名返回完整端点清单。
