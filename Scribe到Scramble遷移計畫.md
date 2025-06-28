# 📋 Scribe to Scramble PRO 完整遷移任務文檔

## 🎯 項目概述

**目標**：將庫存管理系統從 Scribe 100% 遷移至 Scramble PRO，實現完全的 DTO 驅動架構和自動化 API 文檔生成。

**當前狀態**：
- ✅ **分類管理模組**：已完成遷移（POC 成功）
- ❌ **其他 11 個模組**：待遷移
- ✅ **Scribe 殘留**：已完全清除

**預期收益**：
- 🚀 開發效率提升 90%+
- 🛡️ 100% 類型安全保證
- 📊 API 文檔維護成本降至零
- ⚡ 即時契約同步機制

---

## 🗺️ 遷移路線圖

### 階段一：核心商品模組 (Week 1-2)
| 模組 | 複雜度 | 優先級 | 預估工時 |
|------|--------|--------|----------|
| 商品管理 | ⭐⭐⭐⭐⭐ | 🔥 極高 | 16h |
| 商品變體 | ⭐⭐⭐⭐ | 🔥 極高 | 8h |
| 商品批量操作 | ⭐⭐⭐ | 高 | 4h |

### 階段二：業務核心模組 (Week 3-4)
| 模組 | 複雜度 | 優先級 | 預估工時 |
|------|--------|--------|----------|
| 訂單管理 | ⭐⭐⭐⭐⭐ | 🔥 極高 | 20h |
| 庫存管理 | ⭐⭐⭐⭐ | 🔥 極高 | 12h |
| 進貨管理 | ⭐⭐⭐⭐ | 高 | 10h |

### 階段三：支援模組 (Week 5-6)
| 模組 | 複雜度 | 優先級 | 預估工時 |
|------|--------|--------|----------|
| 用戶管理 | ⭐⭐⭐ | 中 | 6h |
| 門市管理 | ⭐⭐ | 中 | 4h |
| 客戶管理 | ⭐⭐⭐ | 中 | 6h |
| 屬性管理 | ⭐⭐ | 低 | 4h |

### 階段四：高級功能模組 (Week 7-8)
| 模組 | 複雜度 | 優先級 | 預估工時 |
|------|--------|--------|----------|
| 安裝管理 | ⭐⭐⭐⭐ | 中 | 8h |
| 退款管理 | ⭐⭐⭐ | 中 | 6h |
| 庫存轉移 | ⭐⭐⭐ | 中 | 6h |

**總計預估工時：110 小時 (約 8 週)**

---

## 🛠️ 標準遷移工作流程

### 📋 每個模組的標準 SOP

#### Step 1: 模組分析 (30 分鐘)
```bash
# 1.1 分析 API 端點
grep -r "Route::" routes/api.php | grep "模組名"

# 1.2 檢查 FormRequest 
ls app/Http/Requests/Api/*模組名*

# 1.3 分析 Controller 複雜度
wc -l app/Http/Controllers/Api/模組名Controller.php

# 1.4 檢查關聯模型
grep -r "belongsTo\|hasMany" app/Models/模組名.php
```

#### Step 2: DTO 設計與實現 (2-4 小時)
```php
// 2.1 創建主 DTO
app/Data/模組名Data.php

// 2.2 創建子 DTO（如有需要）
app/Data/模組名ItemData.php
app/Data/Batch模組名Data.php

// 2.3 DTO 設計要點
- 使用 Spatie Laravel Data 標準
- 包含完整驗證規則
- 支援部分更新（sometimes 規則）
- 正確的類型定義和註釋
```

#### Step 3: Controller 重構 (1-3 小時)
```php
// 3.1 更新 FormRequest 為 DTO
// 修改前
public function store(Store模組名Request $request)

// 修改後  
public function store(模組名Data $data)

// 3.2 使用 WithData trait（如需要）
use Spatie\LaravelData\WithData;

// 3.3 更新所有 CRUD 方法
- store() 方法
- update() 方法  
- 批量操作方法（如有）
```

#### Step 4: Scramble 配置更新 (15 分鐘)
```php
// config/scramble.php
'include' => [
    'api/categories',
    'api/categories/*',
    'api/模組名',        // 新增
    'api/模組名/*',      // 新增
],
'exclude' => [
    // 移除相應的排除規則
],
```

