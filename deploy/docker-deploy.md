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

## 快速部署

```bash
# 克隆项目
git clone https://github.com/gituib/idc_assest.git
cd idc_assest

# 启动生产环境
docker compose -f docker-compose.prod.yml up -d
```

> **注意**：生产环境使用的 Docker Compose 文件为 `docker-compose.prod.yml`，位于项目根目录。

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

#### 创建 docker-compose.yml

从项目根目录复制 `docker-compose.prod.yml` 到部署目录，或手动创建：

```bash
# 方式一：直接复制项目中的文件
cp /path/to/idc_assest/docker-compose.prod.yml /opt/idc_assest/docker-compose.yml

# 方式二：手动创建（内容参考项目中的 docker-compose.prod.yml）
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
JWT_SECRET=$(openssl rand -base64 64)

cat > /opt/idc_assest/backend/.env << EOF
PORT=8000
NODE_ENV=production

DB_TYPE=mysql
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USERNAME=idc_user
MYSQL_PASSWORD=${MYSQL_PASSWORD:-your_user_password}
MYSQL_DATABASE=idc_management

JWT_SECRET=${JWT_SECRET}
TOKEN_EXPIRY=24h

# ... 其他配置（参考 .env.example）
EOF
```

> 完整的 backend/.env 配置项说明请见 [环境配置](env-config.md)。

### 3. 启动服务

```bash
cd /opt/idc_assest

# 拉取最新镜像
docker compose -f docker-compose.yml pull

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

### 1. 限制容器资源使用

在 `docker-compose.yml` 中为每个容器添加资源限制：

```yaml
services:
  backend:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  mysql:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

### 2. MySQL 性能优化

```yaml
services:
  mysql:
    # ... 其他配置
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --innodb_buffer_pool_size=512M
      --max_connections=200
      --slow_query_log=1
      --long_query_time=2
```

### 3. 使用 Docker 日志轮转

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

### 4. 镜像拉取策略

- 生产环境建议使用固定版本标签（如 `v2.0.0`）而非 `latest`，避免意外更新
- 可通过 `BACKEND_IMAGE` 和 `FRONTEND_IMAGE` 环境变量切换镜像来源

### 5. 其他优化

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

详细部署说明请参考项目中的 `docs/docker-deployment-guide.md` 文档。
