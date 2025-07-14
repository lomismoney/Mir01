# 麵包屑導航使用指南

## 概述

本系統實現了一個智能的麵包屑導航系統，支持自動生成、動態更新和響應式設計。

## 特性

- ✅ 自動根據路由生成麵包屑
- ✅ 支持動態路由參數（如商品ID、訂單號等）
- ✅ 支持自定義麵包屑文字
- ✅ 支持圖標顯示
- ✅ 響應式設計（移動端自動折疊）
- ✅ 支持下拉菜單顯示隱藏的項目

## 使用方法

### 1. 基本使用（自動生成）

麵包屑導航已經集成在 `SiteHeader` 組件中，會自動根據當前路由顯示。

### 2. 動態設置麵包屑標籤

在需要顯示動態內容的頁面（如商品詳情、訂單詳情等），使用 `useDynamicBreadcrumb` Hook：

```tsx
import { useDynamicBreadcrumb } from "@/components/breadcrumb-context";

export default function ProductDetailPage() {
  const { setLabel } = useDynamicBreadcrumb();
  const { data: product } = useProductDetail(productId);
  
  // 當商品數據加載完成後，更新麵包屑標籤
  useEffect(() => {
    if (product?.name) {
      setLabel(product.name);
    }
  }, [product?.name, setLabel]);
  
  // ... 頁面其他內容
}
```

### 3. 完全自定義麵包屑

如果需要完全自定義麵包屑項目：

```tsx
import { useDynamicBreadcrumb } from "@/components/breadcrumb-context";
import { Home, Package, Eye } from "lucide-react";

export default function CustomPage() {
  const { setItems } = useDynamicBreadcrumb();
  
  useEffect(() => {
    setItems([
      { label: "首頁", href: "/", icon: Home },
      { label: "商品管理", href: "/products", icon: Package },
      { label: "特殊商品", icon: Eye }
    ]);
  }, [setItems]);
  
  // ... 頁面其他內容
}
```

### 4. 路由配置

新增路由時，在 `/src/lib/routes-config.ts` 中添加相應的配置：

```typescript
{
  path: "/your-route",
  label: "頁面名稱",
  icon: YourIcon, // 可選
  parent: "/parent-route", // 可選，指定父級路由
  children: [ // 可選，子路由
    {
      path: "/your-route/sub",
      label: "子頁面",
      parent: "/your-route"
    }
  ]
}
```

對於動態路由：

```typescript
{
  path: "/products/:productId",
  label: "商品詳情",
  parent: "/products",
  isDynamic: true
}
```

## 配置選項

`EnhancedBreadcrumb` 組件支持以下配置：

- `maxItemsMobile`: 移動端最大顯示項目數（默認 2）
- `maxItemsDesktop`: 桌面端最大顯示項目數（默認 4）
- `showHomeIcon`: 是否顯示首頁圖標（默認 true）
- `showIcons`: 是否顯示路由圖標（默認 true）
- `separator`: 自定義分隔符（默認使用 ChevronRight）

## 最佳實踐

1. **動態頁面標題**：在詳情頁面加載數據後立即更新麵包屑標籤
2. **層級結構**：保持清晰的父子關係，避免層級過深
3. **圖標使用**：為主要路由添加圖標，提升視覺辨識度
4. **響應式考慮**：測試移動端顯示效果，確保關鍵信息可見

## 已實現的頁面示例

- 商品詳情頁：顯示商品名稱
- 訂單詳情頁：顯示訂單編號
- SKU 歷史頁：顯示 SKU 編號
- 其他頁面會自動根據路由配置顯示

## 注意事項

1. 組件卸載時會自動清除自定義設置
2. 動態標籤只影響最後一個麵包屑項
3. 自定義項目會完全覆蓋自動生成的項目