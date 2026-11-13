# Docker 部署

> 适用场景：新服务器上首次部署
>
> 架构：3 个容器 —— Nginx 内含前端静态文件并反向代理到 Backend，MySQL 为内置数据库容器
>
> 对应文件：`docker-compose.prod.yml`（生产，拉取预构建镜像）、`docker-compose.dev.yml`（开发，本地构建）、`backend/Dockerfile`、`frontend/Dockerfile`、`frontend/nginx.conf`

## 前置要求

| 条件                 | 说明                                                  |
| ------------------ | --------------------------------------------------- |
| **服务器**            | Linux 系统（推荐 Ubuntu 20.04+ / Debian 11+ / CentOS 7+） |
| **Docker**         | 20.10 及以上版本                                         |
| **Docker Compose** | v2 及以上（使用 `docker compose` 子命令，不是 `docker-compose`） |
| **网络**             | 能访问 `ghcr.io`（镜像仓库）与 Docker Hub（拉取 `mysql:8.0`）      |
| **内存**             | 建议 ≥ 2GB（MySQL 8.0 默认占用约 400MB，低于 1GB 易 OOM）        |

## 架构

```
浏览器 ──HTTPS──► 前置 TLS 网关（宿主 Nginx / Caddy）
                        │  反代 127.0.0.1:80
                        ▼
                  idc-frontend 容器（Nginx:80）
                        ├── /                 → 前端静态文件（SPA fallback）
                        ├── /api/             → proxy_pass http://backend:8000
                        ├── /uploads/         → proxy_pass http://backend:8000
                        └── /health           → proxy_pass http://backend:8000
                                                  │
                                                  ▼
                                        idc-backend 容器（Node.js:8000）
                                                  │  idc-network 内网
                                                  ▼
                                        idc-mysql 容器（MySQL:3306）
                                                  │
                                                  ▼
                                        命名卷 mysql_data（持久化）
```

### 容器说明

| 容器名              | 镜像来源                                                    | 端口                | 说明                                  |
| ---------------- | ------------------------------------------------------- | ----------------- | ----------------------------------- |
| **idc-frontend** | `${FRONTEND_IMAGE:-ghcr.io/gituib/idc-frontend:latest}` | `127.0.0.1:80:80` | Nginx 提供前端静态文件并反代 `/api`            |
| **idc-backend**  | `${BACKEND_IMAGE:-ghcr.io/gituib/idc-backend:latest}`   | 不映射到宿主机           | Node.js API，仅在 `idc-network` 内被前端访问 |
| **idc-mysql**    | `mysql:8.0`                                             | 不映射到宿主机           | **默认启用**，数据存命名卷 `mysql_data`         |

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

### 2. 创建部署目录

```bash
# 后端会向这些目录写入文件，必须提前建好，否则容器内 node 用户（uid 1000）无权限写入
mkdir -p /opt/idc_assest/backend/{uploads,logs,backups,temp,config}
cd /opt/idc_assest
```

::: tip 目录权限  
后端镜像以非 root 的 `node` 用户（uid 1000）运行。bind mount 会覆盖镜像内 `chown node:node /app` 的结果，因此宿主机目录需要可被 uid 1000 写入：

```bash
sudo chown -R 1000:1000 /opt/idc_assest/backend/{uploads,logs,backups,temp,config}
```

若跳过这一步，常见现象是服务能启动但上传文件失败、日志写不进去、远程备份配置保存报错。

:::

### 3. 创建 docker-compose.yml

服务器上不需要克隆仓库，直接在部署目录写入以下内容：

