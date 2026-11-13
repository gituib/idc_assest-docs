# 环境配置

## 环境要求

| 项目 | 最低要求 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Windows 10, macOS 12, Ubuntu 20.04 | 同最低 |
| Node.js | ≥20.0.0（`Dockerfile` 与 `vite` 构建均基于 20.x） | 20.x LTS |
| 内存 | 4GB | 8GB+ |
| 磁盘空间 | 2GB | 10GB+ |

> 使用 Docker 部署时无需在宿主机安装 Node.js。

## 前端环境变量

前端环境变量配置文件位于 `frontend/.env`，所有变量以 `VITE_` 前缀开头。

::: warning 只有构建时存在的变量才有效
`VITE_` 变量在 `vite build` 时**静态内联**进打包产物。Docker 部署使用预构建镜像，**此时设置 `frontend/.env` 不会生效**，必须重新构建前端镜像才能改变。运行期可变的配置请走后端环境变量或系统设置。

:::

### 代码中实际读取的变量

以下 3 个变量在源码中通过 `import.meta.env.*` 真实读取，均已内置默认值，通常**无需配置**：

```bash
# API 基础路径，默认 /api（生产环境由 Nginx 反代，保持默认即可）
VITE_API_BASE_URL=/api

# API 请求超时时间（毫秒），默认 30000
VITE_API_TIMEOUT=30000

# 闭源模块接口路径，默认 /premium-api（未部署闭源模块时无需设置）
# VITE_PREMIUM_API_BASE_URL=/premium-api
```

> 注意：`VITE_IDLE_TIMEOUT`、`VITE_IDLE_WARNING_TIME`、`VITE_APP_TITLE`、`VITE_APP_VERSION` 曾出现在旧版文档中，但**当前代码并未读取**。空闲超时由后端系统设置项 `idle_timeout` / `idle_warning_time` 控制，页面标题写在 `frontend/index.html`。

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
> 数据库创建命令：`CREATE DATABASE idc_management CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`
> Docker Compose 部署时由 `mysql` 容器按根目录 `.env` 的 `MYSQL_DATABASE` 自动建库，无需手工执行。

```bash
# MySQL 主机地址
# Docker Compose 部署时 docker-compose.yml 的 backend.environment 已强制覆盖为 mysql，
# 此处写 localhost 也不影响；改用外部 MySQL 时填实际地址（不能写容器内的 localhost）
MYSQL_HOST=localhost

# MySQL 端口
MYSQL_PORT=3306

# MySQL 用户名
MYSQL_USERNAME=root

# MySQL 密码
# 注意：值中若含 # 会被 dotenv 当作注释截断，含 # 时请用双引号包裹整个值
MYSQL_PASSWORD=

# MySQL 数据库名（代码只读取此键名）
MYSQL_DATABASE=idc_management
```

::: warning 不要使用 `MYSQL_ORLOFGYI`
旧模板中出现过 `MYSQL_DATABASE=idc_management`，该键在代码中不存在。填写后不会报错，但库名会静默回落到默认值，属于「配置了却没生效」的典型问题。库名统一用 `MYSQL_DATABASE`。
:::

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
# 密码加密强度（bcrypt salt rounds），不设置时代码回退为 10
# 该值参与 bcrypt.hash 的实际计算，是真正生效的配置：
#   注册、管理员建号/改密、用户改密、scripts/create-admin.js 均使用此值
# 新口令按新值计算哈希，旧口令在下一次改密时才会升级到新强度（bcrypt 哈希自带盐值，可共存）
# 不建议调到 12 —— 耗时约为 10 的 4 倍，用户量上升后登录会明显变慢
# SALT_ROUNDS=10

# 密码最小长度，不设置时代码回退为 6
# 注意：前端登录/注册/改密表单把下限写死为 6，
# 把此值调大后旧账号（口令短于新下限）将无法登录，管理员新建用户的表单校验也会不一致
# PASSWORD_MIN_LENGTH=6

