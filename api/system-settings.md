# 系统设置接口

系统设置接口用于配置系统全局参数，包括 SMTP 邮件服务、维护模式、备份策略、版本检查与系统监控。

> **路径说明**：实际挂载前缀为 **`/api/system-settings`**（定义于 `backend/config/routes.js`），不是 `/api/settings`。

## 接口前缀

```
/api/system-settings
```

## 数据模型（SystemSetting）

系统设置采用**键值对**存储，每个键为一条独立记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| `settingKey` | string (PK) | 配置键，如 `maintenance_mode`、`ipam_probe_config` |
| `settingValue` | string | 配置值，JSON 序列化后的字符串 |
| `settingType` | string | 值类型：`string`、`number`、`boolean`、`json` |
| `category` | string | 分类，如 `system`、`security`、`ipam`、`mail` |
| `description` | string | 说明 |
| `isEditable` | boolean | 是否允许运行时修改；`false` 时修改接口返回 `403` |
| `updatedAt` | datetime | 更新时间 |

## 权限码

| 权限码 | 覆盖操作 |
|--------|----------|
| `settings:view` | 读取设置、备份列表、备份下载 |
| `settings:edit` | 更新设置、重置设置、备份创建与恢复、前端端口同步与重启 |

邮件配置相关端点额外要求超级管理员（`requireAdmin`）。

## 配置项读取

### 获取全部设置

```http
GET /api/system-settings
```

权限要求：`settings:view`

返回所有设置的键值集合，按 `category` 分组。

### 获取单个配置项

```http
GET /api/system-settings/{key}
```

权限要求：`settings:view`

#### 响应示例

```json
{
  "key": "maintenance_mode",
  "value": false,
  "type": "boolean",
  "category": "system",
  "description": "系统维护模式开关",
  "isEditable": true,
  "updatedAt": "2026-10-20T09:12:00.000Z"
}
```

> **响应格式差异**：该端点**不使用 `{ success, data }` 包装**，直接返回配置对象；错误时返回 `{ error: "..." }`。

### 获取空闲超时配置

```http
GET /api/system-settings/idle-timeout
```

无需额外权限（已登录即可），返回前端空闲登出所需的超时时间，供前端在登录后同步会话策略。

## 配置项写入

### 更新单个配置项

```http
PUT /api/system-settings/{key}
Content-Type: application/json
```

权限要求：`settings:edit`

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `value` | any | 是 | 配置值，按 `settingType` 校验并序列化 |

#### 校验与限制

| 场景 | 响应 |
|------|------|
| 键不存在 | `404 { error: "设置不存在" }` |
| `isEditable = false` | `403 { error: "该设置不可编辑" }`，并记录失败的审计日志 |
| 值类型与 `settingType` 不符 | `400` |

更新成功会记录 `beforeValue` 与 `afterValue` 到操作日志，便于审计回溯。

### 批量更新配置项

```http
PUT /api/system-settings
Content-Type: application/json
```

权限要求：`settings:edit`

#### 请求体

```json
{
  "settings": {
    "maintenance_mode": true,
    "ipam_probe_cron_enabled": true
  }
}
```

#### 响应

逐键处理，返回 `updatedSettings` 与 `errors` 两个数组。单个键失败不会中断整批。

### 重置配置项

```http
POST /api/system-settings/reset/{key}
```

权限要求：`settings:edit`

将指定配置项恢复为代码中定义的默认值。仅对可编辑项有效。

## SMTP 邮件服务

> v2.3.0 新增，用于邮箱验证码、找回密码、测试邮件。

所有邮件端点要求 **超级管理员**。

### 获取邮件配置

```http
GET /api/system-settings/mail
```

#### 响应字段

| 字段 | 说明 |
|------|------|
| `host` | SMTP 服务器地址 |
| `port` | SMTP 端口（465 为 SSL，587 为 STARTTLS） |
| `secure` | 是否使用 SSL |
| `user` | 认证用户名 |
| `from` | 发件人显示地址 |
| `password` | **返回掩码值**，不返回明文 |

### 更新邮件配置

```http
PUT /api/system-settings/mail
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `host` | string | 是 | SMTP 服务器 |
| `port` | integer | 是 | 端口 |
| `secure` | boolean | 否 | 是否 SSL |
| `user` | string | 否 | 用户名 |
| `password` | string | 否 | 口令；**留空或提交掩码值时保持原值** |
| `from` | string | 否 | 发件人 |

> **加密存储**：SMTP 口令通过 AES-256-GCM 加密落库，密钥来源于环境变量 `SMTP_SECRET_KEY`。

### 发送测试邮件

```http
POST /api/system-settings/mail/test
```

向指定地址发送测试邮件，验证 SMTP 配置连通性。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `to` | string | 是 | 收件地址 |

## 维护模式

### 查询维护状态（免鉴权）

```http
GET /api/maintenance/status
```

该端点在公开白名单中，供前端在登录页判断是否显示维护提示。

### 手动解除维护模式

```http
POST /api/maintenance/disable
```

**仅超级管理员**。

同时写入数据库真源、清理缓存与进程内状态，确保立即生效。

> **设计背景**：该端点曾因白名单使用前缀匹配而可被匿名调用，现已改为精确匹配白名单并叠加 `requireAdmin`。

## 数据库备份（系统设置入口）

系统设置模块提供轻量的库备份能力，与 [备份接口](./backup) 的数据备份功能并行。

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/system-settings/backup` | `settings:edit` | 创建系统设置备份 |
| GET | `/api/system-settings/backup/list` | `settings:view` | 备份文件列表 |
| POST | `/api/system-settings/backup/restore` | `settings:edit` | 从备份恢复 |
| GET | `/api/system-settings/backup/download/{filename}` | `settings:view` | 下载备份文件 |
| DELETE | `/api/system-settings/backup/{filename}` | `settings:edit` | 删除备份文件 |

