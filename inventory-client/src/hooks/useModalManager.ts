import { useState, useCallback } from 'react';

/**
 * Modal 狀態類型定義
 */
export interface ModalState<T = unknown> {
  type: string | null;
  data: T | null;
  isOpen: boolean;
}

/**
 * Modal 管理器配置
 */
interface ModalConfig {
  preventMultiple?: boolean; // 是否防止多個 Modal 同時開啟
  autoClose?: boolean; // 是否在操作成功後自動關閉
}

/**
 * 統一的 Modal 管理 Hook
 * 
 * 解決多個 Modal 狀態管理混亂的問題
 * 提供類型安全的 Modal 操作接口
 * 
 * @param config Modal 配置選項
 * @returns Modal 管理器對象
 */
export function useModalManager<T = any>(config: ModalConfig = {}) {
  const { preventMultiple = true, autoClose = true } = config;
  
  const [modal, setModal] = useState<ModalState<T>>({
    type: null,
    data: null,
    isOpen: false,
  });

  /**
   * 打開指定類型的 Modal
   */
  const openModal = useCallback((type: string, data?: T) => {
    if (preventMultiple && modal.isOpen) {
      console.warn(`Modal "${modal.type}" is already open. Closing previous modal.`);
    }
    
    setModal({
      type,
      data: data || null,
      isOpen: true,
    });
  }, [modal.isOpen, modal.type, preventMultiple]);

  /**
   * 關閉當前 Modal
   */
  const closeModal = useCallback(() => {
    setModal({
      type: null,
      data: null,
      isOpen: false,
    });
  }, []);

  /**
   * 檢查特定類型的 Modal 是否開啟
   */
  const isModalOpen = useCallback((type: string) => {
    return modal.isOpen && modal.type === type;
  }, [modal.isOpen, modal.type]);

  /**
   * 切換 Modal 狀態
   */
  const toggleModal = useCallback((type: string, data?: T) => {
    if (isModalOpen(type)) {
      closeModal();
    } else {
      openModal(type, data);
    }
  }, [isModalOpen, closeModal, openModal]);

  /**
   * 更新當前 Modal 的數據
   */
  const updateModalData = useCallback((data: T) => {
    if (modal.isOpen) {
      setModal(prev => ({
        ...prev,
        data,
      }));
    }
  }, [modal.isOpen]);

  /**
   * 操作成功後的處理
   */
  const handleSuccess = useCallback(() => {
    if (autoClose) {
      closeModal();
    }
  }, [autoClose, closeModal]);

  return {
    // 狀態
    modal,
    isOpen: modal.isOpen,
    currentType: modal.type,
    currentData: modal.data,
    
    // 操作方法
    openModal,
    closeModal,
    toggleModal,
    isModalOpen,
    updateModalData,
    handleSuccess,
  };
}

/**
 * 訂單相關 Modal 類型常量
 */
export const ORDER_MODAL_TYPES = {
  PREVIEW: 'preview',
  EDIT: 'edit', 
  PAYMENT: 'payment',
  REFUND: 'refund',
  SHIPMENT: 'shipment',
  CANCEL: 'cancel',
} as const;

/**
 * 客戶相關 Modal 類型常量
 */
export const CUSTOMER_MODAL_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  VIEW: 'view',
} as const;

/**
 * 商品相關 Modal 類型常量
 */
export const PRODUCT_MODAL_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  VIEW: 'view',
  VARIANT_DETAIL: 'variant_detail',
} as const;

/**
 * 庫存相關 Modal 類型常量
 */
export const INVENTORY_MODAL_TYPES = {
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
  HISTORY: 'history',
} as const;

/**
 * 專用的訂單 Modal 管理器
 */
export function useOrderModalManager() {
  return useModalManager<any>({
    preventMultiple: true,
    autoClose: true,
  });
}

/**
 * 專用的客戶 Modal 管理器
 */
export function useCustomerModalManager() {
  return useModalManager<any>({
    preventMultiple: true,
    autoClose: true,
  });
}