# 用户名长度限制，不设置时代码回退为 3 / 50
# 注意：前端表单把上限写死为 20。若配置大于 20 的上限，前端会拦下合法长度，造成前后端校验不一致
# USERNAME_MIN_LENGTH=3
# USERNAME_MAX_LENGTH=20
```

#### 登录安全

::: warning 这两项不是环境变量，写进 .env 不会生效
`MAX_LOGIN_ATTEMPTS` / `LOCK_TIME_MINUTES` 在 `backend/config/security.js` 中被读取成常量 `MAX_LOGIN_ATTEMPTS` 与 `LOCK_TIME`，但**全项目没有任何代码引用这两个常量**。登录路由 `backend/routes/auth.js` 的实际取值为：

| 策略 | 真实来源 | 可调整 |
| ---- | ---- | ---- |
| 失败次数阈值 | `SystemSetting` 表的 `max_login_attempts`（默认 `5`） | ✅ 系统设置界面可改 |
| 锁定时长 | `auth.js` 中硬编码 `30 * 60 * 1000`（30 分钟） | ❌ 代码常量，改 `.env` 无效 |

另有一层与账号锁定独立的**登录限流**（`backend/utils/loginRateLimit.js`），按 IP + 用户名滑动窗口计数，超限返回 `429`，同样不受这两个环境变量控制。

所以：想调「失败几次锁定」，请到**系统设置 → 安全策略 → 最大登录尝试次数**修改；想改「锁多久」，目前只能改 `auth.js` 源码后重新构建镜像。
:::

#### 部署安全（建议生产必配）

```bash
# 首管理员引导用户名（推荐显式设置）
# 空库时首个注册用户默认自动获得管理员权限，存在部署窗口期被抢注超级管理员的风险。
# 配置后仅当首个注册用户名与此值一致才授予管理员权限，其他用户名按待审核处理。
BOOTSTRAP_ADMIN_USERNAME=admin

# CORS 来源白名单（逗号分隔）
# 留空则允许多源（宽松兼容）；经 TLS 网关对外后建议显式收紧
CORS_ORIGINS=https://idc.example.com

# 远端备份凭据加密密钥（可选，32 字节十六进制）
# 不填则复用 JWT_SECRET 派生密钥。注意：复用情况下轮换 JWT_SECRET 会使已存远端凭据失效，
# 轮换前须先执行 node scripts/migrate-remote-backup-cipher.js
# REMOTE_BACKUP_KEY=
```

### API 配置

```bash
# 默认每页条数，不设置时代码回退为 10
DEFAULT_PAGE_SIZE=20

# 最大每页条数，不设置时代码回退为 1000
MAX_PAGE_SIZE=500

# 最大重试次数（耗材相关接口写库重试），不设置时代码回退为 3
MAX_RETRIES=3