#### Step 5: API 文檔生成與驗證 (30 分鐘)
```bash
# 5.1 重新生成 API 文檔
php artisan scramble:export

# 5.2 檢查生成的 Schema
cat api.json | jq '.components.schemas' | grep 模組名

# 5.3 驗證端點覆蓋
cat api.json | jq '.paths' | grep 模組名

# 5.4 檢查類型準確性
# 訪問 http://localhost:8000/docs/api
```

#### Step 6: 前端類型同步 (30 分鐘)
```bash
# 6.1 更新前端 API 文檔
cd inventory-client
copy ../inventory-api/api.json ./scramble-api.json

# 6.2 重新生成 TypeScript 類型
npm run api:types

# 6.3 檢查新增的類型
grep -A 10 "模組名" src/types/scramble-api.ts
```

#### Step 7: 測試與驗證 (1-2 小時)
```bash
# 7.1 後端測試
php artisan test --filter=模組名ControllerTest

# 7.2 前端整合測試
# 在 /scramble-test 頁面測試新模組

# 7.3 API 文檔完整性檢查
# 確保所有端點都有正確的 Schema
```

---

## 🏗️ 詳細實施計劃

### 🔥 第一優先級：商品管理模組遷移

#### 複雜度分析
- **API 端點**：15+ 個
- **關聯模型**：Product, ProductVariant, Inventory, Attribute, AttributeValue, Category
- **特殊功能**：批量操作、圖片上傳、複雜篩選、SKU/SPU 架構

#### 詳細執行步驟

**Phase 1.1: 核心 DTO 設計**
```php
// 需要創建的 DTO 文件
app/Data/ProductData.php           // 主商品 DTO
app/Data/ProductVariantData.php    // 變體 DTO  
app/Data/BatchDeleteProductsData.php // 批量刪除 DTO
app/Data/ProductImageUploadData.php  // 圖片上傳 DTO
```

**Phase 1.2: ProductData DTO 核心功能**
```php
class ProductData extends Data
{
    // SPU 基本信息
    public readonly string $name;
    public readonly ?string $description;
    public readonly ?int $category_id;
    
    // 屬性關聯
    public readonly array $attributes;
    
    // SKU 變體集合
    public readonly DataCollection $variants;
    
    // 業務邏輯方法
    public function isSingleVariant(): bool;
    public function getAllSkus(): array;
    public function getPriceRange(): array;
}
```

**Phase 1.3: Controller 重構清單**
```php
// ProductController 需要更新的方法
✅ store(ProductData $data)
✅ update(ProductData $data, Product $product)  
✅ show() - 無需修改，只需確保 Resource 正確

// 專用 Controller 重構
✅ BatchDeleteProductController::__invoke(BatchDeleteProductsData $data)
✅ ProductImageUploadController::__invoke(ProductImageUploadData $data, Product $product)
```

**Phase 1.4: Scramble 配置更新**
```php
'include' => [
    'api/categories',
    'api/categories/*',
    'api/products',              // 新增基本商品路由
    'api/products/*',            // 新增所有商品子路由
],
```

### 🔥 第二優先級：訂單管理模組遷移

#### 複雜度分析
- **API 端點**：20+ 個
- **關聯模型**：Order, OrderItem, Customer, Product, Payment, Installation
- **特殊功能**：狀態流轉、付款管理、預訂系統、安裝排程

#### 關鍵 DTO 設計
```php
app/Data/OrderData.php           // 主訂單 DTO
app/Data/OrderItemData.php       // 訂單項目 DTO
app/Data/AddPaymentData.php      // 付款 DTO
app/Data/BatchOrderStatusData.php // 批量狀態更新 DTO
```

### 🔥 第三優先級：庫存管理模組遷移

#### 複雜度分析
- **API 端點**：12+ 個  
- **關聯模型**：Inventory, Product, ProductVariant, Store, InventoryTransaction
- **特殊功能**：庫存調整、轉移、時間序列查詢、統計報表

#### 關鍵 DTO 設計
```php
app/Data/InventoryAdjustmentData.php  // 庫存調整 DTO
app/Data/InventoryTransferData.php    // 庫存轉移 DTO
app/Data/InventoryTimeSeriesData.php  // 時間序列查詢 DTO
```

---

## 🧪 測試與驗證策略

### 自動化測試檢查點

#### 後端測試
```bash
# 1. 運行所有 API 測試
php artisan test --filter=Api

# 2. 檢查測試覆蓋率
php artisan test --coverage

# 3. DTO 驗證測試
php artisan test --filter=DataValidation
```

