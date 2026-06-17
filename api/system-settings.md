# 系统设置接口

系统设置接口用于配置系统全局参数，包括站点信息、维护模式、登录限制等。

## 获取系统设置

```http
GET /api/settings
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "site": {
      "name": "IDC 设备资产管理系统",
      "logo": "/uploads/logo.svg",
      "favicon": "/favicon.ico"
    },
    "security": {
      "sessionTimeout": 30,
      "loginAttempts": 5,
      "lockDuration": 30,
      "ipWhitelist": ["192.168.1.0/24"],
      "maintenanceMode": false,
      "maintenanceMessage": "系统维护中，请稍后再试"
    },
    "backup": {
      "autoBackup": true,
      "cronExpression": "0 2 * * *",
      "retentionCount": 7
    },
    "notification": {
      "lowStockAlert": true,
      "ticketAlert": true
    }
  }
}
```

## 更新系统设置

```http
PUT /api/settings
Content-Type: application/json
```

支持部分更新，仅传需要修改的配置项。

### 站点设置

```json
{
  "site": {
    "name": "新系统名称",
    "logo": "/uploads/new-logo.svg"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `site.name` | string | 站点名称 |
| `site.logo` | string | Logo 图片路径，建议 120×40px |
| `site.favicon` | string | 网站图标路径 |

### 安全设置

```json
{
  "security": {
    "sessionTimeout": 60,
    "loginAttempts": 5,
    "lockDuration": 30,
    "ipWhitelist": ["192.168.1.0/24", "10.0.0.0/8"],
    "maintenanceMode": true,
    "maintenanceMessage": "系统维护中，预计 2 小时后恢复"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `security.sessionTimeout` | integer | 空闲超时（分钟）：15、30、60、0（永不超时） |
| `security.loginAttempts` | integer | 最大登录失败次数 |
| `security.lockDuration` | integer | 锁定时长（分钟） |
| `security.ipWhitelist` | string[] | 登录 IP 白名单（CIDR 格式） |
| `security.maintenanceMode` | boolean | 维护模式开关 |
| `security.maintenanceMessage` | string | 维护提示信息 |

::: warning 注意
开启维护模式后，除管理员外的所有用户将无法访问系统。请确保至少保留一个管理员账号可登录。
:::

### 备份设置

```json
{
  "backup": {
    "autoBackup": true,
    "cronExpression": "0 2 * * *",
    "retentionCount": 7
  }
}
```

### 通知设置

```json
{
  "notification": {
    "lowStockAlert": true,
    "ticketAlert": true
  }
}
```

## 获取单个配置项

```http
GET /api/settings/:key
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `key` | string | 配置键，如 `site`、`security`、`backup` |

### 响应示例

```json
{
  "success": true,
  "data": {
    "key": "security",
    "value": {
      "sessionTimeout": 30,
      "maintenanceMode": false
    }
  }
}
```

## 上传站点资源

上传 Logo、背景图等站点资源文件。

```http
POST /api/settings/upload
Content-Type: multipart/form-data
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | file | 是 | 图片文件（支持 PNG/SVG/JPG） |
| `type` | string | 否 | 资源类型：`logo`、`background`、`favicon` |

### 响应

```json
{
  "success": true,
  "data": { "url": "/uploads/logo_20260617.png" },
  "message": "上传成功"
}
```

## 维护模式

### 获取维护模式状态

```http
GET /api/settings/maintenance
```

### 响应

```json
{
  "success": true,
  "data": {
    "enabled": false,
    "message": "系统维护中，请稍后再试"
  }
}
```

### 切换维护模式

```http
PUT /api/settings/maintenance
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | boolean | 是 | 是否开启维护模式 |
| `message` | string | 否 | 维护提示信息 |

## 初始化状态

系统首次启动时会写入默认设置，可通过该接口检查是否已初始化。

```http
GET /api/settings/initialized
```

### 响应

```json
{
  "success": true,
  "data": { "initialized": true }
}
```

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 配置项格式错误或 CIDR 非法 |
| `FORBIDDEN` | 403 | 无系统设置权限（仅管理员可操作） |
| `NOT_FOUND` | 404 | 配置项不存在 |
