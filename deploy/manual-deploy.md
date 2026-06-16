# 手动部署

## 生产环境部署流程

### 构建前端

```bash
cd frontend
npm install
npm run build
```

构建产物在 `frontend/dist/` 目录。

### 启动后端

```bash
cd backend
npm install --production

# 使用 PM2 管理进程
npm install -g pm2
pm2 start server.js --name idc-backend
pm2 save
pm2 startup
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your_domain.com;

    root /var/www/idc/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/idc/backend/uploads;
    }

    location /api-docs {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

## 安装脚本使用说明

项目根目录提供了三个安装部署脚本，位于 `install/` 目录下，用于简化部署、更新和卸载流程。

### 环境要求

| 条件 | 说明 |
| ---- | ---- |
| **Node.js** | 16.x 及以上 |
| **npm** | 7.x 及以上 |
| **操作系统** | Windows 10+ / macOS 12+ / Ubuntu 20.04+ / Debian 11+ / CentOS 7+ |
| **内存** | 最低 4GB，推荐 8GB+ |
| **磁盘空间** | 最低 2GB，推荐 10GB+ |

### install.js — 交互式安装

```bash
# 进入项目根目录
cd idc_assest

# 交互式安装（向导模式）
node install.js
```

安装脚本会引导你完成以下步骤：

1. **环境检查** — 检测 Node.js 版本、Git、PM2、Nginx 等工具是否已安装
2. **数据库配置** — 选择 SQLite（默认）或 MySQL，配置连接参数
3. **JWT 密钥生成** — 自动生成安全的 JWT 密钥
4. **依赖安装** — 自动安装前端和后端依赖
5. **数据库初始化** — 创建数据库表并初始化默认数据
6. **前端构建** — 构建生产环境前端文件
7. **服务启动** — 使用 PM2 启动后端服务（可选配置 Nginx 前端部署）
8. **生成配置摘要** — 显示部署完成后的访问地址和配置信息

### install.js -y — 快速安装

```bash
# 快速安装（跳过交互式确认，使用默认配置）
node install.js -y
```

适用于熟悉部署流程、接受默认配置（SQLite 数据库）的场景。快速安装会：

- 使用 SQLite 数据库（无需额外配置）
- 自动生成 JWT 密钥
- 安装所有依赖
- 构建前端
- 启动后端服务

### update.js — 一键更新

```bash
# 完整更新流程
node update.js
```

更新脚本会自动执行以下 7 个步骤：

1. **备份数据** — 自动备份 SQLite 数据库（MySQL 需手动备份）
2. **拉取代码** — `git pull` 拉取最新代码
3. **安装依赖** — 检测并安装前后端依赖更新
4. **数据库迁移** — 执行数据库结构迁移
5. **构建前端** — 检测并重新构建前端
6. **重启服务** — 重启 PM2 管理的后端服务，同步前端文件到 Nginx
7. **健康检查** — 验证服务是否正常运行

**常用选项**：

```bash
# 模拟运行（预览将要执行的操作，不实际执行）
node update.js --dry-run

# 跳过特定步骤
node update.js --skip-deps    # 跳过依赖安装
node update.js --skip-build   # 跳过前端构建
node update.js --skip-restart # 跳过服务重启
node update.js --skip-backup  # 跳过数据库备份
node update.js --skip-git     # 跳过 Git 拉取

# 强制运行（忽略锁文件）
node update.js --force

# 查看帮助
node update.js --help
```

### uninstall.js — 卸载脚本

```bash
# 交互式卸载
node uninstall.js

# 强制卸载（无需确认）
node uninstall.js --force

# 卸载前自动备份数据库
node uninstall.js --backup

