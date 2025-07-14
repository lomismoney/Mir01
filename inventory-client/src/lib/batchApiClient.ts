import type { FetchOptions } from 'openapi-fetch';
import type { paths } from '@/types/api';
import { apiClient } from './apiClient';

// 批量請求項目介面
interface BatchRequestItem<P extends keyof paths, M extends keyof paths[P]> {
  id: string; // 請求的唯一標識符
  path: P;
  method: M;
  options?: FetchOptions<paths[P][M]>;
}

// 批量響應項目介面
interface BatchResponseItem<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

// 批量 API 配置
interface BatchApiConfig {
  maxBatchSize?: number; // 最大批量大小
  maxConcurrent?: number; // 最大並發數
  retryCount?: number; // 重試次數
  retryDelay?: number; // 重試延遲（毫秒）
  timeout?: number; // 超時時間（毫秒）
}

// 預設配置
const defaultConfig: BatchApiConfig = {
  maxBatchSize: 50,
  maxConcurrent: 5,
  retryCount: 2,
  retryDelay: 1000,
  timeout: 30000,
};

/**
 * 批量 API 客戶端
 * 
 * 提供高效的批量 API 調用功能，支援：
 * - 自動分批處理
 * - 並發控制
 * - 錯誤重試
 * - 請求去重
 * - 進度追蹤
 */
export class BatchApiClient {
  private config: BatchApiConfig;
  private requestQueue: Map<string, BatchRequestItem<keyof paths, keyof paths[keyof paths]>> = new Map();
  private processingBatch = false;

