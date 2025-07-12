import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * 用戶偏好設置接口
 */
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-TW' | 'en-US';
  itemsPerPage: number;
  enableVirtualization: boolean;
  enableAnimations: boolean;
  compactMode: boolean;
}

/**
 * 表格配置接口
 */
interface TableConfig {
  [tableId: string]: {
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
    sorting: Array<{ id: string; desc: boolean }>;
    columnFilters: Array<{ id: string; value: unknown }>;
    pageSize: number;
    enableVirtualization: boolean;
  };
}

/**
 * 通知設置接口
 */
interface NotificationSettings {
  enableToasts: boolean;
  enableSounds: boolean;
  autoClose: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration: number;
}

/**
 * 性能設置接口
 */
interface PerformanceSettings {
  enableOptimisticUpdates: boolean;
  cacheTimeout: number;
  enablePrefetch: boolean;
  maxCacheSize: number;
  enableCompression: boolean;
}

/**
 * 全局狀態接口
 */
interface GlobalState {
  // 用戶偏好
  userPreferences: UserPreferences;
  
  // 表格配置
  tableConfigs: TableConfig;
  
  // 通知設置
  notificationSettings: NotificationSettings;
  
  // 性能設置
  performanceSettings: PerformanceSettings;
  
  // 當前活動的功能
  activeFeatures: {
    isVirtualizationGloballyEnabled: boolean;
    isOptimisticUpdatesEnabled: boolean;
    isDebugMode: boolean;
  };
  
  // 臨時狀態
  temporaryState: {
    selectedItems: Record<string, Set<string | number>>;
    expandedItems: Record<string, Set<string | number>>;
    searchQueries: Record<string, string>;
  };
}

/**
 * 全局狀態操作接口
 */
interface GlobalActions {
  // 用戶偏好操作
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  resetUserPreferences: () => void;
  
  // 表格配置操作
  updateTableConfig: (tableId: string, config: Partial<TableConfig[string]>) => void;
  resetTableConfig: (tableId: string) => void;
  resetAllTableConfigs: () => void;
  
  // 通知設置操作
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  
  // 性能設置操作
  updatePerformanceSettings: (settings: Partial<PerformanceSettings>) => void;
  
  // 功能切換
  toggleFeature: (feature: keyof GlobalState['activeFeatures']) => void;
  
  // 臨時狀態操作
  setSelectedItems: (context: string, items: Set<string | number>) => void;
  addSelectedItem: (context: string, item: string | number) => void;
  removeSelectedItem: (context: string, item: string | number) => void;
  clearSelectedItems: (context: string) => void;
  
  setExpandedItems: (context: string, items: Set<string | number>) => void;
  toggleExpandedItem: (context: string, item: string | number) => void;
  
  setSearchQuery: (context: string, query: string) => void;
  clearSearchQuery: (context: string) => void;
  
  // 實用操作
  exportSettings: () => string;
  importSettings: (settings: string) => void;
  resetAllSettings: () => void;
}

/**
 * 預設狀態
 */
const defaultState: GlobalState = {
  userPreferences: {
    theme: 'system',
    language: 'zh-TW',
    itemsPerPage: 15,
    enableVirtualization: true,
    enableAnimations: true,
    compactMode: false,
  },
  
  tableConfigs: {},
  
  notificationSettings: {
    enableToasts: true,
    enableSounds: false,
    autoClose: true,
    position: 'top-right',
    duration: 4000,
  },
  
  performanceSettings: {
    enableOptimisticUpdates: true,
    cacheTimeout: 300000, // 5 分鐘
    enablePrefetch: true,
    maxCacheSize: 50,
    enableCompression: false,
  },
  
  activeFeatures: {
    isVirtualizationGloballyEnabled: true,
    isOptimisticUpdatesEnabled: true,
    isDebugMode: false,
  },
  
  temporaryState: {
    selectedItems: {},
    expandedItems: {},
    searchQueries: {},
  },
};

/**
 * 全局狀態 Store
 * 
 * 使用 Zustand 提供的中間件：
 * - persist: 持久化存儲到 localStorage
 * - subscribeWithSelector: 提供選擇性訂閱功能
 * - immer: 提供不可變更新能力
 */
