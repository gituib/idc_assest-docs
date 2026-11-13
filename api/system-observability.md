# 观测与审计辅助接口

本页涵盖三类与系统可观测性、审计安全相关的接口：前端错误上报、危险操作审计、公开设备信息牌。

---

## 前端错误日志上报

### 接口说明

```http
POST /api/frontend-logs
```

**免鉴权**（位于公开端点白名单）：前端在未登录、Token 失效或登录页崩溃时同样需要上报错误。

### 触发来源

前端 `frontendLogger` 全局捕获以下三类异常并统一上报后端：

| 来源 | 说明 |
|------|------|
| `window.onerror` | 未捕获的同步运行时错误 |
| `unhandledrejection` | 未处理的 Promise 拒绝 |
| `ErrorBoundary` | React 组件渲染异常（含 `componentStack`） |

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 否 | 错误类型，默认 `error` |
| `message` | string | 否 | 错误消息 |
| `stack` | string | 否 | 调用栈，服务端截断至 4000 字符 |
| `componentStack` | string | 否 | React 组件栈 |
| `url` | string | 否 | 发生错误的页面地址 |
| `userAgent` | string | 否 | 客户端 UA，缺省取请求头 |

### 服务端行为

1. 按 IP 做**进程内滑动窗口限流**：60 秒内最多 30 次
2. 超限返回 `429`，并在响应头 `Retry-After` 中给出重试秒数
3. 通过 Winston 写入 `app/` 与 `error/` 日志目录，模块标记为 `Frontend`

### 响应示例

```json
{ "success": true, "message": "已记录" }
```

### 限流响应

```json
{ "success": false, "message": "日志上报过于频繁，请稍后再试" }
```

> **部署提示**：限流基于 `req.ip`，Nginx 必须使用覆盖写方式传递真实客户端 IP：
> ```
> proxy_set_header X-Forwarded-For $remote_addr;
> ```
> 并使用追加式传递，否则所有用户会共用网关 IP 的同一个桶，导致误封。

---

## 危险操作审计

### 接口前缀

```
/api/dangerous-operations
```

路由级统一挂载 `authMiddleware`，以下所有端点均需登录。

### 危险操作类型

| 类型 | 说明 |
|------|------|
| `DELETE_SINGLE` | 单条删除 |
| `DELETE_BATCH` | 批量删除 |
| `DELETE_ALL` | 全量删除 |
| `UPDATE_BATCH` | 批量更新 |
| `RESTORE` | 数据恢复 |
| `BATCH_RESTORE` | 批量恢复 |
| `PURGE` | 清理/彻底删除 |

### 风险等级判定

| 风险等级 | 判定条件 |
|----------|----------|
| `EXTREME` | `DELETE_ALL`，或系统级操作，或批量删除超过 10 条 |
| `HIGH` | `DELETE_BATCH` 且数量在 4~10 条 |
| `MEDIUM` | `DELETE_BATCH` 且数量不超过 3 条；或目标存在关联数据 |
| `LOW` | 其他情况 |

### 记录危险操作

```http
POST /api/dangerous-operations/log
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `operationType` | string | 是 | 操作类型，取值见上表 |
| `operationName` | string | 否 | 操作名称（面向人阅读） |
| `targetType` | string | 否 | 目标对象类型 |
| `targetId` | string | 否 | 目标对象 ID |
| `targetName` | string | 否 | 目标对象名称 |
| `beforeState` | object | 否 | 操作前完整快照 |
| `metadata` | object | 否 | 附加信息，如 `{ itemCount, hasRelatedData }` |
| `success` | boolean | 否 | 是否成功，默认 `true` |
| `errorMessage` | string | 否 | 失败原因 |

### 查询危险操作日志

```http
GET /api/dangerous-operations/logs
```

支持按操作类型、风险等级、时间范围、操作人筛选。

### 清理历史日志

```http
DELETE /api/dangerous-operations/logs/clean
```

用于按保留期清理，操作本身亦会被记录。

### 风险评估

```http
GET /api/dangerous-operations/risk-assessment
```

返回指定操作在当前数据规模下的风险预估，供前端在执行前弹出对应级别的二次确认。

> **前端配合**：`frontend/src/config/dangerousOperationConfig.js` 定义了各类危险操作的确认文案与交互规格，`DangerConfirmModal` 组件按风险等级渲染不同强度的确认流程。

---

## 公开设备信息牌

### 接口说明

```http
GET /p/devices/{deviceId}
```

**完全免鉴权**，用于生成可对外展示的设备信息 HTML 卡片（贴合在设备上的二维码扫码查看）。

这是**唯一不位于 `/api` 前缀下**的业务接口。

### 设计约束（安全）

| 约束 | 说明 |
|------|------|
| 字段白名单 | 仅允许展示固定字段，**不含 `ipAddress` 与 `description`** |
| 禁止任意字段 | 旧版本支持 `?fields=ipAddress,description` 让免鉴权页面渲染敏感信息，现已修复为白名单校验 |
| 输出转义 | 所有字段经 HTML 转义后渲染，防止 XSS |

### 可展示字段白名单

| 字段 | 中文标签 |
|------|----------|
| `deviceId` | 设备编号 |
| `name` | 名称 |
| `type` | 类型 |
| `model` | 型号 |
| `serialNumber` | 序列号 |
| `position` | 所在位置 |
| `status` | 状态 |

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `fields` | string | 否 | 逗号分隔的字段名，**超出白名单的字段会被忽略** |

### 响应

返回 `text/html` 格式的信息卡片，包含设备基础信息与「本卡片由 IDC 资产系统生成」页脚。

### 错误响应

| HTTP | 场景 | 页面内容 |
|------|------|----------|
| `404` | 设备不存在 | 设备不存在 / 未找到该设备，请核对设备编号或联系管理员。 |
| `500` | 生成失败 | 服务异常 / 信息牌生成失败，请稍后重试。 |

### 二维码生成

设备二维码在前端生成，包含以下两类能力：

| 功能 | 说明 |
|------|------|
| 单个二维码 | 设备管理列表与详情抽屉中的「二维码」操作，可预览与下载 |
| 批量二维码 | `DeviceQrBatchModal` 支持批量选择设备生成并打印信息牌 |

> 二维码内容为上述 `/p/devices/{deviceId}` 绝对地址，因此部署时前端与服务端的对外域名必须正确配置，否则扫码后无法访问。
