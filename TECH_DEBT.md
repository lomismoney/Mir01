# 技術債務管理 (Technical Debt Management)

## 概述
本文件記錄專案中的技術債務，包括已知問題、臨時解決方案和改進計劃。

## 技術債務清單

### TD-003: 實現庫存管理頁面的庫存調整功能
**優先級**: 中等  
**狀態**: 待處理  
**建立日期**: 2025-06-17  

**問題描述**:
在庫存管理頁面的 `handleAdjustInventory` 函式中，目前只有 console.log 和 toast 通知的佔位符實現，缺少實際的庫存調整功能。

**影響範圍**:
- 用戶無法直接從庫存管理頁面調整庫存數量
- 影響庫存管理工作流程的完整性

**建議解決方案**:
1. 實現庫存調整對話框組件
2. 整合庫存調整 API 端點
3. 添加調整原因和備註功能
4. 實現調整後的數據刷新

**預估工時**: 4-6 小時

---

### TD-004: 後端商品查詢 API 缺少篩選與搜尋能力
**優先級**: 高  
**狀態**: ✅ 已完成（包含前端集成）  
**建立日期**: 2025-06-17  
**完成日期**: 2025-01-16  

**問題描述**:
目前的 `/api/products` 端點只支持基本的 `search` 參數，缺少庫存管理所需的關鍵篩選功能：
- `low_stock`: 低庫存商品篩選
- `out_of_stock`: 缺貨商品篩選  
- `store_id`: 按門市篩選
- `category_id`: 按分類篩選
- `product_name`: 商品名稱搜尋

**完整解決方案實施**:
1. ✅ **OpenAPI 契約更新**: 在 `openapi.yaml` 中添加了所有新的查詢參數
2. ✅ **後端實現**: 擴展 `ProductController` 的 `index` 方法，支持所有篩選參數
3. ✅ **查詢邏輯**: 實現複雜的庫存狀態查詢，包括 `whereHas` 關聯查詢
4. ✅ **測試覆蓋**: 編寫了 6 個完整的測試案例，所有測試通過（24 個斷言）
5. ✅ **前端類型同步**: 使用 `openapi-typescript` 生成最新的 API 類型
6. ✅ **Hook 擴展**: 更新 `useProducts` hook 支援 `ProductFilters` 參數
7. ✅ **UI 重建**: 完全重寫 `InventoryManagement` 組件，添加 5 個篩選器
8. ✅ **用戶體驗優化**: 實現 300ms 防抖搜尋、篩選器計數、一鍵重置

**技術實現亮點**:
- **後端**: 條件化查詢、`whereHas` 關聯查詢、庫存狀態精確判斷
- **前端**: TypeScript 類型安全、React Query 智能緩存、防抖優化
- **UI/UX**: shadcn/ui 組件、響應式設計、即時篩選反饋

**測試案例**:
- `admin_can_filter_products_by_product_name`
- `admin_can_filter_products_by_category_id` 
- `admin_can_filter_products_by_store_id`
- `admin_can_filter_products_by_low_stock`
- `admin_can_filter_products_by_out_of_stock`
- `admin_can_combine_multiple_filters`

**實際工時**: 4 小時（vs 預估 8-12 小時）

**技術規格**:
```php
// 建議的後端 API 參數擴展
public function index(Request $request)
{
    $query = Product::with(['variants.inventory', 'category']);
    
    // 搜尋功能
    if ($request->search) {
        $query->where('name', 'like', "%{$request->search}%");
    }
    
    // 門市篩選
    if ($request->store_id) {
        $query->whereHas('variants.inventory', function($q) use ($request) {
            $q->where('store_id', $request->store_id);
        });
    }
    
    // 庫存狀態篩選
    if ($request->low_stock) {
        $query->whereHas('variants.inventory', function($q) {
            $q->whereRaw('quantity <= low_stock_threshold');
        });
    }
    
    if ($request->out_of_stock) {
        $query->whereHas('variants.inventory', function($q) {
            $q->where('quantity', 0);
        });
    }
    
    return $query->paginate($request->per_page ?? 15);
}
```

---

## 管理流程

### 優先級定義
- **高**: 影響核心功能或用戶體驗的關鍵問題
- **中等**: 影響工作效率但有替代方案的問題  
- **低**: 改進性質的優化項目

### 狀態定義
- **待處理**: 已識別但尚未開始處理
- **進行中**: 正在開發或修復
- **已完成**: 已解決並通過測試
- **關鍵後端缺陷**: 需要後端 API 修改的阻塞性問題

### 更新規則
- 每個技術債務項目都應有明確的負責人和預期完成時間
- 定期評估技術債務的優先級和影響範圍
- 完成後更新狀態並記錄解決方案 