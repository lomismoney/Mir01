import { useState } from 'react';
import { useDebounce } from './use-debounce';
import { useCustomerModalManager, CUSTOMER_MODAL_TYPES } from './useModalManager';
import { useApiErrorHandler } from './useErrorHandler';
import { useEmptyState } from './use-empty-state';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useStandardTable,
} from '@/hooks';
import { Customer, CreateCustomerData, UpdateCustomerData } from '@/types/api-helpers';
import { columns } from '@/components/customers/columns';

/**
 * 客戶管理業務邏輯 Hook
 * 
 * 將 CustomerClientComponent 的業務邏輯抽取到此 Hook 中
 * 實現關注點分離和更好的測試性
 */
export function useCustomerManagement() {
  // === 搜尋狀態管理 ===
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // === 工具 Hooks ===
  const modalManager = useCustomerModalManager();
  const { handleError, handleSuccess } = useApiErrorHandler();
  const { config: emptyConfig, handleAction } = useEmptyState('customers');

  // === API 查詢 ===
  const {
    data: customerResponse,
    isLoading,
    isError,
    error,
  } = useCustomers({
    search: debouncedSearchQuery || undefined,
  });

  // === 資料轉換 ===
  const customers = customerResponse?.data ?? [];
  const pageMeta = customerResponse?.meta;

  // === Mutations ===
  const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();
  const { mutate: deleteCustomer, isPending: isDeleting } = useDeleteCustomer();

  // === 表格管理 ===
  const handleEditCustomer = (customer: Customer) => {
    modalManager.openModal(CUSTOMER_MODAL_TYPES.EDIT, customer);
  };

  const handleDeleteCustomer = (customerId: number) => {
    deleteCustomer(customerId, {
      onSuccess: () => {
        handleSuccess('客戶刪除成功');
      },
      onError: (error) => handleError(error),
    });
  };

  const tableManager = useStandardTable({
    data: customerResponse,
    columns: columns({ 
      onEditCustomer: handleEditCustomer,
      onDeleteCustomer: handleDeleteCustomer 
    }),
    enablePagination: true,
    enableSorting: true,
    enableRowSelection: false,
    initialPageSize: 15,
  });

  // === 表單處理邏輯 ===
  const handleCreateSubmit = (values: CreateCustomerData) => {
    createCustomer(values, {
      onSuccess: () => {
        modalManager.handleSuccess();
        handleSuccess('客戶新增成功');
      },
      onError: (error) => handleError(error),
    });
  };

  const handleEditSubmit = (values: UpdateCustomerData) => {
    const customer = modalManager.currentData;
    if (!customer) return;
    
    updateCustomer(
      { id: customer.id!, data: values },
      {
        onSuccess: () => {
          modalManager.handleSuccess();
          handleSuccess('客戶更新成功');
        },
        onError: (error) => handleError(error),
      }
    );
  };

  // === Modal 操作 ===
  const openCreateModal = () => {
    modalManager.openModal(CUSTOMER_MODAL_TYPES.CREATE, null);
  };

  const openEditModal = (customer: Customer) => {
    modalManager.openModal(CUSTOMER_MODAL_TYPES.EDIT, customer);
  };

  const closeModal = () => {
    modalManager.closeModal();
  };

  // === 搜尋操作 ===
  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    // === 資料狀態 ===
    customers,
    pageMeta,
    isLoading,
    isError,
    error,

    // === 搜尋狀態 ===
    searchQuery,
    setSearchQuery,
    clearSearch,

    // === 表格狀態 ===
    tableManager,

    // === Modal 狀態 ===
    modalManager,
    isCreating,
    isUpdating,
    isDeleting,

    // === 空狀態配置 ===
    emptyConfig,
    handleAction,

    // === 操作函數 ===
    handleCreateSubmit,
    handleEditSubmit,
    handleEditCustomer,
    openCreateModal,
    openEditModal,
    closeModal,

    // === 工具函數 ===
    handleError,
    handleSuccess,
  };
}

/**
 * 客戶管理返回類型
 */
export type CustomerManagementHook = ReturnType<typeof useCustomerManagement>;