```bash
cd /opt/idc_assest
cat > docker-compose.yml << 'EOF'
# ============================================
# IDC 设备管理系统 - 生产环境配置
# 从镜像仓库拉取预构建镜像，无 build 指令
# 默认从 ghcr.io 拉取，可通过 BACKEND/FRONTEND_IMAGE 环境变量切换
#
# P1-9 加固：前端仅绑定 127.0.0.1，由前置 TLS 网关对外提供 HTTPS；
#            MySQL 不对公网暴露；容器降权（cap_drop / no-new-privileges）。
#
# 数据库说明：
#   默认启用内置 mysql 服务（数据存命名卷 mysql_data，持久化）。
#   改用外部 / 远程 MySQL 时只启动前后端两个服务即可，mysql 不会被创建：
#       docker compose up -d backend frontend
#   并把 backend/.env 的 MYSQL_HOST 指向外部地址（同时删掉下方 environment 里的 MYSQL_HOST）。
#
# 说明：不使用顶层 version 字段 —— Compose V2 已废弃该字段，保留会输出告警。
# ============================================

services:
  # ---------- 后端服务 ----------
  backend:
    # 从 ghcr.io 拉取公开镜像，可通过 BACKEND_IMAGE 环境变量覆盖
    image: ${BACKEND_IMAGE:-ghcr.io/gituib/idc-backend:latest}
    container_name: idc-backend
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    volumes:
      # 配置映射（核心）
      - ./backend/.env:/app/.env
      # 数据持久化
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs
      - ./backend/backups:/app/backups
      - ./backend/temp:/app/temp
      # 含敏感凭据的运行时配置（远端备份账号/私钥等），P1-9 规定不进镜像，挂载持久化
      - ./backend/config:/app/config
    env_file:
      - ./backend/.env
    environment:
      - NODE_ENV=production
      # 默认连内置 mysql 服务；backend/.env 里的 MYSQL_HOST 会被这里覆盖，
      # 因此不必再为容器场景手工改 .env。改用外部 MySQL 时删掉这两行，
      # 并让 backend/.env 的 MYSQL_HOST 指向外部地址。
      - MYSQL_HOST=mysql
      # 兜底库名：backend/.env 未写 MYSQL_DATABASE 时用根 .env 的值，
      # 避免容器建的库与后端连的库不一致。
      - MYSQL_DATABASE=${MYSQL_DATABASE:-idc_management}
    networks:
      - idc-network
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # ---------- 前端（Nginx）服务 ----------
  frontend:
    # 从 ghcr.io 拉取公开镜像，可通过 FRONTEND_IMAGE 环境变量覆盖
    image: ${FRONTEND_IMAGE:-ghcr.io/gituib/idc-frontend:latest}
    pull_policy: always
    container_name: idc-frontend
    ports:
      # P1-9：仅绑定本机回环，不直接对公网暴露 80，由前置 TLS 网关转发
      - "127.0.0.1:80:80"
    cap_drop:
      - ALL
    cap_add:
      # nginx master 绑定 80 特权端口所需，其余能力全部丢弃
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
    networks:
      - idc-network
    depends_on:
      - backend
    restart: unless-stopped

  # ---------- MySQL 数据库（默认启用）----------
  mysql:
    image: mysql:8.0
    container_name: idc-mysql
    # 显式指定字符集：后端 ddl 用 utf8mb4_0900_ai_ci，库默认排序规则不一致会在建表时报错
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_0900_ai_ci
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      # P1-9：密码一律从 .env 注入，禁止明文默认弱口令。
      # 缺值时 compose 直接报错退出，比创建出空密码库安全。
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:?请在根目录 .env 设置 MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-idc_management}
      MYSQL_USER: ${MYSQL_USER:-idc_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:?请在根目录 .env 设置 MYSQL_PASSWORD}
    # MySQL 不对公网暴露：不配置 ports，仅在 compose 内网供 backend 访问
    networks:
      - idc-network
    restart: unless-stopped
    healthcheck:
      # 用普通账号做 TCP 探测，除就绪外还能验证账号已创建、能连目标库
      test:
        - CMD-SHELL
        - mysqladmin ping -h 127.0.0.1 -u"$$MYSQL_USER" -p"$$MYSQL_PASSWORD" --silent
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 30s

networks:
  idc-network:
    driver: bridge

volumes:
  mysql_data:
EOF
```

