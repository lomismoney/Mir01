/**
 * 系統性能配置
 * 統一管理虛擬滾動和圖片懶加載的配置參數
 */

export const PERFORMANCE_CONFIG = {
  // 虛擬滾動配置
  virtualScroll: {
    // 觸發虛擬滾動的數據量閾值
    threshold: 100,
    
    // 預設配置
    defaults: {
      containerHeight: 600,
      estimateSize: 50,
      overscan: 5,
    },
    
    // 不同場景的配置
    presets: {
      // 產品列表
      products: {
        containerHeight: 700,
        estimateSize: 120, // 產品行通常較高
        overscan: 3,
      },
      
      // 訂單列表
      orders: {
        containerHeight: 650,
        estimateSize: 80,
        overscan: 5,
      },
      
      // 客戶列表
      customers: {
        containerHeight: 600,
        estimateSize: 60,
        overscan: 5,
      },
      
      // 庫存管理
      inventory: {
        containerHeight: 600,
        estimateSize: 55,
        overscan: 8,
      },
    },
  },
  
  // 圖片懶加載配置
  lazyImage: {
    // 預設配置
    defaults: {
      threshold: 0,
      rootMargin: '50px',
      placeholder: 'shimmer' as const,
    },
    
    // 不同場景的配置
    presets: {
      // 產品縮略圖
      productThumbnail: {
        rootMargin: '100px', // 提前載入
        quality: 75,
      },
      
      // 產品詳情圖
      productDetail: {
        rootMargin: '200px', // 更早載入
        quality: 90,
        priority: true, // 優先載入
      },
      
      // 列表圖片
      listImage: {
        rootMargin: '50px',
        quality: 70,
      },
    },
    
    // 圖片尺寸預設
    sizes: {
      thumbnail: { width: 80, height: 80 },
      small: { width: 200, height: 200 },
      medium: { width: 400, height: 400 },
      large: { width: 800, height: 800 },
    },
  },
  
  // 性能監控配置
  monitoring: {
    enabled: process.env.NODE_ENV === 'development',
    reportThreshold: 100, // 報告閾值（毫秒）
    
    // 性能指標收集
    metrics: {
      renderTime: true,
      scrollPerformance: true,
      imageLoadTime: true,
      memoryUsage: true,
    },
  },
  
  // 緩存策略
  cache: {
    // 圖片緩存
    images: {
      maxAge: 3600 * 24 * 7, // 7天
      maxSize: 100 * 1024 * 1024, // 100MB
    },
    
    // 數據緩存
    data: {
      staleTime: 5 * 60 * 1000, // 5分鐘
      cacheTime: 10 * 60 * 1000, // 10分鐘
    },
  },
};

/**
 * 獲取虛擬滾動配置
 */
export function getVirtualScrollConfig(
  dataLength: number,
  preset?: keyof typeof PERFORMANCE_CONFIG.virtualScroll.presets
) {
  // 如果數據量小於閾值，返回 null 表示不需要虛擬滾動
  if (dataLength < PERFORMANCE_CONFIG.virtualScroll.threshold) {
    return null;
  }
  
  // 如果有預設配置，使用預設
  if (preset && PERFORMANCE_CONFIG.virtualScroll.presets[preset]) {
    return PERFORMANCE_CONFIG.virtualScroll.presets[preset];
  }
  
  // 否則返回預設配置
  return PERFORMANCE_CONFIG.virtualScroll.defaults;
}

/**
 * 獲取圖片懶加載配置
 */
export function getLazyImageConfig(
  preset?: keyof typeof PERFORMANCE_CONFIG.lazyImage.presets
) {
  const defaults = PERFORMANCE_CONFIG.lazyImage.defaults;
  
  if (preset && PERFORMANCE_CONFIG.lazyImage.presets[preset]) {
    return {
      ...defaults,
      ...PERFORMANCE_CONFIG.lazyImage.presets[preset],
    };
  }
  
  return defaults;
}

/**
 * 性能監控工具
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }
  
  startMeasure(name: string) {
    if (!PERFORMANCE_CONFIG.monitoring.enabled) return;
    
    performance.mark(`${name}-start`);
  }
  
  endMeasure(name: string) {
    if (!PERFORMANCE_CONFIG.monitoring.enabled) return;
    
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    if (measure) {
      const duration = measure.duration;
      
      // 收集指標
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(duration);
      
      // 如果超過閾值，發出警告
      if (duration > PERFORMANCE_CONFIG.monitoring.reportThreshold) {
        console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`);
      }
    }
    
    // 清理標記
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }
  
  getMetrics(name: string) {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return null;
    
    const sum = metrics.reduce((a, b) => a + b, 0);
    const avg = sum / metrics.length;
    const max = Math.max(...metrics);
    const min = Math.min(...metrics);
    
    return {
      count: metrics.length,
      average: avg,
      max,
      min,
      total: sum,
    };
  }
  
  clearMetrics(name?: string) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

// 導出全局性能監控實例
export const performanceMonitor = PerformanceMonitor.getInstance();