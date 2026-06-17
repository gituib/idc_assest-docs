# 用户与角色接口

用户与角色接口提供用户管理、角色权限配置（RBAC）能力。

## 用户数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId` | integer | 主键，自增 |
| `username` | string | 用户名（唯一） |
| `email` | string | 邮箱 |
| `status` | string | 状态：`active`、`pending`、`locked`、`disabled` |
| `loginAttempts` | integer | 连续登录失败次数 |
| `lockUntil` | string | 锁定截止时间 |
| `roles` | array | 角色列表 |
| `createdAt` | string | 创建时间 |

### 用户状态

| 状态 | 说明 |
|------|------|
| `active` | 正常，可登录系统 |
| `pending` | 待审核，注册后等待管理员审核 |
| `locked` | 已锁定，连续登录失败超限 |
| `disabled` | 已禁用，管理员禁用该账号 |

## 角色数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `roleId` | integer | 主键，自增 |
| `name` | string | 角色名，如 `admin`、`operator`、`viewer` |
| `description` | string | 角色描述 |
| `permissions` | array | 权限列表 |

### 内置角色

| 角色 | 权限范围 |
|------|----------|
| `admin` | 全部功能，包括系统设置、用户管理、所有模块增删改查 |
| `operator` | 设备管理（含导入导出、端口、接线）、工单处理 |
| `viewer` | 查看权限，可创建工单 |

## 用户管理

### 获取用户列表

```http
GET /api/users
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | string | 否 | 用户名/邮箱关键词 |
| `status` | string | 否 | 状态筛选 |
| `roleId` | integer | 否 | 按角色筛选 |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "userId": 1,
        "username": "admin",
        "email": "admin@example.com",
        "status": "active",
        "roles": [{ "roleId": 1, "name": "admin" }],
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

### 获取用户详情

```http
GET /api/users/:userId
```

### 创建用户

管理员直接创建用户，无需审核流程。

```http
POST /api/users
Content-Type: application/json
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 用户名（唯一） |
| `password` | string | 是 | 密码 |
| `email` | string | 是 | 邮箱（唯一） |
| `roleIds` | integer[] | 否 | 角色 ID 列表 |

#### 请求示例

```json
{
  "username": "operator01",
  "password": "secure_password",
  "email": "op01@example.com",
  "roleIds": [2]
}
```

### 更新用户

```http
PUT /api/users/:userId
```

支持部分更新，可修改邮箱、状态、角色等。

#### 请求示例

```json
{
  "email": "new_email@example.com",
  "roleIds": [2, 3]
}
```

### 删除用户

```http
DELETE /api/users/:userId
```

### 审核用户

审核待审核状态的用户注册申请。

```http
PUT /api/users/:userId/audit
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `approved` | boolean | 是 | 是否通过 |
| `reason` | string | 否 | 驳回原因（驳回时必填） |

#### 请求示例

```json
{
  "approved": false,
  "reason": "信息不完整，请补充部门信息"
}
```

### 启用/禁用用户

```http
PUT /api/users/:userId/enable
PUT /api/users/:userId/disable
```

### 解锁用户

解除因登录失败次数超限导致的账号锁定。

```http
PUT /api/users/:userId/unlock
```

### 重置密码

管理员重置用户密码。

```http
PUT /api/users/:userId/reset-password
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `newPassword` | string | 是 | 新密码 |

## 角色管理

### 获取角色列表

```http
GET /api/roles
```

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "roleId": 1,
      "name": "admin",
      "description": "管理员",
      "permissions": ["*"],
      "userCount": 2
    },
    {
      "roleId": 2,
      "name": "operator",
      "description": "运维人员",
      "permissions": ["device:*", "ticket:*"],
      "userCount": 5
    }
  ]
}
```

### 创建角色

```http
POST /api/roles
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 角色名 |
| `description` | string | 否 | 角色描述 |
| `permissions` | string[] | 是 | 权限列表 |

#### 权限格式

权限采用 `模块:操作` 格式，支持通配符 `*`：

| 权限 | 说明 |
|------|------|
| `*` | 全部权限 |
| `device:*` | 设备模块全部操作 |
| `device:read` | 设备查看 |
| `device:create` | 设备创建 |
| `device:import` | 设备导入 |
| `ticket:*` | 工单模块全部操作 |
| `system:settings` | 系统设置 |

### 更新角色

```http
PUT /api/roles/:roleId
```

### 删除角色

::: warning 注意
删除角色前需确保没有用户关联该角色。
:::

```http
DELETE /api/roles/:roleId
```

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 参数缺失或密码强度不足 |
| `NOT_FOUND` | 404 | 用户/角色不存在 |
| `CONFLICT` | 409 | 用户名/邮箱已存在，或角色仍关联用户 |
| `FORBIDDEN` | 403 | 无用户管理权限 |
