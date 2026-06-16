# 设备接口

## 获取设备列表

```http
GET /api/devices
```

**查询参数**: keyword, status, type, rackId, roomId, page, pageSize

**响应**:
```json
{ "success": true, "data": { "list": [...], "total": 100, "page": 1, "pageSize": 20 } }
```

## 获取设备详情

```http
GET /api/devices/:deviceId
```

## 创建设备

```http
POST /api/devices
Content-Type: application/json

{ "name": "Server-01", "type": "server", "rackId": "RACK-001", "position": 1, "height": 2 }
```

## 更新设备

```http
PUT /api/devices/:deviceId
```

## 删除设备

```http
DELETE /api/devices/:deviceId
```

## 批量导入

```http
POST /api/devices/import-preview    # 导入预览
POST /api/devices/import            # 执行导入
GET /api/devices/import-template    # 下载模板
```

## 设备导出

```http
GET /api/devices/export?format=csv
```