::: warning 内容必须逐字一致
文件中的 `${...}` 是 Compose 变量插值，`$$MYSQL_USER` 中的 `$$` 是转义（表示传给容器内的字面 `$`）。**不要**把 `$$` 改成单个 `$`，否则健康检查会读到宿主机变量而非容器内变量。

上面用 `'EOF'`（带引号）是为了让 shell 不做任何展开；若用不带引号的 `EOF`，`${BACKEND_IMAGE:-...}` 会被当前 shell 提前求值成空值。
:::

::: tip 与仓库文件的关系
上述内容与仓库根目录的 `docker-compose.prod.yml` 完全一致。镜像版本、数据库、端口、服务依赖都由文件本身与根目录 `.env` 控制，创建后无需手工编辑。

仓库里同时存在 prod / dev 两份配置，用后缀区分；服务器上部署时统一命名为 `docker-compose.yml`，`docker compose` 不带 `-f` 即可自动识别（查找顺序：`compose.yaml` → `compose.yml` → `docker-compose.yaml` → `docker-compose.yml`）。
:::

### 4. 配置环境变量

Docker 部署涉及两个 `.env`，用途不同、变量名不同，**必须区分**：

| 文件                             | 谁读取               | 作用                                   |
| ------------------------------ | ----------------- | ------------------------------------ |
| `/opt/idc_assest/.env`         | Docker Compose    | 镜像地址、MySQL 容器的建库/建号参数                |
| `/opt/idc_assest/backend/.env` | 后端应用（`dotenv`）    | 服务端口、数据库连接、JWT 密钥等全部运行时配置            |

#### 4.1 根目录 `.env`（Compose 使用）

```bash
cd /opt/idc_assest
cat > .env << 'EOF'
BACKEND_IMAGE=ghcr.io/gituib/idc-backend:latest
FRONTEND_IMAGE=ghcr.io/gituib/idc-frontend:latest

# MySQL 容器初始化参数（MYSQL_ROOT_PASSWORD / MYSQL_PASSWORD 缺失时 compose 会直接报错）
MYSQL_ROOT_PASSWORD=换成强口令
MYSQL_DATABASE=idc_management
MYSQL_USER=idc_user
MYSQL_PASSWORD=换成强口令
EOF
```

> `MYSQL_USER` 是 **MySQL 容器要创建的用户名**，`MYSQL_USERNAME` 是**后端用来连接的用户名**。两者键名不同、值要对应，是这套配置最容易出错的地方。

#### 4.2 生成 JWT_SECRET（生产必填）

```bash
openssl rand -hex 32
```

后端启动时会执行 `ensureJwtSecret()`：`NODE_ENV=production` 且 `JWT_SECRET` 缺失或短于 32 字符时，**直接抛错并退出进程**（容器会不断重启）。所以这一步不能省。

#### 4.3 backend/.env（后端使用）

```bash
cd /opt/idc_assest
cat > backend/.env << 'EOF'
# ==============================================
# 服务器配置
# ==============================================
PORT=8000
NODE_ENV=production

# ==============================================
# 数据库配置
# ==============================================
DB_TYPE=mysql
# 使用内置 mysql 容器时此项写什么都不影响（compose 已强制覆盖为 mysql），
# 改成外部 MySQL 时把下面几行换成实际地址与账号即可
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USERNAME=idc_user
MYSQL_PASSWORD=与根目录 .env 的 MYSQL_PASSWORD 完全一致
MYSQL_DATABASE=idc_management

# ==============================================
# 安全配置
# ==============================================
JWT_SECRET=粘贴第 4.2 步生成的 64 位十六进制字符串
TOKEN_EXPIRY=24h
SALT_ROUNDS=10
PASSWORD_MIN_LENGTH=6
USERNAME_MIN_LENGTH=3
USERNAME_MAX_LENGTH=20

# 首管理员引导：留空则「首个注册用户」即管理员，建议显式指定防止被抢注
BOOTSTRAP_ADMIN_USERNAME=admin

# 经 TLS 网关对外时建议显式收紧跨域白名单
# CORS_ORIGINS=https://idc.example.com

# ==============================================
# 其他配置（保持默认即可）
# ==============================================
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=500
# 必须 ≤ Nginx 的 client_max_body_size（镜像内置 50m），否则大文件在 Nginx 层就 413
MAX_FILE_SIZE_MB=30
MAX_AVATAR_SIZE_MB=5
MAX_IMAGE_SIZE_MB=10
MAX_RETRIES=3
RETRY_DELAY=1000
LOG_LEVEL=info
LOG_MAX_FILE_SIZE=20m
LOG_MAX_FILES=30d
EOF
```

