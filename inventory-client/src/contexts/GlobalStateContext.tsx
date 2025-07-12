"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

/**
 * 用戶偏好設置類型
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
 * 表格配置類型
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
 * 通知設置類型
 */
interface NotificationSettings {
  enableToasts: boolean;
  enableSounds: boolean;
  autoClose: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration: number;
}

/**
 * 全局狀態類型
 */
interface GlobalState {
  userPreferences: UserPreferences;
  tableConfigs: TableConfig;
  notificationSettings: NotificationSettings;
  activeFeatures: {
    isVirtualizationGloballyEnabled: boolean;
    isOptimisticUpdatesEnabled: boolean;
    isDebugMode: boolean;
  };
  temporaryState: {
    selectedItems: Record<string, Set<string | number>>;
    expandedItems: Record<string, Set<string | number>>;
    searchQueries: Record<string, string>;
  };
}

/**
 * 全局狀態操作類型
 */
type GlobalAction =
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_USER_PREFERENCES' }
  | { type: 'UPDATE_TABLE_CONFIG'; payload: { tableId: string; config: Partial<TableConfig[string]> } }
  | { type: 'RESET_TABLE_CONFIG'; payload: string }
  | { type: 'RESET_ALL_TABLE_CONFIGS' }
  | { type: 'UPDATE_NOTIFICATION_SETTINGS'; payload: Partial<NotificationSettings> }
  | { type: 'TOGGLE_FEATURE'; payload: keyof GlobalState['activeFeatures'] }
  | { type: 'SET_SELECTED_ITEMS'; payload: { context: string; items: Set<string | number> } }
  | { type: 'ADD_SELECTED_ITEM'; payload: { context: string; item: string | number } }
  | { type: 'REMOVE_SELECTED_ITEM'; payload: { context: string; item: string | number } }
  | { type: 'CLEAR_SELECTED_ITEMS'; payload: string }
  | { type: 'SET_EXPANDED_ITEMS'; payload: { context: string; items: Set<string | number> } }
  | { type: 'TOGGLE_EXPANDED_ITEM'; payload: { context: string; item: string | number } }
  | { type: 'SET_SEARCH_QUERY'; payload: { context: string; query: string } }
  | { type: 'CLEAR_SEARCH_QUERY'; payload: string }
  | { type: 'IMPORT_SETTINGS'; payload: Partial<GlobalState> }
  | { type: 'RESET_ALL_SETTINGS' };

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
 * 狀態 Reducer
 */
function globalStateReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload,
        },
      };
    
    case 'RESET_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: defaultState.userPreferences,
      };
    
    case 'UPDATE_TABLE_CONFIG': {
      const { tableId, config } = action.payload;
      const existingConfig = state.tableConfigs[tableId] || {
        columnVisibility: {},
        columnOrder: [],
        sorting: [],
        columnFilters: [],
        pageSize: state.userPreferences.itemsPerPage,
        enableVirtualization: state.userPreferences.enableVirtualization,
      };
      
      return {
        ...state,
        tableConfigs: {
          ...state.tableConfigs,
          [tableId]: {
            ...existingConfig,
            ...config,
          },
        },
      };
    }
    
    case 'RESET_TABLE_CONFIG': {
      const { [action.payload]: _, ...remainingConfigs } = state.tableConfigs;
      return {
        ...state,
        tableConfigs: remainingConfigs,
      };
    }
    
    case 'RESET_ALL_TABLE_CONFIGS':
      return {
        ...state,
        tableConfigs: {},
      };
    
    case 'UPDATE_NOTIFICATION_SETTINGS':
      return {
        ...state,
        notificationSettings: {
          ...state.notificationSettings,
          ...action.payload,
        },
      };
    
    case 'TOGGLE_FEATURE':
      return {
        ...state,
        activeFeatures: {
          ...state.activeFeatures,
          [action.payload]: !state.activeFeatures[action.payload],
        },
      };
    
    case 'SET_SELECTED_ITEMS':
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          selectedItems: {
            ...state.temporaryState.selectedItems,
            [action.payload.context]: action.payload.items,
          },
        },
      };
    
    case 'ADD_SELECTED_ITEM': {
      const { context, item } = action.payload;
      const currentItems = state.temporaryState.selectedItems[context] || new Set();
      const newItems = new Set(currentItems);
      newItems.add(item);
      
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          selectedItems: {
            ...state.temporaryState.selectedItems,
            [context]: newItems,
          },
        },
      };
    }
    
    case 'REMOVE_SELECTED_ITEM': {
      const { context, item } = action.payload;
      const currentItems = state.temporaryState.selectedItems[context] || new Set();
      const newItems = new Set(currentItems);
      newItems.delete(item);
      
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          selectedItems: {
            ...state.temporaryState.selectedItems,
            [context]: newItems,
          },
        },
      };
    }
    
    case 'CLEAR_SELECTED_ITEMS':
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          selectedItems: {
            ...state.temporaryState.selectedItems,
            [action.payload]: new Set(),
          },
        },
      };
    
    case 'SET_EXPANDED_ITEMS':
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          expandedItems: {
            ...state.temporaryState.expandedItems,
            [action.payload.context]: action.payload.items,
          },
        },
      };
    
    case 'TOGGLE_EXPANDED_ITEM': {
      const { context, item } = action.payload;
      const currentItems = state.temporaryState.expandedItems[context] || new Set();
      const newItems = new Set(currentItems);
      
      if (newItems.has(item)) {
        newItems.delete(item);
      } else {
        newItems.add(item);
      }
      
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          expandedItems: {
            ...state.temporaryState.expandedItems,
            [context]: newItems,
          },
        },
      };
    }
    
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          searchQueries: {
            ...state.temporaryState.searchQueries,
            [action.payload.context]: action.payload.query,
          },
        },
      };
    
    case 'CLEAR_SEARCH_QUERY': {
      const { [action.payload]: _, ...remainingQueries } = state.temporaryState.searchQueries;
      return {
        ...state,
        temporaryState: {
          ...state.temporaryState,
          searchQueries: remainingQueries,
        },
      };
    }
    
    case 'IMPORT_SETTINGS':
      return {
        ...state,
        ...action.payload,
        // 不覆蓋臨時狀態
        temporaryState: state.temporaryState,
      };
    
    case 'RESET_ALL_SETTINGS':
      return {
        ...defaultState,
        // 保留臨時狀態
        temporaryState: state.temporaryState,
      };
    
    default:
      return state;
  }
}

/**
 * Context 介面
 */
interface GlobalStateContextType {
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
}

/**
 * 全局狀態 Context
 */
const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

/**
 * 從 localStorage 載入持久化狀態
 */
function loadPersistedState(): Partial<GlobalState> {
  if (typeof window === 'undefined') return {};
  
  try {
    const persistedState = localStorage.getItem('inventory-global-state');
    if (persistedState) {
      const parsed = JSON.parse(persistedState);
      // 只載入需要持久化的狀態，排除臨時狀態
      return {
        userPreferences: parsed.userPreferences,
        tableConfigs: parsed.tableConfigs,
        notificationSettings: parsed.notificationSettings,
        activeFeatures: parsed.activeFeatures,
      };
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
  }
  
  return {};
}

/**
 * 保存狀態到 localStorage
 */
function saveStateToStorage(state: GlobalState) {
  if (typeof window === 'undefined') return;
  
  try {
    const stateToSave = {
      userPreferences: state.userPreferences,
      tableConfigs: state.tableConfigs,
      notificationSettings: state.notificationSettings,
      activeFeatures: state.activeFeatures,
    };
    localStorage.setItem('inventory-global-state', JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save state to storage:', error);
  }
}

/**
 * 全局狀態 Provider
 */
interface GlobalStateProviderProps {
  children: ReactNode;
}

export function GlobalStateProvider({ children }: GlobalStateProviderProps) {
  // 載入持久化狀態
  const initialState = {
    ...defaultState,
    ...loadPersistedState(),
  };
  
  const [state, dispatch] = useReducer(globalStateReducer, initialState);
  
  // 自動保存狀態變更到 localStorage
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);
  
  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

/**
 * 使用全局狀態的 Hook
 */
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}

/**
 * 便捷的操作 Hooks
 */

// 用戶偏好 Hook
export function useUserPreferences() {
  const { state, dispatch } = useGlobalState();
  
  const updateUserPreferences = (preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences });
  };
  
  const resetUserPreferences = () => {
    dispatch({ type: 'RESET_USER_PREFERENCES' });
  };
  
  return {
    userPreferences: state.userPreferences,
    updateUserPreferences,
    resetUserPreferences,
  };
}

