# 后端架构

## 服务入口

```javascript
async function initializeApp() {
  // 1. 数据库同步
  await syncDatabase();
  // 2. 初始化设备字段
  await initDeviceFields();
  // 3. 初始化工单字段
  await initTicketFields();
  // 4. 同步耗材模型
  await syncConsumableModels();
  // 5. 同步盘点模型
  await syncInventoryModels();
  // 6. 初始化系统设置
  await initDefaultSystemSettings();
  // 7. 初始化故障分类
  await initFaultCategories();
  // 8. 初始化自动备份调度器
  await initAutoBackupScheduler();
}
```

## 中间件层

| 中间件 | 功能描述 |
|--------|----------|
| authMiddleware | JWT令牌验证、用户认证 |
| maintenanceMiddleware | 维护模式拦截 |
| requestLogger | HTTP请求日志记录 |
| validationMiddleware | Joi数据验证 |

## 数据库连接

支持 SQLite 和 MySQL 双数据库，通过 `DB_TYPE` 环境变量切换。

## 路由模块

完整的 RESTful API 路由，覆盖所有业务模块的 CRUD 操作及批量操作。
