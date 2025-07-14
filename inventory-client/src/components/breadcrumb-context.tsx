"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";

interface BreadcrumbContextValue {
  customLabel: string | null;
  setCustomLabel: (label: string | null) => void;
  customItems: Array<{
    label: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }> | null;
  setCustomItems: (
    items: Array<{
      label: string;
      href?: string;
      icon?: React.ComponentType<{ className?: string }>;
    }> | null
  ) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(
  undefined
);

/**
 * 麵包屑上下文提供者
 * 允許頁面動態設置麵包屑內容
 */
export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [customLabel, setCustomLabel] = useState<string | null>(null);
  const [customItems, setCustomItems] = useState<BreadcrumbContextValue["customItems"]>(null);

  const value: BreadcrumbContextValue = {
    customLabel,
    setCustomLabel,
    customItems,
    setCustomItems,
  };

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/**
 * 使用麵包屑上下文的 Hook
 */
export function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumbContext must be used within BreadcrumbProvider");
  }
  return context;
}

/**
 * 動態設置麵包屑的 Hook
 * 用於在頁面組件中設置自定義麵包屑
 */
export function useDynamicBreadcrumb() {
  const { setCustomLabel, setCustomItems } = useBreadcrumbContext();

  // 設置最後一個麵包屑項的自定義標籤
  const setLabel = useCallback(
    (label: string) => {
      setCustomLabel(label);
    },
    [setCustomLabel]
  );

  // 設置完全自定義的麵包屑項目
  const setItems = useCallback(
    (
      items: Array<{
        label: string;
        href?: string;
        icon?: React.ComponentType<{ className?: string }>;
      }>
    ) => {
      setCustomItems(items);
    },
    [setCustomItems]
  );

  // 清除自定義設置
  const reset = useCallback(() => {
    setCustomLabel(null);
    setCustomItems(null);
  }, [setCustomLabel, setCustomItems]);

  // 組件卸載時清除設置
  React.useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    setLabel,
    setItems,
    reset,
  };
}