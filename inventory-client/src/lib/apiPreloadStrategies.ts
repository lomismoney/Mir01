import { queryKeys } from '@/hooks/queries/shared/queryKeys';
import { apiClient } from './apiClient';

/**
 * 預加載策略定義
 * 
 * 定義不同頁面和場景的預加載策略
 */

// 產品相關預加載策略
export const productPreloadStrategies = {
  // 產品列表頁面
  listPage: [
    {
      queryKey: queryKeys.products.LIST({ page: 1, per_page: 20 }),
      queryFn: () => apiClient.GET('/api/products', { 
        params: { query: { page: 1, per_page: 20 } } 
      }),
      staleTime: 5 * 60 * 1000,
      priority: 'high' as const,
    },
    {
      queryKey: queryKeys.categories.ALL,
      queryFn: () => apiClient.GET('/api/categories'),
      staleTime: 10 * 60 * 1000,
      priority: 'medium' as const,
    },
    {
      queryKey: queryKeys.attributes.ALL,
      queryFn: () => apiClient.GET('/api/attributes'),
      staleTime: 10 * 60 * 1000,
      priority: 'low' as const,
    },
  ],
  
  // 產品詳情頁面
  detailPage: (productId: number) => [
    {
      queryKey: queryKeys.products.DETAIL(productId),
      queryFn: () => apiClient.GET('/api/products/{product}' as any, {
        params: { path: { product: productId } }
      } as any),
      staleTime: 5 * 60 * 1000,
      priority: 'high' as const,
    },
    {
      queryKey: queryKeys.products.VARIANTS(productId),
      queryFn: () => apiClient.GET('/api/products/{product}/variants' as any, {
        params: { path: { product: productId } }
      } as any),
      staleTime: 5 * 60 * 1000,
      priority: 'high' as const,
    },
  ],
  
  // 新增產品頁面
  createPage: [
    {
      queryKey: queryKeys.categories.ALL,
      queryFn: () => apiClient.GET('/api/categories'),
      staleTime: 10 * 60 * 1000,
      priority: 'high' as const,
    },
    {
      queryKey: queryKeys.attributes.ALL,
      queryFn: () => apiClient.GET('/api/attributes'),
      staleTime: 10 * 60 * 1000,
      priority: 'high' as const,
    },
    {
      queryKey: queryKeys.stores.ALL,
      queryFn: () => apiClient.GET('/api/stores'),
      staleTime: 10 * 60 * 1000,
      priority: 'medium' as const,
    },
  ],
};

// 訂單相關預加載策略
export const orderPreloadStrategies = {
  // 訂單列表頁面
  listPage: [
    {
      queryKey: queryKeys.orders.LIST({ page: 1, per_page: 15 }),
      queryFn: () => apiClient.GET('/api/orders', {
        params: { query: { per_page: 15 } as any }
      }),
      staleTime: 2 * 60 * 1000,
      priority: 'high' as const,
    },
  ],
  
  // 新增訂單頁面
  createPage: [
    {
      queryKey: queryKeys.customers.ALL,
      queryFn: () => apiClient.GET('/api/customers'),
      staleTime: 5 * 60 * 1000,
      priority: 'high' as const,
    },
    {
      queryKey: queryKeys.products.LIST({ page: 1, per_page: 50 }),
      queryFn: () => apiClient.GET('/api/products', {
        params: { query: { page: 1, per_page: 50, is_active: true } }
      }),
      staleTime: 5 * 60 * 1000,
      priority: 'high' as const,
    },
    {
      queryKey: queryKeys.stores.ALL,
      queryFn: () => apiClient.GET('/api/stores'),
      staleTime: 10 * 60 * 1000,
      priority: 'medium' as const,
    },
  ],
  
  // 訂單詳情頁面
  detailPage: (orderId: number) => [
    {
      queryKey: queryKeys.orders.DETAIL(orderId),
      queryFn: () => apiClient.GET('/api/orders/{order}' as any, {
        params: { path: { order: orderId } }
      } as any),
      staleTime: 2 * 60 * 1000,
      priority: 'high' as const,
    },
  ],
};

