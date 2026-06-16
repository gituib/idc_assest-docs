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

## 架构

```
用户浏览器 → Nginx 容器 :80
                ├── / 路径 → 返回前端静态页面
                └── /api 路径 → 反向代理 → Backend 容器 :8000 → MySQL 容器 :3306
```

## 快速部署

```bash
# 克隆项目
git clone https://github.com/gituib/idc_assest.git
cd idc_assest

# 启动生产环境
docker compose -f docker-compose.prod.yml up -d
```

详细部署说明请参考项目中的 `docs/docker-deployment-guide.md` 文档。
