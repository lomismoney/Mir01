# CLAUDE.md

此檔案為 Claude Code (claude.ai/code) 在此存儲庫中工作時提供指導。

## 專案概述

這是一個使用 Laravel 12 (後端) 和 Next.js 15 (前端) 構建的**全端庫存管理系統**。系統實現了複雜的 SPU/SKU 架構，支援多門市產品管理、安裝服務和全面的財務追蹤。

## 核心架構

### 後端 (Laravel 12)
- **領域模型**: 基於屬性變體的 SPU/SKU 產品架構
- **多門市支援**: 門市特定庫存和使用者分配
- **業務服務**: 豐富的服務層處理複雜操作
- **API 優先設計**: 使用 Sanctum 驗證的 RESTful API
- **資料完整性**: 資料庫事務和完整驗證

### 前端 (Next.js 15)
- **App Router**: 現代 Next.js 路由與伺服器元件
- **TypeScript**: 完整型別安全與 OpenAPI 生成型別
- **shadcn/ui**: 一致的設計系統與 Radix UI
- **TanStack Query**: 高效的資料獲取和狀態管理
- **表單管理**: react-hook-form 與 Zod 驗證

## 重要指令

### 後端 (Laravel) - 在 `inventory-api/` 目錄執行
```bash
# 開發
php artisan serve                    # 啟動開發伺服器
composer dev                        # 啟動所有服務 (伺服器、佇列、日誌、vite)

# 測試
php artisan test                     # 執行所有測試
php artisan test --filter TestName  # 執行特定測試

# 資料庫
php artisan migrate                  # 執行遷移
php artisan migrate:fresh --seed    # 重新建立資料庫並填入範例資料
php artisan db:seed                 # 填入資料庫

# API 文檔
php artisan scribe:generate         # 生成 API 文檔

# 程式碼品質
./vendor/bin/pint                   # 格式化程式碼 (Laravel Pint)

# 快取管理
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### 前端 (Next.js) - 在 `inventory-client/` 目錄執行
```bash
# 開發
npm run dev                         # 啟動開發伺服器 (使用 Turbopack)

# 建置
npm run build                       # 建置生產版本
npm run start                       # 啟動生產伺服器

# 測試
npm run test                        # 執行測試
npm run test:watch                  # 監視模式執行測試
npm run test:coverage               # 執行測試並生成覆蓋率報告

# 程式碼品質
npm run lint                        # ESLint 檢查

# API 型別
npm run api:types                   # 從 OpenAPI 生成 TypeScript 型別
```

## 核心業務模型

### 產品架構 (SPU/SKU)
- **Product**: 標準產品單位 (例如：「經典 T 恤」)
- **ProductVariant**: 庫存保存單位 (例如：「紅色-小號 T 恤」)
- **Attributes**: 產品特徵 (顏色、尺寸等)
- **Inventory**: 門市特定的變體庫存水準

### 核心實體
- **Store**: 多門市支援與使用者分配
- **Customer**: 客戶管理與地址
- **Order**: 完整的訂單生命週期與雙重狀態追蹤
- **Purchase**: 採購訂單管理與成本分配
- **Installation**: 安裝服務排程
- **User**: 角色基礎存取 (管理員、員工、檢視者、安裝員)

### 財務與庫存
- **InventoryTransaction**: 所有庫存異動的稽核軌跡
- **InventoryTransfer**: 門市間庫存轉移
- **PaymentRecord**: 部分付款支援
- **Refund**: 退貨和退款管理

## 開發工作流程

### API 契約同步
當進行 API 變更時：
```bash
# 1. 更新後端 API (新增路由、控制器等)
cd inventory-api
php artisan scribe:generate

# 2. 複製 OpenAPI 規格到前端
cp public/docs/openapi.yaml ../inventory-client/openapi.yaml

