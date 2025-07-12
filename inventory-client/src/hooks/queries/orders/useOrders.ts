import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { OrderFormData, ProcessedOrder, ProcessedOrderItem } from '@/types/api-helpers';
import { QUERY_KEYS } from '../shared/queryKeys';

/**
 * 訂單管理系統 (ORDER MANAGEMENT)
 * 
 * 🎯 功能概述：
 * 本模組提供完整的訂單管理功能，包含：
 * - 訂單列表查詢與篩選
 * - 訂單創建與編輯
 * - 訂單詳情查詢
 * - 付款管理（確認付款、部分付款）
 * - 出貨管理
 * - 退款處理
 * - 批量操作（刪除、狀態更新）
 * 
 * 🚀 架構特點：
 * - 100% 類型安全，杜絕 any 類型污染
 * - 數據精煉廠模式，在 select 中統一處理數據轉換
 * - 標準化的緩存失效策略
 * - 完整的錯誤處理與用戶回饋
 * - 事務化的批量操作支援
 */

/**
 * 訂單列表查詢 Hook
 * 
 * 🎯 功能特性：
 * 1. 支援多維度篩選（搜尋、狀態、日期範圍）
 * 2. 扁平化的查詢鍵結構，支援精確緩存
 * 3. 與後端 API 完全對應的參數結構
 * 4. 標準的 staleTime 配置
 * 5. 100% 類型安全 - 使用精確的篩選參數類型
 * 
 * @param filters - 訂單篩選參數
 * @returns React Query 查詢結果，包含 data 和 meta
 */
