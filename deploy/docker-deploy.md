# Docker 部署

> 适用场景：新服务器上首次部署
>
> 架构：3 个容器（Nginx + 前端静态文件 | Backend | MySQL）

## 前置要求

| 条件 | 说明 |
| ---- | ---- |
| **服务器** | Linux 系统（推荐 Ubuntu 20.04+ / Debian 11+ / CentOS 7+） |
| **Docker** | 20.10 及以上版本 |
| **Docker Compose** | v2 及以上 |
| **网络** | 服务器能访问镜像仓库（ghcr.io） |

## 架构

```
用户浏览器 → Nginx 容器 :80
                ├── / 路径 → 返回前端静态页面
                └── /api 路径 → 反向代理 → Backend 容器 :8000 → MySQL 容器 :3306
```

### 容器说明

| 容器名 | 镜像来源 | 暴露端口 | 说明 |
| ------ | -------- | -------- | ---- |
| **idc-frontend** | `ghcr.io/gituib/idc-frontend:latest` | `:80` | Nginx + 前端静态文件 |
| **idc-backend** | `ghcr.io/gituib/idc-backend:latest` | `:8000` | Node.js API 服务 |
| **idc-mysql** | `mysql:8.0` | `:3306` | 数据库（可选，可改用远程 MySQL） |

> 如需使用远程 MySQL，请在 `docker-compose.yml` 中注释掉 `mysql` 服务部分。



## 完整部署流程

### 1. 安装 Docker

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | bash -s docker
sudo systemctl enable docker
sudo systemctl start docker

# 验证
docker --version
docker compose version
```

### 2. 创建部署目录与配置文件

本部署方式不需要 git clone 整个项目仓库，只需在服务器上手动创建需要的配置文件和持久化目录即可。

```bash
# 创建部署根目录和所有持久化目录
mkdir -p /opt/idc_assest/backend/{uploads,logs,backups,temp}
cd /opt/idc_assest
```

#### 手动创建 docker-compose.yml


```bash
cat > /opt/idc_assest/docker-compose.yml << 'YAMLEOF'
# ============================================
# IDC 设备管理系统 - 生产环境配置
# 从镜像仓库拉取预构建镜像，无 build 指令
# 默认从 ghcr.io 拉取，可通过 BACKEND/FRONTEND_IMAGE 环境变量切换
# ============================================

