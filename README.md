# 庫存管理系統 (Inventory Management System)

這是一個基於 Laravel 後端和 Next.js 前端的現代化庫存管理系統。

## 📋 目錄

- [技術棧](#技術棧)
- [系統需求](#系統需求)
- [快速開始](#快速開始)
- [詳細安裝步驟](#詳細安裝步驟)
- [環境配置](#環境配置)
- [資料庫設定](#資料庫設定)
- [常用命令](#常用命令)
- [開發流程](#開發流程)
- [故障排除](#故障排除)
- [專案結構](#專案結構)
- [開發紀錄](#開發紀錄)

## 🚀 技術棧

### 後端 (Laravel)
- **PHP** 8.2+
- **Laravel** 11.x
- **Laravel Sanctum** - API 認證
- **Spatie 套件**:
  - Laravel Query Builder - 高級查詢建構
  - Laravel Data - 資料傳輸物件
  - Laravel Media Library - 媒體檔案管理
  - Laravel Permission - 權限管理
  - Laravel Activity Log - 活動日誌
- **Scribe** - API 文檔生成

### 前端 (Next.js)
- **Next.js** 15.x (App Router)
- **TypeScript** 5.x
- **React** 19.x
- **shadcn/ui** - UI 元件庫
- **Tailwind CSS** 4.x - 樣式框架
- **@tanstack/react-query** - 伺服器狀態管理
- **zustand** - 客戶端狀態管理
- **immer** - 不可變狀態更新
- **openapi-fetch** - API 客戶端
- **react-hook-form** - 表單管理
- **Sonner** - Toast 通知
- **Lucide React** - 圖標庫

## 💻 系統需求

### 選項 A: Laragon 環境（推薦用於 Windows）
- **Laragon** 最新版本
- **PHP** 8.2+
- **MySQL** 8.0+
- **Node.js** 18.x 或更高版本
- **npm** 或 **yarn**
- **Composer** 2.x

### 選項 B: Docker 環境
- **Docker Desktop**
- **Docker Compose**

## 🏃‍♂️ 快速開始

### 使用 Laragon（推薦）

```bash
# 1. 克隆專案
git clone [你的專案 URL]
cd Mir01

# 2. 後端設定
cd inventory-api
composer install
cp .env.example .env
php artisan key:generate

# 3. 配置資料庫（修改 .env 文件）
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventory-api
DB_USERNAME=root
DB_PASSWORD=

# 4. 執行資料庫遷移
php artisan migrate
php artisan db:seed

# 5. 生成 API 文檔
php artisan scribe:generate

# 6. 前端設定
cd ../inventory-client
npm install
cp .env.example .env.local
# 自動產生並設定 NextAuth Secret
echo "AUTH_SECRET=$(openssl rand -hex 32)" >> .env.local

# 7. 啟動服務
# 後端（在 inventory-api 目錄）
php artisan serve

# 前端（在 inventory-client 目錄，新終端）
npm run dev
```

## 🌟 Laragon 完整部署指南

### 第一步：準備 Laragon 環境

1. **下載並安裝 Laragon**
   - 訪問 [Laragon 官方網站](https://laragon.org/download/index.html)
   - 下載最新版本的 Laragon Full
   - 以管理員身份運行安裝程序

2. **啟動 Laragon**
   - 開啟 Laragon 控制面板
   - 點擊「全部啟動」按鈕
   - 確保 Apache、MySQL、PHP 都正常運行

3. **檢查環境**
   - 在瀏覽器中訪問 `http://localhost`
   - 確認看到 Laragon 歡迎頁面

### 第二步：克隆並配置專案

1. **克隆專案到 Laragon 目錄**
   ```bash
   # 打開 Laragon 控制面板，點擊「根目錄」
   # 通常在 C:\laragon\www\ 目錄下
   git clone [你的專案 URL] inventory-system
   cd inventory-system
   ```

2. **配置後端**
   ```bash
   cd inventory-api
   
   # 安裝 Composer 依賴
   composer install
   
   # 複製環境配置文件
   cp .env.example .env
   
   # 生成應用密鑰
   php artisan key:generate
   ```

3. **配置 .env 文件**
   編輯 `inventory-api/.env` 文件：
   ```env
   APP_NAME="庫存管理系統"
   APP_ENV=local
   APP_DEBUG=true
   APP_URL=http://inventory-system.test
   
   # 資料庫設定
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=inventory_api
   DB_USERNAME=root
   DB_PASSWORD=
   
   # Sanctum 設定
   SANCTUM_STATEFUL_DOMAINS=inventory-system.test,localhost:3000
   SESSION_DOMAIN=inventory-system.test
   
   # CORS 設定
   FRONTEND_URL=http://localhost:3000
   ```

### 第三步：設定資料庫

1. **創建資料庫**
   ```bash
   # 打開 Laragon 控制面板，點擊「資料庫」
   # 或者使用命令行
   mysql -u root -p
   CREATE DATABASE inventory_api;
   EXIT;
   ```

2. **執行資料庫遷移**
   ```bash
   cd inventory-api
   php artisan migrate
   php artisan db:seed
   ```

3. **生成 API 文檔**
   ```bash
   php artisan scribe:generate
   ```

### 第四步：配置前端

1. **安裝前端依賴**
   ```bash
   cd ../inventory-client
   npm install
   ```

2. **配置前端環境**
   ```bash
   cp .env.example .env.local
   
   # 自動產生 NextAuth Secret
   echo "AUTH_SECRET=$(openssl rand -hex 32)" >> .env.local
   ```

3. **編輯前端環境文件**
   編輯 `inventory-client/.env.local`：
   ```env
   # API 端點
   NEXT_PUBLIC_API_BASE_URL=http://inventory-system.test
   
   # NextAuth 設定
   NEXTAUTH_URL=http://localhost:3000
   AUTH_SECRET=[自動生成的密鑰]
   ```

### 第五步：Laragon 虛擬主機設定

1. **在 Laragon 中啟用虛擬主機**
   - 打開 Laragon 控制面板
   - 右鍵點擊「Apache」→「虛擬主機」→「inventory-system.test」
   - 或者手動編輯 `C:\laragon\etc\apache2\sites-enabled\auto.inventory-system.test.conf`

2. **設定 Document Root**
   確保虛擬主機指向正確的目錄：
   ```apache
   <VirtualHost *:80>
       DocumentRoot "C:/laragon/www/inventory-system/inventory-api/public"
       ServerName inventory-system.test
       ServerAlias *.inventory-system.test
       <Directory "C:/laragon/www/inventory-system/inventory-api/public">
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

3. **重啟 Apache**
   - 在 Laragon 控制面板中點擊「重新載入」

### 第六步：啟動服務

1. **啟動後端**
   ```bash
   cd inventory-api
   # 如果使用 Laragon 虛擬主機，直接訪問 http://inventory-system.test
   # 或者使用 artisan serve（適用於開發）
   php artisan serve --host=0.0.0.0 --port=8000
   ```

2. **啟動前端**
   ```bash
   cd inventory-client
   npm run dev
   ```

### 第七步：驗證部署

1. **檢查後端 API**
   - 訪問 `http://inventory-system.test/api/health`（如果有健康檢查端點）
   - 或訪問 `http://inventory-system.test/docs` 查看 API 文檔

2. **檢查前端**
   - 訪問 `http://localhost:3000`
   - 確認登入頁面正常顯示

3. **測試功能**
   - 使用預設帳號登入：`admin@example.com` / `password`
   - 測試基本功能如商品管理、訂單管理等

### 故障排除

1. **權限問題**
   ```bash
   # 確保 Laravel 目錄有正確權限
   chmod -R 755 storage bootstrap/cache
   chown -R www-data:www-data storage bootstrap/cache
   ```

2. **Composer 依賴問題**
   ```bash
   # 如果遇到依賴衝突
   composer install --ignore-platform-reqs
   ```

3. **SSL 證書問題**
   ```bash
   # 如果需要 HTTPS，在 Laragon 中啟用 SSL
   # 右鍵點擊 Laragon → SSL → inventory-system.test
   ```

4. **端口衝突**
   ```bash
   # 檢查端口占用
   netstat -ano | findstr :80
   netstat -ano | findstr :3000
   ```

### 使用 Docker

```bash
# 1. 克隆專案
git clone [你的專案 URL]
cd Mir01/inventory-api

# 2. 複製環境設定
cp .env.example .env

# 3. 安裝 PHP 依賴（使用 Sail）
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install --ignore-platform-reqs

# 4. 啟動 Docker 容器
./vendor/bin/sail up -d

# 5. 生成應用金鑰
./vendor/bin/sail artisan key:generate

# 6. 執行資料庫遷移
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan db:seed

# 7. 前端設定（新終端）
cd ../inventory-client
npm install
cp .env.example .env.local
echo "AUTH_SECRET=$(openssl rand -hex 32)" >> .env.local
npm run dev
```

## 🔧 詳細安裝步驟

### 1. 資料庫設定

#### Laragon 環境
1. **開啟 Laragon**
   - 啟動 Laragon 控制面板
   - 點擊「全部啟動」確保所有服務運行

2. **創建資料庫**
   - 方式一：使用 phpMyAdmin
     - 在瀏覽器中訪問 `http://localhost/phpmyadmin`
     - 使用 root 用戶登入（通常無密碼）
     - 創建新資料庫 `inventory_api`
   
   - 方式二：使用 HeidiSQL
     - 打開 Laragon 控制面板 → 資料庫 → HeidiSQL
     - 連接到 MySQL 伺服器
     - 創建新資料庫 `inventory_api`
   
   - 方式三：使用命令行
     ```bash
     mysql -u root -p
     CREATE DATABASE inventory_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     EXIT;
     ```

3. **配置資料庫連接**
   - 在 `inventory-api/.env` 中設定：
     ```env
     DB_CONNECTION=mysql
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=inventory_api
     DB_USERNAME=root
     DB_PASSWORD=
     ```

4. **驗證資料庫連接**
   ```bash
   cd inventory-api
   php artisan migrate:status
   ```

#### Docker 環境
資料庫會自動創建，使用以下預設值：
- Host: `mysql` (在容器內) 或 `localhost` (從主機)
- Database: `inventory-api`
- Username: `sail`
- Password: `password`

### 2. 後端配置

修改 `inventory-api/.env` 文件：

```env
# 應用設定
APP_NAME="庫存管理系統"
APP_ENV=local
APP_KEY=base64:你的金鑰
APP_DEBUG=true
APP_URL=http://localhost:8000

# 資料庫設定（Laragon）
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventory-api
DB_USERNAME=root
DB_PASSWORD=

# 資料庫設定（Docker）
# DB_CONNECTION=mysql
# DB_HOST=mysql
# DB_PORT=3306
# DB_DATABASE=inventory-api
# DB_USERNAME=sail
# DB_PASSWORD=password

# Sanctum 設定
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost

# CORS 設定
FRONTEND_URL=http://localhost:3000
```

### 3. 前端配置

在 `inventory-client` 目錄下，首先從範例檔案建立您的本地環境設定檔：

```bash
cp .env.example .env.local
```

此指令會創建一個 `.env.local` 檔案。接下來，您需要為 NextAuth 設定一個安全的密鑰。執行以下指令可以自動產生一個密鑰並附加到您的 `.env.local` 檔案中：

```bash
echo "AUTH_SECRET=$(openssl rand -hex 32)" >> .env.local
```

完成後，請確保 `inventory-client/.env.local` 檔案中至少包含以下變數：

```env
# API 端點 (URL應與後端 inventory-api/.env 中的 APP_URL 一致)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# NextAuth 設定
# 通常是您前端應用的 URL
NEXTAUTH_URL=http://localhost:3000
# 這是您剛剛產生的密鑰
AUTH_SECRET=...
```

### 4. 初始化數據

```bash
# 在 inventory-api 目錄
# 創建測試用戶
php artisan tinker
>>> User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => bcrypt('password')]);

# 或使用 Seeder
php artisan db:seed --class=UserSeeder
```

## 📝 常用命令

### 後端命令

```bash
# 啟動開發服務器
php artisan serve

# 執行資料庫遷移
php artisan migrate

# 回滾遷移
php artisan migrate:rollback

# 重新執行所有遷移
php artisan migrate:fresh --seed

# 生成 API 文檔
php artisan scribe:generate

# 清除快取
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 執行測試
php artisan test

# 創建新的控制器
php artisan make:controller Api/ControllerName --api --model=ModelName

# 創建新的模型和相關文件
php artisan make:model ModelName -mfsc
```

### 前端命令

```bash
# 開發模式
npm run dev

# 建構生產版本
npm run build

# 啟動生產服務器
npm run start

# 更新 API 類型定義
npm run api:types

# 程式碼檢查
npm run lint
```

## 🔄 開發流程

### 1. API 契約同步流程

當後端 API 有變更時：

```bash
# 1. 在後端生成 OpenAPI 文檔
cd inventory-api
php artisan scribe:generate

# 2. 複製到前端
cp public/docs/openapi.yaml ../inventory-client/openapi.yaml

# 3. 在前端更新類型
cd ../inventory-client
npm run api:types
```

### 2. 新增功能的標準流程

1. **後端開發**
   - 創建 Migration
   - 創建 Model
   - 創建 Form Request
   - 創建 Policy
   - 創建 Controller
   - 更新路由
   - 添加 Scribe 註解
   - 生成 API 文檔

2. **前端開發**
   - 同步 API 類型
   - 創建類型定義
   - 創建 API hooks
   - 創建元件
   - 創建頁面

## 🐛 故障排除

### 常見問題

1. **CORS 錯誤**
   - 確認 `FRONTEND_URL` 環境變數設定正確
   - 檢查 `config/cors.php` 設定
   - 確保 `SANCTUM_STATEFUL_DOMAINS` 包含前端域名

2. **資料庫連接錯誤**
   - 確認資料庫服務正在運行
   - 檢查 `.env` 中的資料庫設定
   - 確認資料庫已創建

3. **API 類型錯誤**
   - 重新生成 API 文檔
   - 重新同步 API 類型
   - 清除 Next.js 快取：`rm -rf .next`

4. **權限錯誤**
   - 確保 `storage` 和 `bootstrap/cache` 目錄可寫入
   ```bash
   chmod -R 777 storage bootstrap/cache
   ```

5. **Docker 性能問題**
   - 避免使用自定義網絡配置
   - 使用預設的 bridge 網絡

### Laragon 特有問題

6. **Laragon 服務啟動失敗**
   - **Apache 啟動失敗**
     ```bash
     # 檢查端口占用
     netstat -ano | findstr :80
     # 結束占用端口的程序
     taskkill /PID [PID號碼] /F
     ```
   
   - **MySQL 啟動失敗**
     ```bash
     # 檢查 MySQL 端口
     netstat -ano | findstr :3306
     # 重啟 MySQL 服務
     net stop mysql
     net start mysql
     ```

7. **虛擬主機設定問題**
   - **域名無法訪問**
     - 檢查 `C:\Windows\System32\drivers\etc\hosts` 文件
     - 確認包含：`127.0.0.1 inventory-system.test`
   
   - **404 錯誤**
     - 確認 Apache 虛擬主機配置正確
     - 檢查 DocumentRoot 路徑
     ```apache
     DocumentRoot "C:/laragon/www/inventory-system/inventory-api/public"
     ```

8. **PHP 版本問題**
   - **切換 PHP 版本**
     ```bash
     # 在 Laragon 中右鍵 → PHP → 選擇版本
     # 或使用命令行檢查
     php -v
     ```
   
   - **擴展缺失**
     ```bash
     # 檢查已安裝的擴展
     php -m
     # 啟用需要的擴展（編輯 php.ini）
     extension=openssl
     extension=pdo_mysql
     extension=mbstring
     ```

9. **SSL 證書問題**
   - **HTTPS 無法訪問**
     ```bash
     # 在 Laragon 中啟用 SSL
     # 右鍵點擊 Laragon → SSL → inventory-system.test
     ```
   
   - **證書信任問題**
     - 將 Laragon 的 CA 證書添加到受信任的根證書頒發機構
     - 路徑：`C:\laragon\etc\ssl\laragon.crt`

10. **性能優化**
    - **Laravel 緩存優化**
      ```bash
      php artisan config:cache
      php artisan route:cache
      php artisan view:cache
      php artisan optimize
      ```
    
    - **Composer 優化**
      ```bash
      composer install --optimize-autoloader --no-dev
      ```

11. **開發工具整合**
    - **VSCode 整合**
      - 安裝 PHP Intelephense 擴展
      - 配置 PHP 路徑：`C:\laragon\bin\php\php-8.x\php.exe`
    
    - **Git 整合**
      ```bash
      # 配置 Git 忽略 Laragon 特有文件
      echo "*.log" >> .gitignore
      echo "storage/logs/*" >> .gitignore
      ```

12. **記憶體限制問題**
    - **PHP 記憶體限制**
      ```ini
      # 編輯 php.ini
      memory_limit = 512M
      upload_max_filesize = 64M
      post_max_size = 64M
      ```
    
    - **Composer 記憶體限制**
      ```bash
      php -d memory_limit=-1 composer install
      ```

### 除錯技巧

13. **日誌檢查**
    ```bash
    # Laravel 日誌
    tail -f storage/logs/laravel.log
    
    # Apache 日誌
    tail -f C:\laragon\etc\apache2\logs\error.log
    
    # MySQL 日誌
    tail -f C:\laragon\etc\mysql\data\mysql-error.log
    ```

14. **效能監控**
    ```bash
    # 使用 Laravel Telescope（開發環境）
    composer require laravel/telescope --dev
    php artisan telescope:install
    php artisan migrate
    ```

15. **API 測試**
    ```bash
    # 使用 Postman 或 curl 測試
    curl -X GET http://inventory-system.test/api/health
    curl -X POST http://inventory-system.test/api/login \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@example.com","password":"password"}'
    ```

## 📂 專案結構

```
Mir01/
├── inventory-api/          # Laravel 後端
│   ├── app/               # 應用程式核心
│   │   ├── config/            # 配置文件
│   │   ├── database/          # 資料庫相關
│   │   ├── routes/            # API 路由
│   │   └── tests/             # 測試文件
│   │
│   └── inventory-client/       # Next.js 前端
│       ├── src/
│       │   ├── app/           # App Router 頁面
│       │   ├── components/    # React 元件
│       │   ├── hooks/         # 自定義 Hooks
│       │   ├── lib/           # 工具函式
│       │   └── types/         # TypeScript 類型
│       └── public/            # 靜態資源
│
└── 文檔/                  # 專案文檔
    ├── 技術架構文檔.md
    ├── API契約同步報告.md
    └── 進貨管理功能說明.md
```

## 🚀 Laragon 部署最佳實踐

### 1. 專案結構建議

```
C:\laragon\www\
└── inventory-system\              # 專案根目錄
    ├── inventory-api\             # Laravel 後端
    │   ├── public\                # Web 根目錄
    │   ├── storage\               # 存儲目錄
    │   └── .env                   # 環境配置
    └── inventory-client\          # Next.js 前端
        ├── .next\                 # Next.js 建構目錄
        └── .env.local             # 前端環境配置
```

### 2. 環境配置最佳實踐

#### Laravel 環境配置
```env
# 生產環境建議
APP_ENV=production
APP_DEBUG=false
APP_URL=https://inventory-system.test

# 資料庫配置
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventory_api
DB_USERNAME=root
DB_PASSWORD=your_secure_password

# 快取配置
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# 郵件配置（如需要）
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
```

#### Next.js 環境配置
```env
# 生產環境建議
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://inventory-system.test
NEXTAUTH_URL=https://localhost:3000
NEXTAUTH_SECRET=your-very-secure-secret-key-here
```

### 3. 安全配置

#### Apache 安全設定
```apache
# 在 .htaccess 中添加安全頭
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# 隱藏 PHP 版本
ServerTokens Prod
ServerSignature Off
```

#### MySQL 安全設定
```sql
-- 創建專用資料庫用戶
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON inventory_api.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 效能優化

#### Laravel 優化
```bash
# 生產環境優化
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# 設定檔案權限
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

#### Apache 優化
```apache
# 啟用 Gzip 壓縮
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# 設定快取
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 5. 備份策略

#### 資料庫備份
```bash
# 創建備份腳本
@echo off
set BACKUP_DIR=C:\backups\inventory-system
set TIMESTAMP=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set BACKUP_FILE=%BACKUP_DIR%\inventory_api_%TIMESTAMP%.sql

mkdir %BACKUP_DIR% 2>nul
mysqldump -u root -p inventory_api > %BACKUP_FILE%
echo Backup created: %BACKUP_FILE%
```

#### 檔案備份
```bash
# 備份重要檔案
robocopy "C:\laragon\www\inventory-system" "C:\backups\inventory-system\files" /MIR /XD node_modules .git .next storage\logs
```

### 6. 監控與日誌

#### 錯誤監控
```bash
# 設定 Laravel 日誌輪替
# 在 config/logging.php 中配置
'daily' => [
    'driver' => 'daily',
    'path' => storage_path('logs/laravel.log'),
    'level' => 'debug',
    'days' => 14,
],
```

#### 效能監控
```bash
# 安裝 Laravel Telescope（開發環境）
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate

# 安裝 Laravel Horizon（如使用佇列）
composer require laravel/horizon
php artisan horizon:install
```

### 7. 開發工作流程

#### Git 工作流程
```bash
# 開發分支策略
git checkout -b feature/new-feature
# 開發完成後
git add .
git commit -m "feat: 新增功能說明"
git push origin feature/new-feature
# 創建 Pull Request
```

#### 自動化部署
```bash
# 創建部署腳本 deploy.bat
@echo off
echo 正在部署到 Laragon...
cd C:\laragon\www\inventory-system

echo 更新程式碼...
git pull origin main

echo 更新後端依賴...
cd inventory-api
composer install --optimize-autoloader --no-dev

echo 執行資料庫遷移...
php artisan migrate --force

echo 清除快取...
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo 更新前端...
cd ..\inventory-client
npm install
npm run build

echo 部署完成！
```

## 📞 支援

如有問題，請查看專案中的其他文檔：
- `技術架構文檔.md` - 詳細的技術架構說明
- `問題解決記錄.md` - 已解決問題的記錄
- `架構規則.md` - 開發規範和最佳實踐
- `前後端API契約修復任務清單.md` - API 契約同步指南

### 常用資源
- [Laravel 官方文檔](https://laravel.com/docs)
- [Next.js 官方文檔](https://nextjs.org/docs)
- [Laragon 官方文檔](https://laragon.org/docs)
- [shadcn/ui 文檔](https://ui.shadcn.com)

---

**注意事項：**
- 預設管理員帳號：`admin@example.com` / `password`
- 請在生產環境中修改所有預設密碼
- 定期備份資料庫和重要檔案
- 保持依賴套件更新
- 定期檢查安全漏洞
- 監控系統效能和日誌 

## 開發紀錄

### 訂單管理頁面優化 (2024-01-XX)

#### 訂單預覽 Modal 重構
- **設計風格**：採用現代電商平台設計風格，參考 Shopify、Stripe 等平台
- **使用技術**：完全使用 shadcn/UI 組件和顏色系統
- **主要特點**：
  - 卡片式布局，清晰分組顯示訂單資訊
  - 狀態視覺化，使用色彩和圖標明確表示付款和出貨狀態  
  - 響應式設計，支援各種螢幕尺寸
  - 簡約現代的視覺風格
- **組件結構**：
  - Header：顯示訂單號和日期
  - 狀態卡片：付款狀態和出貨狀態
  - 客戶資訊卡片：姓名、電話、地址
  - 商品明細卡片：商品列表和費用明細
  - 付款紀錄卡片：顯示所有付款記錄
  - Footer：查看詳情和編輯訂單按鈕