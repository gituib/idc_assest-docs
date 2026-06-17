# 备份接口

备份接口用于数据库的备份与恢复，支持手动备份、自动备份调度、远端备份及备份文件管理。

## 获取备份列表

```http
GET /api/backup/list
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "filename": "backup_20260617_120000.db",
        "size": 1048576,
        "sizeText": "1.00 MB",
        "createdAt": "2026-06-17T12:00:00Z",
        "type": "manual",
        "validated": true
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `filename` | string | 备份文件名 |
| `size` | integer | 文件大小（字节） |
| `sizeText` | string | 文件大小（人类可读） |
| `createdAt` | string | 创建时间 |
| `type` | string | 备份类型：`manual`（手动）、`auto`（自动）、`upload`（上传） |
| `validated` | boolean | 是否已通过完整性校验 |

## 创建备份

```http
POST /api/backup
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 备份名称 |
| `description` | string | 否 | 备份描述 |

### 请求示例

```json
{
  "name": "版本升级前备份",
  "description": "v2.2.0 升级前手动备份"
}
```

### 响应

```json
{
  "success": true,
  "data": {
    "filename": "backup_20260617_120000.db",
    "size": 1048576
  },
  "message": "备份创建成功"
}
```

## 恢复备份

::: warning 注意
恢复操作会覆盖当前数据库，执行前请确认备份文件正确，建议先执行验证。
:::

```http
POST /api/backup/restore
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `filename` | string | 是 | 备份文件名 |

### 请求示例

```json
{ "filename": "backup_20260617_120000.db" }
```

### 响应

```json
{
  "success": true,
  "message": "恢复成功，服务即将重启"
}
```

## 验证备份

校验备份文件的完整性和可用性。

```http
GET /api/backup/validate/:filename
```

### 响应

```json
{
  "success": true,
  "data": {
    "filename": "backup_20260617_120000.db",
    "valid": true,
    "tables": 25,
    "records": 10234
  }
}
```

## 下载备份

```http
GET /api/backup/download/:filename
```

返回文件流，`Content-Type: application/octet-stream`，浏览器自动触发下载。

## 删除备份

```http
DELETE /api/backup/:filename
```

### 响应

```json
{
  "success": true,
  "message": "删除成功"
}
```

## 上传备份

上传外部备份文件到服务器，便于跨环境恢复。

```http
POST /api/backup/upload
Content-Type: multipart/form-data
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `backup` | file | 是 | 备份文件 |

### 响应

```json
{
  "success": true,
  "data": { "filename": "uploaded_backup.db" },
  "message": "上传成功"
}
```

## 自动备份

自动备份通过 Cron 表达式定时执行，支持配置保留份数。

### 获取自动备份状态

```http
GET /api/backup/auto/status
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "cronExpression": "0 2 * * *",
    "retentionCount": 7,
    "lastRunAt": "2026-06-17T02:00:00Z",
    "nextRunAt": "2026-06-18T02:00:00Z"
  }
}
```

### 更新自动备份设置

```http
POST /api/backup/auto/settings
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | boolean | 否 | 是否启用 |
| `cronExpression` | string | 否 | Cron 表达式（如 `0 2 * * *` 每天 2 点） |
| `retentionCount` | integer | 否 | 保留备份份数，超出自动清理 |

#### 请求示例

```json
{
  "enabled": true,
  "cronExpression": "0 2 * * *",
  "retentionCount": 7
}
```

### 立即执行备份

手动触发一次自动备份任务，不影响原有调度。

```http
POST /api/backup/auto/execute
```

## 远端备份

支持将本地备份同步到远程存储，协议包括 FTP、SFTP、WebDAV、SMB。

### 获取远端备份配置

```http
GET /api/backup/remote/configs
```

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "异地备份服务器",
      "protocol": "sftp",
      "host": "backup.example.com",
      "port": 22,
      "enabled": true
    }
  ]
}
```

### 新增远端备份配置

```http
POST /api/backup/remote/configs
```

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 配置名称 |
| `protocol` | string | 是 | 协议：`ftp`、`sftp`、`webdav`、`smb` |
| `host` | string | 是 | 主机地址 |
| `port` | integer | 否 | 端口 |
| `username` | string | 是 | 用户名 |
| `password` | string | 是 | 密码 |
| `remotePath` | string | 否 | 远程存储路径 |
| `enabled` | boolean | 否 | 是否启用 |

### 测试远端连接

```http
POST /api/backup/remote/test
```

### 同步备份到远端

```http
POST /api/backup/remote/sync
Body: { "configId": 1, "filename": "backup_20260617_120000.db" }
```

## 错误码

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `NOT_FOUND` | 404 | 备份文件不存在 |
| `VALIDATION_ERROR` | 400 | Cron 表达式非法或文件格式错误 |
| `FORBIDDEN` | 403 | 无备份管理权限 |
| `INTERNAL_ERROR` | 500 | 备份/恢复过程失败 |
