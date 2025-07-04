import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { CreateStoreRequest, UpdateStoreRequest, ProductFilters, ProductItem, ProductVariant, InventoryProductItem, InventoryTransaction, InventoryTransactionFilters, CustomerFilters, Customer, AttributePathParams, OrderFormData, ProcessedOrder, ProcessedOrderItem } from '@/types/api-helpers';
import { toast } from '@/components/ui/use-toast';
import { QUERY_KEYS, INSTALLATION_QUERY_KEYS } from './shared/queryKeys';

// ==================== 已拆分到獨立模組的 API Hooks ====================
// 
// 🎯 商品管理 - 已遷移至 hooks/queries/products/useProducts.ts
// 🎯 客戶管理 - 已遷移至 hooks/queries/customers/useCustomers.ts  
// 🎯 庫存管理 - 已遷移至 hooks/queries/inventory/useInventory.ts
// 🎯 屬性管理 - 已遷移至 hooks/queries/attributes/useAttributes.ts
// 🎯 門市管理 - 已遷移至 hooks/queries/stores/useStores.ts
// 🎯 分類管理 - 已遷移至 hooks/queries/categories/useCategories.ts
// 🎯 用戶管理 - 已遷移至 hooks/queries/users/useUsers.ts
//
// ==================== 剩餘未拆分的模組 ====================









// ==================== 剩餘待拆分的模組 ====================
// 
// 🚧 訂單管理系統 (ORDER MANAGEMENT) - 待拆分
// 🚧 安裝管理系統 (INSTALLATION MANAGEMENT) - 待拆分
//


/**
 * 檢查客戶名稱是否存在 Hook
 * 
 * 🎯 功能：在新增客戶時檢查名稱是否重複，提供智能預警功能
 * 
 * @param name - 要檢查的客戶名稱
 * @returns React Query 查詢結果，包含 exists 布林值
 */
// ==================== 訂單管理系統 (ORDER MANAGEMENT) - 未拆分 ====================




















// ==================== 訂單管理系統 (ORDER MANAGEMENT) - 已拆分 ====================

// 🎯 訂單管理 - 已遷移至 hooks/queries/orders/useOrders.ts
// 請從 @/hooks 導入訂單管理相關的hooks

// ==================== 報表與分析 (REPORTS & ANALYTICS) ====================

// ==================== 安裝管理 (INSTALLATION MANAGEMENT) ====================

// 安裝管理相關的hooks已拆分到獨立檔案：/hooks/queries/installations/useInstallations.ts
// 請從 @/hooks 導入安裝管理相關的hooks