#### Scramble 生成品質檢查
```php
// 自動化檢查 Schema 完整性
$generatedSchemas = json_decode(file_get_contents('api.json'), true);

// 檢查每個模組是否有對應的 Schema
$requiredSchemas = [
    'ProductData',
    'CategoryData', 
    'OrderData',
    // ...
];

foreach ($requiredSchemas as $schema) {
    assert(isset($generatedSchemas['components']['schemas'][$schema]));
}
```

#### 前端類型安全檢查
```bash
# TypeScript 編譯檢查
cd inventory-client
npm run build

# 類型覆蓋率檢查
npx tsc --noEmit --skipLibCheck
```

### 手動測試清單

#### API 文檔完整性
- [ ] 所有端點都有正確的請求 Schema  
- [ ] 所有端點都有正確的響應 Schema
- [ ] 中文註釋正確顯示
- [ ] 驗證規則準確反映
- [ ] 錯誤響應格式統一

#### 功能完整性
- [ ] 所有 CRUD 操作正常
- [ ] 複雜業務邏輯正確
- [ ] 權限控制有效
- [ ] 錯誤處理完善

---

## 🔧 常見問題與解決方案

### ⚠️ 關鍵經驗教訓（基於分類模組遷移）

#### 問題 1: Hook 命名不一致導致構建失敗 🔴
**問題描述**：
在重構過程中，Hook 函數命名不一致導致前端組件無法正確導入，出現 `Export useCreateScrambleCategory doesn't exist` 錯誤。

**具體情況**：
```typescript
// ❌ 錯誤：測試頁面導入了舊的命名
import { useCreateScrambleCategory, useUpdateScrambleCategory } from '@/hooks/useScrambleCategories';

// ✅ 正確：實際 Hook 已重命名為兼容版本
import { useCreateCategory, useUpdateCategory } from '@/hooks/useScrambleCategories';
```

**根本原因**：
- 為了保持與舊版 `useEntityQueries` 的兼容性，重命名了 Hook
- 但忘記同步更新所有使用該 Hook 的文件（特別是測試頁面）

**解決方案**：
1. **命名策略統一**：決定是使用 `useCreateCategory` 還是 `useCreateScrambleCategory`，全專案統一
2. **全域搜索替換**：使用 IDE 的全域搜索功能確保所有引用都已更新
3. **編譯前檢查**：每次重構後立即運行 `npm run dev` 檢查編譯錯誤

**預防措施**：
```bash
# 在每個模組遷移完成前，執行全域檢查
grep -r "useCreate.*Category" src/
grep -r "useUpdate.*Category" src/
grep -r "useDelete.*Category" src/
```

#### 問題 2: TypeScript 參數結構不匹配 🟡
**問題描述**：
Scramble Hook 的參數結構與測試頁面中的調用方式不匹配，導致類型錯誤。

**具體情況**：
```typescript
// ❌ 錯誤：直接傳遞整個物件
createMutation.mutate(newCategory, {...})

// ❌ 錯誤：參數結構錯誤
updateMutation.mutate({ id: editingId, categoryData: editCategory }, {...})

// ✅ 正確：明確的類型安全參數
createMutation.mutate({
  name: newCategory.name,
  description: newCategory.description || undefined,
  parent_id: newCategory.parent_id || null,
}, {...})

// ✅ 正確：正確的參數結構
updateMutation.mutate({ 
  id: editingId, 
  data: {
    name: editCategory.name!,
    description: editCategory.description || undefined,
    parent_id: editCategory.parent_id || null,
  }
}, {...})
```

**根本原因**：
- Hook 設計時為了類型安全，採用了更嚴格的參數結構
- 測試頁面仍使用舊的參數傳遞方式

**解決方案**：
1. **嚴格按照 Hook 定義的介面傳遞參數**
2. **使用 TypeScript 的類型檢查及時發現問題**
3. **參數物件重構時保持一致性**

**預防措施**：
```typescript
// 建議：為每個 Hook 創建清晰的類型定義
type CreateCategoryParams = {
  name: string;
  description?: string;
  parent_id?: number | null;
};

type UpdateCategoryParams = {
  id: number;
  data: {
    name: string;
    description?: string;
    parent_id?: number | null;
  };
};
```

