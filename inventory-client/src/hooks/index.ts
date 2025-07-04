/**
 * Hooks 統一導出入口
 * 
 * 為了提供向後兼容性和便於使用，
 * 此檔案重新導出所有常用的 React 鉤子
 */

// 主要實體查詢鉤子（來自新的統一檔案）
export * from './queries/useEntityQueries';

// 分類管理相關 hooks（已拆分到獨立檔案）
export {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
  // 型別定義也一併匯出
  type CategoryNode
} from './queries/categories/useCategories';

// 屬性管理相關 hooks（已拆分到獨立檔案）
export {
  useAttributes,
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
  useCreateAttributeValue,
  useUpdateAttributeValue,
  useDeleteAttributeValue,
  useAttributeValues
} from './queries/attributes/useAttributes';

// 門市管理相關 hooks（已拆分到獨立檔案）
export {
  useStores,
  useStore,
  useCreateStore,
  useUpdateStore,
  useDeleteStore
} from './queries/stores/useStores';

// 用戶管理相關 hooks（已拆分到獨立檔案）
export {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser
} from './queries/users/useUsers';

// 商品管理相關 hooks（已拆分到獨立檔案）
export {
  useProducts,
  useProductDetail,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useDeleteMultipleProducts,
  useProductVariants,
  useProductVariantDetail,
  useUploadProductImage,
  // 導出類型定義
  type ProcessedProduct,
  type ProcessedProductAttribute,
  type ProcessedProductVariant,
  type ProcessedProductAttributeValue
} from './queries/products/useProducts';

// 客戶管理相關 hooks（已拆分到獨立檔案）
export {
  useCustomers,
  useCustomerDetail,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useCheckCustomerExistence
} from './queries/customers/useCustomers';

// 庫存管理相關 hooks（已拆分到獨立檔案）
export {
  useInventoryList,
  useInventoryDetail,
  useInventoryAdjustment,
  useInventoryHistory,
  useSkuInventoryHistory,
  useAllInventoryTransactions,
  useInventoryTransfers,
  useInventoryTransferDetail,
  useCreateInventoryTransfer,
  useUpdateInventoryTransferStatus,
  useCancelInventoryTransfer,
  useInventoryTimeSeries
} from './queries/inventory/useInventory';

// 進貨管理相關 hooks（已拆分到獨立檔案）
export {
  usePurchases,
  usePurchase,
  useCreatePurchase,
  useUpdatePurchase,
  useUpdatePurchaseStatus,
  useCancelPurchase,
  useDeletePurchase
} from './queries/purchases/usePurchases';

// 安裝管理相關 hooks（已拆分到獨立檔案）
export {
  useInstallations,
  useInstallation,
  useCreateInstallation,
  useCreateInstallationFromOrder,
  useUpdateInstallation,
  useDeleteInstallation,
  useAssignInstaller,
  useUpdateInstallationStatus,
  useInstallationSchedule
} from './queries/installations/useInstallations';

// 訂單管理相關 hooks（已拆分到獨立檔案）
export {
  useOrders,
  useCreateOrder,
  useOrderDetail,
  useConfirmOrderPayment,
  useCreateOrderShipment,
  useAddOrderPayment,
  useUpdateOrder,
  useDeleteOrder,
  useUpdateOrderItemStatus,
  useCreateRefund,
  useCancelOrder,
  useBatchDeleteOrders,
  useBatchUpdateStatus
} from './queries/orders/useOrders';

// 其他專門的鉤子
export * from './use-admin-auth';
export { useDebounce } from './use-debounce';
// useUserStores 已移除 - 包含 URL 參數相關的 as any 臨時補丁，且未被使用
export * from './use-mobile';
export * from './useAppFieldArray'; 