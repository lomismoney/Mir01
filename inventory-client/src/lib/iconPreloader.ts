import { ComponentType } from 'react';
import { LucideProps } from 'lucide-react';

// 圖標預加載管理器
class IconPreloader {
  private preloadedIcons = new Map<string, ComponentType<LucideProps>>();
  private loadingPromises = new Map<string, Promise<ComponentType<LucideProps>>>();

  /**
   * 預加載指定的圖標
   */
  async preloadIcon(iconName: string): Promise<ComponentType<LucideProps>> {
    // 如果已經預加載，直接返回
    if (this.preloadedIcons.has(iconName)) {
      return this.preloadedIcons.get(iconName)!;
    }

    // 如果正在加載中，返回現有的 Promise
    if (this.loadingPromises.has(iconName)) {
      return this.loadingPromises.get(iconName)!;
    }

    // 開始加載圖標
    const loadPromise = import('lucide-react').then((module) => {
      const iconComponent = module[iconName as keyof typeof module] as ComponentType<LucideProps>;
      if (iconComponent) {
        this.preloadedIcons.set(iconName, iconComponent);
        this.loadingPromises.delete(iconName);
        return iconComponent;
      }
      throw new Error(`Icon "${iconName}" not found in lucide-react`);
    });

    this.loadingPromises.set(iconName, loadPromise);
    return loadPromise;
  }

  /**
   * 批量預加載圖標
   */
  async preloadIcons(iconNames: string[]): Promise<void> {
    const promises = iconNames.map((name) => this.preloadIcon(name));
    await Promise.allSettled(promises);
  }

  /**
   * 預加載頁面級別的圖標
   */
  async preloadPageIcons(page: 'products' | 'orders' | 'inventory' | 'customers' | 'dashboard'): Promise<void> {
    const pageIconSets = {
      dashboard: [
        'TrendingUp', 'TrendingDown', 'Package', 'DollarSign', 'Users', 'ShoppingCart'
      ],
      products: [
        'Package', 'Edit', 'Trash2', 'Eye', 'Plus', 'Search', 'Filter',
        'Image', 'Tag', 'Grid3X3', 'List', 'Save'
      ],
      orders: [
        'ShoppingCart', 'Package', 'Truck', 'CreditCard', 'DollarSign',
        'Edit', 'Eye', 'RefreshCw', 'Calendar', 'User'
      ],
      inventory: [
        'Package', 'Warehouse', 'TrendingUp', 'TrendingDown', 'AlertTriangle',
        'RefreshCw', 'ArrowLeft', 'ArrowRight', 'Settings'
      ],
      customers: [
        'Users', 'User', 'Edit', 'Trash2', 'Phone', 'Mail',
        'MapPin', 'Building2', 'Plus'
      ]
    };

    const iconsToPreload = pageIconSets[page] || [];
    await this.preloadIcons(iconsToPreload);
  }

  /**
   * 獲取已預加載的圖標
   */
  getPreloadedIcon(iconName: string): ComponentType<LucideProps> | undefined {
    return this.preloadedIcons.get(iconName);
  }

  /**
   * 清除預加載緩存
   */
  clearCache(): void {
    this.preloadedIcons.clear();
    this.loadingPromises.clear();
  }

  /**
   * 獲取緩存統計信息
   */
  getCacheStats(): { preloaded: number; loading: number } {
    return {
      preloaded: this.preloadedIcons.size,
      loading: this.loadingPromises.size,
    };
  }
}

// 創建全局實例
export const iconPreloader = new IconPreloader();

// 頁面進入時預加載圖標的 Hook
export function useIconPreloader() {
  const preloadPageIcons = (page: Parameters<typeof iconPreloader.preloadPageIcons>[0]) => {
    return iconPreloader.preloadPageIcons(page);
  };

  const preloadIcons = (iconNames: string[]) => {
    return iconPreloader.preloadIcons(iconNames);
  };

  const getCacheStats = () => {
    return iconPreloader.getCacheStats();
  };

  return {
    preloadPageIcons,
    preloadIcons,
    getCacheStats,
  };
}

// 路由變化時自動預加載的工具函數
export function createRouteIconPreloader() {
  const routeIconMap: Record<string, string[]> = {
    '/products': ['products'],
    '/orders': ['orders'],
    '/inventory': ['inventory'],
    '/customers': ['customers'],
    '/dashboard': ['dashboard'],
  };

  return {
    preloadForRoute: async (pathname: string) => {
      // 根據路由路徑匹配圖標集
      for (const [route, pages] of Object.entries(routeIconMap)) {
        if (pathname.startsWith(route)) {
          for (const page of pages) {
            await iconPreloader.preloadPageIcons(page as Parameters<typeof iconPreloader.preloadPageIcons>[0]);
          }
          break;
        }
      }
    }
  };
}