// 表格配置 Hook
export function useTableConfig(tableId: string) {
  const { state, dispatch } = useGlobalState();
  
  const updateTableConfig = (config: Partial<TableConfig[string]>) => {
    dispatch({
      type: 'UPDATE_TABLE_CONFIG',
      payload: { tableId, config },
    });
  };
  
  const resetTableConfig = () => {
    dispatch({ type: 'RESET_TABLE_CONFIG', payload: tableId });
  };
  
  return {
    tableConfig: state.tableConfigs[tableId],
    updateTableConfig,
    resetTableConfig,
  };
}

// 通知設置 Hook
export function useNotificationSettings() {
  const { state, dispatch } = useGlobalState();
  
  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    dispatch({ type: 'UPDATE_NOTIFICATION_SETTINGS', payload: settings });
  };
  
  return {
    notificationSettings: state.notificationSettings,
    updateNotificationSettings,
  };
}

// 功能切換 Hook
export function useFeatureToggle() {
  const { state, dispatch } = useGlobalState();
  
  const toggleFeature = (feature: keyof GlobalState['activeFeatures']) => {
    dispatch({ type: 'TOGGLE_FEATURE', payload: feature });
  };
  
  return {
    activeFeatures: state.activeFeatures,
    toggleFeature,
  };
}

// 臨時狀態管理 Hook
export function useTemporaryState(context: string) {
  const { state, dispatch } = useGlobalState();
  
  // 選中項目管理
  const selectedItems = state.temporaryState.selectedItems[context] || new Set();
  const setSelectedItems = (items: Set<string | number>) => {
    dispatch({ type: 'SET_SELECTED_ITEMS', payload: { context, items } });
  };
  const addSelectedItem = (item: string | number) => {
    dispatch({ type: 'ADD_SELECTED_ITEM', payload: { context, item } });
  };
  const removeSelectedItem = (item: string | number) => {
    dispatch({ type: 'REMOVE_SELECTED_ITEM', payload: { context, item } });
  };
  const clearSelectedItems = () => {
    dispatch({ type: 'CLEAR_SELECTED_ITEMS', payload: context });
  };
  
  // 展開項目管理
  const expandedItems = state.temporaryState.expandedItems[context] || new Set();
  const setExpandedItems = (items: Set<string | number>) => {
    dispatch({ type: 'SET_EXPANDED_ITEMS', payload: { context, items } });
  };
  const toggleExpandedItem = (item: string | number) => {
    dispatch({ type: 'TOGGLE_EXPANDED_ITEM', payload: { context, item } });
  };
  
  // 搜索查詢管理
  const searchQuery = state.temporaryState.searchQueries[context] || '';
  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: { context, query } });
  };
  const clearSearchQuery = () => {
    dispatch({ type: 'CLEAR_SEARCH_QUERY', payload: context });
  };
  
  return {
    selectedItems,
    setSelectedItems,
    addSelectedItem,
    removeSelectedItem,
    clearSelectedItems,
    expandedItems,
    setExpandedItems,
    toggleExpandedItem,
    searchQuery,
    setSearchQuery,
    clearSearchQuery,
  };
}

// 設置導入導出 Hook
export function useSettingsManager() {
  const { state, dispatch } = useGlobalState();
  
  const exportSettings = () => {
    const exportData = {
      userPreferences: state.userPreferences,
      tableConfigs: state.tableConfigs,
      notificationSettings: state.notificationSettings,
      activeFeatures: state.activeFeatures,
    };
    return JSON.stringify(exportData, null, 2);
  };
  
  const importSettings = (settingsJson: string) => {
    try {
      const settings = JSON.parse(settingsJson);
      dispatch({ type: 'IMPORT_SETTINGS', payload: settings });
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  };
  
  const resetAllSettings = () => {
    dispatch({ type: 'RESET_ALL_SETTINGS' });
  };
  
  return {
    exportSettings,
    importSettings,
    resetAllSettings,
  };
}