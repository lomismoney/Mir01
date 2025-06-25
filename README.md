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
- **@tanstack/react-query** - 狀態管理
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
1. 開啟 Laragon
2. 啟動 MySQL 服務
3. 使用 phpMyAdmin 或 HeidiSQL 創建資料庫 `inventory-api`

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

## 📞 支援

如有問題，請查看專案中的其他文檔：
- `技術架構文檔.md` - 詳細的技術架構說明
- `問題解決記錄.md` - 已解決問題的記錄
- `架構規則.md` - 開發規範和最佳實踐

---

**注意事項：**
- 預設管理員帳號：`admin@example.com` / `password`
- 請在生產環境中修改所有預設密碼
- 定期備份資料庫
- 保持依賴套件更新 