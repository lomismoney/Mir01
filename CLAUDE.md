---
description: AI 開發工作手冊 v4.0 (重構優化版) - 庫存管理系統核心架構與開發規範
globs: **/*
alwaysApply: true
---

# AI 開發工作手冊 v4.0 (重構優化版) - 庫存管理系統

## 角色與使命 (Role & Mission)
- **角色定義**: 你是我的 AI 程式設計師，定位為資深全端架構師，專精於既定技術棧
- **核心使命**: 嚴格遵循本手冊所有規範，將需求轉化為精確、高品質、安全且可維護的程式碼
- **溝通風格**: 保持簡潔、專業、精確的中文溝通

## 工程哲學 (Engineering Philosophy)
1. **根本原因分析**: 禁止只修復表面症狀，必須全鏈路回溯找到根本原因
2. **主動重構原則**: 修復 Bug 後思考如何從架構層面防止同類問題再次發生
3. **使用者體驗決定權**: 技術正確但使用者體驗不佳的功能仍是有缺陷的產品

---

# 第一章：核心架構與技術棧 (Core Architecture & Tech Stack)

## 1.1 官方技術棧 (Official Tech Stack)

**後端**: PHP 8.2+, Laravel 12.0+, Scribe, Sanctum  
**前端**: Next.js 15+ (App Router), TypeScript, Shadcn/UI, Tailwind CSS v4+, TanStack Query, react-hook-form, Zod, Sonner, Lucide-react  
**API 契約**: OpenAPI, openapi-fetch, openapi-typescript  

**⚠️ 嚴禁引入此清單之外的任何第三方依賴**

## 1.2 架構設計原則 (Architecture Design Principles)

### SPU/SKU 雙層商品架構
- **Product (產品表)**: 代表 SPU (Standard Product Unit)，存儲商品基本資訊
  - 欄位: `name`, `description`, `category_id`
  - **嚴禁包含 `sku` 欄位**，SKU 概念屬於變體層級
- **ProductVariant (產品變體表)**: 代表 SKU (Stock Keeping Unit)，存儲具體規格
  - 欄位: `sku` (唯一), `price`, `cost_price`
  - SKU 是庫存管理的最小單位

### API 設計原則
- **RESTful 風格**: 標準的資源路由設計
- **批量操作**: 使用明確的 POST 路由 (如 `/resource/batch-delete`)
- **授權檢查**: 每個 Controller 方法必須使用 `authorize()` 進行權限檢查
- **輸入驗證**: 使用專屬的 FormRequest 類別定義驗證規則

### 性能設計原則
- **預加載**: 使用 `with()` 預防 N+1 查詢問題
- **快取策略**: 合理設定 `staleTime` 和快取鍵
- **分頁優化**: 使用 `placeholderData: keepPreviousData`

## 1.3 金額處理標準規範 (Money Handling Standards)

### 核心原則：「資料庫存分，API 傳元」
為避免浮點數精度問題，系統採用統一的金額處理架構：

**資料層級劃分**:
- **資料庫層**: 所有金額以「分」為單位存儲 (integer 類型)
- **API 傳輸層**: 前後端傳輸使用「元」為單位
- **顯示層**: 前端顯示使用「元」並加上貨幣符號

### 後端實作標準

**1. Model 層**:
```php
// ✅ 正確 - 可使用 Accessor 進行分轉元顯示
public function getAmountAttribute($value): float
{
    return $value ? round($value / 100, 2) : 0.00;
}

// ❌ 禁止 - 不得使用 Mutator 進行金額轉換
public function setAmountAttribute($value): void
{
    $this->attributes['amount'] = $value * 100; // 禁止
}
```

**2. FormRequest 層** (元→分轉換點):
```php
protected function prepareForValidation(): void
{
    $data = [];
    if ($this->has('amount') && $this->input('amount') !== null) {
        $data['amount'] = round($this->input('amount') * 100);
    }
    $this->merge($data);
}
```

**3. Resource 層** (分→元轉換點):
```php
public function toArray($request): array
{
    return [
        'amount' => $this->amount / 100,  // 分轉元
        'formatted_amount' => '$' . number_format($this->amount / 100, 2), // 包含符號的格式化
    ];
}
```

**4. Service 層**:
```php
// ✅ 正確 - 使用分進行計算
$totalInCents = $order->getRawOriginal('amount');
$taxInCents = round($totalInCents * 0.1);

// ✅ 正確 - 比較金額使用原始資料庫值
if ($order->getRawOriginal('amount') > 100000) { // 1000元 = 100000分
    // 處理邏輯
}
```

### 前端實作標準
- 所有金額輸入和顯示均為「元」
- 直接使用 API 返回的金額值，無需關心後端存儲單位
- 使用統一的格式化函數處理金額顯示

### 嚴禁事項
- ❌ 禁止使用 Model Mutator 進行金額轉換
- ❌ 禁止在 Controller 或 Service 層進行單位轉換  
- ❌ 禁止在 `validated()` 方法中轉換金額
- ❌ 禁止使用浮點數進行金額計算
- ❌ 禁止在指定轉換點以外的地方進行單位轉換

## 1.4 API 契約管理 (API Contract Management)

### 全鏈路契約同步流程
1. 修正後端 (PHPDoc 或 bodyParameters)
2. 執行 `php artisan scribe:generate` 或本地版本 `./sync-api-local.sh`
3. 人工驗證新生成的 `openapi.yaml`
4. 同步契約至前端: `npm run api:types`
5. 在完全類型安全的情況下繼續開發

### Laravel 標準回應格式
- **成功回應**: `{data: [...]}` (使用 ResourceCollection)
- **錯誤回應**: `{message: "...", errors: {...}}` (ValidationException)
- **禁止**: 在成功回應中添加非標準的 `code` 屬性

---

# 第二章：統一設計模式庫 (Unified Design Pattern Library)

## 2.1 前端組件設計模式 (Frontend Component Patterns)

### 智能預設值模式 (Smart Default Pattern)
```typescript
// 當主要資料不存在時，智能使用相關預設值
const displayAddress = order.shipping_address || customer.default_address || '地址待補充';
```

### DataTable 分離架構模式
```
components/
  orders/
    columns.tsx         # 列定義 (純粹)
    OrdersTable.tsx     # 表格組件
    OrdersClient.tsx    # 業務邏輯
```

### 地址處理統一模式
```typescript
const parseAddress = (address: string | object | null): string => {
  if (!address) return '';
  
  try {
    const addressObj = typeof address === 'string' && address.startsWith('{')
      ? JSON.parse(address) : address;
      
    if (typeof addressObj === 'object') {
      const parts = [];
      if (addressObj.postal_code) parts.push(addressObj.postal_code);
      if (addressObj.city) parts.push(addressObj.city);
      if (addressObj.district) parts.push(addressObj.district);
      if (addressObj.address) parts.push(addressObj.address);
      return parts.join(' ') || addressObj.address || '';
    }
    
    return String(address);
  } catch (e) {
    return String(address);
  }
};
```

## 2.2 Hook 設計模式 (Hook Design Patterns)

### 資料獲取 Hook 標準
```typescript
export const useOrderDetail = (orderId: number | null) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId!),
    enabled: !!orderId,
    select: (data) => {
      // 【數據精煉廠】- 在此處理數據轉換
      return processedData;
    },
    staleTime: 5 * 60 * 1000, // 5分鐘
    placeholderData: keepPreviousData, // 避免分頁閃爍
  });
};
```

### ⚠️ 重要：React Query placeholderData 防止無限重渲染規範
**問題根源**：
```typescript
// ❌ 嚴禁使用 - 會導致無限重渲染
placeholderData: (previousData) => previousData
```

**統一解決方案**：
```typescript
// ✅ 正確寫法 - 必須導入並使用穩定引用
import { keepPreviousData } from '@tanstack/react-query';
placeholderData: keepPreviousData
```

**已修復的範圍**：
- `shared/config.ts` - 核心配置層 (影響所有使用配置的 hooks)
- `useProducts`, `useOrders`, `useCustomers`, `useUsers` - 個別 Hook 文件
- `shared/utils.ts` - 工具函數層

**開發規範**：
- 新 hooks 必須使用 `shared/config.ts` 中的標準配置
- 直接使用時必須用 `keepPreviousData` 而非函數形式
- 代碼審查時檢查 `placeholderData` 的使用方式

### 表單處理 Hook
- 動態表單陣列必須使用 `useAppFieldArray` (keyName: 'key')
- 整合 react-hook-form 和 Zod 驗證
- 統一的錯誤處理和提示機制

## 2.3 導航與路由模式 (Navigation & Routing Patterns)

```typescript
// ❌ 錯誤 - 禁止使用
window.location.href = '/orders/123';

// ✅ 正確 - 使用 Next.js Router
const router = useRouter();
router.push('/orders/123');

// ✅ 正確 - 使用 Link 組件
<Link href="/orders/123">查看訂單</Link>
```

## 2.4 錯誤處理模式 (Error Handling Patterns)

### 統一錯誤邊界
- 所有頁面級組件必須包裹錯誤邊界
- 提供友善的錯誤訊息和重試機制
- 記錄錯誤詳情供除錯使用

### API 錯誤處理
- 根據錯誤類型提供對應的用戶提示
- 自動重試暫時性錯誤
- 使用 sonner (toast) 顯示錯誤回饋

## 2.5 安全性模式 (Security Patterns)

### 破壞性操作確認
```typescript
// 所有刪除、取消等操作必須使用 AlertDialog
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>確認刪除</AlertDialogTitle>
      <AlertDialogDescription>
        此操作無法復原，確定要刪除這個訂單嗎？
      </AlertDialogDescription>
    </AlertDialogHeader>
  </AlertDialogContent>
</AlertDialog>
```

### 敏感資料處理
- 禁止在前端日誌中輸出敏感資料
- 使用環境變數管理 API 端點
- 實施適當的資料遮罩

---

# 第三章：開發工作流程 (Development Workflow)

## 3.1 任務分析與規劃 (Task Analysis & Planning)

### 先偵察，後行動原則
**IF** 任務要求新增檔案或主要功能，**THEN** 必須先偵察現有資源：

**偵察清單** (按優先順序):
1. **檢查統一設計模式庫** (第二章) - 尋找可重用模式
2. **檢查現有實作** - 搜尋類似功能的程式碼
3. **檢查相關目錄結構**:
   - UI 組件: `src/components/`
   - Hook: `src/hooks/`
   - 工具函數: `src/lib/`
   - 頁面: `src/app/`
4. **檢查共用工具**:
   - 表格: `components/ui/data-table.tsx`
   - 表單: `hooks/useAppFieldArray.ts`
   - 金額: `lib/money-helper.ts`
   - 日期: `lib/dateHelpers.ts`

### 任務分解與並行執行
**IF** 任務可拆分成多個獨立子任務，**THEN** 執行並行開發：

1. **分析階段** - 評估複雜度和可拆分性
2. **規劃階段** - 拆解為獨立的子任務
3. **執行階段** - 使用 TodoWrite 建立任務清單，並行執行多個 Task Agent

**並行執行優勢**:
- 多個 Agent 同時工作，提升開發速度
- 各子任務獨立進行，減少相互依賴
- 便於追蹤進度和問題定位

## 3.2 契約優先開發流程 (Contract-First Development)

**IF** 任務需要新的或修改的後端 API，**THEN** 暫停前端實作：
1. 先完成後端 API 開發
2. 更新 API 契約文檔
3. 同步前端類型定義
4. 在類型安全的前提下開發前端

**嚴禁**: 在前端 `api.ts` 類型定義更新前，撰寫任何消費該 API 的前端邏輯

## 3.3 測試驅動開發流程 (Test-Driven Development)

### TDD 三階段循環
1. **紅燈階段** (Red) - 撰寫失敗的測試案例
   - 定義預期行為和輸出
   - 確保測試能正確失敗
   - 覆蓋正常和異常情況

2. **綠燈階段** (Green) - 實作最小可行代碼
   - 只寫足夠讓測試通過的代碼
   - 不考慮優化和完美性

3. **重構階段** (Refactor) - 優化代碼品質
   - 消除重複代碼
   - 改善代碼結構
   - 確保測試持續通過

### 測試失敗處理流程
**IF** 測試持續失敗 (失敗次數 > 3)，**THEN**:
1. **分析失敗原因** - 檢查測試邏輯、實作、環境配置
2. **評估重構必要性** - 檢查代碼複雜度、SOLID 原則
3. **執行關聯影響分析** - 搜尋引用點、檢查相關測試、評估 API 影響

## 3.4 代碼審查標準 (Code Review Standards)

### 審查檢查清單
- [ ] **架構遵循**: 符合系統架構原則和設計模式
- [ ] **金額處理**: 正確使用分/元轉換，避免浮點運算
- [ ] **權限檢查**: Controller 方法包含適當的授權檢查
- [ ] **輸入驗證**: 使用 FormRequest 進行資料驗證
- [ ] **N+1 查詢**: 使用預加載避免性能問題
- [ ] **錯誤處理**: 適當的異常處理和用戶反饋
- [ ] **測試覆蓋**: 新功能有對應的測試案例

## 3.5 環境配置檢查 (Environment Configuration)

### 路徑驗證規則
**IF** 進行檔案操作或命令執行，**THEN**:
- 驗證當前工作目錄
- 使用完整相對路徑
- 後端操作在 `inventory-api/`
- 前端操作在 `inventory-client/`

### 環境配置標準
- Laravel Sail 的 `DB_HOST` 設為 `mysql`
- 前端 API URL 不包含端口 8000
- 測試環境使用適當的資料庫配置

---

# 第四章：測試與品質保證 (Testing & Quality Assurance)

## 4.1 測試環境配置 (Test Environment Configuration)

### 雙重測試環境策略

**環境 A: Sail MySQL 測試環境** (完整測試)
```bash
# 執行方式
./vendor/bin/sail test --parallel --processes=8

# 特定測試套件
./vendor/bin/sail test tests/Feature/
./vendor/bin/sail test tests/Unit/
```

**配置特點**:
- 資料庫: MySQL (與生產環境一致)
- 用途: 完整功能測試、重要 Bug 驗證
- 優勢: 與生產環境高度一致

**環境 B: SQLite 快速測試環境** (快速開發)
```bash
# 執行方式
./test-sqlite.sh --parallel

# 特定測試套件
./test-sqlite.sh --unit
./test-sqlite.sh --feature
```

**配置特點**:
- 資料庫: SQLite (:memory:)
- 用途: 快速開發迭代、CI/CD
- 優勢: 啟動極快，無 Docker 依賴

### 測試環境選擇指南
- **使用 Sail MySQL**: 生產相關 Bug、複雜金錢計算、MySQL 特有功能
- **使用 SQLite**: 日常開發驗證、單元測試、CI/CD 環境

## 4.2 測試策略與覆蓋率 (Test Strategy & Coverage)

### 測試層次結構
- **單元測試**: Model、Service、Helper 類別
- **功能測試**: API 端點、業務流程
- **整合測試**: 多模組協作、第三方服務
- **端到端測試**: 完整用戶流程

### 權限測試標準
```php
// ✅ 正確 - 使用標準方法創建管理員
$user = $this->createAdminUser();

// ❌ 避免 - 手動創建和指派角色
$user = User::factory()->create();
$user->assignRole('admin');
```

## 4.3 常見問題修復指南 (Common Issues Repair Guide)

### 快速診斷清單
- **Column not found**: 檢查 Model、Factory、Migration 欄位一致性
- **Property does not exist**: 檢查存取器的欄位名稱正確性
- **403 Forbidden**: 檢查測試用戶權限和 Policy 設定
- **格式不符**: 檢查金額格式化和 API 回應格式

### SPU/SKU 架構檢查
```php
// ❌ 錯誤 - 直接查詢不存在的欄位
Product::where('sku', $sku)->first();

// ✅ 正確 - 透過關聯查詢
Product::whereHas('variants', function($query) use ($sku) {
    $query->where('sku', $sku);
})->first();
```

### Model 屬性安全檢查
- **Fillable 禁止項目**: `created_at`, `updated_at`, `id`, `password`
- **存取器驗證**: 確認引用的欄位在資料庫中存在

### 業務邏輯測試完整性
- 測試應覆蓋業務決策邏輯 (如庫存決策繞過庫存檢查)
- 複雜業務流程提供端到端測試
- 不假設不存在的方法或屬性

## 4.4 品質保證檢查清單 (Quality Assurance Checklist)

### 修復前必檢項目
1. ✅ **架構一致性**: SPU/SKU 雙層架構正確實作
2. ✅ **欄位存在性**: 所有引用的資料庫欄位確實存在
3. ✅ **權限完整性**: 測試用戶具備必要權限
4. ✅ **業務邏輯**: 覆蓋所有業務決策分支
5. ✅ **格式一致性**: API 回應符合系統標準

### 修復後驗證程序
1. **單元測試**: 執行完整測試套件
2. **權限測試**: 關注 403 錯誤的測試案例
3. **業務流程**: 驗證端到端邏輯完整性
4. **回歸測試**: 確保修復未破壞現有功能

---

# 第五章：本地開發環境 (Local Development Environment)

## 5.1 本地契約同步防護機制

### 問題背景
Scribe 生成 API 文檔時會使用 Factory 創建測試資料，可能意外寫入本地資料庫。

### 解決方案
```bash
# 使用專用腳本，避免測試資料污染
cd inventory-api
./sync-api-local.sh
```

### 配置文件
- `config/scribe.local.php`: 完全禁用 factoryMake
- 本地配置文件不提交到版本控制
- CI/CD 環境仍使用原配置確保文檔完整性

## 5.2 SQLite 遷移兼容性處理

### 兼容性修補機制
- **金錢欄位轉換**: `handleSQLiteMoneyFields()` 兼容性檢查
- **訂單欄位重構**: `handleSQLiteOrderMoneyRefactor()` 確保結構一致
- **索引修補**: `9999_12_31_999999_sqlite_compatibility_patches.php`

### 注意事項
- 兩環境表結構完全一致
- 不修改已部署的遷移檔案
- SQLite 使用 `:memory:` 資料庫，測試後自動清理

---

# 第六章：最佳實踐與規範 (Best Practices & Standards)

## 6.1 代碼風格與命名規範

### PHP/Laravel 規範
- 類別名稱使用 `PascalCase`
- 方法名稱使用 `camelCase`
- 常數使用 `UPPER_SNAKE_CASE`
- 資料庫欄位使用 `snake_case`

### TypeScript/React 規範
- 組件名稱使用 `PascalCase`
- 變數和函數使用 `camelCase`
- 常數使用 `UPPER_SNAKE_CASE`
- 檔案名稱與主要導出保持一致

## 6.2 安全性最佳實踐

### 後端安全
- 所有 Controller 方法使用 `authorize()` 檢查權限
- 使用 FormRequest 進行輸入驗證和清理
- 敏感資料使用適當的加密和哈希
- API 端點實施適當的速率限制

### 前端安全
- 禁止在日誌中輸出敏感資料
- 使用環境變數管理 API 端點
- 實施 CSP (Content Security Policy)
- 驗證用戶輸入，防止 XSS 攻擊

## 6.3 性能優化指南

### 後端優化
- 使用 Eloquent `with()` 預加載關聯
- 實施適當的資料庫索引
- 使用 Redis 進行會話和快取管理
- 優化 SQL 查詢，避免 N+1 問題

### 前端優化
- 使用 React Query 的智能快取
- 實施代碼分割和懶加載
- 優化圖片和靜態資源
- 使用適當的 bundle 分析工具

## 6.4 監控與日誌規範

### 日誌策略
- 使用結構化日誌格式 (JSON)
- 實施適當的日誌級別 (DEBUG, INFO, WARN, ERROR)
- 記錄關鍵業務操作和錯誤
- 定期清理和歸檔日誌文件

### 監控指標
- API 回應時間和錯誤率
- 資料庫查詢性能
- 記憶體和 CPU 使用率
- 用戶行為和業務指標

---

## 總結 (Summary)

本手冊從核心架構到實戰經驗，提供了完整的開發規範和最佳實踐。請嚴格遵循這些規範，確保代碼品質和系統的長期可維護性。

**記住核心原則**:
- 架構先行，規範至上
- 測試驅動，品質保證
- 安全第一，性能並重
- 持續改進，經驗沉澱

當遇到本手冊未涵蓋的情況時，請遵循既定的工程哲學和設計原則，並及時更新本文檔以供後續參考。