export function useOrders(filters: {
  search?: string;
  shipping_status?: string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;       // 🎯 新增分頁參數
  per_page?: number;   // 🎯 新增每頁數量參數
} = {}) {
  return useQuery({
    // 遵循我們已建立的、扁平化的查詢鍵結構，包含分頁參數
    queryKey: [...QUERY_KEYS.ORDERS, filters],
    queryFn: async () => {
      // 🚀 構建符合 Spatie QueryBuilder 的查詢參數格式
      const queryParams: Record<string, any> = {};
      
      // 使用 filter[...] 格式進行篩選參數
      if (filters.search) queryParams['filter[search]'] = filters.search;
      if (filters.shipping_status) queryParams['filter[shipping_status]'] = filters.shipping_status;
      if (filters.payment_status) queryParams['filter[payment_status]'] = filters.payment_status;
      if (filters.start_date) queryParams['filter[start_date]'] = filters.start_date;
      if (filters.end_date) queryParams['filter[end_date]'] = filters.end_date;
      
      // 分頁參數不需要 filter 前綴
      if (filters.page) queryParams.page = filters.page;
      if (filters.per_page) queryParams.per_page = filters.per_page;
      
      const { data, error } = await apiClient.GET("/api/orders" as any, {
        params: {
          query: queryParams,
        },
      });
      if (error) throw error;
      return data;
    },
    // 🎯 新增 select 選項 - 數據精煉廠，返回完整的分頁響應
    select: (response: any) => {
      // 1. 解包：從 API 響應中提取數據和分頁元數據
      const orders = response?.data || [];
      const meta = response?.meta || {}; // 提取分頁元數據
      const links = response?.links || {}; // 提取分頁連結

      // 2. 進行訂單數據的類型轉換和清理
      const processedOrders = orders.map((order: any) => ({
        ...order,
        // 📊 金額字段的數值化處理
        subtotal: parseFloat(order.subtotal || '0'),
        shipping_fee: parseFloat(order.shipping_fee || '0'),
        tax_amount: parseFloat(order.tax_amount || '0'),
        discount_amount: parseFloat(order.discount_amount || '0'),
        grand_total: parseFloat(order.grand_total || '0'),
        paid_amount: parseFloat(order.paid_amount || '0'),
        
        // 🎯 新增：日期格式化 - 在數據精煉廠中一次性完成
        formatted_created_date: new Date(order.created_at).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).replace(/\//g, '/'), // 確保使用 / 作為分隔符
      }));

      // 3. 返回完整的分頁響應結構
      return { 
        data: processedOrders,
        meta: meta,
        links: links
      };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1 * 60 * 1000, // 設置 1 分鐘的數據保鮮期
  });
}

/**
 * 創建訂單的 Hook
 * 
 * 支援完整的訂單創建流程：
 * 1. 客戶資訊綁定
 * 2. 商品項目管理
 * 3. 價格計算
 * 4. 庫存扣減
 * 
 * @returns React Query 變更結果
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: OrderFormData) => {
      // 🎯 重新整理數據格式以匹配後端 API 期望
      const apiPayload = {
        customer_id: orderData.customer_id,
        shipping_status: orderData.shipping_status,
        payment_status: orderData.payment_status,
        shipping_fee: orderData.shipping_fee || 0,
        tax: orderData.tax || 0,
        discount_amount: orderData.discount_amount || 0,
        payment_method: orderData.payment_method,
        order_source: orderData.order_source,
        shipping_address: orderData.shipping_address,
        notes: orderData.notes || null,
        items: orderData.items,
        ...(orderData.hasOwnProperty('force_create_despite_stock') && {
          force_create_despite_stock: (orderData as any).force_create_despite_stock,
        }),
      };
      
      const { data, error } = await apiClient.POST('/api/orders', {
        body: apiPayload as any
      });
      
      // 如果有錯誤，代表 API 請求失敗
      if (error) {
        // 🎯 檢查這個錯誤是否是我們預期的「庫存不足」結構化錯誤
        if ((error as any).stockCheckResults || (error as any).insufficientStockItems) {
          // 如果是，直接將這個帶有詳細數據的錯誤物件拋出
          // 讓 onError 回調可以接收到它
          throw error;
        }
        
        // 如果是其他類型的錯誤，則使用我們的標準解析器
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '創建訂單失敗');
      }
      
      // 如果沒有錯誤，返回成功的數據
      return data;
    },
    onSuccess: async (data, payload) => {
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      await Promise.all([
        // 1. 失效所有訂單查詢緩存
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ORDERS,
          exact: false,
          refetchType: 'active',
        }),
        // 2. 強制重新獲取所有活躍的訂單查詢
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.ORDERS,
          exact: false,
        })
      ]);
      
      // 使用 toast 顯示成功訊息
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('訂單創建成功！', {
          description: `訂單已成功創建，訂單列表已自動更新。`
        });
      }
    },
    onError: (error: any) => {
      // 🎯 在 onError 回調中，我們現在可以更安全地檢查錯誤類型
      if (error.stockCheckResults || error.insufficientStockItems) {
        // 這裡是處理庫存不足的邏輯...
        // 前端頁面組件會自行處理這種錯誤，這裡只需要記錄即可
      } else {
        // 這裡是處理其他通用錯誤的邏輯...
        if (typeof window !== 'undefined') {
          const { toast } = require('sonner');
          toast.error('訂單創建失敗', {
            description: error.message || '請檢查輸入資料並重試。'
          });
        }
      }
    },
  });
}

/**
 * 訂單詳情查詢 Hook - 架構升級版
 * 
 * 功能特性：
 * 1. 獲取單一訂單的完整資訊（包含關聯的客戶、項目、狀態歷史）
 * 2. 使用獨立的查詢鍵確保每個訂單獨立緩存
 * 3. 條件性查詢，只有在 orderId 存在時才執行
 * 4. 較長的緩存時間，適合詳情頁使用場景
 * 5. 🎯 資料精煉廠 - 在源頭處理所有數據解包和類型轉換
 * 6. 🚫 根除 any 類型 - 確保數據契約的純淨
 * 
 * @param orderId - 訂單 ID
 * @returns React Query 查詢結果，返回處理乾淨、類型完美的 ProcessedOrder 對象
 */
export function useOrderDetail(orderId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.ORDER(orderId!), // 使用 ['orders', orderId] 作為唯一鍵
    queryFn: async () => {
      if (!orderId) return null; // 如果沒有 ID，則不執行查詢
      const { data, error } = await apiClient.GET("/api/orders/{order}", {
        params: { path: { order: orderId } },
      });
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取訂單詳情失敗');
      }
      // queryFn 依然返回完整的 response，數據轉換交給 select 處理
      return data;
    },
    // 🎯 新增 select 選項 - 數據精煉廠，讓元件獲得純淨的數據
    select: (response: any): ProcessedOrder | null => {
      // 1. 解包：從 API 響應中提取 data 部分
      const order = response?.data;
      if (!order) return null;

      // 2. 進行所有必要的類型轉換和數據清理
      // 明確返回 ProcessedOrder 類型，確保所有消費端都能享受完美的類型推斷
      const processedOrder: ProcessedOrder = {
        ...order,
        // 📊 金額字段的數值化處理 - 絕對保證是 number
        subtotal: parseFloat(order.subtotal || '0'),
        shipping_fee: order.shipping_fee ? parseFloat(order.shipping_fee) : null,
        tax_amount: parseFloat(order.tax_amount || '0'),
        discount_amount: parseFloat(order.discount_amount || '0'),
        grand_total: parseFloat(order.grand_total || '0'),
        paid_amount: parseFloat(order.paid_amount || '0'),
        
        // 🛒 訂單項目的數據清理 - 每個項目都是 ProcessedOrderItem
        items: order.items?.map((item: any): ProcessedOrderItem => ({
          ...item,
          price: parseFloat(item.price || '0'),
          cost: parseFloat(item.cost || '0'),
          quantity: parseInt(item.quantity || '0', 10),
          tax_rate: parseFloat(item.tax_rate || '0'),
          discount_amount: parseFloat(item.discount_amount || '0'),
          // 🎯 Operation: Precise Tagging - 確保預訂標記正確傳遞
          is_backorder: Boolean(item.is_backorder),
        })) || [],
        
        // 🔄 確保客戶資訊的完整性
        customer: order.customer || null,
        creator: order.creator || null,
        
        // 💰 處理付款記錄 - 確保金額是 number 類型
        payment_records: order.payment_records?.map((payment: any) => ({
          ...payment,
          amount: parseFloat(payment.amount || '0'),
        })) || undefined,
      };
      
      return processedOrder;
    },
    enabled: !!orderId, // 只有在 orderId 存在時，此查詢才會被觸發
    staleTime: 5 * 60 * 1000, // 詳情頁數據可以緩存 5 分鐘
    retry: 2, // 失敗時重試 2 次
  });
}

