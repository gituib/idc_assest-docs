# 认证接口

认证接口提供登录、注册、邮箱验证、密码找回与账号解锁能力，是访问其他业务接口的前置条件。

> **鉴权模型说明**：系统采用**单一 JWT 访问令牌**（`token`）而非双令牌。令牌默认有效期由环境变量 `TOKEN_EXPIRY` 控制（默认 `24h`），**不存在 `refreshToken` 与 `/api/auth/refresh` 端点**。令牌吊销通过用户记录上的 `tokenVersion` 字段实现：改密、重置密码、禁用账号、退出登录均会递增该版本号，使此前签发的所有令牌立即失效。

## 接口前缀

```
/api/auth
```

## 免鉴权端点

以下端点在全局认证白名单中，可匿名访问：

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/check-admin` | 检查系统是否已初始化 |
| POST | `/api/auth/forgot-password/send-code` | 发送找回密码验证码 |
| POST | `/api/auth/forgot-password/reset` | 重置密码 |
| POST | `/api/auth/unlock` | 自助解锁 |

其余端点均需在请求头携带有效令牌。

---

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
  "message": "登录成功",
  "data": {
    "user": {
      "userId": "USR0001",
      "username": "admin",
      "email": "admin@example.com",
      "emailVerified": true,
      "realName": "系统管理员",
      "avatar": null,
      "roles": [
        {
          "roleId": "ROLE_ADMIN",
          "roleName": "系统管理员",
          "roleCode": "admin",
          "permissions": ["*"]
        }
      ]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> **字段说明**：令牌字段名为 `token`（非 `accessToken`）；`roles[].permissions` 为该角色持有的权限码数组，`admin` 角色为通配 `["*"]`，前端据此控制菜单与按钮显隐。

### 登录失败场景

| 场景 | HTTP | 响应 message | 说明 |
|------|------|--------------|------|
| 缺少用户名或密码 | 400 | `用户名和密码不能为空` | - |
| 用户名或密码错误 | 401 | `用户名或密码错误` | 用户不存在时返回相同文案，防枚举 |
| 账号锁定中 | 403 | `账户已被锁定，请在 N 分钟后重试` | 锁定期满自动解锁 |
| 账号已禁用 | 403 | `账户已禁用` | - |
| 账号待审核 | 403 | 待审核提示 | 注册后未通过管理员审核 |
| 系统维护中 | 503 | `系统维护中，暂时无法登录，请联系管理员` | 仅管理员可在此期间登录 |
| 认证入口限流 | 429 | 触发频率限制提示 | 按 IP + 账户双维度限流 |

> **锁定策略**：连续失败次数达到阈值后锁定账户，锁定期满自动解锁。
>
> - **失败阈值**：取 `SystemSetting` 表的 `max_login_attempts`（初始默认 `5`），可在系统设置 → 安全策略中修改，**不是环境变量**。
> - **锁定时长**：`backend/routes/auth.js` 中硬编码 `30 * 60 * 1000`（30 分钟），无法通过配置调整。
> - 与账号锁定并行的还有一层**认证入口限流**（IP + 账户双维度滑动窗口），超限返回 `429`，同样不受环境变量控制。
>
> 代码中存在 `MAX_LOGIN_ATTEMPTS` / `LOCK_TIME_MINUTES` 两个环境变量，会被读入 `config/security.js`，但没有任何业务代码引用，改动无效果。

---

## 检查系统初始化状态

```http
POST /api/auth/check-admin
```

用于前端判断是否处于「空库首启」状态，从而决定登录页是否引导进入首次注册。

### 响应示例

```json
{
  "success": true,
  "data": { "hasAdmin": false, "userCount": 0 }
}
```

`hasAdmin` 的判定依据是**用户总数是否大于 0**，而非是否存在 `admin` 角色用户。

### 首管理员引导

系统为空库时，首个注册用户默认自动获得管理员权限。为防止部署窗口期内被他人抢注超级管理员，可通过环境变量 `BOOTSTRAP_ADMIN_USERNAME` 预设首管理员用户名：

| 配置状态 | 行为 |
|----------|------|
| 已配置 | 仅当首个注册用户名与之完全一致时才授予管理员角色，其他用户名一律进入待审核 |
| 未配置 | 保持旧行为（首用户即管理员），服务启动时输出警告日志 |

> **生产部署建议**：始终配置 `BOOTSTRAP_ADMIN_USERNAME`。

---

## 注册

```http
POST /api/auth/register
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 用户名，长度受 `USERNAME_MIN_LENGTH`(4) ~ `USERNAME_MAX_LENGTH`(30) 约束 |
| `password` | string | 是 | 密码，长度不小于 `PASSWORD_MIN_LENGTH`(8) |
| `email` | string | 否 | 邮箱 |
| `phone` | string | 否 | 手机号 |
| `realName` | string | 否 | 真实姓名 |