services:
  # ---------- 后端服务 ----------
  backend:
    image: ${BACKEND_IMAGE:-ghcr.io/gituib/idc-backend:latest}
    container_name: idc-backend
    volumes:
      - ./backend/.env:/app/.env
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs
      - ./backend/backups:/app/backups
      - ./backend/temp:/app/temp
    env_file:
      - ./backend/.env
    environment:
      - NODE_ENV=production
    networks:
      - idc-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # ---------- 前端（Nginx）服务 ----------
  frontend:
    image: ${FRONTEND_IMAGE:-ghcr.io/gituib/idc-frontend:latest}
    pull_policy: always
    container_name: idc-frontend
    ports:
      - "80:80"
    networks:
      - idc-network
    depends_on:
      - backend
    restart: unless-stopped

  # ---------- MySQL 数据库 ----------
  mysql:
    image: mysql:8.0
    container_name: idc-mysql
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-idc_management}
      MYSQL_USER: ${MYSQL_USER:-idc_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    networks:
      - idc-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  idc-network:
    driver: bridge

volumes:
  mysql_data:
YAMLEOF
```

#### 配置环境变量

```bash
# 创建项目根目录 .env（供 Docker Compose 读取 MySQL 配置）
cat > /opt/idc_assest/.env << 'EOF'
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_USER=idc_user
MYSQL_PASSWORD=your_user_password
MYSQL_DATABASE=idc_management
EOF
```

```bash
# 创建 backend/.env（后端应用配置）
cd /opt/idc_assest/

# 先生成 JWT 密钥（确保已执行 4.1 节的命令）
# JWT_SECRET=$(openssl rand -base64 64)

# 创建 backend/.env（注意：使用 << EOF 而非 << 'EOF'，使变量可以被展开）
cat > backend/.env << EOF
# ==============================================
# 服务器配置
# ==============================================
PORT=8000
NODE_ENV=production

# ==============================================
# 数据库配置
# ==============================================
# 方式一：使用 Docker 本地 MySQL 容器（推荐新部署）
DB_TYPE=mysql
MYSQL_HOST=mysql                      # Docker 服务名，不是 localhost
MYSQL_PORT=3306
MYSQL_USERNAME=idc_user
MYSQL_PASSWORD=这里改成MySQL用户密码
MYSQL_DATABASE=idc_management

# 方式二：使用远程 MySQL（已有数据库的情况）
# DB_TYPE=mysql
# MYSQL_HOST=远程MySQL地址
# MYSQL_PORT=3306
# MYSQL_USERNAME=数据库用户名
# MYSQL_PASSWORD=数据库密码
# MYSQL_DATABASE=数据库名

# ==============================================
# JWT 密钥（重要！通过变量自动注入，无需手动填写）
# ==============================================
JWT_SECRET=${JWT_SECRET}

# ==============================================
# 其他配置（保持默认即可）
# ==============================================
TOKEN_EXPIRY=24h
SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=3
LOCK_TIME_MINUTES=15
PASSWORD_MIN_LENGTH=8
USERNAME_MIN_LENGTH=4
USERNAME_MAX_LENGTH=30
API_TIMEOUT=20000
DB_QUERY_TIMEOUT=15000
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=500
MAX_FILE_SIZE_MB=30
MAX_AVATAR_SIZE_MB=2
MAX_RETRIES=5
RETRY_DELAY=2000
LOG_LEVEL=info
LOG_DIR=./logs
LOG_MAX_FILE_SIZE=20m
LOG_MAX_FILES=30d
EOF
```


可以用以下命令快速对比两个文件中的用户和密码是否一致：

```bash
cd /opt/idc_assest
echo "=== 根目录 .env ===" && grep -E "MYSQL_USER|MYSQL_PASSWORD" .env
echo ""
echo "=== backend/.env ===" && grep -E "MYSQL_USERNAME|MYSQL_PASSWORD" backend/.env
```

预期输出（用户名为 `idc_user`，密码两处相同即表示一致）：

```
=== 根目录 .env ===
MYSQL_USER=idc_user
MYSQL_PASSWORD=MyPassw0rd!

=== backend/.env ===
MYSQL_USERNAME=idc_user
MYSQL_PASSWORD=MyPassw0rd!
```

> 完整的 backend/.env 配置项说明请见 [环境配置](env-config.md)。

### 3. 启动服务

```bash
cd /opt/idc_assest

# 启动所有容器（后台模式）
docker compose -f docker-compose.yml up -d
```

### 4. 查看启动状态

```bash
# 查看所有容器状态
docker compose -f docker-compose.yml ps

# 实时查看日志
docker compose -f docker-compose.yml logs -f

# 单独查看某个容器的日志
docker logs idc-backend
docker logs idc-frontend
docker logs idc-mysql
```

首次启动后，后端会自动初始化数据库（约 10-30 秒）。当日志出现以下内容时，说明启动完成：

```
所有初始化完成，服务器准备就绪
服务器运行在 http://localhost:8000
```

### 5. 验证部署

```bash
# 检查容器状态（都应为 Up）
docker compose -f docker-compose.yml ps

# 测试健康检查
curl http://localhost/health

# 测试 API
curl http://localhost/api

# 浏览器访问
# http://服务器IP
```

## 容器数据持久化

| 宿主机路径 | 容器内路径 | 说明 |
| ---------- | ---------- | ---- |
| `./backend/uploads` | `/app/uploads` | 上传文件持久化 |
| `./backend/logs` | `/app/logs` | 运行日志 |
| `./backend/backups` | `/app/backups` | 数据库备份文件 |
| `./backend/temp` | `/app/temp` | 临时文件 |
| `mysql_data`（Docker 数据卷） | `/var/lib/mysql` | MySQL 数据文件 |

> - MySQL 数据使用 Docker 命名数据卷（`mysql_data`），即使容器删除数据也不会丢失
> - 上传文件、日志、备份等使用 bind mount 映射到宿主机目录，方便直接访问和管理

## 常用 Docker 运维命令

### 服务管理

```bash
# 启动服务
docker compose -f docker-compose.yml up -d

# 停止服务
docker compose -f docker-compose.yml down

# 停止并删除数据卷（数据会丢失！慎用）
docker compose -f docker-compose.yml down -v

# 重启特定服务
docker compose -f docker-compose.yml restart backend

# 重启所有服务
docker compose -f docker-compose.yml restart
```

### 日志查看

```bash
# 实时查看所有容器日志
docker compose -f docker-compose.yml logs -f

# 查看最近 100 行日志
docker compose -f docker-compose.yml logs --tail=100

# 查看特定容器日志
docker logs idc-backend
docker logs -f idc-backend        # 实时跟踪
docker logs --tail=200 idc-backend # 最近 200 行
```

### 容器管理

```bash
# 进入容器内部
docker exec -it idc-backend /bin/sh
docker exec -it idc-mysql mysql -u root -p

# 查看容器资源占用
docker stats idc-backend idc-frontend idc-mysql

# 查看容器详细信息
docker inspect idc-backend
```

### 镜像管理

```bash
# 拉取最新镜像
docker compose -f docker-compose.yml pull

# 清理旧镜像（释放磁盘空间）
docker image prune -a

# 查看镜像列表
docker images
```

### 数据备份

```bash
# 备份 MySQL 数据库
docker exec idc-mysql mysqldump -u root -p idc_management > backup_$(date +%Y%m%d).sql

# 备份上传文件目录
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

## 版本升级

```bash
# 1. 拉取最新镜像
docker compose -f docker-compose.yml pull

# 2. 重新创建容器
docker compose -f docker-compose.yml up -d

# 3. 清理旧镜像（可选）
docker image prune -a
```

## 性能优化建议



### 1. 使用 Docker 日志轮转

在 `docker-compose.yml` 中配置日志轮转，避免日志文件无限增长：

```yaml
services:
  backend:
    # ... 其他配置
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: 3
```

### 2. 镜像拉取策略

- 生产环境建议使用固定版本标签（如 `v2.0.0`）而非 `latest`，避免意外更新
- 可通过 `BACKEND_IMAGE` 和 `FRONTEND_IMAGE` 环境变量切换镜像来源

### 3. 其他优化

- 定期清理未使用的 Docker 资源：`docker system prune -f`
- 使用 Docker 的 overlay2 存储驱动以获得更好性能
- 为 Docker 数据目录（默认 `/var/lib/docker`）使用 SSD 磁盘
- 监控容器资源使用：`docker stats`

## 常见问题

### 容器启动后立即退出

**原因**：配置错误或数据库连接失败。

**排查**：
```bash
docker logs idc-backend
# 常见错误：
# - JWT_SECRET 未配置 → 在 backend/.env 中设置
# - MySQL 连接被拒 → 检查 MYSQL_HOST / MYSQL_PASSWORD
# - 端口被占用 → 检查 80 端口是否已被占用
```

### 端口被占用

修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8080:80"   # 改为 8080 端口
```

### 确认账号密码一致性

MySQL 容器的账号密码必须在两个 `.env` 文件中保持一致：

| 配置项 | 文件 | 说明 |
| ------ | ---- | ---- |
| `MYSQL_USER=idc_user` | `/opt/idc_assest/.env` | 指定 MySQL 容器创建的用户名 |
| `MYSQL_USERNAME=idc_user` | `/opt/idc_assest/backend/.env` | 后端连接数据库用的用户名 |
| `MYSQL_PASSWORD=xxx` | 两个文件各有一处 | 密码必须相同 |