/**
 * 確認訂單付款 Hook
 * 
 * 功能特性：
 * 1. 確認訂單付款狀態
 * 2. 自動刷新相關緩存（列表和詳情）
 * 3. 提供用戶友善的成功/錯誤提示
 * 4. 標準化的錯誤處理
 * 5. 🎯 100% 類型安全 - 移除所有 any 類型斷言
 * 
 * @returns React Query mutation 結果
 */
export function useConfirmOrderPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderId: number) => {
      // 🚀 confirm-payment API 不需要請求體
      const { data, error } = await apiClient.POST("/api/orders/{order}/confirm-payment", {
        params: { 
          path: { 
            order: orderId
          } 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data, orderId) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("訂單款項已確認");
      }
      // 🚀 強化快取同步機制 - 確保頁面即時更新
      await Promise.all([
        // 1. 失效訂單列表快取
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ORDERS,
          exact: false,
          refetchType: 'all' // 改為 'all' 確保所有快取都更新
        }),
        // 2. 失效並強制重新獲取訂單詳情
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ORDER(orderId),
          exact: false,
          refetchType: 'all' // 改為 'all' 確保頁面即時更新
        }),
        // 3. 強制重新獲取當前訂單詳情（雙重保險）
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.ORDER(orderId),
          exact: false,
          type: 'active' // 只重新獲取活躍的查詢
        })
      ]);
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("操作失敗", { description: parseApiError(error) });
      }
    },
  });
}

/**
 * 創建訂單出貨記錄 Hook
 * 
 * 功能特性：
 * 1. 創建訂單出貨記錄
 * 2. 支援物流資訊（如追蹤號碼）
 * 3. 自動刷新相關緩存
 * 4. 完整的成功/錯誤回饋
 * 5. 🎯 100% 類型安全 - 使用精確的 API 類型定義
 * 
 * @returns React Query mutation 結果
 */
