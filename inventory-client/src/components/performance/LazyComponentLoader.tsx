"use client";

import React, { lazy, Suspense, memo, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * 懶載入錯誤邊界組件
 */
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent />;
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <Alert>
              <AlertDescription>
                組件載入失敗，請重試。
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-4"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重新載入
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * 載入狀態組件
 */
const DefaultLoadingFallback = memo(() => (
  <Card>
    <CardContent className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">載入組件中...</p>
      </div>
    </CardContent>
  </Card>
));

DefaultLoadingFallback.displayName = 'DefaultLoadingFallback';

/**
 * 骨架屏載入組件
 */
const SkeletonFallback = memo(() => (
  <div className="space-y-4 animate-pulse">
    <div className="h-4 bg-muted rounded w-3/4"></div>
    <div className="h-4 bg-muted rounded w-1/2"></div>
    <div className="h-32 bg-muted rounded"></div>
  </div>
));

SkeletonFallback.displayName = 'SkeletonFallback';

/**
 * 懶載入組件包裝器選項
 */
interface LazyWrapperOptions {
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType;
  preload?: boolean;
  retryCount?: number;
}

/**
 * 創建懶載入組件的高階函數
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options: LazyWrapperOptions = {}
): React.ComponentType<React.ComponentProps<T>> {
  const {
    fallback: CustomFallback = DefaultLoadingFallback,
    errorFallback,
    preload = false,
    retryCount = 3
  } = options;

  // 創建懶載入組件
  const LazyComponent = lazy(() => {
    return importFunction().catch(error => {
      console.error('Failed to load component:', error);
      // 可以在這裡實現重試邏輯
      throw error;
    });
  });

  // 預載入邏輯
  if (preload && typeof window !== 'undefined') {
    // 在 idle 時間預載入
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFunction().catch(() => {});
      });
    } else {
      // 備用方案
      setTimeout(() => {
        importFunction().catch(() => {});
      }, 100);
    }
  }

  // 返回包裝後的組件
  const WrappedComponent = memo((props: React.ComponentProps<T>) => (
    <LazyLoadErrorBoundary fallback={errorFallback}>
      <Suspense fallback={<CustomFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyLoadErrorBoundary>
  ));

  WrappedComponent.displayName = `LazyWrapper(${LazyComponent.displayName || 'Component'})`;

  return WrappedComponent;
}

/**
 * 預定義的懶載入組件
 * 按照實際使用頻率和重要性分級
 */

// 高優先級組件 - 立即預載入
export const LazyProductTable = createLazyComponent(
  () => import('@/components/products/VirtualizedProductTable'),
  { preload: true, fallback: SkeletonFallback }
);

export const LazyOrderForm = createLazyComponent(
  () => import('@/components/orders/OrderForm'),
  { preload: true }
);

// 中優先級組件 - 條件預載入
export const LazyCustomerForm = createLazyComponent(
  () => import('@/components/customers/CustomerForm'),
  { fallback: SkeletonFallback }
);

export const LazyInventoryManagement = createLazyComponent(
  () => import('@/components/inventory/InventoryManagement'),
  { fallback: SkeletonFallback }
);

// 低優先級組件 - 懶載入
export const LazyPerformanceDashboard = createLazyComponent(
  () => import('@/components/dev/PerformanceDashboard')
);

export const LazyInstallationForm = createLazyComponent(
  () => import('@/components/installations/InstallationForm')
);

// 報告和統計組件 - 按需載入
export const LazyPerformanceReport = createLazyComponent(
  () => import('@/components/performance/PerformanceReport')
);

export const LazyGlobalPerformanceMonitor = createLazyComponent(
  () => import('@/components/performance/GlobalPerformanceMonitor')
);

/**
 * 路由級別的懶載入組件
 */
export const LazyPages = {
  Products: createLazyComponent(
    () => import('@/app/(dashboard)/products/page'),
    { preload: true, fallback: SkeletonFallback }
  ),
  
  Orders: createLazyComponent(
    () => import('@/app/(dashboard)/orders/page'),
    { preload: true, fallback: SkeletonFallback }
  ),
  
  Customers: createLazyComponent(
    () => import('@/app/(dashboard)/customers/page'),
    { fallback: SkeletonFallback }
  ),
  
  Inventory: createLazyComponent(
    () => import('@/app/(dashboard)/inventory/page'),
    { fallback: SkeletonFallback }
  ),
  
  Settings: createLazyComponent(
    () => import('@/app/(dashboard)/settings/page')
  ),
};

/**
 * 模態框懶載入組件
 */
export const LazyModals = {
  ProductDetail: createLazyComponent(
    () => import('@/components/products/VariantDetailsModal')
  ),
  
  OrderPreview: createLazyComponent(
    () => import('@/components/orders/OrderPreviewModal')
  ),
  
  RefundModal: createLazyComponent(
    () => import('@/components/orders/RefundModal')
  ),
  
  ShipmentForm: createLazyComponent(
    () => import('@/components/orders/ShipmentFormModal')
  ),
};

/**
 * 組件預載入管理器
 */
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();
  
  /**
   * 根據路由預載入相關組件
   */
  static preloadForRoute(route: string) {
    switch (route) {
      case '/products':
        this.preloadComponents([
          'LazyProductTable',
          'LazyProductForm'
        ]);
        break;
      
      case '/orders':
        this.preloadComponents([
          'LazyOrderForm',
          'LazyCustomerSelector'
        ]);
        break;
      
      case '/inventory':
        this.preloadComponents([
          'LazyInventoryManagement',
          'LazyInventoryAdjustment'
        ]);
        break;
    }
  }
  
  /**
   * 預載入指定組件
   */
  static async preloadComponents(componentNames: string[]) {
    const preloadPromises = componentNames
      .filter(name => !this.preloadedComponents.has(name))
      .map(async (name) => {
        try {
          // 這裡可以根據組件名稱動態導入
          // 實際實現需要根據具體的組件映射
          this.preloadedComponents.add(name);
        } catch (error) {
          console.warn(`Failed to preload component: ${name}`, error);
        }
      });
    
    await Promise.allSettled(preloadPromises);
  }
  
  /**
   * 清理預載入緩存
   */
  static clearCache() {
    this.preloadedComponents.clear();
  }
  
  /**
   * 獲取預載入統計
   */
  static getStats() {
    return {
      preloadedCount: this.preloadedComponents.size,
      preloadedComponents: Array.from(this.preloadedComponents),
    };
  }
}

/**
 * 自動預載入 Hook
 */
export function useAutoPreload(route: string) {
  React.useEffect(() => {
    // 延遲預載入，避免影響初始渲染
    const timer = setTimeout(() => {
      ComponentPreloader.preloadForRoute(route);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [route]);
}

const LazyComponentLoaderExports = {
  createLazyComponent,
  LazyProductTable,
  LazyOrderForm,
  LazyCustomerForm,
  LazyInventoryManagement,
  LazyPerformanceDashboard,
  LazyPages,
  LazyModals,
  ComponentPreloader,
  useAutoPreload,
};

export default LazyComponentLoaderExports;