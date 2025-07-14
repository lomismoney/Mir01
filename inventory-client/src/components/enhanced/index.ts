/**
 * 增強版組件導出
 * 
 * 包含虛擬滾動和圖片懶加載的增強版組件
 */

// 虛擬化表格組件
export { VirtualTable, useVirtualizedTablePerformance, createVirtualizationConfig } from '@/components/ui/virtual-table';
export type { VirtualTableProps, VirtualizationConfig } from '@/components/ui/virtual-table/types';

// 懶加載圖片組件
export { LazyImage, LazyImageGallery, useIntersectionObserver } from '@/components/ui/lazy-image';
export type { LazyImageProps, ImageSize } from '@/components/ui/lazy-image/types';

// 增強版頁面組件
export { default as ProductClientComponentEnhanced } from '@/components/products/ProductClientComponentEnhanced';
export { OrderClientComponentEnhanced } from '@/components/orders/OrderClientComponentEnhanced';
export { ProductDetailPageEnhanced } from '@/components/products/ProductDetailPageEnhanced';

// 增強版列定義
export { columnsEnhanced } from '@/components/products/columns-enhanced';

// 性能監控組件
export { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';

// 性能配置和監控工具
export { 
  PERFORMANCE_CONFIG,
  getVirtualScrollConfig,
  getLazyImageConfig,
  performanceMonitor,
  PerformanceMonitor
} from '@/lib/performance-config';