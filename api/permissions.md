# 权限接口

权限接口提供系统的三级权限树查询能力，是 RBAC 角色配置的数据基础。

> **历史说明**：本文档此前为空。权限相关接口分为两部分——**权限字典查询**（本页）与**角色 CRUD**（见 [用户与角色接口](./users)）。

## 权限模型

系统采用三级权限结构：

```
模块（module）
  └── 菜单（menu）
        └── 按钮（button）
```

| 层级 | `type` 取值 | 说明 | 示例 |
|------|-------------|------|------|
| 模块 | `module` | 一级功能域，通常不单独授权 | `device`、`room`、`system` |
| 菜单 | `menu` | 对应一个前端页面路由 | `device:view`、`rack:3d`、`ipam:view` |
| 按钮 | `button` | 页面内的操作能力 | `device:create`、`device:edit`、`device:delete` |

权限码命名规范为 `{资源}:{操作}`，例如 `ticket:view`、`consumable:stats`、`warehouse:delete`。

## 权限码实现机制

### 中间件

后端通过 `requirePermission(code)` 中间件在路由级声明权限要求：

```js
router.post('/', authMiddleware, requirePermission('device:create'), async (req, res) => { ... });
```

### 通配符支持

权限匹配支持通配符：

| 权限值 | 含义 |
|--------|------|
| `*` | 全部权限（`admin` 角色使用） |
| `device:*` | 设备模块全部操作 |

### 权限种子数据

权限清单以种子数据形式维护于 `backend/scripts/init-permissions.js`，服务启动时执行**幂等 upsert**，补齐缺失的权限项，不会覆盖已存在的自定义权限。

```bash
# 手动初始化权限种子
cd backend && npm run init-permissions
```

> **启动期自检**：服务启动后会扫描所有路由的 `requirePermission` 声明，若发现权限码在种子中缺失，会输出警告日志。这是发现权限漏配的主要手段。

## 获取权限列表

```http
GET /api/permissions
```

### 鉴权要求

- 需要有效令牌（`authMiddleware`）
- **不额外校验模块级权限码**：任何已登录用户均可读取权限字典，以便前端渲染角色配置界面

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "permissionId": "perm_device_view",
      "permissionName": "设备查看",
      "permissionCode": "device:view",
      "parentId": "device",
      "type": "menu",
      "sort": 10,
      "status": "active"
    },
    {
      "permissionId": "perm_device_create",
      "permissionName": "设备新增",
      "permissionCode": "device:create",
      "parentId": "device",
      "type": "button",
      "sort": 11,
      "status": "active"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `permissionId` | string (PK) | 主键 |
| `permissionName` | string | 权限名称（中文） |
| `permissionCode` | string | 权限码，中间件校验依据 |
| `parentId` | string | 父权限 ID，`module` 级为空 |
| `type` | enum | `module`、`menu`、`button` |
| `sort` | integer | 排序值，用于树形渲染顺序 |
| `status` | enum | `active`、`inactive`；接口仅返回 `active` 项 |

### 数据结构提示

接口返回**扁平数组**（按 `sort` 升序），前端需按 `parentId` 自行构建树形结构。服务端不返回嵌套树。

## 主要权限码清单

### 机房与机柜

| 权限码 | 说明 |
|--------|------|
| `room:view` | 机房查看 |
| `rack:view` | 机柜查看 |
| `rack:3d` | 3D 机柜可视化 |
| `floorplan` | 机房平面图 |

### 资产

| 权限码 | 说明 |
|--------|------|
| `device:view` | 设备查看 |
| `device:create` | 设备新增、导入 |
| `device:edit` | 设备编辑、批量操作 |
| `device:delete` | 设备删除 |
| `field:page` | 字段管理页面 |
| `idle:view` | 空闲设备查看 |
| `idle:shelve` | 转入空闲、上架 |
| `idle:edit` | 空闲设备编辑 |
| `idle:restore` | 恢复上架 |
| `idle:delete` | 空闲设备删除 |
| `warehouse:view` | 库房查看 |
| `warehouse:create` | 库房新增 |
| `warehouse:edit` | 库房编辑 |
| `warehouse:delete` | 库房删除 |

### 线路

| 权限码 | 说明 |
|--------|------|
| `port:view` | 端口查看、采集预览 |
| `port:create` | 端口新增、采集落库 |
| `port:edit` | 端口编辑、凭据管理 |
| `port:delete` | 端口删除 |
| `cable:view` | 接线查看 |
| `cable:create` | 接线创建 |
| `cable:edit` | 接线编辑 |
| `cable:delete` | 接线删除 |

### 耗材与工单

| 权限码 | 说明 |
|--------|------|
| `consumable:view` | 耗材列表 |
| `consumable:category` | 分类管理 |
| `consumable:stats` | 耗材统计 |
| `consumable:log` | 耗材操作日志 |
| `ticket:view` | 工单查看 |
| `ticket:create` | 创建工单 |
| `ticket:edit` | 处理工单 |
| `ticket:delete` | 删除工单 |
| `ticket:category` | 故障分类管理 |
| `ticket:stats` | 工单统计 |

### 盘点

| 权限码 | 说明 |
|--------|------|
| `inventory:plan` | 盘点计划 |
| `inventory:task` | 盘点任务执行 |
| `inventory:pending` | 盘盈设备 |

### 系统

| 权限码 | 说明 |
|--------|------|
| `user:view` / `user:create` / `user:edit` / `user:delete` | 用户管理 |
| `user:password` | 重置他人密码 |
| `user:approve` | 审核注册申请 |
| `role:view` / `role:create` / `role:edit` / `role:delete` | 角色管理 |
| `settings:view` / `settings:edit` | 系统设置 |
| `backup:view` / `backup:auto` / `backup:remote` | 备份管理 |
| `log:view` | 操作日志 |

### 未纳入权限码的模块

以下模块**当前未在种子数据中注册独立权限码**，所有已登录用户均可访问：

| 模块 | 前端路由权限配置 | 说明 |
|------|------------------|------|
| IPAM | `NO_PERMISSION_REQUIRED` | `App.jsx` 中已标注「IPAM 在 init-permissions.js 清单中暂无对应权限码」 |

> **改进建议**：如需按角色隔离 IPAM 访问，需在 `init-permissions.js` 中新增 `ipam:view` / `ipam:edit` 等权限码，并在 `frontend/src/App.jsx` 的路由表与 `backend/routes/ipam.js` 中各路由上接入。这是当前权限体系的主要缺口。

## 权限校验失败行为

### 后端

返回 `403`：

```json
{
  "success": false,
  "message": "无权限执行此操作"
}
```

### 前端

- 菜单项按权限码条件渲染，无权限的菜单不显示
- 路由层由 `ProtectedRoute` 拦截，无权限跳转 `/403`
- 按钮级操作按权限码禁用或隐藏

## 相关文档

- [用户与角色接口](./users)
- [系统管理功能说明](/guide/features/system-management)
- [认证接口](./auth)
