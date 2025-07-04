# Docker 部署指南

本指南說明如何使用 Docker 部署庫存管理系統。

## 目錄

1. [系統需求](#系統需求)
2. [部署架構](#部署架構)
3. [快速開始](#快速開始)
4. [配置說明](#配置說明)
5. [部署步驟](#部署步驟)
6. [維護操作](#維護操作)
7. [故障排除](#故障排除)

## 系統需求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 至少 4GB RAM
- 至少 20GB 可用磁碟空間
- 開放端口：80, 443（如使用 HTTPS）

## 部署架構

系統包含以下服務：

- **前端（frontend）**：Next.js 14 應用程式，部署在 los.lomis.com.tw
- **後端（api）**：Laravel 11 API，部署在 api.lomis.com.tw
- **資料庫（mysql）**：MySQL 8.0
- **快取（redis）**：Redis 7
- **管理工具（phpmyadmin）**：phpMyAdmin（開發環境）

## 快速開始

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd Mir01
   ```

2. **準備環境變數**
   ```bash
   cp docker-env-example .env
   # 編輯 .env 檔案，填入實際配置值
   ```

3. **生成密鑰**
   ```bash
   # 生成 NextAuth 密鑰
   openssl rand -base64 32
   # 將生成的密鑰填入 .env 的 NEXTAUTH_SECRET
   ```

4. **啟動服務**
   ```bash
   # 生產環境（不含 phpMyAdmin）
   docker-compose up -d
   
   # 開發環境（包含 phpMyAdmin）
   docker-compose --profile dev up -d
   ```

## 配置說明

### 環境變數

主要環境變數說明：

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| APP_ENV | 應用程式環境 | production |
| API_URL | 後端 API URL | https://api.lomis.com.tw |
| NEXTAUTH_URL | 前端應用程式 URL | https://los.lomis.com.tw |
| DB_PASSWORD | 資料庫密碼 | 使用強密碼 |
| NEXTAUTH_SECRET | NextAuth 加密密鑰 | 32 字元隨機字串 |

### 端口配置

預設端口配置：

- 前端：3000
- 後端 API：8080
- MySQL：3306
- Redis：6379
- phpMyAdmin：8888（開發環境）

## 部署步驟

### 1. 準備伺服器

```bash
# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 配置域名

確保以下域名已正確指向伺服器：

- los.lomis.com.tw → 伺服器 IP
- api.lomis.com.tw → 伺服器 IP

### 3. 設定反向代理（Nginx）

```nginx
# /etc/nginx/sites-available/los.lomis.com.tw
server {
    listen 80;
    server_name los.lomis.com.tw;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# /etc/nginx/sites-available/api.lomis.com.tw
server {
    listen 80;
    server_name api.lomis.com.tw;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. 設定 SSL（使用 Let's Encrypt）

```bash
# 安裝 Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 獲取 SSL 憑證
sudo certbot --nginx -d los.lomis.com.tw
sudo certbot --nginx -d api.lomis.com.tw
```

### 5. 初始化資料庫

```bash
# 進入 API 容器
docker-compose exec api bash

# 執行資料庫遷移
php artisan migrate --seed

# 生成 API 文檔
php artisan scribe:generate
```

## 維護操作

### 查看日誌

```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f api
docker-compose logs -f frontend
```

### 備份資料庫

```bash
# 備份資料庫
docker-compose exec mysql mysqldump -u root -p inventory > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢復資料庫
docker-compose exec -T mysql mysql -u root -p inventory < backup.sql
```

### 更新應用程式

```bash
# 拉取最新代碼
git pull origin main

# 重新構建並啟動
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 清理資源

```bash
# 清理未使用的映像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理所有未使用資源
docker system prune -a
```

## 故障排除

### 1. 容器無法啟動

檢查日誌：
```bash
docker-compose logs [service-name]
```

### 2. 資料庫連接失敗

- 確認環境變數配置正確
- 檢查 MySQL 容器是否正常運行
- 驗證網路連接

### 3. CORS 錯誤

- 檢查後端 `config/cors.php` 配置
- 確認前端域名已加入允許列表

### 4. 圖片上傳失敗

- 檢查儲存目錄權限
- 確認 Nginx 客戶端上傳大小限制

### 5. Session 問題

- 檢查 SESSION_DOMAIN 配置
- 確認 Redis 連接正常

## 效能優化

### 1. 啟用 OPcache

OPcache 已在 Dockerfile 中配置。

### 2. 配置 Redis 持久化

編輯 `docker-compose.yml`：
```yaml
redis:
  command: redis-server --save 60 1 --loglevel warning
```

### 3. 調整 PHP-FPM 工作程序

根據伺服器資源調整 PHP-FPM 配置。

## 安全建議

1. **使用強密碼**：確保所有密碼都是強密碼
2. **定期更新**：保持 Docker 映像和依賴項更新
3. **限制端口**：只開放必要的端口
4. **啟用防火牆**：使用 UFW 或 iptables
5. **監控日誌**：定期檢查應用程式和系統日誌

## 監控建議

考慮部署以下監控工具：

- **Prometheus** + **Grafana**：系統監控
- **ELK Stack**：日誌管理
- **Sentry**：錯誤追蹤

---

如有問題，請參考專案文檔或聯繫技術支援。 