export const useGlobalStore = create<GlobalState & GlobalActions>()(
  subscribeWithSelector(
    persist(
      immer((set: (fn: (state: GlobalState & GlobalActions) => void) => void, get: () => GlobalState & GlobalActions) => ({
        ...defaultState,
        
        // 用戶偏好操作
        updateUserPreferences: (preferences: Partial<UserPreferences>) =>
          set((state: GlobalState & GlobalActions) => {
            Object.assign(state.userPreferences, preferences);
          }),
        
        resetUserPreferences: () =>
          set((state: GlobalState & GlobalActions) => {
            state.userPreferences = defaultState.userPreferences;
          }),
        
        // 表格配置操作
        updateTableConfig: (tableId: string, config: Partial<TableConfig[string]>) =>
          set((state: GlobalState & GlobalActions) => {
            if (!state.tableConfigs[tableId]) {
              state.tableConfigs[tableId] = {
                columnVisibility: {},
                columnOrder: [],
                sorting: [],
                columnFilters: [],
                pageSize: state.userPreferences.itemsPerPage,
                enableVirtualization: state.userPreferences.enableVirtualization,
              };
            }
            Object.assign(state.tableConfigs[tableId], config);
          }),
        
        resetTableConfig: (tableId: string) =>
          set((state: GlobalState & GlobalActions) => {
            delete state.tableConfigs[tableId];
          }),
        
        resetAllTableConfigs: () =>
          set((state: GlobalState & GlobalActions) => {
            state.tableConfigs = {};
          }),
        
        // 通知設置操作
        updateNotificationSettings: (settings: Partial<NotificationSettings>) =>
          set((state: GlobalState & GlobalActions) => {
            Object.assign(state.notificationSettings, settings);
          }),
        
        // 性能設置操作
        updatePerformanceSettings: (settings: Partial<PerformanceSettings>) =>
          set((state: GlobalState & GlobalActions) => {
            Object.assign(state.performanceSettings, settings);
          }),
        
        // 功能切換
        toggleFeature: (feature: keyof GlobalState['activeFeatures']) =>
          set((state: GlobalState & GlobalActions) => {
            state.activeFeatures[feature] = !state.activeFeatures[feature];
          }),
        
        // 臨時狀態操作
        setSelectedItems: (context: string, items: Set<string | number>) =>
          set((state: GlobalState & GlobalActions) => {
            state.temporaryState.selectedItems[context] = items;
          }),
        
        addSelectedItem: (context: string, item: string | number) =>
          set((state: GlobalState & GlobalActions) => {
            if (!state.temporaryState.selectedItems[context]) {
              state.temporaryState.selectedItems[context] = new Set();
            }
            state.temporaryState.selectedItems[context].add(item);
          }),
        
        removeSelectedItem: (context: string, item: string | number) =>
          set((state: GlobalState & GlobalActions) => {
            state.temporaryState.selectedItems[context]?.delete(item);
          }),
        
        clearSelectedItems: (context: string) =>
          set((state: GlobalState & GlobalActions) => {
            state.temporaryState.selectedItems[context] = new Set();
          }),
        
        setExpandedItems: (context: string, items: Set<string | number>) =>
          set((state: GlobalState & GlobalActions) => {
            state.temporaryState.expandedItems[context] = items;
          }),
        
        toggleExpandedItem: (context: string, item: string | number) =>
          set((state: GlobalState & GlobalActions) => {
            if (!state.temporaryState.expandedItems[context]) {
              state.temporaryState.expandedItems[context] = new Set();
            }
            const expandedItems = state.temporaryState.expandedItems[context];
            if (expandedItems.has(item)) {
              expandedItems.delete(item);
            } else {
              expandedItems.add(item);
            }
          }),
        
        setSearchQuery: (context: string, query: string) =>
          set((state: GlobalState & GlobalActions) => {
            state.temporaryState.searchQueries[context] = query;
          }),
        
        clearSearchQuery: (context: string) =>
          set((state: GlobalState & GlobalActions) => {
            delete state.temporaryState.searchQueries[context];
          }),
        
        // 實用操作
        exportSettings: () => {
          const state = get();
          const exportData = {
            userPreferences: state.userPreferences,
            tableConfigs: state.tableConfigs,
            notificationSettings: state.notificationSettings,
            performanceSettings: state.performanceSettings,
            activeFeatures: state.activeFeatures,
          };
          return JSON.stringify(exportData, null, 2);
        },
        
        importSettings: (settingsJson: string) => {
          try {
            const settings = JSON.parse(settingsJson);
            set((state: GlobalState & GlobalActions) => {
              if (settings.userPreferences) {
                Object.assign(state.userPreferences, settings.userPreferences);
              }
              if (settings.tableConfigs) {
                Object.assign(state.tableConfigs, settings.tableConfigs);
              }
              if (settings.notificationSettings) {
                Object.assign(state.notificationSettings, settings.notificationSettings);
              }
              if (settings.performanceSettings) {
                Object.assign(state.performanceSettings, settings.performanceSettings);
              }
              if (settings.activeFeatures) {
                Object.assign(state.activeFeatures, settings.activeFeatures);
              }
            });
          } catch (error) {
            console.error('Failed to import settings:', error);
          }
        },
        
        resetAllSettings: () =>
          set(() => ({ ...defaultState })),
      })),
      {
        name: 'inventory-global-store',
        // 不持久化臨時狀態
        partialize: (state: GlobalState & GlobalActions) => ({
          userPreferences: state.userPreferences,
          tableConfigs: state.tableConfigs,
          notificationSettings: state.notificationSettings,
          performanceSettings: state.performanceSettings,
          activeFeatures: state.activeFeatures,
        }),
      }
    )
  )
);

