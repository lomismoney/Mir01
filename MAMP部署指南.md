# 🍎 Mac + MAMP 庫存管理系統部署指南

## 📋 部署狀態
✅ **已完成部署** - 2024年12月

## 🎯 部署配置摘要

### 環境信息
- **操作系統**: macOS
- **開發環境**: MAMP
- **資料庫**: MySQL 8.0 (端口: 8889)
- **Web服務器**: Apache (端口: 80)
- **PHP版本**: 8.0+
- **Node.js**: 18.x+

### 專案結構
```
Min01/
├── inventory-api/          # Laravel 後端 (PHP)
│   ├── .env               # 後端環境配置
│   └── storage/           # 儲存目錄
├── inventory-client/       # Next.js 前端 (TypeScript)
│   ├── .env.local         # 前端環境配置
│   └── src/types/api.ts   # API類型定義
└── MAMP部署指南.md        # 本文檔
```

## 🔧 環境配置

### 後端配置 (inventory-api/.env)
```env
APP_NAME="庫存管理系統"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

# 資料庫設定 (MAMP)
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=8889
DB_DATABASE=inventory_api
DB_USERNAME=root
DB_PASSWORD=root

# Sanctum 設定
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:3000
```

### 前端配置 (inventory-client/.env.local)
```env
# API 端點
NEXT_PUBLIC_API_BASE_URL=http://localhost:8888

# NextAuth 設定
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=ce89915d5dc0860800698eaaae0de06c500e5c4cc0d02afd1a7b6fcf2a2a5f25

# 開發環境設定
NODE_ENV=development
```

## 🚀 啟動服務

### 1. 啟動 MAMP
```bash
# 打開 MAMP 控制面板
# 點擊 "Start Servers"
# 確認 Apache 和 MySQL 都顯示綠色狀態
```

### 2. 啟動後端服務
```bash
cd inventory-api
php artisan serve
```
- 後端將運行在: `http://localhost:8000`
- API文檔: `http://localhost:8000/docs`

### 3. 啟動前端服務
```bash
cd inventory-client
npm run dev
```
- 前端將運行在: `http://localhost:3000`

## 🎲 測試數據

系統已預載以下測試數據：
- **用戶**: 管理員帳號 `admin@example.com` / `password`
- **商品**: 6個商品，43個商品變體
- **分類**: 9個商品分類
- **庫存**: 68筆庫存記錄
- **進貨**: 10筆進貨單，25筆進貨項目
- **屬性**: 4個屬性，24個屬性值

## 📊 功能模組

### 已實現功能
- ✅ **用戶認證系統** - 登入/登出、權限管理
- ✅ **商品管理** - 商品CRUD、變體管理、圖片上傳
- ✅ **分類管理** - 分類CRUD、排序功能
- ✅ **屬性管理** - 商品屬性和屬性值管理
- ✅ **庫存管理** - 庫存查詢、調整、轉移
- ✅ **進貨管理** - 進貨單CRUD、狀態追蹤
- ✅ **訂單管理** - 訂單CRUD、付款管理、出貨管理
- ✅ **客戶管理** - 客戶信息管理
- ✅ **安裝管理** - 安裝工程管理
- ✅ **用戶管理** - 多角色權限系統
- ✅ **店鋪管理** - 多店鋪支援

### 技術特色
- 📱 **響應式設計** - 支援各種螢幕尺寸
- 🔐 **安全認證** - Laravel Sanctum + NextAuth
- 🎨 **現代UI** - shadcn/ui + Tailwind CSS
- 📊 **即時查詢** - TanStack Query 狀態管理
- 📝 **API文檔** - 自動生成的OpenAPI文檔
- 🔄 **類型安全** - TypeScript + 自動API類型生成

## 🔧 維護指令

### 後端維護
```bash
cd inventory-api

# 清除快取
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# 重新生成API文檔
php artisan scribe:generate

# 執行測試
php artisan test

# 查看資料庫狀態
php artisan migrate:status
```

### 前端維護
```bash
cd inventory-client

# 更新API類型
npm run api:types

# 程式碼檢查
npm run lint

# 建構生產版本
npm run build
```

## 🐛 常見問題解決

### 1. 資料庫連接問題
```bash
# 檢查MAMP狀態
# 確認MySQL服務正在運行
# 驗證.env中的DB_PORT=8889
```

### 2. API類型同步問題
```bash
cd inventory-api
php artisan scribe:generate
cp storage/app/private/scribe/openapi.yaml ../inventory-client/
cd ../inventory-client
npm run api:types
```

### 3. 權限問題
```bash
cd inventory-api
chmod -R 777 storage bootstrap/cache
```

### 4. 前端無法連接後端
```bash
# 檢查前端.env.local中的API URL
# 確認NEXT_PUBLIC_API_BASE_URL=http://localhost:8888
# 檢查CORS設定
```

## 📚 相關資源

### 官方文檔
- [Laravel 文檔](https://laravel.com/docs)
- [Next.js 文檔](https://nextjs.org/docs)
- [MAMP 文檔](https://www.mamp.info/en/documentation/)

### 專案文檔
- `README.md` - 完整專案說明
- `架構規則.md` - 開發規範
- `前後端API契約修復任務清單.md` - API同步指南

## 🎯 下一步

1. **訪問前端應用**: `http://localhost:3000`
2. **使用測試帳號登入**: `admin@example.com` / `password`
3. **查看API文檔**: `http://localhost:8000/docs`
4. **開始開發**: 參考專案文檔進行功能開發

## 🚨 重要提醒

- 請勿在生產環境使用預設密碼
- 定期備份資料庫
- 保持依賴套件更新
- 監控系統日誌

---

**部署完成時間**: 2024年12月  
**部署環境**: Mac + MAMP  
**專案狀態**: 生產就緒 🚀 