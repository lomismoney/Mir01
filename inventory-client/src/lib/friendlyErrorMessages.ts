/**
 * 友善錯誤訊息系統
 * 
 * 將技術性錯誤訊息轉換為使用者容易理解的友善訊息
 * 提供解決建議和操作指引
 */

/**
 * 錯誤類別枚舉
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * 錯誤嚴重程度
 */
export enum ErrorSeverity {
  LOW = 'low',      // 不影響核心功能
  MEDIUM = 'medium', // 影響部分功能
  HIGH = 'high',    // 影響主要功能
  CRITICAL = 'critical', // 系統無法使用
}

/**
 * 友善錯誤訊息介面
 */
export interface FriendlyErrorMessage {
  title: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  suggestions: string[];
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
  icon?: string;
  recoverable: boolean;
}

/**
 * HTTP 狀態碼對應的錯誤訊息
 */
const HTTP_ERROR_MESSAGES: Record<number, Omit<FriendlyErrorMessage, 'actions'>> = {
  // 400 系列 - 客戶端錯誤
  400: {
    title: '請求格式錯誤',
    message: '您提交的資料格式不正確，請檢查輸入內容。',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '檢查所有必填欄位是否正確填寫',
      '確認日期、數字格式是否正確',
      '移除特殊字符或不允許的內容'
    ],
    icon: '⚠️',
    recoverable: true,
  },
  
  401: {
    title: '登入已過期',
    message: '您的登入狀態已過期，請重新登入。',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    suggestions: [
      '點擊重新登入按鈕',
      '清除瀏覽器快取後重試',
      '檢查網路連線狀態'
    ],
    icon: '🔐',
    recoverable: true,
  },
  
  403: {
    title: '權限不足',
    message: '您沒有執行此操作的權限。',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.HIGH,
    suggestions: [
      '聯繫系統管理員申請權限',
      '確認您的帳戶狀態是否正常',
      '檢查是否使用正確的帳戶登入'
    ],
    icon: '🚫',
    recoverable: false,
  },
  
  404: {
    title: '找不到資源',
    message: '您要查看的內容不存在或已被移除。',
    category: ErrorCategory.NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '檢查網址是否正確',
      '返回上一頁重新選擇',
      '使用搜尋功能查找相關內容'
    ],
    icon: '🔍',
    recoverable: true,
  },
  
  409: {
    title: '資料衝突',
    message: '您要修改的資料已被其他人更新，請重新載入後再試。',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '重新載入頁面取得最新資料',
      '檢查是否有重複的資料',
      '稍後再試或聯繫管理員'
    ],
    icon: '⚡',
    recoverable: true,
  },
  
  422: {
    title: '資料驗證失敗',
    message: '您輸入的資料不符合系統要求。',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '檢查所有欄位的格式要求',
      '確認數值範圍是否正確',
      '移除不允許的特殊字符'
    ],
    icon: '📝',
    recoverable: true,
  },
  
  // 500 系列 - 伺服器錯誤
  500: {
    title: '系統暫時無法回應',
    message: '伺服器發生內部錯誤，我們正在處理中。',
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.CRITICAL,
    suggestions: [
      '稍後再試',
      '檢查網路連線',
      '如持續發生請聯繫技術支援'
    ],
    icon: '🛠️',
    recoverable: true,
  },
  
  502: {
    title: '服務暫時無法使用',
    message: '系統正在維護中，請稍後再試。',
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    suggestions: [
      '稍後再試',
      '查看系統公告獲取維護資訊',
      '聯繫客服了解預計恢復時間'
    ],
    icon: '🔧',
    recoverable: true,
  },
  
  503: {
    title: '服務暫時過載',
    message: '系統使用人數過多，請稍後再試。',
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    suggestions: [
      '等待幾分鐘後重試',
      '避開使用高峰時段',
      '儲存當前工作以免丟失'
    ],
    icon: '⏳',
    recoverable: true,
  },
  
  504: {
    title: '請求超時',
    message: '系統回應時間過長，請求已超時。',
    category: ErrorCategory.TIMEOUT,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '檢查網路連線品質',
      '重新送出請求',
      '嘗試分批處理大量資料'
    ],
    icon: '⏰',
    recoverable: true,
  },
};

