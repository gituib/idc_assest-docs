# 认证接口

认证接口提供用户登录、注册、Token 刷新等能力，是访问其他业务接口的前置条件。

## 登录

```http
POST /api/auth/login
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 用户名 |
| `password` | string | 是 | 密码 |

### 请求示例

```json
{
  "username": "admin",
  "password": "your_password"
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "username": "admin",
      "email": "admin@example.com",
      "roles": [{ "roleId": 1, "name": "admin" }]
    }
  },
  "message": "登录成功"
}
```

### 登录失败场景

| 场景 | HTTP | 错误码 | 说明 |
|------|------|--------|------|
| 用户名或密码错误 | 401 | `UNAUTHORIZED` | 凭证无效 |
| 账号待审核 | 403 | `ACCOUNT_PENDING` | 注册后未通过审核 |
| 账号已禁用 | 403 | `ACCOUNT_DISABLED` | 管理员已禁用该账号 |
| 账号已锁定 | 423 | `ACCOUNT_LOCKED` | 连续登录失败次数超限 |
| 系统维护中 | 423 | `MAINTENANCE_MODE` | 仅管理员可登录 |

> 连续登录失败达到阈值（默认 5 次）后账号将被锁定一段时间，期间无法登录。

## 注册

新用户注册后默认进入「待审核」状态，需管理员审核通过后方可登录。

```http
POST /api/auth/register
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 用户名（唯一） |
| `password` | string | 是 | 密码 |
| `email` | string | 是 | 邮箱（唯一） |

### 请求示例

```json
{
  "username": "newuser",
  "password": "secure_password",
  "email": "newuser@example.com"
}
```

### 响应

```json
{
  "success": true,
  "data": { "userId": 10, "status": "pending" },
  "message": "注册成功，等待管理员审核"
}
```

## 刷新 Token

当 `accessToken` 过期时，使用 `refreshToken` 获取新的访问令牌。

```http
POST /api/auth/refresh
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `refreshToken` | string | 是 | 刷新令牌 |

### 请求示例

```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

### 响应

```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token..."
  }
}
```

### 错误响应

| 场景 | HTTP | 错误码 | 说明 |
|------|------|--------|------|
| refreshToken 无效 | 401 | `UNAUTHORIZED` | 令牌无效或被吊销 |
| refreshToken 过期 | 401 | `TOKEN_EXPIRED` | 需重新登录 |

## 获取当前用户信息

```http
GET /api/auth/me
```

返回当前登录用户的详细信息及权限。

### 响应示例

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "admin",
    "email": "admin@example.com",
    "status": "active",
    "roles": [
      { "roleId": 1, "name": "admin", "permissions": ["*"] }
    ]
  }
}
```

## 修改密码

```http
PUT /api/auth/password
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `oldPassword` | string | 是 | 原密码 |
| `newPassword` | string | 是 | 新密码 |

### 响应

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

## 退出登录

```http
POST /api/auth/logout
```

吊销当前用户的 Token。

### 响应

```json
{
  "success": true,
  "message": "已退出登录"
}
```

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `UNAUTHORIZED` | 401 | 用户名或密码错误 |
| `TOKEN_EXPIRED` | 401 | Token 已过期 |
| `ACCOUNT_LOCKED` | 423 | 账号已锁定 |
| `ACCOUNT_DISABLED` | 403 | 账号已禁用 |
| `ACCOUNT_PENDING` | 403 | 账号待审核 |
| `CONFLICT` | 409 | 用户名或邮箱已存在 |
