# 环境配置

## 环境要求

| 项目 | 最低要求 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Windows 10, macOS 12, Ubuntu 20.04 | 同最低 |
| Node.js | ≥14.0.0 | 20.x LTS |
| 内存 | 4GB | 8GB+ |
| 磁盘空间 | 2GB | 10GB+ |

## 前端环境变量

前端环境变量配置文件位于 `frontend/.env`，所有变量以 `VITE_` 前缀开头。

### API 配置

```bash
# API 基础路径
# 开发环境：http://localhost:8000/api
# 生产环境（Nginx 代理）：/api
VITE_API_BASE_URL=/api

# API 请求超时时间（毫秒）
# 默认：30000（30 秒）
VITE_API_TIMEOUT=30000
```

### 应用配置

```bash
# 应用标题（显示在浏览器标签页）
VITE_APP_TITLE=IDC设备管理系统

# 应用版本号
VITE_APP_VERSION=2.0.0
```

### 用户空闲超时配置

```bash
# 用户空闲超时时间（毫秒）
# 默认：1800000（30 分钟 = 30 * 60 * 1000）
VITE_IDLE_TIMEOUT=1800000

# 超时前警告时间（毫秒）
# 默认：60000（1 分钟 = 60 * 1000）
VITE_IDLE_WARNING_TIME=60000
```

## 后端环境变量

后端环境变量配置文件位于 `backend/.env`，涵盖了服务、数据库、安全、日志、备份等全部配置。

### 服务配置

```bash
# 服务端口
PORT=8000

# 运行环境: development 或 production
NODE_ENV=development

# 前端默认端口（开发环境使用）
FRONTEND_PORT=3000
```

### 数据库配置

```bash
# 数据库类型: sqlite 或 mysql
DB_TYPE=sqlite
```

#### SQLite 配置（DB_TYPE=sqlite 时使用）

```bash
# SQLite 数据库文件路径
DB_PATH=./idc_management.db
```

#### MySQL 配置（DB_TYPE=mysql 时使用）

> 使用 MySQL 前请确保 MySQL 服务已安装并创建相应的数据库。
> 数据库创建命令：`CREATE DATABASE idc_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

```bash
# MySQL 主机地址
# Docker 部署时使用服务名：mysql
# 远程 MySQL 使用 IP 或域名
MYSQL_HOST=localhost

# MySQL 端口
MYSQL_PORT=3306

# MySQL 用户名
MYSQL_USERNAME=root

# MySQL 密码
MYSQL_PASSWORD=

# MySQL 数据库名
MYSQL_DATABASE=idc_management
```

### 安全配置

#### JWT 配置

```bash
# JWT 密钥 - 用于签名和验证用户身份令牌
# 开发环境留空会自动生成并保存到 .env 文件
# 生产环境必须设置强随机密钥（至少 32 位）
# 生成命令（Node.js）：
#   require('crypto').randomBytes(64).toString('hex')
# 生成命令（PowerShell）：
#   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
JWT_SECRET=

# Token 过期时间（格式：数字+单位）
# 常用值：24h（24 小时）、7d（7 天）、30m（30 分钟）
TOKEN_EXPIRY=24h
```

#### 密码策略

```bash
# 密码加密强度（bcrypt salt rounds，范围：4-12）
# 值越大越安全，但加密速度越慢
SALT_ROUNDS=12

# 密码最小长度
PASSWORD_MIN_LENGTH=8

# 用户名长度限制
USERNAME_MIN_LENGTH=4
USERNAME_MAX_LENGTH=30
```

#### 登录安全

```bash
# 登录失败锁定阈值（连续失败次数达到后锁定账户）
MAX_LOGIN_ATTEMPTS=3

# 账户锁定时间（分钟）
LOCK_TIME_MINUTES=15
```

### API 配置

```bash
# API 请求超时时间（毫秒）
API_TIMEOUT=20000

# 数据库查询超时时间（毫秒）
DB_QUERY_TIMEOUT=15000

# 默认每页条数
DEFAULT_PAGE_SIZE=20

# 最大每页条数
MAX_PAGE_SIZE=500

# 最大重试次数
MAX_RETRIES=5

# 重试延迟（毫秒）
RETRY_DELAY=2000
```

### 文件上传配置

```bash
# 最大文件上传大小（MB）
MAX_FILE_SIZE_MB=30

# 最大头像上传大小（MB）
MAX_AVATAR_SIZE_MB=2
```

### 日志配置

```bash
# 日志级别: error / warn / info / debug
# 生产环境建议 info，开发环境建议 debug
LOG_LEVEL=debug

# 日志文件存储目录（相对路径或绝对路径）
LOG_DIR=./logs

# 单个日志文件最大大小（支持单位: k/m/g）
LOG_MAX_FILE_SIZE=20m

# 日志文件最大保留天数
LOG_MAX_FILES=30d

# 模块级别日志控制（JSON 格式，可选）
# 允许针对特定模块设置不同的日志级别
# 示例：{"device":"debug","backup":"warn","HTTP":"info"}
MODULE_LOG_LEVELS=