# 重试延迟（毫秒），不设置时代码回退为 1000
RETRY_DELAY=1000
```

::: warning `API_TIMEOUT` / `DB_QUERY_TIMEOUT` 是空转配置
`backend/config/constants.js` 里确实有 `TIMEOUT.API_TIMEOUT`、`TIMEOUT.DB_QUERY_TIMEOUT`（默认各 30000），但**全项目没有任何代码引用 `TIMEOUT` 这个导出**：

```bash
# 可自行验证，结果为空
grep -rn "\bTIMEOUT\b" backend/*.js backend/routes backend/middleware backend/utils backend/services
```

也就是说写进 `.env` 会被读成常量，但不会影响任何请求或查询的超时行为，属于「配了没反应」。实际超时控制分散在：

| 行为 | 真实控制点 |
| ---- | ---- |
| 前端请求超时 | `frontend/src/config/api.js` 的 `VITE_API_TIMEOUT`（构建时内联，默认 30000ms） |
| Nginx → 后端代理超时 | `frontend/nginx.conf` 的 `proxy_read_timeout` / `proxy_send_timeout`（120s） |
| 数据库连接获取超时 | `backend/db.js` 的 `pool.acquire`（30000ms） |
| 邮件发送超时 | `backend/services/mailer.js` 的 `SEND_TIMEOUT_MS`（10000ms，代码常量） |
| 维护模式超时 | `backend/utils/maintenanceMode.js` 的 `MAINTENANCE_TIMEOUT_MS`（30 分钟，代码常量） |

模板中已将这两项注释掉，避免误导。真正要调接口耗时，请改 Nginx 与前端 `VITE_API_TIMEOUT`。
:::

### 文件上传配置

```bash
# 全局请求体上限（MB），不设置时代码回退为 500
# 同时是「数据库备份恢复」上传备份文件的上限：备份包会先落到系统临时目录再入库，
# 调得过大且临时目录位于系统盘时，大文件上传有写满磁盘的风险
MAX_FILE_SIZE_MB=100

# 最大头像上传大小（MB），不设置时代码回退为 5
# 注意：前端 UserManagement 页把头像上限写死为 5MB，调大后前端仍会按 5MB 拦截
MAX_AVATAR_SIZE_MB=5

# 设备/耗材业务图片单张上限（MB），不设置时代码回退为 10
MAX_IMAGE_SIZE_MB=10
```

::: danger MAX_FILE_SIZE_MB 必须与 Nginx 的 client_max_body_size 对齐
后端上限只是「允许」，Nginx 默认只放行 1MB。镜像内置的 `frontend/nginx.conf` 设为 `50m`，**当 `MAX_FILE_SIZE_MB` 调大于 50 时，大文件会在 Nginx 层被 413 拒绝**，后端根本收不到请求。前置 TLS 网关的那一层也要同步调整。详见 [Docker 部署 · 上传文件返回 413](docker-deploy.md#上传文件返回-413)。
:::

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

::: warning 备份配置不在 .env 中
自动备份与备份路径**不是环境变量**，而是通过系统设置界面（`SystemSetting` 表）与配置文件管理。旧版文档中的 `BACKUP_DIR` / `AUTO_BACKUP_ENABLED` / `AUTO_BACKUP_CRON` / `BACKUP_RETENTION` 在代码中不存在，写入 `.env` 不会生效。

:::

#### 本地自动备份

| 配置来源 | 位置 | 说明 |
| -------- | ---- | ---- |
| 备份文件目录 | 系统设置项 `backup_path` | 默认 `./backups`，相对后端工作目录（容器内为 `/app/backups`） |
| 自动备份开关 / 周期 / 保留数量 | `backend/config/auto-backup-settings.json` | 该文件被 `.dockerignore` 排除，不进镜像；首次通过界面保存时自动生成 |

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
JWT_SECRET=dev_jwt_secret_key_at_least_32_chars_long
TOKEN_EXPIRY=7d
LOG_LEVEL=debug
```

> 开发态前端通过 `vite.config.mjs` 的 `server.proxy` 把 `/api` 转发到 `localhost:8000`，因此 `frontend/.env` 无需设置 `VITE_API_BASE_URL`。

### 生产环境（MySQL，非 Docker）

```bash
# 后端 backend/.env
NODE_ENV=production
PORT=8000
DB_TYPE=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USERNAME=idc_user
MYSQL_PASSWORD=your_strong_password_here
MYSQL_DATABASE=idc_management
JWT_SECRET=your_strong_random_jwt_secret_at_least_32_chars
TOKEN_EXPIRY=24h
PASSWORD_MIN_LENGTH=8
# LOG_LEVEL 不设时为 info（production）；LOG_DIR 不设时为 backend/logs
```

> 登录失败次数请到系统设置界面调 `max_login_attempts`，`MAX_LOGIN_ATTEMPTS` / `LOCK_TIME_MINUTES` 写在此处不生效（原因见上方「登录安全」）。

### Docker 部署（内置 MySQL 容器，默认方案）

```bash
# 项目根目录 .env（Docker Compose 读取，供 mysql 容器初始化）
MYSQL_ROOT_PASSWORD=root_password
MYSQL_DATABASE=idc_management
MYSQL_USER=idc_user
MYSQL_PASSWORD=user_password

# 后端 backend/.env（应用读取）
NODE_ENV=production
PORT=8000
DB_TYPE=mysql
MYSQL_HOST=mysql          # 实际由 compose 强制覆盖，填 localhost 也不影响
MYSQL_PORT=3306
MYSQL_USERNAME=idc_user
MYSQL_PASSWORD=user_password
MYSQL_DATABASE=idc_management
JWT_SECRET=已生成的64位十六进制随机串
TOKEN_EXPIRY=24h
```

> **三处易错点**：
> 1. 用户名在两个文件中键名不同（`MYSQL_USER` vs `MYSQL_USERNAME`），值需一致；
> 2. 库名统一用 `MYSQL_DATABASE`，历史模板里出现过的 `MYSQL_ORLOFGYI` 代码从不读取；
> 3. 值中若含 `#`，`dotenv` 会截断，需用双引号包裹整个值。
>
> `MYSQL_HOST=mysql` 已由 `docker-compose.yml` 的 `backend.environment` 强制设置，所以即便 `backend/.env` 忘了改也不会连错库。改用外部 MySQL 时需删掉 compose 里那一行覆盖。

## 配置项生效状态速查

模板（`backend/.env.example`）遵循「只写代码真会读的键」这一约定，但「会被读取」与「会影响行为」是两件事。下表按实际效果分三档：

| 档位 | 含义 | 键 |
| ---- | ---- | ---- |
| ✅ 真正生效 | 有业务代码使用，改动立即影响行为 | `PORT`、`NODE_ENV`、`DB_TYPE`、`DB_PATH`、`MYSQL_*`、`JWT_SECRET`、`TOKEN_EXPIRY`、`REMOTE_BACKUP_KEY`、`BOOTSTRAP_ADMIN_USERNAME`、`CORS_ORIGINS`、`SALT_ROUNDS`、`PASSWORD_MIN_LENGTH`、`USERNAME_MIN_LENGTH`、`USERNAME_MAX_LENGTH`、`DEFAULT_PAGE_SIZE`、`MAX_PAGE_SIZE`、`MAX_FILE_SIZE_MB`、`MAX_AVATAR_SIZE_MB`、`MAX_IMAGE_SIZE_MB`、`MAX_RETRIES`、`RETRY_DELAY`、`LOG_LEVEL`、`LOG_DIR`、`LOG_MAX_FILE_SIZE`、`LOG_MAX_FILES`、`MODULE_LOG_LEVELS`、`LOG_SAMPLING`、`FRONTEND_PORT` |
| ⚠️ 读成常量但无人使用 | 会被解析进 config 对象，但没有业务代码引用 `TIMEOUT` / `MAX_LOGIN_ATTEMPTS` / `LOCK_TIME`，改动无效果 | `API_TIMEOUT`、`DB_QUERY_TIMEOUT`、`MAX_LOGIN_ATTEMPTS`、`LOCK_TIME_MINUTES` |
| 🚫 实为系统设置项 | 不是环境变量，写进 `.env` 无效，须在系统设置界面或配置文件改 | 备份路径 `backup_path`、自动备份策略（`backend/config/auto-backup-settings.json`）、`max_login_attempts`、`idle_timeout`、`allow_intranet_collection`、`target_whitelist` |

::: tip 自行验证某个键是否生效
```bash
cd backend
# 1) 看它是否被读取
grep -rn "process.env.你的键名" --include=*.js .
# 2) 看读出来的常量是否被引用（把 grep 词换成 config 里的导出名）
grep -rn "\bTIMEOUT\b" --include=*.js . | grep -v config/
```
第 2 步结果为空，说明虽然读了但没有任何代码使用。
:::

## 注意事项

1. **JWT_SECRET 安全**：生产环境必须设置且不少于 32 字符，否则后端启动即退出；不同环境使用不同密钥
2. **MySQL 密码安全**：密码应包含大小写字母、数字和特殊字符；含 `#` 时必须加双引号
3. **日志级别**：生产环境建议使用 `info`，开发环境建议使用 `debug`
4. **备份策略**：备份路径与自动备份通过系统设置界面配置，不写在 `.env`
5. **前端环境变量**：以 `VITE_` 开头的变量在构建时内联进产物，Docker 镜像部署时修改 `frontend/.env` 无效，须重新构建镜像
