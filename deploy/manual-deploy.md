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