# 3. 生成 TypeScript 型別
cd ../inventory-client
npm run api:types
```

### 新增功能
1. **後端**: 建立遷移 → 模型 → 表單請求 → 政策 → 控制器 → 路由 → API 文檔
2. **前端**: 同步 API 型別 → 建立型別 → API hooks → 元件 → 頁面

## 重要檔案位置

### 後端
- `app/Http/Controllers/Api/` - API 控制器
- `app/Services/` - 業務邏輯服務
- `app/Models/` - Eloquent 模型
- `app/Http/Requests/Api/` - 表單驗證
- `app/Policies/` - 授權政策
- `routes/api.php` - API 路由
- `database/migrations/` - 資料庫結構

### 前端
- `src/app/` - Next.js 頁面 (App Router)
- `src/components/` - React 元件
- `src/hooks/` - 自訂 React hooks
- `src/lib/` - 工具函式
- `src/types/` - TypeScript 型別定義
- `openapi.yaml` - API 規格

## 架構模式

### 服務層
- **InventoryService**: 庫存操作與預訂支援
- **OrderService**: 訂單生命週期和付款處理
- **ProductService**: SPU/SKU 管理
- **PurchaseService**: 採購訂單管理
- **InstallationService**: 服務排程

### 資料轉換
- **Resource Classes**: API 回應轉換
- **Data Transfer Objects**: 型別安全的資料處理 (Spatie Laravel Data)
- **OpenAPI Types**: 自動生成的 TypeScript 型別

### 授權
- **角色**: 管理員、員工、檢視者、安裝員
- **政策**: 資源基礎的授權
- **多門市**: 使用者-門市關係權限

## 測試策略

### 後端 (PHPUnit)
- **單元測試**: 服務層和模型邏輯
- **功能測試**: API 端點和整合測試
- **資料庫**: 記憶體內 SQLite 進行測試

### 前端 (Jest)
- **元件測試**: React 元件行為
- **Hook 測試**: 自訂 hook 功能
- **API 測試**: 使用 Mock Service Worker 進行 API 呼叫

## 常見模式

### 錯誤處理
- **後端**: 表單請求 + 服務層驗證
- **前端**: Zod 結構描述 + 錯誤邊界
- **API**: 一致的錯誤回應格式

### 狀態管理
- **後端**: 資料庫事務確保一致性
- **前端**: TanStack Query 處理伺服器狀態
- **表單**: react-hook-form 與驗證

### 程式碼風格
- **後端**: Laravel Pint (PSR-12)
- **前端**: ESLint + Prettier
- **資料庫**: Snake_case 命名
- **API**: Camel_case 回應

## 環境設定

### 必要服務
- **資料庫**: MySQL (主要) / SQLite (測試)
- **快取**: 檔案基礎 (開發) / Redis (生產)
- **佇列**: 同步 (開發) / Redis (生產)
- **儲存**: 本地 (開發) / S3 (生產)

### 關鍵設定
- **CORS**: 為前端域名進行設定
- **Sanctum**: SPA 驗證的狀態域
- **Media Library**: 圖片上傳和處理
- **Scribe**: API 文檔生成

## 效能考量

### 資料庫
- **預載關聯**: 使用 `with()` 載入關聯
- **查詢優化**: 使用 QueryBuilder 套件
- **索引**: 外鍵和搜尋欄位已建立索引
- **分頁**: 內建 Laravel 分頁

### 前端
- **程式碼分割**: Next.js 自動處理
- **圖片優化**: Next.js Image 元件
- **快取**: TanStack Query 適當的過期時間
- **包大小分析**: 監控包大小

## 安全最佳實踐

### 身份驗證
- **Sanctum**: 基於 Token 的 API 驗證
- **CSRF 保護**: 狀態域設定
- **密碼雜湊**: 適當輪數的 Bcrypt

### 授權
- **政策基礎**: 資源授權
- **角色基礎**: Spatie Permission 套件
- **輸入驗證**: 表單請求 + 前端驗證

### 資料保護
- **大量賦值**: 已定義可填入屬性
- **SQL 注入**: Eloquent ORM 保護
- **XSS 防護**: 適當的輸出轉義