/**
 * 網路錯誤訊息
 */
const NETWORK_ERROR_MESSAGES: Record<string, Omit<FriendlyErrorMessage, 'actions'>> = {
  'Failed to fetch': {
    title: '網路連線問題',
    message: '無法連接到伺服器，請檢查您的網路連線。',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    suggestions: [
      '檢查網路連線是否正常',
      '嘗試重新載入頁面',
      '檢查防火牆或代理設定'
    ],
    icon: '🌐',
    recoverable: true,
  },
  
  'Network request failed': {
    title: '網路請求失敗',
    message: '網路不穩定，請求無法完成。',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '檢查網路訊號強度',
      '切換到更穩定的網路',
      '稍後再試'
    ],
    icon: '📶',
    recoverable: true,
  },
  
  'timeout': {
    title: '連線超時',
    message: '網路回應時間過長，連線已超時。',
    category: ErrorCategory.TIMEOUT,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '檢查網路速度',
      '重新嘗試操作',
      '分批處理大量資料'
    ],
    icon: '⏱️',
    recoverable: true,
  },
};

/**
 * 業務邏輯錯誤訊息
 */
const BUSINESS_ERROR_MESSAGES: Record<string, Omit<FriendlyErrorMessage, 'actions'>> = {
  'insufficient_stock': {
    title: '庫存不足',
    message: '商品庫存不足，無法完成此操作。',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '調整商品數量',
      '選擇其他可用商品',
      '等待補貨後再操作'
    ],
    icon: '📦',
    recoverable: true,
  },
  
  'duplicate_entry': {
    title: '資料重複',
    message: '系統中已存在相同的資料。',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '檢查是否已有相同記錄',
      '修改重複的資料內容',
      '使用編輯功能更新現有資料'
    ],
    icon: '📋',
    recoverable: true,
  },
  
  'order_already_shipped': {
    title: '訂單已出貨',
    message: '此訂單已完成出貨，無法再進行修改。',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '聯繫客服處理已出貨訂單',
      '建立退貨或換貨申請',
      '檢查訂單狀態'
    ],
    icon: '🚚',
    recoverable: false,
  },
};

/**
 * 轉換錯誤為友善訊息
 */
export function convertToFriendlyError(error: any): FriendlyErrorMessage {
  // 處理網路錯誤
  if (error?.message && NETWORK_ERROR_MESSAGES[error.message]) {
    return {
      ...NETWORK_ERROR_MESSAGES[error.message],
      actions: [
        {
          label: '重試',
          action: () => window.location.reload(),
          primary: true,
        },
        {
          label: '檢查網路',
          action: () => window.open('https://www.google.com', '_blank'),
        },
      ],
    };
  }
  
  // 處理 HTTP 狀態碼錯誤
  if (error?.response?.status && HTTP_ERROR_MESSAGES[error.response.status]) {
    const baseMessage = HTTP_ERROR_MESSAGES[error.response.status];
    let actions: FriendlyErrorMessage['actions'] = [];
    
    switch (error.response.status) {
      case 401:
        actions = [
          {
            label: '重新登入',
            action: () => window.location.href = '/login',
            primary: true,
          },
        ];
        break;
      case 403:
        actions = [
          {
            label: '聯繫管理員',
            action: () => window.open('mailto:admin@example.com', '_blank'),
            primary: true,
          },
        ];
        break;
      case 404:
        actions = [
          {
            label: '返回首頁',
            action: () => window.location.href = '/',
            primary: true,
          },
          {
            label: '返回上頁',
            action: () => window.history.back(),
          },
        ];
        break;
      default:
        actions = [
          {
            label: '重試',
            action: () => window.location.reload(),
            primary: true,
          },
        ];
    }
    
    return {
      ...baseMessage,
      actions,
    };
  }
  
  // 處理業務邏輯錯誤
  if (error?.code && BUSINESS_ERROR_MESSAGES[error.code]) {
    return {
      ...BUSINESS_ERROR_MESSAGES[error.code],
      actions: [
        {
          label: '了解',
          action: () => {},
          primary: true,
        },
      ],
    };
  }
  
  // 處理 API 回應中的錯誤訊息
  if (error?.response?.data?.message) {
    const serverMessage = error.response.data.message;
    
    // 嘗試匹配已知的錯誤模式
    for (const [key, message] of Object.entries(BUSINESS_ERROR_MESSAGES)) {
      if (serverMessage.toLowerCase().includes(key)) {
        return {
          ...message,
          actions: [
            {
              label: '了解',
              action: () => {},
              primary: true,
            },
          ],
        };
      }
    }
  }
  
  // 預設的未知錯誤訊息
  return {
    title: '發生未預期的錯誤',
    message: '系統發生了未預期的問題，請稍後再試。',
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      '重新載入頁面',
      '清除瀏覽器快取',
      '聯繫技術支援'
    ],
    actions: [
      {
        label: '重新載入',
        action: () => window.location.reload(),
        primary: true,
      },
      {
        label: '回報問題',
        action: () => window.open('mailto:support@example.com', '_blank'),
      },
    ],
    icon: '❌',
    recoverable: true,
  };
}

