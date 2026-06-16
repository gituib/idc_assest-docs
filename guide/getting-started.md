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

## 环境要求

- Node.js >= 16.x（推荐 20.x LTS）
- npm >= 7.x
- 操作系统：Windows 10+ / macOS 12+ / Ubuntu 20.04+ / Debian 11+ / CentOS 7+
- 内存：最低 4GB，推荐 8GB+
- 磁盘空间：最低 2GB，推荐 10GB+

## 部署方式

系统支持三种部署方式，请根据实际场景选择：

| 部署方式 | 适用场景 | 难度 |
|----------|----------|------|
| **Docker 部署** | 生产环境推荐，快速一键部署 | 低 |
| **安装脚本部署** | 生产环境，需更多定制选项 | 中 |
| **手动部署** | 开发调试、自定义部署 | 高 |

### Docker 部署（推荐）

适用于新服务器上首次部署，使用 3 容器架构（Nginx + 前端静态文件 | Backend | MySQL）。

#### 前置要求

| 条件 | 说明 |
| ---- | ---- |
| **Docker** | 20.10 及以上版本 |
| **Docker Compose** | v2 及以上 |
| **网络** | 服务器能访问镜像仓库（ghcr.io） |

#### 架构示意

```
用户浏览器 → Nginx 容器 :80
                ├── / 路径 → 返回前端静态页面
                └── /api 路径 → 反向代理 → Backend 容器 :8000 → MySQL 容器 :3306
```

#### 快速部署

```bash
# 克隆项目
git clone https://github.com/gituib/idc_assest.git
cd idc_assest

# 启动生产环境（一键部署）
docker compose -f docker-compose.prod.yml up -d
```

首次启动后，后端会自动初始化数据库（约 10-30 秒）。当日志出现以下内容时，说明启动完成：

```
所有初始化完成，服务器准备就绪
服务器运行在 http://localhost:8000
```

#### 服务验证

```bash
# 查看容器状态（都应为 Up）
docker compose -f docker-compose.prod.yml ps

# 测试健康检查
curl http://localhost/health

# 浏览器访问
# http://服务器IP
```

#### 常用 Docker 运维命令

```bash
# 启动/停止服务
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml down

# 查看日志
docker compose -f docker-compose.prod.yml logs -f

# 重启特定服务
docker compose -f docker-compose.prod.yml restart backend

# 拉取最新镜像并重启（版本升级）
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

> 完整的 Docker 部署说明（含环境变量配置、数据持久化、性能优化等）请参考 [Docker 部署文档](../deploy/docker-deploy.md)。

### 安装脚本部署

项目根目录提供了 `install/` 目录下的安装脚本，支持交互式安装和快速安装两种模式。

#### 交互式安装（推荐新手使用）

```bash
# 进入项目根目录
cd idc_assest

# 启动交互式安装向导
node install.js
```

安装脚本会引导完成以下完整流程：

| 步骤 | 说明 |
|------|------|
| 1. 环境检查 | 检测 Node.js 版本、Git、PM2、Nginx 等工具是否已安装 |
| 2. 数据库配置 | 选择 SQLite（默认）或 MySQL，配置连接参数 |
| 3. JWT 密钥生成 | 自动生成安全的 JWT 密钥 |
| 4. 依赖安装 | 自动安装前端和后端依赖 |
| 5. 数据库初始化 | 创建数据库表并初始化默认数据 |
| 6. 前端构建 | 构建生产环境前端文件 |
| 7. 服务启动 | 使用 PM2 启动后端服务（可选配置 Nginx 前端部署） |
| 8. 生成配置摘要 | 显示部署完成后的访问地址和配置信息 |

#### 一键快速安装（Linux）

```bash
# Linux/Mac 系统 - 使用一键部署脚本
./install.sh

# 或使用 Node.js 快速安装模式（跳过交互确认）
node install.js -y
```

`install.sh` 脚本会自动检测系统环境、安装必要依赖、运行 `install.js -y` 快速安装。

`node install.js -y` 快速安装适用于熟悉部署流程、接受默认配置的场景，会使用 SQLite 数据库（无需额外配置）、自动生成 JWT 密钥、安装所有依赖、构建前端并启动后端服务。

#### 一键更新

```bash
# 更新到最新版本（自动备份数据、拉取代码、执行迁移、重启服务）
node update.js
```

更新脚本会自动执行：

| 步骤 | 说明 |
|------|------|
| 1. 备份数据 | 自动备份 SQLite 数据库（MySQL 需手动备份） |
| 2. 拉取代码 | `git pull` 拉取最新代码 |
| 3. 安装依赖 | 检测并安装前后端依赖更新 |
| 4. 数据库迁移 | 执行数据库结构迁移 |
| 5. 构建前端 | 检测并重新构建前端 |
| 6. 重启服务 | 重启 PM2 管理的后端服务 |
| 7. 健康检查 | 验证服务是否正常运行 |

**常用选项：**

```bash
# 模拟运行（预览将要执行的操作，不实际执行）
node update.js --dry-run

# 跳过特定步骤
node update.js --skip-deps    # 跳过依赖安装
node update.js --skip-build   # 跳过前端构建
node update.js --skip-backup  # 跳过数据库备份

# 强制运行（忽略锁文件）
node update.js --force
```

#### 一键卸载

```bash
# 交互式卸载（推荐，可先备份数据）
node uninstall.js

# 卸载前自动备份数据库
node uninstall.js --backup

# 强制卸载（无需确认）
node uninstall.js --force

# 预览模式（仅显示将要删除的内容）
node uninstall.js --dry-run
```

卸载脚本会依次执行：停止 PM2 服务、清理 Nginx 配置、删除数据库文件、清理日志和上传文件、删除依赖和构建产物。

### 手动安装

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

## 脚本命令参考

| 命令 | 用途 | 说明 |
|------|------|------|
| `npm run install:all` | 安装所有依赖 | 同时安装前后端依赖 |
| `npm start` | 启动开发环境 | 前后端同时启动 |
| `npm run build` | 构建生产版本 | 构建前端静态文件 |
| `node install.js` | 交互式安装 | 生产环境安装向导 |
| `node install.js -y` | 快速安装 | 默认配置快速部署 |
| `./install.sh` | 一键部署脚本 | Linux 系统自动部署 |
| `node update.js` | 一键更新 | 备份-更新-迁移-重启 |
| `node uninstall.js` | 卸载系统 | 清理服务和数据 |
| `docker compose -f docker-compose.prod.yml up -d` | Docker 部署 | 生产环境容器化部署 |

## 首次使用

1. 打开浏览器访问系统地址（如 `http://localhost:3000` 或 `http://服务器IP`）
2. 点击「注册账号」链接
3. 填写用户名和密码完成注册
4. **第一个注册的用户自动获得管理员权限**
5. 登录后即可开始管理机房、机柜和设备

## 基本操作流程

```
创建机房 → 添加机柜 → 录入设备 → 配置端口/线缆 → 日常维护
```