# 预览模式（仅显示将要删除的内容，不实际执行）
node uninstall.js --dry-run
```

卸载脚本会执行以下清理操作（按步骤依次执行）：

1. **停止服务** — 停止并删除 PM2 管理的后端和前端服务，清理 PM2 日志
2. **清理 Nginx** — 删除 Nginx 站点配置文件（sites-available/conf.d），恢复默认站点，重载 Nginx
3. **清理配置** — 删除生成的 `.env`、`ecosystem.config.js`、`nginx-idc.conf` 等配置文件
4. **数据库清理** — 提示是否删除 SQLite 数据库文件（可先备份再删除）
5. **日志清理** — 删除后端日志目录和安装脚本日志
6. **上传文件清理** — 删除 `backend/uploads/` 上传文件目录
7. **依赖清理** — 删除 `node_modules`、前端构建产物 `dist`、Vite 缓存等

**常用选项**：

```bash
# 跳过特定清理步骤
node uninstall.js --skip-db      # 跳过数据库删除
node uninstall.js --skip-deps    # 跳过依赖删除
node uninstall.js --skip-uploads # 跳过上传文件目录删除

# 查看帮助
node uninstall.js --help
```

## PM2 进程管理

### 常用命令

```bash
# 查看进程列表
pm2 list

# 查看进程详细信息
pm2 show idc-backend

# 查看实时日志
pm2 logs idc-backend

# 查看最近 100 行日志
pm2 logs idc-backend --lines 100

# 监控进程资源（CPU / 内存）
pm2 monit

# 重启进程
pm2 restart idc-backend

# 停止进程
pm2 stop idc-backend

# 删除进程
pm2 delete idc-backend

# 保存当前进程列表（重启后自动恢复）
pm2 save

# 设置开机自启
pm2 startup
```

### PM2 日志管理

```bash
# 查看日志路径
pm2 show idc-backend | grep "out log path"
pm2 show idc-backend | grep "error log path"

# 清空日志
pm2 flush

# 日志文件默认位置
# ~/.pm2/logs/idc-backend-out.log
# ~/.pm2/logs/idc-backend-error.log
```

## 日志查看

后端运行时日志统一存储在 `backend/logs/` 目录：

```bash
# 查看应用日志
tail -f backend/logs/app.log

# 查看错误日志
tail -f backend/logs/error.log

# 查看最近 200 行日志
tail -200 backend/logs/app.log

# 搜索关键词
grep "ERROR" backend/logs/app.log
grep "error" backend/logs/error.log

# 统计错误数量
grep -c "ERROR" backend/logs/app.log
```

如果使用 PM2 管理进程，也可通过 PM2 查看日志（见上方说明）。

## 数据备份

### 手动备份

```bash
# 备份 SQLite 数据库
cp backend/idc_management.db backup/idc_management_$(date +%Y%m%d).db

# 备份 MySQL 数据库
mysqldump -u root -p idc_management > backup/idc_management_$(date +%Y%m%d).sql

# 备份上传文件
tar -czf backup/uploads_$(date +%Y%m%d).tar.gz backend/uploads/

# 备份日志文件
tar -czf backup/logs_$(date +%Y%m%d).tar.gz backend/logs/
```

### 自动备份

系统后端支持自动备份功能，需在 `backend/.env` 中配置：

```ini
# 开启自动备份
AUTO_BACKUP_ENABLED=true

# 备份计划（每天凌晨 2 点）
AUTO_BACKUP_CRON=0 2 * * *

# 备份文件保留天数
BACKUP_RETENTION=30

# 备份文件存放目录
BACKUP_DIR=./backups
```

备份文件默认存储在 `backend/backups/` 目录。

### 远程备份

系统支持将备份文件自动同步到远程存储，支持以下协议：

- **FTP / SFTP** — 标准文件传输
- **WebDAV** — 基于 HTTP 的文件存储
- **SMB** — 网络共享目录

远程备份配置位于 `backend/config/remote-backup-configs.json`，参考 [env-config.md](env-config.md) 中的远程备份章节。

## 完整部署示例

```bash
# 1. 克隆项目
git clone https://github.com/gituib/idc_assest.git
cd idc_assest

# 2. 交互式安装
node install.js

# 3. 安装完成后，访问系统
# http://localhost:8000

# 4. 后续更新
node update.js

# 5. 如需卸载
node uninstall.js --backup
```