/**
 * 錯誤追蹤和分析
 */
export class ErrorTracker {
  private static errors: Array<{
    error: any;
    friendlyMessage: FriendlyErrorMessage;
    timestamp: Date;
    url: string;
    userAgent: string;
  }> = [];
  
  static track(error: any, friendlyMessage: FriendlyErrorMessage) {
    this.errors.push({
      error,
      friendlyMessage,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
    
    // 保持最近 100 個錯誤記錄
    if (this.errors.length > 100) {
      this.errors.shift();
    }
    
    // 在開發環境中輸出錯誤信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Tracked');
      console.error('Original Error:', error);
      console.info('Friendly Message:', friendlyMessage);
      console.groupEnd();
    }
  }
  
  static getErrorStats() {
    const stats = {
      total: this.errors.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: this.errors.slice(-10),
    };
    
    this.errors.forEach(({ friendlyMessage }) => {
      stats.byCategory[friendlyMessage.category] = 
        (stats.byCategory[friendlyMessage.category] || 0) + 1;
      
      stats.bySeverity[friendlyMessage.severity] = 
        (stats.bySeverity[friendlyMessage.severity] || 0) + 1;
    });
    
    return stats;
  }
  
  static exportErrorsForSupport() {
    return {
      errors: this.errors.map(({ error, friendlyMessage, timestamp, url }) => ({
        timestamp: timestamp.toISOString(),
        url,
        category: friendlyMessage.category,
        severity: friendlyMessage.severity,
        title: friendlyMessage.title,
        originalError: error?.message || String(error),
      })),
      browser: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 錯誤回報輔助函數
 */
export function generateErrorReport(error: any, friendlyMessage: FriendlyErrorMessage) {
  return {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    error: {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    },
    friendlyMessage: {
      title: friendlyMessage.title,
      category: friendlyMessage.category,
      severity: friendlyMessage.severity,
    },
    systemInfo: {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${screen.width}x${screen.height}`,
      language: navigator.language,
      online: navigator.onLine,
    },
  };
}

/**
 * 智能錯誤恢復建議
 */
export function getRecoveryActions(error: FriendlyErrorMessage): Array<{
  label: string;
  description: string;
  action: () => void;
  automatic?: boolean;
}> {
  const actions = [];
  
  switch (error.category) {
    case ErrorCategory.NETWORK:
      actions.push({
        label: '檢查網路連線',
        description: '測試網路連線狀態',
        action: () => {
          if (navigator.onLine) {
            alert('網路連線正常，問題可能在伺服器端');
          } else {
            alert('網路連線異常，請檢查您的網路設定');
          }
        },
      });
      break;
      
    case ErrorCategory.AUTHENTICATION:
      actions.push({
        label: '自動重新登入',
        description: '嘗試重新取得登入狀態',
        action: () => {
          // 這裡可以整合實際的重新登入邏輯
          window.location.href = '/login';
        },
        automatic: true,
      });
      break;
      
    case ErrorCategory.VALIDATION:
      actions.push({
        label: '重置表單',
        description: '清空表單重新填寫',
        action: () => {
          const forms = document.querySelectorAll('form');
          forms.forEach(form => form.reset());
        },
      });
      break;
  }
  
  return actions;
}