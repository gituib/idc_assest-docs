# API 概览

## 接口基础规范

| 项目 | 规范 |
|------|------|
| 基础URL | `http://localhost:8000/api` |
| 认证方式 | JWT Bearer Token |
| Content-Type | `application/json` |
| 编码 | UTF-8 |

## 认证方式

所有 API 请求（除登录注册外）需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <your_token>
```

## 主要API模块

| 模块 | 基础路径 | 功能描述 |
|------|----------|----------|
| 认证 | /api/auth | 登录、注册、Token管理 |
| 机房 | /api/rooms | 机房CRUD |
| 机柜 | /api/racks | 机柜CRUD |
| 设备 | /api/devices | 设备CRUD、批量操作 |
| 设备字段 | /api/deviceFields | 设备自定义字段 |
| 设备端口 | /api/device-ports | 设备端口管理 |
| 网卡 | /api/network-cards | 网卡管理 |
| 线缆 | /api/cables | 线缆连接管理 |
| 工单 | /api/tickets | 工单全流程 |
| 耗材 | /api/consumables | 耗材管理 |
| 盘点 | /api/inventory | 盘点管理 |
| 用户 | /api/users | 用户管理 |
| 角色 | /api/roles | 角色权限 |
| 系统设置 | /api/system-settings | 系统配置 |
| 备份 | /api/backup | 备份恢复 |
| 统计 | /api/statistics | 统计分析 |
| 操作日志 | /api/operation-logs | 操作审计 |
| 拓扑 | /api/topology | 网络拓扑 |

## 响应格式

```javascript
// 成功
{ "success": true, "data": { ... }, "message": "操作成功" }

// 失败
{ "success": false, "message": "错误描述", "code": "ERROR_CODE" }

// 分页
{ "success": true, "data": { "list": [...], "total": 100, "page": 1, "pageSize": 20 } }
```

完整的 Swagger 文档可在启动后端后访问 `/api-docs` 查看。
