# Code Wiki

> 版本：2.0.0 | 更新日期：2026-05-07

## 系统概述

IDC设备资产系统是一个现代化的数据中心设备全生命周期管理平台，提供机房、机柜、设备的完整管理能力，并具备3D可视化展示功能。

### 技术栈概览

| 层级 | 技术选型 | 版本 |
|------|----------|------|
| **前端框架** | React + Vite | 18.2.0 / 4.4.9 |
| **UI组件库** | Ant Design | 5.8.6 |
| **3D渲染** | Three.js + @react-three/fiber | 0.183.2 / 8.18.0 |
| **后端框架** | Express | 4.18.2 |
| **ORM框架** | Sequelize | 6.37.8 |
| **数据库** | SQLite / MySQL | 5.1.7 / 8.0+ |
| **认证** | JWT | 9.0.3 |

### 核心功能模块

| 模块 | 功能描述 | 页面入口 |
|------|----------|----------|
| **机房管理** | 多机房分类、平面图可视化 | /rooms |
| **机柜管理** | 机柜CRUD、容量统计、3D可视化 | /racks |
| **设备管理** | 设备全生命周期、批量导入导出 | /devices |
| **端口管理** | 设备端口配置、网卡绑定 | /ports |
| **线缆管理** | 机柜间线缆连接可视化追踪 | /cables |
| **网络拓扑** | ReactFlow拓扑可视化 | - |
| **工单管理** | 故障报修、维护工单全流程 | /tickets |
| **耗材管理** | 库存、领用、SN序列号追踪 | /consumables |
| **盘点管理** | 盘点计划、任务分配、盘盈设备 | /inventory |
| **数据看板** | 实时监控、趋势图表、功率监控 | / |
| **3D可视化** | Three.js机柜可视化、LOD优化 | /visualization-3d |
| **备份管理** | 本地/远程备份、定时任务 | /backup |
| **操作日志** | 审计日志、统计分析 | /operation-logs |
| **用户权限** | RBAC角色控制 | /users |

## 前端项目结构

```
frontend/
├── public/                    # 静态公共资源
│   ├── assets/3d/            # 3D环境贴图
│   └── png/                   # 设备图标
├── src/
│   ├── api/                   # API接口封装
│   ├── components/            # React组件库
│   │   ├── 3d/               # 3D可视化组件
│   │   ├── dashboard/        # 数据看板组件
│   │   ├── device/           # 设备管理组件
│   │   ├── floorplan/        # 机房平面图组件
│   │   ├── rack/             # 机柜组件
│   │   └── topology/         # 网络拓扑组件
│   ├── config/                # 配置文件
│   ├── constants/             # 常量定义
│   ├── context/               # React Context
│   ├── hooks/                 # 自定义Hooks
│   ├── pages/                 # 页面组件
│   ├── styles/                # 样式文件
│   └── utils/                 # 工具函数
```

## 后端项目结构

```
backend/
├── config/                    # 配置模块
├── middleware/                # 中间件
├── models/                    # Sequelize数据模型
├── routes/                    # API路由
├── scripts/                   # 数据库脚本
├── utils/                     # 工具函数
├── validation/                # Joi验证Schema
├── tests/                     # 测试文件
├── server.js                  # 服务入口
└── db.js                      # 数据库连接
```

## API响应格式

```javascript
// 成功响应
{ "success": true, "data": { ... }, "message": "操作成功" }

// 失败响应
{ "success": false, "message": "错误描述", "code": "ERROR_CODE" }

// 分页响应
{ "success": true, "data": { "list": [...], "total": 100, "page": 1, "pageSize": 20 } }
```

## 常用命令

```bash
# 安装依赖
npm run install:all

# 启动开发环境
npm start

# 后端测试
cd backend && npm test

# 前端构建
cd frontend && npm run build

# 代码检查
cd backend && npm run lint
cd frontend && npm run lint
```

## 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 组件文件 | PascalCase.jsx | DeviceManagement.jsx |
| 工具文件 | camelCase.js | secureStorage.js |
| 数据模型 | PascalCase | Device.js |
| 数据库表 | snake_case | device_ports |
| API路径 | camelCase | /api/devices |
| Context | PascalCase | AuthContext.jsx |
| Hooks | use{camelCase}.js | useApi.js |
