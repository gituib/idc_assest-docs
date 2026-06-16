# 手动部署

> 本文档涵盖四种部署方式：**Linux 一键部署**、**Windows 部署**、**手动安装（开发环境）** 和 **生产环境部署**。
>
> **Docker 部署**（推荐）请参阅 [Docker 部署指南](./docker-deploy)。

## 环境要求

| 项目 | 最低要求 | 推荐配置 |
|------|----------|----------|
| **操作系统** | Windows 10+、macOS 12+、Linux | 同最低 |
| **Node.js** | ≥14.0.0 | 20.x LTS |
| **npm** | ≥6.0.0 | 10.x |
| **内存** | 4GB | 8GB+ |
| **磁盘** | 2GB | 10GB+ |

**生产环境额外要求**：

| 项目 | 要求 |
|------|------|
| 数据库 | MySQL 8.0+（推荐）或 SQLite |
| Web 服务器 | Nginx 1.18+ |
| 进程管理 | PM2 5.x+ |

---

## Linux 一键部署

适用于 Ubuntu/Debian/CentOS/Arch 等主流 Linux 发行版。

### 方式一：从 Git 克隆后运行

```bash
# 克隆项目
git clone https://github.com/gituib/idc_assest.git
cd idc_assest
# 运行安装脚本（自动安装 Node.js）
./install.sh
```

`install.sh` 自动完成以下操作：

- 自动检测 Linux 发行版（Ubuntu/Debian/CentOS/Arch）
- 自动安装 Node.js 20.x（如未安装）
- 自动安装系统依赖（git、curl、wget）
- 调用 `install.js` 完成后续安装

### 方式二：一键安装（无需克隆）

```bash
curl -fsSL https://gitee.com/zhang96110/idc_assest/raw/main/install.sh | bash
```

> **注意**：一键安装时脚本会自动克隆项目到当前目录下的 `idc_assest` 文件夹。

---

## Windows 部署

> 前置条件：需要先手动安装 Node.js（推荐 20.x LTS）。

```powershell
# 克隆项目
git clone https://github.com/gituib/idc_assest.git
cd idc_assest
# 运行安装脚本
node install.js
# 或使用 npm 命令
npm run deploy
```

---

## 手动安装（开发环境）

适用于本地开发调试场景，不依赖安装脚本。

```bash
# 1. 克隆项目
git clone https://github.com/gituib/idc_assest.git
cd idc_assest

# 2. 安装所有依赖（根目录 + backend + frontend）
npm run install:all

# 3. 配置环境变量
cp backend/.env.example backend/.env

# 4. 配置 JWT 密钥（必填）
# 编辑 backend/.env，设置 JWT_SECRET 为强随机字符串
# 生成密钥：
#   Linux/macOS:   openssl rand -hex 64
#   通用:          node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 5. 初始化数据库
cd backend && node scripts/init-database.js

# 6. 启动服务（前后端同时启动）
cd .. && npm start
```

启动后：

| 服务 | 地址 |
|------|------|
| **前端** | http://localhost:3000 |
| **后端** | http://localhost:8000 |
| **API 文档（Swagger）** | http://localhost:8000/api-docs |

### 单独启动

```bash
# 仅启动后端（端口 8000，nodemon 热重载）
cd backend && npm run dev

# 仅启动前端（端口 3000，Vite HMR）
cd frontend && npm run dev
```

### 首次使用

1. 打开浏览器访问 http://localhost:3000
2. 点击「注册账号」链接
3. 填写用户名和密码完成注册
4. **第一个注册的用户自动获得管理员权限**

---

## 生产环境部署

生产环境推荐直接运行安装脚本，它会自动完成所有配置。

### 安装脚本部署

```bash
# 进入项目根目录
cd idc_assest

# 交互式安装（向导模式）
node install.js
```

安装脚本会引导你完成以下步骤：

| 步骤 | 说明 |
|------|------|
| 1. 环境检查 | 检测 Node.js 版本、Git、PM2、Nginx 等工具是否已安装 |
| 2. 数据库配置 | 选择 SQLite（默认）或 MySQL，配置连接参数 |
| 3. JWT 密钥生成 | 自动生成安全的 JWT 密钥 |
| 4. 依赖安装 | 自动安装前端和后端依赖 |
| 5. 数据库初始化 | 创建数据库表并初始化默认数据 |
| 6. 前端构建 | 构建生产环境前端文件 |
| 7. 服务启动 | 使用 PM2 启动后端服务（可选配置 Nginx） |
| 8. 配置摘要 | 显示部署完成后的访问地址和配置信息 |

#### 快速安装（非交互式）

```bash
# 使用默认配置（SQLite）直接安装
node install.js -y

# 指定数据库类型
node install.js -y --db=mysql    # 使用 MySQL
node install.js -y --db=sqlite   # 使用 SQLite（默认）

# 指定后端端口
node install.js -y --port=8000

# 跳过前端构建
node install.js -y --skip-build

# 跳过 Nginx 配置
node install.js -y --skip-nginx

# 查看帮助
node install.js --help
```

### 提前准备 MySQL 数据库（如使用 MySQL）

```sql
-- 创建数据库
CREATE DATABASE idc_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'idc_user'@'localhost' IDENTIFIED BY 'YourStrongPassword';
GRANT ALL PRIVILEGES ON idc_management.* TO 'idc_user'@'localhost';
FLUSH PRIVILEGES;
```

### 服务器配置参考

