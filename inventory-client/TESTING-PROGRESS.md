# 測試進度追蹤

## 整體覆蓋率目標
- 目標：70%
- 當前：3.78% (Statements) | 2.97% (Branches) | 2.4% (Functions) | 3.84% (Lines)

## 測試覆蓋率詳情

### 高覆蓋率檔案 (>90%)
- ✅ src/lib/inventory-utils.ts - 100%
- ✅ src/lib/utils.ts - 100%
- ✅ src/lib/errorHandler.ts - 95.71%
- ✅ src/middleware.ts - 95.83%
- ✅ src/actions/auth.ts - 100%
- ✅ src/components/ui/input.tsx - 100%
- ✅ src/components/ui/button.tsx - 87.5%
- ✅ src/hooks/use-mobile.tsx - 100%
- ✅ src/hooks/useAppFieldArray.ts - 100%
- ✅ src/hooks/useDebounce.ts - 100%

### 中覆蓋率檔案 (50-90%)
- 🟡 src/lib/apiClient.ts - 56.66% (測試失敗，需要修復 mock 問題)
- 🟡 src/lib (整體) - 90.3%

### 低覆蓋率檔案 (<50%)
- 🔴 src/hooks/use-admin-auth.ts - 0% (mock 問題待解決)
- 🔴 src/hooks/useStores.ts - 0% (已廢棄，不建議測試)
- 🔴 src/hooks/queries/useEntityQueries.ts - 4.42%
- 🔴 src/components/ui/use-toast.tsx - 17.54%

## 已完成測試

### Utils 和 Hooks
1. ✅ src/lib/__tests__/utils.test.ts - 測試 cn 和其他工具函數
2. ✅ src/lib/__tests__/errorHandler.test.ts - 完整的錯誤處理測試
3. ✅ src/lib/__tests__/inventory-utils.test.ts - 庫存工具函數測試
4. ✅ src/hooks/__tests__/useDebounce.test.tsx - Debounce Hook 測試
5. ✅ src/hooks/__tests__/use-mobile.test.tsx - Mobile 檢測 Hook 測試
6. ✅ src/hooks/__tests__/useAppFieldArray.test.tsx - Field Array Hook 測試

### UI 組件
1. ✅ src/components/ui/__tests__/input.test.tsx - Input 組件測試
2. ✅ src/components/ui/__tests__/button.test.tsx - Button 組件測試

### 其他
1. ✅ src/__tests__/middleware.test.ts - Middleware 測試
2. ✅ src/actions/__tests__/auth.test.ts - Auth Actions 測試
3. ✅ src/__tests__/example.test.ts - 基本測試示例

## 待修復問題

### apiClient 測試失敗
- 問題：模組初始化順序導致 mock 失敗
- 錯誤：`Cannot read properties of undefined (reading 'use')`
- 需要重新設計 mock 策略

### use-admin-auth 測試失敗
- 問題：next/navigation 的 useRouter mock 失敗
- 錯誤：`mockReturnValue is not a function`
- 建議使用 __mocks__ 目錄方式

## 下一步計劃

1. **修復失敗的測試**
   - 修復 apiClient.test.ts
   - 修復 use-admin-auth.test.tsx

2. **提升主要模組覆蓋率**
   - 為 QueryProvider 撰寫測試
   - 為重要的 React 組件撰寫測試

3. **優先測試高價值檔案**
   - useEntityQueries.ts (核心 API hooks)
   - 重要的業務組件（如 ProductClientComponent、OrderForm 等）

## 技術債務
- useStores.ts 已廢棄，不應計入覆蓋率目標
- 部分 UI 組件（如 icons.tsx）可能不需要測試

## 進度總結
雖然整體覆蓋率仍低（3.78%），但核心工具函數（lib 資料夾）已達到 90.3% 的高覆蓋率。主要挑戰在於：
1. React 組件和 Hooks 的測試設置較複雜
2. Next.js 相關功能的 mock 困難
3. 大量的業務組件尚未測試

建議專注於提升核心業務邏輯的測試覆蓋率，而非追求所有檔案都達到高覆蓋率。 