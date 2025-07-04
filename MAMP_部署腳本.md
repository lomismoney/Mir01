# 🍎 MAMP 部署腳本

## 📋 部署前準備

### 1. 確認 MAMP 已啟動
```bash
# 打開 MAMP 控制面板
# 確認以下服務已啟動（顯示綠色）：
# - Apache (Port: 80)
# - MySQL (Port: 8889)
```

### 2. 創建資料庫
```bash
# 在瀏覽器中打開 phpMyAdmin
# 訪問：http://localhost/phpMyAdmin/
# 或者：http://localhost:8080/phpMyAdmin/
```

**在 phpMyAdmin 中執行：**
1. 點擊 "新增" 創建新資料庫
2. 資料庫名稱輸入：`inventory_api`
3. 編碼選擇：`utf8mb4_unicode_ci`
4. 點擊 "建立"

---

## 🚀 後端部署

### 1. 進入後端目錄
```bash
cd inventory-api
```

### 2. 安裝 Composer 依賴
```bash
composer install
```

### 3. 生成應用程式密鑰
```bash
php artisan key:generate
```

### 4. 執行資料庫遷移
```bash
php artisan migrate
```

### 5. 執行資料填充（可選）
```bash
php artisan db:seed
```

### 6. 創建儲存連結
```bash
php artisan storage:link
```

### 7. 清除快取
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### 8. 生成 API 文檔
```bash
php artisan scribe:generate
```

### 9. 啟動後端服務
```bash
php artisan serve
```

**後端服務將運行在：** `http://localhost:8000`  
**API 文檔將可在：** `http://localhost:8000/docs`

---

## 🎨 前端部署

### 1. 開啟新終端視窗，進入前端目錄
```bash
cd inventory-client
```

### 2. 安裝 npm 依賴
```bash
npm install
```

### 3. 同步 API 類型（如果有 openapi.yaml）
```bash
# 複製後端生成的 API 文檔
cp ../inventory-api/storage/app/private/scribe/openapi.yaml ./

# 生成 TypeScript 類型
npm run api:types
```

### 4. 啟動前端服務
```bash
npm run dev
```

**前端服務將運行在：** `http://localhost:3000`

---

## 🔧 驗證部署

### 1. 檢查後端
- 訪問：`http://localhost:8000`
- 應該看到 Laravel 歡迎頁面

### 2. 檢查 API 文檔
- 訪問：`http://localhost:8000/docs`
- 應該看到 Scribe 生成的 API 文檔

### 3. 檢查前端
- 訪問：`http://localhost:3000`
- 應該看到庫存管理系統登入頁面

### 4. 測試 API 連接
- 在前端嘗試登入
- 使用預設帳號（如果有執行 seeder）

---

## 🎯 測試帳號

如果您執行了 `php artisan db:seed`，系統會創建測試數據：

```
管理員帳號：
Email: admin@example.com
Password: password
```

---

## 🐛 常見問題

### 1. 資料庫連接錯誤
```bash
# 確認 MAMP MySQL 服務已啟動
# 確認 .env 中的資料庫設定正確
# 確認資料庫 inventory_api 已創建
```

### 2. 權限問題
```bash
cd inventory-api
sudo chmod -R 777 storage
sudo chmod -R 777 bootstrap/cache
```

### 3. Composer 依賴問題
```bash
composer update
```

### 4. npm 依賴問題
```bash
cd inventory-client
rm -rf node_modules
npm install
```

### 5. API 類型同步問題
```bash
# 重新生成 API 文檔
cd inventory-api
php artisan scribe:generate

# 複製並生成類型
cd ../inventory-client
cp ../inventory-api/storage/app/private/scribe/openapi.yaml ./
npm run api:types
```

---

## 🎉 部署完成

如果所有步驟都執行成功，您的庫存管理系統現在已經在 MAMP 環境下運行！

**前端應用：** `http://localhost:3000`  
**後端 API：** `http://localhost:8000`  
**API 文檔：** `http://localhost:8000/docs`

---

## 📝 下一步

1. 探索系統功能
2. 查看 API 文檔
3. 根據需求開發新功能
4. 定期備份資料庫

**祝您使用愉快！** 🚀 