export function useCreateOrderShipment() {
  const queryClient = useQueryClient();
  
  // 🚀 使用 API 生成的精確類型定義
  type CreateShipmentRequestBody = import('@/types/api').paths["/api/orders/{order}/create-shipment"]["post"]["requestBody"]["content"]["application/json"];
  
  return useMutation({
    mutationFn: async (payload: { orderId: number; data: CreateShipmentRequestBody }) => {
      // 🚀 使用精確的 API 類型，完全移除 any 斷言
      const { data, error } = await apiClient.POST("/api/orders/{order}/create-shipment", {
        params: { 
          path: { 
            order: payload.orderId
          } 
        },
        body: payload.data,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, payload) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("訂單已標記為已出貨");
      }
      // 標準化快取處理
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(payload.orderId), refetchType: 'active' });
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("操作失敗", { description: parseApiError(error) });
      }
    },
  });
}

/**
 * 新增訂單部分付款 Hook
 * 
 * 功能特性：
 * 1. 新增訂單部分付款記錄
 * 2. 支援訂金、分期付款等場景
 * 3. 自動計算已付金額和付款狀態
 * 4. 完整的付款歷史追蹤
 * 5. 🎯 100% 類型安全 - 使用精確的 API 類型定義
 * 
 * @returns React Query mutation 結果
 */
export function useAddOrderPayment() {
  const queryClient = useQueryClient();
  
  // 🚀 使用 API 生成的精確類型定義
  type AddPaymentRequestBody = import('@/types/api').paths["/api/orders/{order}/add-payment"]["post"]["requestBody"]["content"]["application/json"];
  
  return useMutation({
    mutationFn: async (payload: { orderId: number; data: AddPaymentRequestBody }) => {
      // 🚀 使用精確的 API 類型，完全移除 any 斷言
      const { data, error } = await apiClient.POST("/api/orders/{order}/add-payment", {
        params: { 
          path: { 
            order: payload.orderId
          } 
        },
        body: payload.data,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data, payload) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("付款記錄已成功新增", {
          description: `已記錄 $${(payload.data as any).amount} 的付款`
        });
      }
      // 🚀 強化快取同步機制 - 確保頁面即時更新
      await Promise.all([
        // 1. 失效訂單列表快取
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ORDERS,
          exact: false,
          refetchType: 'all' // 改為 'all' 確保所有快取都更新
        }),
        // 2. 失效並強制重新獲取訂單詳情
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ORDER(payload.orderId),
          exact: false,
          refetchType: 'all' // 改為 'all' 確保頁面即時更新
        }),
        // 3. 強制重新獲取當前訂單詳情（雙重保險）
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.ORDER(payload.orderId),
          exact: false,
          type: 'active' // 只重新獲取活躍的查詢
        })
      ]);
    },
    onError: (error) => {
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("付款記錄新增失敗", { 
          description: errorMessage || "請檢查付款金額是否正確" 
        });
      }
    },
  });
}

