# 依賴清理實施方案

## 📊 當前依賴狀況

基於代碼分析，以下是建議的依賴清理方案：

## ✅ 可以安全移除的依賴

### 1. lodash.debounce 相關
- `lodash.debounce`
- `@types/lodash.debounce`

**原因**: 項目已有自定義的 `useDebounce` hook，功能更適合 React 模式，且已完成替換。

**移除命令**:
```bash
npm uninstall lodash.debounce @types/lodash.debounce
```

## 🔍 需要進一步評估的依賴

### 1. 圖標庫重複
- `@tabler/icons-react` (目前使用中)
- `lucide-react` (主要使用，推薦保留)

**建議**: 逐步將 @tabler/icons-react 替換為 lucide-react，統一圖標系統。

### 2. 開發工具
- `tw-animate-css`: 檢查是否實際在 Tailwind 配置中使用
- `node-fetch`: 主要用於 MSW，可能可以使用內建 fetch

## 🎯 優化建議

### 圖標庫統一化
1. **現狀**: 同時使用 `@tabler/icons-react` 和 `lucide-react`
2. **建議**: 統一使用 `lucide-react`，它有更好的 TypeScript 支持和更豐富的圖標
3. **實施**: 使用新建的 `DynamicIcon` 系統逐步替換

### 依賴大小優化
當前依賴包大小分析（估算）:
- `lodash.debounce`: ~15KB（可移除）
- `@tabler/icons-react`: ~500KB（可考慮替換）
- 總潛在節省: ~515KB

## 📋 實施清單

### 階段一：立即可執行（已完成）
- [x] 替換 `lodash.debounce` 為 `useDebounce` hook
- [x] 建立動態圖標加載系統

### 階段二：安全移除
- [ ] 移除 `lodash.debounce` 相關依賴
- [ ] 測試應用功能確保無破壞

### 階段三：圖標庫統一（選擇性）
- [ ] 分析 `@tabler/icons-react` 使用情況
- [ ] 逐步替換為 `lucide-react`
- [ ] 完全移除 `@tabler/icons-react`

## ⚠️ 注意事項

1. **測試**: 移除任何依賴前，請運行完整的測試套件
2. **構建**: 確保生產構建正常
3. **功能**: 測試所有使用相關功能的頁面
4. **回退**: 保留 package-lock.json 備份以便快速回退

## 🚀 預期效果

- **包大小**: 減少約 515KB 的依賴體積
- **性能**: 減少不必要的包加載時間
- **維護**: 統一的圖標和工具庫，降低維護複雜度
- **類型安全**: 更好的 TypeScript 支持

## 📈 後續監控

建議每月執行一次依賴分析：
```bash
npx ts-node src/scripts/analyzeDependencies.ts
```

這將幫助及時發現和清理未使用的依賴。