::: warning 已从模板中移除的四项
`MAX_LOGIN_ATTEMPTS`、`LOCK_TIME_MINUTES`、`API_TIMEOUT`、`DB_QUERY_TIMEOUT` 会被代码读成常量，但**没有任何业务逻辑引用**，写进 `.env` 不会改变任何行为：

- 登录失败阈值真实来源是 `SystemSetting` 表的 `max_login_attempts`（默认 `5`），到**系统设置 → 安全策略**里改；
- 锁定时长在 `backend/routes/auth.js` 中硬编码为 30 分钟；
- 请求/查询超时分别由 Nginx `proxy_read_timeout`、前端 `VITE_API_TIMEOUT`、`db.js` 连接池参数控制。

完整对照表见 [环境配置 · 配置项生效状态速查](env-config.md#配置项生效状态速查)。
:::

::: danger `.env` 值的三条硬性规则  
这三条不满足会在**不报错**的情况下产生错误配置：

1. **`MYSQL_HOST` 在内置容器场景下由 compose 强制设为 `mysql`**，`backend/.env` 里写 `localhost` 也不会出错。但**改用外部 MySQL 时**，必须确认该值为外部地址，且不能是容器内的 `localhost`（那指向容器自身）。
2. **值里不能出现 `#`**，除非整个值用双引号包裹。`dotenv` 会把 `#` 之后当注释截断且不报警：`MYSQL_PASSWORD=abc#123` 实际只读到 `abc`。
3. **含 `$` 的值必须用单引号包裹或转义为 `$$`**。Compose 会对 `backend/.env` 中的值做变量插值。

:::

::: warning 关于 `MYSQL_ORLOFGYI` 键  
旧版模板与历史文档里出现过 `MYSQL_DATABASE=idc_management`。**该键在代码中不存在**，`backend/db.js` 只读取 `MYSQL_DATABASE`。填写该键不会报错，但库名会静默回落到默认值 `idc_management`，是典型的「配置了却没生效」。当前仓库的 `.env.example` 已更正。

:::

#### 4.4 核对两个文件的账号密码

```bash
cd /opt/idc_assest
echo "=== 根目录 .env ===" && grep -E "MYSQL_USER|MYSQL_PASSWORD|MYSQL_DATABASE" .env
echo "=== backend/.env ===" && grep -E "MYSQL_USERNAME|MYSQL_PASSWORD|MYSQL_DATABASE" backend/.env
```

预期两处的密码与库名一致，用户名一处叫 `MYSQL_USER`、一处叫 `MYSQL_USERNAME`，值相同：

```
=== 根目录 .env ===
MYSQL_DATABASE=idc_management
MYSQL_USER=idc_user
MYSQL_PASSWORD=你的强口令

=== backend/.env ===
MYSQL_USERNAME=idc_user
MYSQL_PASSWORD=你的强口令
MYSQL_DATABASE=idc_management
```

> 完整的 `backend/.env` 配置项说明请见 [环境配置](env-config.md)。

### 5. 启动服务

```bash
cd /opt/idc_assest
docker compose up -d
```

启动顺序由 `depends_on: mysql: condition: service_healthy` 保证：**MySQL 健康检查通过后才会启动 backend**，因此不需要像旧版那样担心「backend 先起来、连不上库然后退出」。

`mysql` 首次启动需要初始化数据目录，通常 20~40 秒。

### 6. 查看启动状态

```bash
# 容器状态（mysql → backend → frontend 依次就绪）
docker compose ps

# 实时日志
docker compose logs -f
docker logs idc-mysql
docker logs idc-backend
```

首次启动时后端会自动建表、写入权限种子与默认系统设置。日志出现以下内容表示就绪：

```
数据库连接成功
数据库表结构同步完成
所有初始化完成，服务器准备就绪
服务器运行在 http://localhost:8000
```

> 若 `JWT_SECRET` 缺失或过短，这一步会看到 `[致命错误] 生产环境未设置 JWT_SECRET 环境变量`，容器反复重启。

### 7. 验证部署

```bash
# 1) 容器状态：mysql 为 Up (healthy)，backend 为 Up (healthy)，frontend 为 Up
docker compose ps

# 2) 数据库连通性：mysql 健康检查用普通账号连目标库，通过即说明账号已建好
docker exec idc-mysql mysqladmin ping -h 127.0.0.1 -u"idc_user" -p"你的强口令"

# 3) 确认库与表已由后端创建
docker exec idc-mysql mysql -u"idc_user" -p"你的强口令" idc_management -e "SHOW TABLES;" | head

# 4) 应用健康检查：生产环境只返回 {"status":"ok"}
curl http://127.0.0.1/health
# → {"status":"ok"}          （ok / warning / error，仅 error 时返回 503）

# 5) 端口归属确认：只应看到 127.0.0.1:80
ss -lntp | grep ':80'

# 6) 容器内部连通性（前端 → 后端）
docker exec idc-frontend wget -qO- http://backend:8000/health
```

`/api` 与 `/api-docs` 都需要认证或非生产环境，**不要**用匿名 `curl http://127.0.0.1/api` 判断成败。

生产环境（`NODE_ENV=production`）**不挂载 Swagger**，`/api-docs` 会 404，这是预期行为。详细的健康信息在 `GET /api/health/detail`，需管理员令牌。

### 8. 前置 TLS 网关（必读）

前端容器只绑定 `127.0.0.1:80`，需要在本机加一层网关才能对外提供 HTTPS。以宿主 Nginx 为例：

```nginx
server {
    listen 443 ssl http2;
    server_name idc.example.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # 必须 ≥ 后端 MAX_FILE_SIZE_MB，否则大文件上传在此层被拒
    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        # 【关键】必须用「覆盖」写法而非 $proxy_add_x_forwarded_for。
        # 后端设置了 app.set('trust proxy', 1) 并通过 XFF 首段识别真实 IP，
        # 追加写法会让客户端伪造 XFF 绕过登录限流与 IP 封禁。
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

```bash
sudo nginx -t && sudo nginx -s reload
```

> 若要临时只用 HTTP 做验证，把 `docker-compose.yml` 中的端口改为 `"0.0.0.0:80:80"` 即可，但这会绕过本层加固，验证完应改回。

## 改用外部 / 远程 MySQL

内置 `mysql` 服务是**默认**行为，但并非强制。已有 DBA 维护的 MySQL 时：

1. **不要**启动 mysql 服务 —— 只指定前后端两个服务名即可，未指定的服务不会被创建：

   ```bash
   docker compose up -d backend frontend
   ```

2. 删掉 `docker-compose.yml` 中 `backend.environment` 的 `MYSQL_HOST=mysql` 与 `MYSQL_DATABASE=...` 两行（否则会覆盖 `backend/.env`）：

   ```bash
   cd /opt/idc_assest
   cp docker-compose.yml docker-compose.yml.bak
   ```

   编辑 `backend.environment`，保留 `NODE_ENV=production`，删除 `MYSQL_HOST` 与 `MYSQL_DATABASE`。

3. 在 `backend/.env` 填外部地址：

   ```bash
   DB_TYPE=mysql
   MYSQL_HOST=192.168.1.10
   MYSQL_PORT=3306
   MYSQL_USERNAME=idc_user
   MYSQL_PASSWORD=数据库密码
   MYSQL_DATABASE=idc_management
   ```

4. 在外库上预先建库并授权（排序规则必须与后端一致，否则建表报错）：

   ```sql
   CREATE DATABASE idc_management CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   CREATE USER 'idc_user'@'%' IDENTIFIED BY '数据库密码';
   GRANT ALL PRIVILEGES ON idc_management.* TO 'idc_user'@'%';
   FLUSH PRIVILEGES;
   ```

5. `docker compose up -d backend frontend`

> 此时根目录 `.env` 中的 `MYSQL_*` 不再被任何服务使用，但保留不影响启动。

## 数据持久化

| 宿主机路径               | 容器内路径            | 说明                                    |
| ------------------- | ---------------- | ------------------------------------- |
| `./backend/.env`    | `/app/.env`      | 运行时配置                                 |
| `./backend/config`  | `/app/config`    | 远程备份凭据等敏感配置（被 `.dockerignore` 排除，必须挂载） |
| `./backend/uploads` | `/app/uploads`   | 上传文件、头像、背景图                           |
| `./backend/logs`    | `/app/logs`      | 应用日志（按天轮转）                            |
| `./backend/backups` | `/app/backups`   | 数据库备份文件                               |
| `./backend/temp`    | `/app/temp`      | 导入导出的临时文件                             |
| `mysql_data`（命名卷）   | `/var/lib/mysql` | MySQL 数据文件                            |

::: danger SQLite 模式下的数据丢失风险  
`docker-compose.prod.yml` 未为 SQLite 数据库文件做任何挂载，且现在默认连接 MySQL。若有人把 `backend/.env` 改回 `DB_TYPE=sqlite`，`./idc_management.db` 会写在容器可写层内，`docker compose down` 或重建容器后**数据全部丢失**。

生产环境请保持 `DB_TYPE=mysql`。确需 SQLite 时至少追加挂载：

```yaml
    volumes:
      - ./backend/data:/app/data
    environment:
      - DB_PATH=/app/data/idc_management.db
```

:::

## 常用运维命令

```bash
cd /opt/idc_assest

# 启动 / 停止
docker compose up -d
docker compose down                # 停止并删除容器，保留 mysql_data 卷
docker compose down -v             # 连 mysql_data 一起删除，数据库数据丢失！

# 重启单个服务（改了 backend/.env 后必须重建 backend，env_file 在容器创建时读取）
docker compose up -d --force-recreate backend

# 日志
docker compose logs -f
docker compose logs --tail=200 backend
docker logs -f idc-backend

# 进入容器（后端镜像是 alpine，shell 为 sh，没有 bash）
docker exec -it idc-backend sh
docker exec -it idc-mysql mysql -uroot -p

# 资源占用
docker stats idc-backend idc-frontend idc-mysql

# 镜像操作
docker compose pull
docker image prune -a
```

### 数据备份

```bash
cd /opt/idc_assest

# MySQL：容器内导出，避免依赖宿主机 mysql 客户端
docker exec idc-mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" idc_management' \
  > backup_$(date +%Y%m%d).sql

# 确认备份文件非空（空文件通常意味着密码错或库名错）
ls -lh backup_*.sql

# 上传文件与敏感配置
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/ backend/config/
```

> 系统内「备份管理」生成的备份落在 `backend/backups`，已随 bind mount 持久化，无需单独拷出容器。恢复时注意：备份文件由后端生成，文件名与格式以界面显示为准。

## 版本升级

```bash
cd /opt/idc_assest

# 1. 先备份（务必）
docker exec idc-mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" idc_management' > pre_upgrade.sql

# 2. 拉取新镜像并重建容器
docker compose pull
docker compose up -d

# 3. 确认启动正常
docker compose ps
docker logs --tail=50 idc-backend
```

生产环境建议在根目录 `.env` 中把镜像标签固定为具体版本（如 `ghcr.io/gituib/idc-backend:v2.8.4`），不要长期使用 `latest`。

## 开发环境（本地构建镜像）

`docker-compose.dev.yml` 使用 `build` 指令从源码构建，容器名带 `-dev` 后缀，数据库同样是内置 mysql 容器：

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

| 差异项                 | prod                           | dev                                    |
| ------------------- | ------------------------------ | -------------------------------------- |
| 镜像来源                | `ghcr.io` 拉取                   | 本地 `build`（`./backend`、`./frontend`）   |
| 容器名                 | `idc-backend` / `idc-frontend` | `idc-backend-dev` / `idc-frontend-dev` |
| `NODE_ENV`          | `production`                   | `development`                          |
| `FRONTEND_IMAGE` 覆盖 | 支持                             | 不支持                                    |
| MySQL 容器名           | `idc-mysql`                    | `idc-mysql-dev`                        |

::: warning dev 与 prod 同时运行会冲突  
两份 compose 的前端都占用 `127.0.0.1:80`，且默认使用同名卷 `mysql_data`。同一台机器上不要同时 `up` 两份配置；若需要，请改端口并给 dev 的卷改名。

:::

::: warning dev 容器的密钥行为  
`NODE_ENV=development` 时若 `JWT_SECRET` 缺失，后端会**自动生成并回写** `backend/.env`。由于该文件是 bind mount，生成结果会直接落到宿主机文件，这是正常且期望的行为。

:::

## 性能与安全优化建议

### 1. Docker 日志轮转

Compose 层日志默认无限增长，建议加上：

```yaml
services:
  backend:
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: "3"
```

应用自身的日志由 `winston-daily-rotate-file` 管理（`LOG_MAX_FILE_SIZE` / `LOG_MAX_FILES`），两者作用对象不同。

### 2. 镜像标签

- 生产固定版本标签，避免 `latest` 漂移
- 可通过 `BACKEND_IMAGE` / `FRONTEND_IMAGE` 切换到私有仓库（若是私有包，需先 `docker login ghcr.io`）

### 3. 容器加固现状

| 加固项         | 现状                                                |
| ----------- | ------------------------------------------------- |
| 后端非 root 运行 | ✅ `Dockerfile` 中 `USER node`                      |
| 能力收敛        | ✅ 三个容器中前后端均 `cap_drop: ALL`，前端仅回补 `NET_BIND_SERVICE` |
| 提权阻断        | ✅ 前后端 `no-new-privileges:true`                   |
| 数据库不对外      | ✅ mysql 服务无 `ports`，仅 `idc-network` 内可达            |
| 前端不对外       | ✅ 仅绑 `127.0.0.1`                                  |
| 前端容器 root   | ⚠️ Nginx master 仍以 root 运行（绑定 80 端口所需），worker 已降权 |

## 常见问题

### backend 容器反复重启

```bash
docker logs --tail=100 idc-backend
```

| 日志关键字                                    | 原因                                    | 处理                                                    |
| ---------------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| `[致命错误] 生产环境未设置 JWT_SECRET`             | `JWT_SECRET` 缺失或短于 32 字符              | 见 4.2，重新生成后 `docker compose up -d --force-recreate backend` |
| `ECONNREFUSED ... 3306`                  | MySQL 未就绪、地址错，或改外部库后 `MYSQL_HOST` 仍是内网名 | 内置库：删掉手改的 `MYSQL_HOST` 让 compose 接管；外部库：填真实地址          |
| `Access denied for user`                 | 两个 `.env` 的密码不一致，或密码含 `#`/`$` 被截断      | 按 4.4 核对，必要时加引号                                       |
| `Unknown database 'xxx'`                 | 库名不一致（多为误用 `MYSQL_ORLOFGYI` 键）         | 统一为 `MYSQL_DATABASE`，或核对两个 `.env`                      |
| `npm ERR! code ELIFECYCLE`（仅 dev）        | 原生依赖在 alpine 上编译失败                    | 用 prod 镜像，或在 `Dockerfile` 增加构建工具链                       |

### mysql 容器启动失败或健康检查一直 unhealthy

```bash
docker logs idc-mysql
```

| 现象                                   | 原因                        | 处理                                                              |
| ------------------------------------ | ------------------------- | --------------------------------------------------------------- |
| `You need to specify one of MYSQL_ROOT_PASSWORD...` | 根目录 `.env` 缺密码           | compose 的 `:?` 校验也会直接报错，按提示补 `MYSQL_ROOT_PASSWORD` / `MYSQL_PASSWORD` |
| `Failed to initialize DD Storage Engine` | 旧数据目录损坏或磁盘满           | 确认无数据要保留后 `docker compose down -v` 重建（会清空数据库）                      |
| `Access denied`（healthcheck 内）        | `MYSQL_USER` / `MYSQL_PASSWORD` 与环境变量不一致 | mysql 初始化参数只在**空数据卷**首次启动时生效，改完需 `down -v` 重建                   |

::: warning 改了 mysql 密码不生效  
`MYSQL_*` 环境变量只在数据目录为空时被初始化。已有数据的卷上改密码，容器内密码不会变。要么进容器用 `ALTER USER` 改，要么 `down -v` 重建（数据丢失）。这是 MySQL 镜像的固有行为，不是本项目的 bug。

:::

### 日志报 `permission denied` / 上传失败

宿主机目录属主与容器内 uid 1000 不匹配：

```bash
sudo chown -R 1000:1000 /opt/idc_assest/backend/{uploads,logs,backups,temp,config}
docker compose restart backend
```

### 浏览器打不开页面

按顺序排查：

```bash
docker compose ps                       # frontend 是否 Up
ss -lntp | grep ':80'                   # 是否只有 127.0.0.1:80
curl -I http://127.0.0.1/               # 本机能否访问
```

若本机能访问、外部不能 —— 这是**预期行为**，前端只监听回环，需按第 8 节配置 TLS 网关。

### 上传文件返回 413

Nginx 默认请求体上限为 1MB。镜像内置的 `frontend/nginx.conf` 已设置 `client_max_body_size 50m`；若在前置网关又加了一层 Nginx，该层也要同步放大，否则仍会在网关处被拒。

### 端口 80 被占用

```bash
ss -lntp | grep ':80'
```

改映射端口（同时要改前置网关的 `proxy_pass`）：

```yaml
ports:
  - "127.0.0.1:8080:80"
```

### 数据库改配置后不生效

`env_file` 只在**容器创建时**读取。改完 `backend/.env` 必须重建容器，`restart` 不会重载环境变量：

```bash
docker compose up -d --force-recreate backend
```

### 确认两个 .env 的账号密码一致性

| 配置项                       | 文件                             | 说明                        |
| ------------------------- | ------------------------------ | ------------------------- |
| `MYSQL_USER=idc_user`     | `/opt/idc_assest/.env`         | MySQL 容器创建的用户名            |
| `MYSQL_USERNAME=idc_user` | `/opt/idc_assest/backend/.env` | 后端连接使用的用户名                |
| `MYSQL_PASSWORD`          | 两个文件各一处                        | 必须完全相同                    |
| `MYSQL_DATABASE`          | 两个文件各一处                        | 必须相同（默认 `idc_management`） |

### 快速自检脚本

```bash
cd /opt/idc_assest
echo "--- 服务状态 ---"; docker compose ps
echo "--- 根 .env ---";  grep -E "^MYSQL_(DATABASE|USER|PASSWORD)=" .env
echo "--- 后端 .env ---"; grep -E "^(MYSQL_DATABASE|MYSQL_USERNAME|MYSQL_PASSWORD)=" backend/.env
echo "--- 后端实际生效的库 ---"
docker exec idc-backend sh -c 'echo DB_TYPE=$DB_TYPE; echo MYSQL_HOST=$MYSQL_HOST; echo MYSQL_DATABASE=$MYSQL_DATABASE'
echo "--- MySQL 内可见的库 ---"
docker exec idc-mysql mysql -uroot -p"$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)" -e "SHOW DATABASES;"
```

`MYSQL_HOST` 应为 `mysql`，`MYSQL_DATABASE` 应出现在 `SHOW DATABASES` 结果中，两边一致即配置正确。