| 规模 | CPU | 内存 | 磁盘 |
|------|-----|------|------|
| 小型（<100 设备） | 2 核心 | 4GB | 40GB |
| 中型（100-500 设备） | 4 核心 | 8GB | 80GB |
| 大型（>500 设备） | 8 核心+ | 16GB+ | 100GB+ |

### Nginx 配置

`install.js` 会自动配置 Nginx。配置文件位于 `deploy/nginx-idc.conf`，核心配置如下：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    client_max_body_size 100M;
    root "/var/www/idc";
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/javascript application/xml+rss
               application/json application/x-javascript image/svg+xml;

    # 静态资源缓存（1 年）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|hdr)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }

    # 文件上传代理
    location /uploads/ {
        proxy_pass http://127.0.0.1:8000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }

    # 前端路由（SPA）
    location / {
        try_files $uri $uri/ /index.html =404;
    }
}
```

**启用配置**：

```bash
# Ubuntu/Debian
sudo cp deploy/nginx-idc.conf /etc/nginx/sites-available/idc
sudo ln -sf /etc/nginx/sites-available/idc /etc/nginx/sites-enabled/idc
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo nginx -s reload
```

---

## 更新脚本

```bash
# 交互式更新（自动备份 → 拉取代码 → 安装依赖 → 数据库迁移 → 构建前端 → 重启服务）
node update.js

# 模拟运行（预览将要执行的操作，不实际执行）
node update.js --dry-run

# 跳过特定步骤
node update.js --skip-git     # 跳过 Git 拉取
node update.js --skip-backup  # 跳过数据库备份
node update.js --skip-deps    # 跳过依赖安装
node update.js --skip-build   # 跳过前端构建
node update.js --skip-restart # 跳过服务重启

# 强制执行（忽略锁文件）
node update.js --force
```

**智能检测功能**：

- 依赖安装智能跳过（检测 package.json 变化）
- 前端构建智能跳过（检测源码变化）
- 数据库自动备份（支持回滚）
- 健康检查验证
- 日志持久化保存到 `logs/update_*.log`
- 锁机制防止重复运行

---

## 卸载脚本

```bash
# 交互式卸载
node uninstall.js

# 强制卸载（无需确认）
node uninstall.js --force

# 卸载前自动备份数据库
node uninstall.js --backup

# 预览模式（不实际执行）
node uninstall.js --dry-run

# 跳过特定步骤
node uninstall.js --skip-db      # 跳过数据库删除
node uninstall.js --skip-deps    # 跳过依赖删除
node uninstall.js --skip-uploads # 跳过上传文件删除
```

---

## 系统维护

### 服务管理

```bash
# PM2 服务
pm2 status                    # 查看状态
pm2 logs idc-backend          # 查看日志
pm2 restart idc-backend       # 重启服务
pm2 stop idc-backend          # 停止服务
pm2 delete idc-backend        # 删除服务
pm2 save                      # 保存配置
pm2 startup                   # 开机自启

# Nginx
sudo nginx -t                 # 测试配置
sudo nginx -s reload          # 重载配置
sudo systemctl restart nginx  # 重启服务
```

### 日志查看

```bash
# PM2 日志
pm2 logs idc-backend
pm2 logs idc-backend --err    # 仅错误日志

# Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 应用日志
tail -f backend/logs/*.log
```

### 数据备份

```bash
# 系统内备份：系统管理 → 备份管理 → 创建备份

# 命令行备份
cd backend && node scripts/backup.js

# 还原备份
cd backend && node scripts/restore.js <backup-file>
```

---

## 常见问题

<details>
<summary>1. 端口冲突（8000、3000、80）</summary>

```bash
# 检查端口占用（Linux）
netstat -tulpn | grep :8000

# Windows
netstat -ano | findstr :8000

# 方案1：修改端口（编辑 backend/.env）
PORT=8001

# 方案2：停止占用进程
sudo kill $(lsof -t -i:8000)
```
</details>

<details>
<summary>2. 502 Bad Gateway</summary>

1. 检查后端服务：`pm2 status`
2. 检查端口监听：`netstat -tulpn | grep 8000`
3. 检查 Nginx 配置：`nginx -t`
4. 查看错误日志：`tail /var/log/nginx/error.log`
</details>

<details>
<summary>3. 前端构建失败</summary>

```bash
# 检查 Node.js 版本
node -v  # 需要 ≥18.x

# 清理并重试
cd frontend
rm -rf node_modules dist
npm install
npm run build
```
</details>

<details>
<summary>4. 数据库连接失败</summary>

**MySQL：**
- 检查服务状态：`sudo systemctl status mysql`
- 验证连接参数（主机、端口、用户名、密码）
- 确认数据库已创建：`SHOW DATABASES;`
- 检查用户权限：`SHOW GRANTS FOR 'idc_user'@'localhost';`
</details>

<details>
<summary>5. 权限问题</summary>

```bash
# 修复文件权限
sudo chown -R $(whoami):$(whoami) /path/to/idc_assest

# 上传目录权限
sudo chmod -R 777 backend/uploads
```
</details>

<details>
<summary>6. 内存不足</summary>

```bash
# 增加内存限制（编辑 ecosystem.config.js）
node_args: "--max-old-space-size=4096"

# 或命令行
pm2 restart idc-backend --update-env
```
</details>

<details>
<summary>7. npm 安装失败</summary>

```bash
# 清理缓存
npm cache clean --force

# 删除后重装
rm -rf node_modules package-lock.json
npm install
```
</details>

<details>
<summary>8. PM2 服务消失</summary>

```bash
# 重新启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
</details>