// 庫存相關預加載策略
export const inventoryPreloadStrategies = {
  // 庫存管理頁面
  managementPage: [
    {
      queryKey: queryKeys.inventory.LIST({ page: 1 }),
      queryFn: () => apiClient.GET('/api/inventory', {
        params: { query: { page: 1, per_page: 50 } }
      }),
      staleTime: 3 * 60 * 1000,
      priority: 'high' as const,
    },
    {
      queryKey: queryKeys.stores.ALL,
      queryFn: () => apiClient.GET('/api/stores'),
      staleTime: 10 * 60 * 1000,
      priority: 'medium' as const,
    },
  ],
  
  // 庫存轉移頁面
  transferPage: [
    {
      queryKey: queryKeys.stores.ALL,
      queryFn: () => apiClient.GET('/api/stores'),
      staleTime: 10 * 60 * 1000,
      priority: 'high' as const,
    },
    {
      queryKey: queryKeys.inventory.TRANSFERS({ status: 'pending' }),
      queryFn: () => apiClient.GET('/api/inventory/transfers', {
        params: { query: { status: 'pending' } }
      }),
      staleTime: 2 * 60 * 1000,
      priority: 'high' as const,
    },
  ],
};

// 儀表板預加載策略
export const dashboardPreloadStrategies = [
  {
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiClient.GET('/api/dashboard/stats' as any, {} as any),
    staleTime: 1 * 60 * 1000,
    priority: 'high' as const,
  },
  {
    queryKey: queryKeys.orders.LIST({ page: 1, per_page: 5 }),
    queryFn: () => apiClient.GET('/api/orders', {
      params: { query: { per_page: 5, sort: '-created_at' } as any }
    }),
    staleTime: 2 * 60 * 1000,
    priority: 'medium' as const,
  },
  {
    queryKey: queryKeys.inventory.ALERTS ? queryKeys.inventory.ALERTS({}) : ['inventory', 'alerts', 'summary'],
    queryFn: () => apiClient.GET('/api/inventory/alerts/summary', {
      params: { query: {} }
    }),
    staleTime: 5 * 60 * 1000,
    priority: 'medium' as const,
  },
  {
    queryKey: queryKeys.installations.LIST({ status: 'pending', page: 1, per_page: 5 }),
    queryFn: () => apiClient.GET('/api/installations', {
      params: { query: { status: 'pending', per_page: 5 } as any }
    }),
    staleTime: 3 * 60 * 1000,
    priority: 'low' as const,
  },
];

// 智能預加載決策函數
export function getPreloadStrategyForRoute(pathname: string) {
  // 產品相關路由
  if (pathname === '/products') {
    return productPreloadStrategies.listPage;
  }
  if (pathname === '/products/new') {
    return productPreloadStrategies.createPage;
  }
  if (pathname.match(/^\/products\/\d+$/)) {
    const productId = parseInt(pathname.split('/')[2]);
    return productPreloadStrategies.detailPage(productId);
  }
  
  // 訂單相關路由
  if (pathname === '/orders') {
    return orderPreloadStrategies.listPage;
  }
  if (pathname === '/orders/new') {
    return orderPreloadStrategies.createPage;
  }
  if (pathname.match(/^\/orders\/\d+$/)) {
    const orderId = parseInt(pathname.split('/')[2]);
    return orderPreloadStrategies.detailPage(orderId);
  }
  
  // 庫存相關路由
  if (pathname === '/inventory' || pathname === '/inventory/management') {
    return inventoryPreloadStrategies.managementPage;
  }
  if (pathname === '/inventory/transfers') {
    return inventoryPreloadStrategies.transferPage;
  }
  
  // 儀表板
  if (pathname === '/dashboard' || pathname === '/') {
    return dashboardPreloadStrategies;
  }
  
  return [];
}

// 預加載優先級管理
export function sortByPriority<T extends { priority?: string }>(strategies: T[]): T[] {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return [...strategies].sort((a, b) => {
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
    return bPriority - aPriority;
  });
}