#### 問題 3: 測試頁面與實際介面不同步 🟡
**問題描述**：
`/scramble-test` 頁面的測試程式碼與實際 Hook 介面出現差異，未能及時發現問題。

**解決方案**：
1. **同步更新所有測試頁面**：每次 Hook 重構後立即更新測試頁面
2. **自動化測試**：考慮添加 API 調用的自動化測試
3. **文檔即程式碼**：確保測試頁面與實際使用方式保持一致

### 🛠️ 最佳實踐總結

#### 後續模組遷移檢查清單
```markdown
**Hook 命名與導入檢查**
- [ ] 確定統一的 Hook 命名策略
- [ ] 全域搜索舊的 Hook 名稱引用
- [ ] 更新所有導入語句
- [ ] 檢查測試頁面是否同步更新

**TypeScript 類型檢查**
- [ ] 確保 Hook 參數類型定義清晰
- [ ] 測試所有調用方式的類型安全
- [ ] 運行 `tsc --noEmit` 檢查類型錯誤
- [ ] 確保編譯無錯誤

**功能驗證檢查**
- [ ] 基本 CRUD 操作測試
- [ ] 錯誤處理測試
- [ ] 前端介面操作驗證
- [ ] API 響應格式檢查
```

#### 推薦工作流程
```bash
# 1. Hook 重構完成後立即檢查
npm run dev  # 檢查編譯錯誤

# 2. 全域搜索相關引用
grep -r "useCreate.*ModuleName" src/
grep -r "useUpdate.*ModuleName" src/  
grep -r "useDelete.*ModuleName" src/

# 3. TypeScript 類型檢查
npx tsc --noEmit --skipLibCheck

# 4. 功能測試
# 打開相關頁面測試基本功能
```

#### 團隊協作建議
1. **程式碼審查**：Hook 重構的 PR 必須包含所有相關文件的更新
2. **文檔更新**：每次介面變更都要同步更新相關文檔
3. **測試優先**：先寫測試用例，再實施重構
4. **漸進式重構**：避免同時重構多個模組，降低風險

---

## ⚠️ 風險評估與緩解措施

### 高風險項目

#### 1. 複雜 DTO 驗證邏輯 🔴
**風險**：複雜的業務邏輯可能導致 DTO 驗證規則過於複雜

**緩解措施**：
- 保持 DTO 驗證規則簡潔
- 複雜業務邏輯放在 Service 層
- 分階段實施，先基礎功能再高級功能

#### 2. 大量關聯數據的性能 🟡
**風險**：複雜關聯查詢可能影響 API 性能

**緩解措施**：
- 優化 Eager Loading
- 適當使用 Lazy Loading
- 監控查詢性能

#### 3. 前後端類型同步 🟡
**風險**：API 變更可能導致前端類型不同步

**緩解措施**：
- 建立自動化同步機制
- CI/CD 中加入類型檢查
- 版本化 API 文檔

### 應急回滾計劃

#### 模組級回滾
```bash
# 1. 暫時排除問題模組
# config/scramble.php
'exclude' => [
    'api/problematic-module/*',
],

# 2. 重新生成文檔
php artisan scramble:export

# 3. 同步前端類型
cd inventory-client && npm run api:types
```

#### 完整回滾
如果遇到嚴重問題，可以：
1. 保留已成功的模組（如分類）
2. 暫時排除所有新遷移的模組
3. 逐個模組重新排查和修復

---

## 📊 進度追蹤表

### 模組遷移進度
| 模組 | DTO 設計 | Controller 重構 | Scramble 配置 | 測試驗證 | 完成狀態 | 經驗教訓 |
|------|----------|----------------|---------------|----------|----------|----------|
| 分類管理 | ✅ | ✅ | ✅ | ✅ | ✅ **完成** | ⚠️ Hook命名一致性 |
| 商品管理 | ⏳ | ⏳ | ⏳ | ⏳ | 🚧 **進行中** | |
| 商品變體 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ **待開始** | |
| 訂單管理 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ **待開始** | |
| 庫存管理 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ **待開始** | |
| 進貨管理 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ **待開始** | |
| 用戶管理 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ **待開始** | |
| 門市管理 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ **待開始** | |
| 客戶管理 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ **待開始** | |
| 屬性管理 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ **待開始** | |
| 安裝管理 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ **待開始** | |
| 退款管理 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ **待開始** | |