# 日志采样配置（JSON 格式，可选）
# 高频日志采样输出，rate 表示采样率(0-1)
# error 和 warn 级别不受采样影响
# 示例：{"HTTP":0.1,"device":0.5}
LOG_SAMPLING=
```

### 备份配置

#### 本地自动备份

```bash
# 备份文件存放目录（相对路径或绝对路径）
BACKUP_DIR=./backups

# 是否开启自动备份
AUTO_BACKUP_ENABLED=false

# 自动备份计划（cron 表达式）
# 默认：每天凌晨 2 点
AUTO_BACKUP_CRON=0 2 * * *

# 备份文件保留天数
BACKUP_RETENTION=30
```

#### 远程备份配置

远程备份配置文件位于 `backend/config/remote-backup-configs.json`，支持将备份文件同步到远程存储。

```json
{
  "targets": [],
  "globalSettings": {
    "enabled": false,
    "uploadAfterBackup": false,
    "deleteLocalAfterUpload": false,
    "retryCount": 3,
    "retryDelay": 5000,
    "timeout": 300000
  }
}
```

**配置项说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `targets` | array | 远程备份目标列表，每个目标支持 FTP/SFTP/WebDAV/SMB 协议 |
| `globalSettings.enabled` | boolean | 全局开关 |
| `globalSettings.uploadAfterBackup` | boolean | 备份完成后自动上传到远程 |
| `globalSettings.deleteLocalAfterUpload` | boolean | 上传成功后删除本地备份文件 |
| `globalSettings.retryCount` | number | 上传失败重试次数 |
| `globalSettings.retryDelay` | number | 重试间隔（毫秒） |
| `globalSettings.timeout` | number | 上传超时时间（毫秒） |

**远程备份目标示例**：

```json
{
  "targets": [
    {
      "name": "远程 FTP 备份",
      "type": "ftp",
      "host": "ftp.example.com",
      "port": 21,
      "username": "backup_user",
      "password": "backup_password",
      "remotePath": "/backups/idc/",
      "enabled": true
    },
    {
      "name": "远程 SFTP 备份",
      "type": "sftp",
      "host": "sftp.example.com",
      "port": 22,
      "username": "backup_user",
      "password": "backup_password",
      "remotePath": "/backups/idc/",
      "enabled": true
    },
    {
      "name": "WebDAV 备份",
      "type": "webdav",
      "url": "https://webdav.example.com",
      "username": "backup_user",
      "password": "backup_password",
      "remotePath": "/backups/idc/",
      "enabled": false
    },
    {
      "name": "SMB 共享备份",
      "type": "smb",
      "host": "192.168.1.100",
      "share": "backups",
      "username": "backup_user",
      "password": "backup_password",
      "remotePath": "\\idc\\",
      "enabled": false
    }
  ]
}
```

## 配置示例

### 开发环境（SQLite）

```bash
# 后端 backend/.env
NODE_ENV=development
PORT=8000
DB_TYPE=sqlite
DB_PATH=./idc_management.db
JWT_SECRET=dev_jwt_secret_key
TOKEN_EXPIRY=7d
LOG_LEVEL=debug

# 前端 frontend/.env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_TITLE=IDC设备管理系统（开发环境）
VITE_APP_VERSION=2.0.0
```

### 生产环境（MySQL）

```bash
# 后端 backend/.env
NODE_ENV=production
PORT=8000
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=idc_user
MYSQL_PASSWORD=your_strong_password_here
MYSQL_DATABASE=idc_management
JWT_SECRET=your_strong_random_jwt_secret_at_least_32_chars
TOKEN_EXPIRY=24h
SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=3
LOCK_TIME_MINUTES=15
PASSWORD_MIN_LENGTH=8
LOG_LEVEL=info
LOG_DIR=./logs
AUTO_BACKUP_ENABLED=true
AUTO_BACKUP_CRON=0 2 * * *
BACKUP_RETENTION=30
```

### Docker 部署（本地 MySQL 容器）

```bash
# 项目根目录 .env（Docker Compose 使用）
MYSQL_ROOT_PASSWORD=root_password
MYSQL_USER=idc_user
MYSQL_PASSWORD=user_password
MYSQL_DATABASE=idc_management

# 后端 backend/.env
NODE_ENV=production
PORT=8000
DB_TYPE=mysql
MYSQL_HOST=mysql         # 关键！使用 Docker 服务名，不是 localhost
MYSQL_PORT=3306
MYSQL_USERNAME=idc_user
MYSQL_PASSWORD=user_password
MYSQL_DATABASE=idc_management
JWT_SECRET=<已生成的随机密钥>
TOKEN_EXPIRY=24h
LOG_LEVEL=info
LOG_DIR=./logs
```

> **注意**：Docker 部署时，`backend/.env` 中的 `MYSQL_HOST` 必须设为 `mysql`（Docker 服务名），而非 `localhost`。

## 注意事项

1. **JWT_SECRET 安全**：生产环境必须设置为强随机字符串，不同环境使用不同的密钥
2. **MySQL 密码安全**：密码应包含大小写字母、数字和特殊字符
3. **日志级别**：生产环境建议使用 `info`，开发环境建议使用 `debug`
4. **备份策略**：建议同时开启本地备份和远程备份，确保数据安全
5. **前端环境变量**：以 `VITE_` 开头的变量会在构建时嵌入到前端代码中，修改后需重新构建
