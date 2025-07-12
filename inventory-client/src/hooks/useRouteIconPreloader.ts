import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { iconPreloader } from '@/lib/iconPreloader';

/**
 * 路由級圖標預加載 Hook
 * 
 * 根據當前路由自動預加載相關圖標，提升頁面載入體驗
 */
export function useRouteIconPreloader() {
  const pathname = usePathname();

  useEffect(() => {
    // 路由圖標映射
    const routeIconMap: Record<string, string[]> = {
      // 產品相關頁面
      '/products': [
        'Package', 'Edit', 'Trash2', 'Eye', 'Search', 'Filter',
        'Image', 'Tag', 'Grid3X3', 'List', 'Save', 'Copy'
      ],
      
      // 訂單相關頁面
      '/orders': [
        'ShoppingCart', 'Package', 'Truck', 'CreditCard', 'DollarSign',
        'Edit', 'Eye', 'RefreshCw', 'Calendar', 'User', 'FileText'
      ],
      
      // 庫存相關頁面
      '/inventory': [
        'Package', 'Warehouse', 'TrendingUp', 'TrendingDown', 'AlertTriangle',
        'RefreshCw', 'ArrowLeft', 'ArrowRight', 'Settings', 'Filter'
      ],
      
      // 客戶相關頁面
      '/customers': [
        'Users', 'User', 'Edit', 'Trash2', 'Phone', 'Mail',
        'MapPin', 'Building2', 'Plus', 'Search'
      ],
      
      // 儀表板
      '/dashboard': [
        'TrendingUp', 'TrendingDown', 'Package', 'DollarSign', 
        'Users', 'ShoppingCart', 'AlertTriangle', 'Calendar'
      ],
      
      // 門市相關頁面
      '/stores': [
        'Building2', 'MapPin', 'Edit', 'Trash2', 'Plus', 'Users'
      ],
      
      // 安裝相關頁面
      '/installations': [
        'Wrench', 'Calendar', 'MapPin', 'User', 'Package', 'CheckCircle'
      ],
      
      // 進貨相關頁面
      '/purchases': [
        'Package', 'Truck', 'DollarSign', 'Calendar', 'FileText', 'Edit'
      ]
    };

    // 根據路由預加載圖標
    const preloadIconsForRoute = async () => {
      const iconsToPreload: string[] = [];
      
      // 匹配當前路由
      for (const [route, icons] of Object.entries(routeIconMap)) {
        if (pathname.startsWith(route)) {
          iconsToPreload.push(...icons);
        }
      }
      
      // 預加載通用圖標
      const commonIcons = [
        'Edit', 'Trash2', 'Plus', 'Search', 'RefreshCw', 'Eye',
        'ArrowLeft', 'ArrowRight', 'MoreHorizontal', 'Settings'
      ];
      
      iconsToPreload.push(...commonIcons);
      
      // 去重並預加載
      const uniqueIcons = [...new Set(iconsToPreload)];
      
      try {
        await iconPreloader.preloadIcons(uniqueIcons);
        console.log(`🎨 Preloaded ${uniqueIcons.length} icons for route: ${pathname}`);
      } catch (error) {
        console.warn('Failed to preload icons:', error);
      }
    };

    // 延遲預加載，避免阻塞初始渲染
    const timeoutId = setTimeout(preloadIconsForRoute, 100);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return {
    preloadPageIcons: iconPreloader.preloadPageIcons.bind(iconPreloader),
    getCacheStats: iconPreloader.getCacheStats.bind(iconPreloader),
  };
}