### 關鍵指標追蹤
| 指標 | 目標 | 當前值 | 達成率 |
|------|------|--------|--------|
| 模組遷移完成率 | 100% | 8.3% (1/12) | 8.3% |
| API 端點覆蓋率 | 100% | ~5% | 5% |
| 類型安全覆蓋率 | 100% | ~5% | 5% |
| 自動化測試通過率 | 100% | 100% | 100% |

---

## 🚀 立即行動計劃

### 本週目標 (Week 1)
**⚠️ 開始前必讀**：詳細研讀「常見問題與解決方案」章節，避免分類模組遇到的問題

1. **星期一**：商品管理 DTO 設計與實現
   - 📋 執行「後續模組遷移檢查清單」
   - 🔍 確定統一的 Hook 命名策略
2. **星期二**：ProductController 重構
   - 🔧 嚴格按照類型安全參數結構設計
3. **星期三**：批量操作和圖片上傳重構  
   - 🧪 即時進行 TypeScript 類型檢查
4. **星期四**：Scramble 配置更新和測試
   - ✅ 運行推薦工作流程中的所有檢查步驟
5. **星期五**：前端整合和驗證
   - 🔄 同步更新所有測試頁面和相關文件

### 下週目標 (Week 2)
1. **星期一-二**：商品變體模組遷移
2. **星期三-五**：訂單管理模組啟動

### 成功標準
- ✅ 所有 API 端點都有完整的 Scramble 文檔
- ✅ 前端 TypeScript 類型 100% 匹配
- ✅ 所有自動化測試通過
- ✅ API 文檔無需手動維護
- ✅ 開發效率顯著提升

---

## 📈 預期成果與收益

### 技術收益
- **API 文檔大小優化**：從 228KB → 預計 50KB (78% 減少)
- **TypeScript 類型行數**：從 7,019 行 → 預計 1,500 行 (79% 減少)
- **手動註釋需求**：從大量 PHPDoc → 零註釋 (100% 減少)
- **契約準確度**：從部分推斷 → 完美推斷 (100% 提升)

### 開發體驗提升
- 🚀 **即時類型檢查**：編譯時發現 API 契約錯誤
- 🎯 **自動完成**：IDE 完整支援 API 端點和參數
- 🔒 **類型安全**：杜絕運行時 API 調用錯誤
- ⚡ **開發速度**：程式碼即契約，零手動維護

### 業務價值
- **團隊協作效率**：前後端完美同步，零溝通成本
- **維護成本**：從繁重維護到零維護運行
- **品質保證**：類型安全防護網，運行時錯誤大幅減少
- **技術債清理**：從手動維護到自動生成的完美轉型

---

## 📝 總結

這是一個雄心勃勃但完全可行的遷移計劃。基於分類模組的成功經驗，我們已經建立了可重複的遷移模式和最佳實踐。

### 關鍵成功因素
1. 🎯 **分階段執行** - 避免一次性風險過大
2. 🛡️ **完善測試** - 確保每個階段的品質
3. ⚡ **快速迭代** - 及時發現和解決問題
4. 📊 **持續監控** - 追蹤進度和品質指標
5. 🔧 **經驗沉澱** - 將每個模組的問題記錄為下個模組的經驗教訓
6. 🔍 **命名一致性** - 確保 Hook 命名策略在整個專案中保持統一
7. 🧪 **即時驗證** - 每次重構後立即進行編譯和類型檢查

### 預期最終成果
- 🏆 **業界領先的 API 文檔架構**
- 🚀 **90%+ 的開發效率提升**  
- 🛡️ **100% 的類型安全保證**
- ⚡ **零維護的文檔同步機制**

### 下一步行動
1. **立即開始商品管理模組遷移**
2. **建立每日進度檢查機制**
3. **準備應急回滾方案**
4. **開始團隊技能提升培訓**
5. **⚠️ 必須先研讀「常見問題與解決方案」章節**
6. **建立每個模組的經驗教訓記錄機制**

**準備好開始這個激動人心的技術升級之旅了嗎？** 🚀

> **重要提醒**：分類模組的成功遷移為我們提供了寶貴的經驗教訓。在進行任何新模組遷移前，請務必參考「常見問題與解決方案」章節，避免重複犯錯，提高遷移效率。

---

*文檔版本：v1.1*  
*創建日期：2024年*  
*最後更新：2024年（添加分類模組遷移經驗教訓）*  
*負責人：開發團隊*