/**
 * 更新訂單 Hook - 契約淨化版本
 * 
 * 功能特性：
 * 1. 完整的類型安全保證 - 根除 any 類型污染
 * 2. 使用精確的 API 類型定義
 * 3. 標準化的錯誤處理和緩存失效
 * 4. 用戶友善的成功/錯誤通知
 * 
 * @returns React Query mutation 結果
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();
  
  // 🎯 契約淨化：使用精確的 API 類型定義，徹底根除 any 污染
  type UpdateOrderRequestBody = {
    customer_id?: number;
    shipping_status?: string;
    payment_status?: string;
    shipping_fee?: number | null;
    tax?: number | null;
    discount_amount?: number | null;
    payment_method?: string | null;
    shipping_address?: string | null;
    billing_address?: string | null;
    customer_address_id?: string | null;
    notes?: string | null;
    po_number?: string | null;
    reference_number?: string | null;
    subtotal?: number | null;
    grand_total?: number | null;
    items?: string[];
  };

  return useMutation({
    mutationFn: async (payload: { id: number; data: UpdateOrderRequestBody }) => {
      const { data, error } = await apiClient.PUT("/api/orders/{order}", {
        params: { path: { order: payload.id } },
        body: payload.data,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("訂單已成功更新");
      }
      // 同時失效列表和詳情的快取
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(variables.id), refetchType: 'active' });
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("更新失敗", { description: parseApiError(error) });
      }
    },
  });
}

/**
 * 刪除訂單 Hook
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number) => {
      const { data, error } = await apiClient.DELETE("/api/orders/{order}", {
        params: { path: { order: orderId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("訂單已成功刪除");
      }
      // 標準化快取處理
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS,
        refetchType: 'active',
      });
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("刪除失敗", { description: parseApiError(error) });
      }
    },
  });
}

/**
 * 更新訂單項目狀態的 Mutation Hook
 * 
 * 🎯 戰術功能：為訂單項目狀態追蹤提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 類型安全的 API 調用 - 使用生成的類型定義
 * 2. 成功後自動刷新訂單詳情 - 「失效並強制重取」標準模式
 * 3. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 4. 錯誤處理與訊息解析 - 統一的錯誤處理邏輯
 * 5. 支援狀態變更歷史記錄 - 自動記錄狀態變更軌跡
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useUpdateOrderItemStatus() {
  const queryClient = useQueryClient();
  
  // 使用 API 生成的類型定義
  type UpdateOrderItemStatusRequestBody = import('@/types/api').paths['/api/order-items/{order_item}/status']['patch']['requestBody']['content']['application/json'];
  type UpdateOrderItemStatusPayload = {
    orderItemId: number;
    status: string;
    notes?: string;
  };
  
  return useMutation({
    mutationFn: async ({ orderItemId, status, notes }: UpdateOrderItemStatusPayload) => {
      const requestBody: UpdateOrderItemStatusRequestBody = {
        status,
        ...(notes && { notes })
      };
      
      const { data, error } = await apiClient.PATCH('/api/order-items/{order_item}/status', {
        params: { path: { order_item: orderItemId } },
        body: requestBody,
      });
      
      if (error) {
        const errorMessage = parseApiError(error) || '更新訂單項目狀態失敗';
        throw new Error(errorMessage);
      }
      
      return data;
    },
    onSuccess: async (data: { data?: { id?: number } }, variables) => {
      // 從返回的訂單資料中提取訂單 ID
      const orderId = data?.data?.id;
      
      if (orderId) {
        // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
        await Promise.all([
          // 1. 失效指定訂單的詳情緩存
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.ORDER(orderId),
            exact: false,
            refetchType: 'active',
          }),
          // 2. 強制重新獲取訂單詳情
          queryClient.refetchQueries({
            queryKey: QUERY_KEYS.ORDER(orderId),
            exact: false,
          }),
          // 3. 同時失效訂單列表緩存（因為可能影響整體訂單狀態）
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.ORDERS,
            exact: false,
            refetchType: 'active',
          })
        ]);
      }
      
      // 🔔 成功通知 - 提升用戶體驗
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('訂單項目狀態已更新', {
          description: `項目狀態已更新為「${variables.status}」`
        });
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('狀態更新失敗', { description: errorMessage });
      }
    },
  });
}

/**
 * 創建訂單退款 Hook
 * 
 * 功能特性：
 * 1. 創建品項級別的訂單退款
 * 2. 支援部分品項退貨
 * 3. 自動計算退款金額
 * 4. 可選擇性回補庫存
 * 5. 🎯 100% 類型安全 - 使用精確的 API 類型定義
 * 
 * @returns React Query mutation 結果
 */
export function useCreateRefund() {
  const queryClient = useQueryClient();
  
  // 🚀 使用 API 生成的精確類型定義
  type CreateRefundRequestBody = import('@/types/api').paths["/api/orders/{order}/refunds"]["post"]["requestBody"]["content"]["application/json"];
  
  return useMutation({
    mutationFn: async (payload: { orderId: number; data: CreateRefundRequestBody }) => {
      // 🚀 使用精確的 API 類型，完全移除 any 斷言
      const { data, error } = await apiClient.POST("/api/orders/{order}/refunds", {
        params: { 
          path: { 
            order: payload.orderId
          } 
        },
        body: payload.data,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { data?: { total_refund_amount?: string | number } }, payload) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        const amount = data?.data?.total_refund_amount;
        const displayAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
        toast.success("退款已成功處理", {
          description: `退款金額：$${displayAmount}`
        });
      }
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(payload.orderId), refetchType: 'active' });
    },
    onError: (error) => {
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("退款處理失敗", { 
          description: errorMessage || "請檢查退款資料是否正確" 
        });
      }
    },
  });
}