  constructor(config: BatchApiConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 添加請求到批量隊列
   */
  add<P extends keyof paths, M extends keyof paths[P]>(
    request: BatchRequestItem<P, M>
  ): void {
    this.requestQueue.set(request.id, request);
  }

  /**
   * 執行批量請求
   */
  async execute<T = unknown>(): Promise<BatchResponseItem<T>[]> {
    if (this.processingBatch) {
      throw new Error('批量請求正在處理中');
    }

    this.processingBatch = true;
    const results: BatchResponseItem<T>[] = [];

    try {
      // 將請求分批
      const batches = this.createBatches();
      
      // 處理每個批次
      for (const batch of batches) {
        const batchResults = await this.processBatch<T>(batch);
        results.push(...batchResults);
      }

      return results;
    } finally {
      this.processingBatch = false;
      this.requestQueue.clear();
    }
  }

  /**
   * 創建批次
   */
  private createBatches(): BatchRequestItem<keyof paths, keyof paths[keyof paths]>[][] {
    const requests = Array.from(this.requestQueue.values());
    const batches: BatchRequestItem<keyof paths, keyof paths[keyof paths]>[][] = [];

    for (let i = 0; i < requests.length; i += this.config.maxBatchSize!) {
      batches.push(requests.slice(i, i + this.config.maxBatchSize!));
    }

    return batches;
  }

  /**
   * 處理單個批次
   */
  private async processBatch<T>(
    batch: BatchRequestItem<keyof paths, keyof paths[keyof paths]>[]
  ): Promise<BatchResponseItem<T>[]> {
    // 使用並發控制執行請求
    const results: BatchResponseItem<T>[] = [];
    const chunks = this.createConcurrentChunks(batch);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(request => 
        this.executeRequest<T>(request)
      );
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * 創建並發分組
   */
  private createConcurrentChunks<T>(
    items: T[]
  ): T[][] {
    const chunks: T[][] = [];
    
    for (let i = 0; i < items.length; i += this.config.maxConcurrent!) {
      chunks.push(items.slice(i, i + this.config.maxConcurrent!));
    }

    return chunks;
  }

  /**
   * 執行單個請求（帶重試）
   */
  private async executeRequest<T>(
    request: BatchRequestItem<keyof paths, keyof paths[keyof paths]>
  ): Promise<BatchResponseItem<T>> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retryCount!; attempt++) {
      try {
        // 使用 AbortController 實現超時
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout!
        );

        try {
          // 執行 API 調用
          // Type assertion for dynamic method call - this is safe as we know the method exists
          const response = await (apiClient as Record<string, Function>)[request.method.toString()](
            request.path,
            {
              ...request.options,
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          // 檢查響應
          if (response.error) {
            throw new Error(response.error.message || '請求失敗');
          }

          return {
            id: request.id,
            success: true,
            data: response.data as T,
          };
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        lastError = error as Error;
        
        // 如果不是最後一次嘗試，等待後重試
        if (attempt < this.config.retryCount!) {
          await this.delay(this.config.retryDelay!);
        }
      }
    }

    // 所有重試都失敗
    return {
      id: request.id,
      success: false,
      error: {
        message: lastError?.message || '未知錯誤',
        code: 'BATCH_REQUEST_FAILED',
      },
    };
  }

  /**
   * 延遲函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 獲取隊列大小
   */
  getQueueSize(): number {
    return this.requestQueue.size;
  }

  /**
   * 清空隊列
   */
  clearQueue(): void {
    this.requestQueue.clear();
  }
}

// 創建預設實例
export const batchApiClient = new BatchApiClient();

/**
 * 批量 API 調用 Hook
 * 
 * 提供 React 組件中使用批量 API 的便利方法
 */
export function useBatchApi(config?: BatchApiConfig) {
  const client = new BatchApiClient(config);

  const execute = async <T = unknown>(
    requests: BatchRequestItem<keyof paths, keyof paths[keyof paths]>[],
    options?: {
      onProgress?: (completed: number, total: number) => void;
      onError?: (error: BatchResponseItem) => void;
    }
  ): Promise<BatchResponseItem<T>[]> => {
    // 添加所有請求到隊列
    requests.forEach(request => client.add(request));

    // 執行批量請求
    const results = await client.execute<T>();

    // 處理結果
    let completedCount = 0;
    results.forEach(result => {
      completedCount++;
      
      if (options?.onProgress) {
        options.onProgress(completedCount, results.length);
      }

      if (!result.success && options?.onError) {
        options.onError(result);
      }
    });

    return results;
  };

  return {
    execute,
    client,
  };
}

/**
 * 批量操作輔助函數
 */
export const batchOperations = {
  /**
   * 批量刪除
   */
  async deleteMany<T>(
    ids: (string | number)[],
    pathTemplate: string,
    options?: {
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<{
    succeeded: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const requests = ids.map(id => ({
      id: id.toString(),
      path: pathTemplate.replace('{id}', id.toString()) as keyof paths,
      method: 'DELETE' as const,
    }));

    const results = await batchApiClient.execute();

    const succeeded: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    results.forEach(result => {
      if (result.success) {
        succeeded.push(result.id);
      } else {
        failed.push({
          id: result.id,
          error: result.error?.message || '未知錯誤',
        });
      }
    });

    return { succeeded, failed };
  },

  /**
   * 批量更新
   */
  async updateMany<T>(
    items: Array<{ id: string | number; data: Record<string, unknown> }>,
    pathTemplate: string,
    options?: {
      method?: 'PUT' | 'PATCH';
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<{
    succeeded: Array<{ id: string; data: T }>;
    failed: Array<{ id: string; error: string }>;
  }> {
    const requests = items.map(item => ({
      id: item.id.toString(),
      path: pathTemplate.replace('{id}', item.id.toString()) as keyof paths,
      method: (options?.method || 'PATCH') as 'PATCH',
      options: {
        body: item.data,
      },
    }));

    const results = await batchApiClient.execute<T>();

    const succeeded: Array<{ id: string; data: T }> = [];
    const failed: Array<{ id: string; error: string }> = [];

    results.forEach((result, index) => {
      if (result.success && result.data) {
        succeeded.push({
          id: result.id,
          data: result.data,
        });
      } else {
        failed.push({
          id: result.id,
          error: result.error?.message || '未知錯誤',
        });
      }
    });

    return { succeeded, failed };
  },

  /**
   * 批量創建
   */
  async createMany<T>(
    items: Record<string, unknown>[],
    path: string,
    options?: {
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<{
    succeeded: T[];
    failed: Array<{ index: number; error: string }>;
  }> {
    const requests = items.map((item, index) => ({
      id: index.toString(),
      path: path as keyof paths,
      method: 'POST' as const,
      options: {
        body: item,
      },
    }));

    const results = await batchApiClient.execute<T>();

    const succeeded: T[] = [];
    const failed: Array<{ index: number; error: string }> = [];

    results.forEach((result, index) => {
      if (result.success && result.data) {
        succeeded.push(result.data);
      } else {
        failed.push({
          index,
          error: result.error?.message || '未知錯誤',
        });
      }
    });

    return { succeeded, failed };
  },
};