/**
 * 選擇器 Hooks - 提供細粒度的狀態訂閱
 */

// 用戶偏好選擇器
export const useUserPreferences = () => useGlobalStore((state: GlobalState & GlobalActions) => state.userPreferences);
export const useTheme = () => useGlobalStore((state: GlobalState & GlobalActions) => state.userPreferences.theme);
export const useLanguage = () => useGlobalStore((state: GlobalState & GlobalActions) => state.userPreferences.language);

// 表格配置選擇器
export const useTableConfig = (tableId: string) =>
  useGlobalStore((state: GlobalState & GlobalActions) => state.tableConfigs[tableId]);

// 通知設置選擇器
export const useNotificationSettings = () =>
  useGlobalStore((state: GlobalState & GlobalActions) => state.notificationSettings);

// 性能設置選擇器
export const usePerformanceSettings = () =>
  useGlobalStore((state: GlobalState & GlobalActions) => state.performanceSettings);

// 功能狀態選擇器
export const useActiveFeatures = () => useGlobalStore((state: GlobalState & GlobalActions) => state.activeFeatures);
export const useVirtualizationEnabled = () =>
  useGlobalStore((state: GlobalState & GlobalActions) => state.activeFeatures.isVirtualizationGloballyEnabled);

// 臨時狀態選擇器
export const useSelectedItems = (context: string) =>
  useGlobalStore((state: GlobalState & GlobalActions) => state.temporaryState.selectedItems[context] || new Set());

export const useExpandedItems = (context: string) =>
  useGlobalStore((state: GlobalState & GlobalActions) => state.temporaryState.expandedItems[context] || new Set());

export const useSearchQuery = (context: string) =>
  useGlobalStore((state: GlobalState & GlobalActions) => state.temporaryState.searchQueries[context] || '');

/**
 * 操作 Hooks - 提供便捷的操作方法
 */
export const useGlobalActions = () => {
  const {
    updateUserPreferences,
    resetUserPreferences,
    updateTableConfig,
    resetTableConfig,
    resetAllTableConfigs,
    updateNotificationSettings,
    updatePerformanceSettings,
    toggleFeature,
    setSelectedItems,
    addSelectedItem,
    removeSelectedItem,
    clearSelectedItems,
    setExpandedItems,
    toggleExpandedItem,
    setSearchQuery,
    clearSearchQuery,
    exportSettings,
    importSettings,
    resetAllSettings,
  } = useGlobalStore();

  return {
    updateUserPreferences,
    resetUserPreferences,
    updateTableConfig,
    resetTableConfig,
    resetAllTableConfigs,
    updateNotificationSettings,
    updatePerformanceSettings,
    toggleFeature,
    setSelectedItems,
    addSelectedItem,
    removeSelectedItem,
    clearSelectedItems,
    setExpandedItems,
    toggleExpandedItem,
    setSearchQuery,
    clearSearchQuery,
    exportSettings,
    importSettings,
    resetAllSettings,
  };
}; 