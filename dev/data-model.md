# 数据模型

## 核心模型关系

```
Room (机房) ──1:N──► Rack (机柜) ──1:N──► Device (设备)
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
              NetworkCard (网卡)         DevicePort (端口)         DeviceField (字段)
                    │                         │
                    └─────────────────────────┘
                                              │
                                              ▼
                                          Cable (线缆)

User (用户) ──N:M──► Role (角色)
Consumable (耗材) ──N:1──► ConsumableCategory (耗材分类)
InventoryPlan (盘点计划) ──1:N──► InventoryTask (盘点任务) ──1:N──► InventoryRecord (盘点记录)
```

## 主要模型

### 机房模型 (Room)

- roomId (主键), name, location, area, manager
- 关联: hasMany Rack

### 机柜模型 (Rack)

- rackId (主键), name, roomId, totalU, usedU, powerCapacity
- 关联: belongsTo Room, hasMany Device

### 设备模型 (Device)

- deviceId (主键), name, type, brand, model, serialNumber
- rackId, position, height, status, ipAddress
- customFields (JSON)
- 关联: belongsTo Rack, hasMany DevicePort/NetworkCard/Cable

### 工单模型 (Ticket)

- ticketId (主键), title, description, type, priority, status
- reporterId, assigneeId, deviceId, customFields (JSON)

### 耗材模型 (Consumable)

- consumableId (主键), name, categoryId, sku, unit, stock
- minStock, location, snList (JSON), version (乐观锁)
