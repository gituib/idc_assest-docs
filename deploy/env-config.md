# 环境配置

## 环境要求

| 项目 | 最低要求 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Windows 10, macOS 12, Ubuntu 20.04 | 同最低 |
| Node.js | ≥14.0.0 | 20.x LTS |
| 内存 | 4GB | 8GB+ |
| 磁盘空间 | 2GB | 10GB+ |

## 前端环境变量

```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_TITLE=IDC设备管理系统
VITE_APP_VERSION=2.0.0
```

## 后端环境变量

```bash
# 服务配置
NODE_ENV=development
PORT=8000

# 数据库配置
DB_TYPE=sqlite                    # sqlite 或 mysql
DB_PATH=./idc_management.db       # SQLite数据库路径

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 备份配置
BACKUP_DIR=./backups
AUTO_BACKUP_ENABLED=false
AUTO_BACKUP_CRON=0 2 * * *
```