> 文件名参数受路径穿越防护校验（安全加固 P1），非法字符将被拒绝。

## 系统信息

### 获取系统版本与资源监控

```http
GET /api/system-settings/system/info
```

**免鉴权**（公开白名单），用于登录页脚展示版本信息。

#### 响应示例

```json
{
  "system": {
    "name": "IDC 设备资产管理系统",
    "version": "2.8.4",
    "uptime": 3600,
    "nodeVersion": "v20.11.0",
    "platform": "linux",
    "arch": "x64",
    "hostname": "idc-server-01",
    "pid": 1234
  },
  "systemMetrics": {
    "cpu": { "percent": 45, "cores": 8 },
    "memory": { "percent": 62, "totalMB": 32768, "usedMB": 20316, "freeMB": 12452 },
    "disk": { "percent": 55 }
  },
  "database": {
    "type": "sqlite",
    "dialect": "sqlite",
    "database": "./idc_management.db",
    "sequelizeVersion": "6.37.8",
    "status": "connected",
    "version": "3.45.0"
  },
  "repoInfo": {
    "repoUrl": "https://github.com/gituib/idc_assest",
    "license": "GPL-3.0-or-later"
  },
  "statistics": { "devices": 120, "racks": 15, "rooms": 3, "users": 10 },
  "timestamp": "2026-11-13T00:00:00.000Z"
}
```

#### 监控指标说明

| 指标 | 说明 |
|------|------|
| `systemMetrics.cpu.percent` | CPU 使用率（0-100），基于 `os.cpus().times` 差值计算 |
| `systemMetrics.cpu.cores` | CPU 核心数 |
| `systemMetrics.memory.percent` | 内存使用率百分比 |
| `systemMetrics.disk.percent` | 磁盘使用率 |
| `database.status` | 数据库连接状态（`connected` / `disconnected`） |
| `system.uptime` | 进程运行时长（秒） |

> CPU 使用率采用 `os.cpus().times` 差值计算，替代 `os.loadavg()`，确保 Linux 与 Windows 平台均返回准确值。

### 检查版本更新

```http
GET /api/system-settings/system/check-update
```

调用 GitHub API 获取最新 tag 与当前版本比较，结果缓存 5 分钟。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "hasUpdate": false,
    "currentVersion": "2.8.4",
    "latestVersion": "2.8.4",
    "latestTag": "v2.8.4",
    "releaseUrl": null,
    "releaseNotes": null,
    "publishedAt": null,
    "projectPath": "/path/to/idc_assest",
    "isDocker": false,
    "error": null
  }
}
```

#### `isDocker` 的用途

| 环境 | 前端行为 |
|------|----------|
| 非 Docker | 展示在线更新命令提示 |
| Docker | 提示「拉取最新镜像后重建容器」，不展示终端命令 |

> 在线更新逻辑实现于项目根目录 `update.js`，包含依赖检测（逐个核对 `package.json` 直接依赖是否已安装）与增量更新流程。

### 获取开源许可列表

```http
GET /api/system-settings/system/licenses
```

**免鉴权**（与 `system/info` 同在根路径，不经过 `/api` 认证）。

获取系统前后端所有依赖包的开源许可信息。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "total": 120,
    "licenses": [
      {
        "name": "react",
        "installedVersion": "18.2.0",
        "license": "MIT",
        "scope": "frontend",
        "type": "runtime",
        "homepage": "https://react.dev"
      }
    ],
    "groups": [
      { "license": "MIT", "count": 80 },
      { "license": "Apache-2.0", "count": 15 },
      { "license": "Unknown", "count": 7 }
    ]
  }
}
```

## 前端服务管理

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/system-settings/frontend/port` | 已登录 | 查询前端端口 |
| POST | `/api/system-settings/frontend/port/sync` | `settings:edit` | 一键同步前端端口配置（含 Nginx 配置同步） |
| POST | `/api/system-settings/frontend/restart` | `settings:edit` | 重启前端服务 |

> **Nginx 配置同步**（v2.7.0 新增）：`port/sync` 会同时更新 Nginx 的 `proxy_pass` 端口与 `frontend/.env` 中的端口配置，避免手工改动导致的端口不一致。

## 其他配置项说明

部分配置项通过系统设置表管理但不提供独立端点，而是纳入通用键值接口：

| 配置键 | 类型 | 说明 |
|--------|------|------|
| `allow_intranet_collection` | boolean | 是否允许访问内网私网设备（BMC / 交换机），默认 `true`。关闭后拒绝所有私网目标，**会中断核心采集业务** |
| `target_whitelist` | json | CIDR 数组，非空时私网采集目标必须落在白名单内 |
| `ipam_probe_config` | json | IPAM 在线探测全局配置（`enablePing`、`tcpPorts`、`timeoutMs`、`concurrency`） |
| `ipam_probe_cron_enabled` | boolean | IPAM 定时探测开关 |
| `ipam_probe_cron_expression` | string | IPAM 定时探测 Cron 表达式 |
| `maintenance_mode` | boolean | 系统维护模式开关 |

## 错误码

| HTTP | 说明 |
|------|------|
| `400` | 配置值类型校验失败 |
| `403` | 无权限，或该配置项不可编辑 |
| `404` | 配置项不存在 |
| `500` | 服务端异常（错误信息已脱敏） |