### 响应示例

```json
{
  "success": true,
  "data": { "userId": "USR0010", "status": "pending" },
  "message": "注册成功，等待管理员审核"
}
```

### 用户状态流转

| 状态 | 说明 |
|------|------|
| `pending` | 待审核，注册后默认状态（首管理员除外） |
| `active` | 正常，可登录 |
| `inactive` | 已禁用 |
| `locked` | 已锁定（连续登录失败超限） |

---

## 获取当前用户信息

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

> **注意**：路径为 `/profile`，**不存在 `/api/auth/me`**。

### 响应示例

```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "USR0001",
      "username": "admin",
      "email": "admin@example.com",
      "emailVerified": true,
      "status": "active"
    },
    "roles": [{ "roleId": "ROLE_ADMIN", "roleName": "系统管理员", "roleCode": "admin", "permissions": ["*"] }]
  }
}
```

## 更新个人资料

```http
PUT /api/auth/profile
Authorization: Bearer <token>
```

支持修改 `email`、`phone`、`realName`、`avatar` 等字段。响应仅返回 `userId` 与更新结果。

---

## 邮箱验证

> v2.3.0 新增，基于 SMTP 邮件服务与 6 位数字验证码。

### 发送验证码

```http
POST /api/auth/send-verify-code
Authorization: Bearer <token>
```

> 路径为 `/send-verify-code`，**不存在 `/send-verify-email`**。

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 否 | 待验证邮箱；不传则使用当前账号已绑定的邮箱 |

#### 前置校验

| 校验 | 响应 |
|------|------|
| 邮箱为空 | 400 `请先填写邮箱地址` |
| 邮箱格式非法 | 400 `邮箱格式无效` |
| 邮箱与已有已验证邮箱一致 | 200 `当前邮箱已验证，无需重复验证` |
| 重发冷却中 | 429 `验证码已发送，请 N 秒后重试`（附 `retryAfter`） |
| 达到当日上限 | 429 `今日该邮箱的验证码发送次数已达上限，请明天再试` |

#### 验证码策略

| 参数 | 取值 |
|------|------|
| 有效期 | 10 分钟 |
| 重发冷却 | 60 秒 |
| 每日上限 | 每邮箱每场景 10 次 |
| 最大错误次数 | 5 次 |
| 存储方式 | 进程内 Map（重启失效） |

系统通过 `scene` 隔离验证码用途，邮箱验证的验证码不能用于密码重置。

### 验证邮箱

```http
POST /api/auth/verify-email
Authorization: Bearer <token>
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `code` | string | 是 | 6 位验证码 |

验证成功后 `user.email` 更新为目标邮箱，`user.emailVerified` 置为 `true`。

---

## 修改密码（已登录）

```http
PUT /api/auth/password
Authorization: Bearer <token>
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `oldPassword` | string | 是 | 原密码 |
| `newPassword` | string | 是 | 新密码，长度不小于 8 |

### 行为说明

改密成功后服务端递增 `tokenVersion`，**所有已签发的令牌立即失效**，且**不返回新令牌**。前端在下一次请求收到 `401` 后应清除本地状态并跳转登录页。

### 响应

```json
{ "success": true, "message": "密码修改成功" }
```

### 已登录状态下的验证码重置密码

```http
POST /api/auth/change-password
Authorization: Bearer <token>
```

通过邮箱验证码重置密码，适用于用户忘记原密码但仍处于登录态的场景。行为与 `PUT /password` 一致：重置后递增 `tokenVersion` 并吊销全部令牌。