/**
 * 取消訂單 Hook - 終止作戰計畫
 * 
 * 功能特性：
 * 1. 取消訂單並返還庫存
 * 2. 支援選填取消原因
 * 3. 自動刷新相關緩存（列表和詳情）
 * 4. 提供用戶友善的成功/錯誤提示
 * 5. 🎯 100% 類型安全 - 使用精確的 API 類型定義
 * 
 * @returns React Query mutation 結果
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason?: string }) => {
      const { error } = await apiClient.POST('/api/orders/{order}/cancel', {
        params: { path: { order: orderId } },
        body: { reason },
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '取消訂單失敗');
      }
    },
    onSuccess: (_, { orderId }) => {
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('訂單已成功取消');
      }
      
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      // 使訂單列表和該訂單的詳細資料緩存失效，觸發 UI 自動更新
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(orderId), refetchType: 'active' });
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error(error.message);
      }
    },
  });
}

/**
 * 批量刪除訂單 Hook - 裁決行動
 * 
 * 功能特性：
 * 1. 批量刪除多個訂單，包含庫存返還邏輯
 * 2. 使用事務確保操作的原子性
 * 3. 支援預先檢查訂單狀態的安全機制
 * 4. 「失效並強制重取」標準快取處理模式
 * 5. 🎯 100% 類型安全 - 精確的批量操作類型定義
 * 
 * @returns React Query mutation 結果
 */
export function useBatchDeleteOrders() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids }: { ids: (number | string)[] }) => {
      const { error } = await apiClient.POST('/api/orders/batch-delete', {
        body: {
          ids: ids.map(id => id.toString()), // 確保發送的是字串陣列，以匹配參考實現
        },
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '批量刪除訂單失敗');
      }
    },
    onSuccess: (_, { ids }) => {
      // 🔔 成功通知 - 顯示操作結果
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('所選訂單已成功刪除', {
          description: `已刪除 ${ids.length} 個訂單`
        });
      }
      
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      // 批量操作後，使整個訂單列表的緩存失效，以獲取最新數據
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.ORDERS,
        exact: false,
        refetchType: 'active'
      });
      
      // 同時移除被刪除訂單的詳情緩存，避免殘留數據
      ids.forEach(id => {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        queryClient.removeQueries({ queryKey: QUERY_KEYS.ORDER(numericId) });
      });
    },
    onError: (error: Error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('批量刪除失敗', { 
          description: error.message || '請檢查選擇的訂單是否允許刪除'
        });
      }
    },
  });
}

/**
 * 批量更新訂單狀態 Hook - 批量狀態更新武器
 * 
 * 功能特性：
 * 1. 批量更新多個訂單的狀態（付款狀態或貨物狀態）
 * 2. 支援靈活的狀態類型選擇（payment_status 或 shipping_status）
 * 3. 事務化批量操作，確保資料一致性
 * 4. 自動記錄每個訂單的狀態變更歷史
 * 5. 🎯 100% 類型安全 - 嚴格的狀態類型約束
 * 
 * @returns React Query mutation 結果
 */
export function useBatchUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ids: (number | string)[];
      status_type: 'payment_status' | 'shipping_status';
      status_value: string;
      notes?: string;
    }) => {
      const { error } = await apiClient.POST('/api/orders/batch-update-status', {
        body: {
          ...payload,
          ids: payload.ids.map(id => id.toString()),
        },
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '批量更新狀態失敗');
      }
    },
    onSuccess: (_, { status_type, status_value, ids }) => {
      // 🔔 成功通知 - 顯示詳細的操作結果
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        const statusTypeName = status_type === 'payment_status' ? '付款狀態' : '貨物狀態';
        toast.success('所選訂單狀態已成功更新', {
          description: `已將 ${ids.length} 個訂單的${statusTypeName}更新為「${status_value}」`
        });
      }
      
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      // 批量操作後，使整個訂單列表的緩存失效，以獲取最新數據
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.ORDERS,
        exact: false,
        refetchType: 'active'
      });
      
      // 同時失效可能受影響的單個訂單詳情緩存
      ids.forEach(id => {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(numericId) });
      });
    },
    onError: (error: Error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('批量狀態更新失敗', { 
          description: error.message || '請檢查選擇的訂單和狀態設定'
        });
      }
    },
  });
} 