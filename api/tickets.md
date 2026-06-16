# 工单接口

## 获取工单列表

```http
GET /api/tickets
```

**查询参数**: status, priority, categoryId, assigneeId, page, pageSize

## 获取工单详情

```http
GET /api/tickets/:ticketId
```

## 创建工单

```http
POST /api/tickets
Content-Type: application/json

{ "title": "服务器故障", "description": "...", "priority": "high", "categoryId": "CAT-001" }
```

## 分配工单

```http
PUT /api/tickets/:ticketId/assign
Body: { "assigneeId": "USER-001" }
```

## 处理工单

```http
PUT /api/tickets/:ticketId/process
Body: { "resolution": "已更换硬盘" }
```

## 关闭/重开工单

```http
PUT /api/tickets/:ticketId/close
PUT /api/tickets/:ticketId/reopen
```
