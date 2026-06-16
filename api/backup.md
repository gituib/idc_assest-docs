# 备份接口

## 获取备份列表

```http
GET /api/backup/list
```

## 创建备份

```http
POST /api/backup
Body: { "name": "手动备份", "description": "版本升级前备份" }
```

## 恢复备份

```http
POST /api/backup/restore
Body: { "filename": "backup_20260507_120000.db" }
```

## 验证备份

```http
GET /api/backup/validate/:filename
```

## 下载备份

```http
GET /api/backup/download/:filename
```

## 删除备份

```http
DELETE /api/backup/:filename
```

## 上传备份

```http
POST /api/backup/upload
Body: FormData (backup)
```

## 自动备份

```http
GET  /api/backup/auto/status      # 获取自动备份状态
POST /api/backup/auto/settings    # 更新自动备份设置
POST /api/backup/auto/execute     # 立即执行备份
```
