# 快速开始

## 系统简介

IDC设备资产系统是一款现代化的数据中心（IDC）设备管理平台，提供机房、机柜、设备的全生命周期管理，具备3D可视化展示功能。

### 技术栈

| 层级 | 技术选型 |
|------|----------|
| **前端框架** | React + Vite |
| **UI组件库** | Ant Design 5 |
| **3D渲染** | Three.js + @react-three/fiber |
| **后端框架** | Express |
| **ORM框架** | Sequelize |
| **数据库** | SQLite / MySQL |
| **认证** | JWT |

## 快速启动

### 环境要求

- Node.js >= 14.0.0（推荐 20.x LTS）
- npm >= 6.0.0

### 安装与启动

```bash
# 1. 克隆项目
git clone https://github.com/gituib/idc_assest.git
cd idc_assest

# 2. 安装所有依赖
npm run install:all

# 3. 启动开发环境（前后端同时启动）
npm start
```

启动后：
- 前端地址：http://localhost:3000
- 后端地址：http://localhost:8000
- API文档：http://localhost:8000/api-docs

### 首次使用

1. 打开浏览器访问 `http://localhost:3000`
2. 点击「注册账号」链接
3. 填写用户名和密码完成注册
4. 第一个注册的用户自动获得管理员权限

## 基本操作流程

```
创建机房 → 添加机柜 → 录入设备 → 配置端口/线缆 → 日常维护
```