---

## 找回密码（未登录）

### 发送验证码

```http
POST /api/auth/forgot-password/send-code
Content-Type: application/json
```

> 路径为 `/forgot-password/send-code`。

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `account` | string | 是 | 账户名或邮箱（优先字段） |
| `email` | string | 否 | 兼容旧字段；单独提交时必须是合法邮箱格式 |

#### 防枚举设计

无论账户是否存在、邮箱是否已验证，均返回相同提示：

```json
{
  "success": true,
  "message": "如果该账户已注册并验证邮箱，验证码已发送至账户绑定邮箱"
}
```

该行为是刻意的安全设计，前端不应据此判断账户是否存在。

### 重置密码

```http
POST /api/auth/forgot-password/reset
Content-Type: application/json
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `account` | string | 是 | 账户名或邮箱 |
| `code` | string | 是 | 6 位验证码 |
| `newPassword` | string | 是 | 新密码，长度不小于 8 |

#### 响应

```json
{ "success": true, "message": "密码重置成功" }
```

#### 失败响应

| 场景 | HTTP | message |
|------|------|---------|
| 参数缺失 | 400 | `账户、验证码和新密码不能为空` |
| 密码过短 | 400 | `新密码长度不能少于8个字符` |
| 账户不存在或验证码错误 | 400 | `验证码错误或已失效`（统一文案） |

---

## 自助解锁

```http
POST /api/auth/unlock
Content-Type: application/json
```

当账号因连续登录失败被锁定，用户可凭正确的用户名与密码自助解锁，无需管理员介入。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 用户名 |
| `password` | string | 是 | 密码 |

### 行为说明

- 与 `/login` 共用同一套失败计数与锁定策略
- 密码正确时清除锁定状态与失败计数
- 失败时统一返回 `401 用户名或密码错误`，避免通过响应差异判断账户是否存在或是否处于锁定

---

## 退出登录

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

递增 `tokenVersion`，使该用户当前签发的所有令牌失效。即使令牌未过期，后续请求也会返回 `401`。

### 响应

```json
{ "success": true, "message": "已退出登录" }
```

---

## 错误码对照

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `MAINTENANCE_MODE` | 503 | 系统维护中，非管理员拒绝登录 |
| - | 400 | 参数校验失败（字段缺失、格式错误、长度不符） |
| - | 401 | 凭证无效或令牌失效 |
| - | 403 | 账号锁定 / 禁用 / 待审核 |
| - | 429 | 频率限制（登录限流、验证码冷却、验证码日上限） |

> 系统认证相关响应以 `message` 中文文案为主，`code` 字段仅在维护模式等少数场景返回，客户端应以 HTTP 状态码 + `message` 组合判断。

---

## 相关配置

真正生效的环境变量：

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `JWT_SECRET` | 空（开发环境自动生成并写回 `.env`） | 生产环境必填，至少 32 位强随机串 |
| `TOKEN_EXPIRY` | `24h` | 令牌有效期 |
| `SALT_ROUNDS` | `10` | bcrypt 加密强度，参与 `bcrypt.hash` 实际计算（注册、建号、改密均使用） |
| `PASSWORD_MIN_LENGTH` | `6` | 密码最小长度，注意前端表单把下限同样写死为 6 |
| `USERNAME_MIN_LENGTH` / `USERNAME_MAX_LENGTH` | `3` / `50` | 用户名长度限制，注意前端上限写死为 20，配置大于 20 会造成前后端校验不一致 |
| `BOOTSTRAP_ADMIN_USERNAME` | 空 | 首管理员引导用户名 |

不生效的「伪配置项」：

| 配置项 | 状态 |
|--------|------|
| `MAX_LOGIN_ATTEMPTS` | 被读入 `config/security.js`，但无代码引用。真实阈值见系统设置 `max_login_attempts` |
| `LOCK_TIME_MINUTES` | 被读入 `config/security.js`，但无代码引用。真实锁定时长硬编码 30 分钟 |

SMTP 邮件服务通过系统设置页面配置（`/api/system-settings/mail`），SMTP 口令加密存储，加密密钥来源于 `SMTP_SECRET_KEY`。
