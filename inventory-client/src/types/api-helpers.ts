import { Category } from '@/types/category';

/**
 * 將 API 回傳的分組分類資料轉換為正確的類型
 * 
 * @param groupedCategories - 從 API 獲取的分組分類資料
 * @returns 轉換後的分組分類資料，具有正確的 Category 類型
 * 
 * 功能說明：
 * 1. 將 API 回傳的 Record<string, unknown[]> 轉換為 Record<string, Category[]>
 * 2. 確保類型安全，避免運行時錯誤
 * 3. 處理可能的 null 或 undefined 值
 */
export function transformCategoriesGroupedResponse(
  groupedCategories: Record<string, unknown[]> | undefined
): Record<string, Category[]> {
  if (!groupedCategories) {
    return {};
  }

  const transformed: Record<string, Category[]> = {};
  
  for (const [key, categories] of Object.entries(groupedCategories)) {
    if (Array.isArray(categories)) {
      transformed[key] = categories.map(category => {
        // 確保每個分類物件都有必要的屬性
        if (typeof category === 'object' && category !== null) {
          const cat = category as Record<string, unknown>;
          return {
            id: cat.id,
            name: cat.name || '',
            description: cat.description || null,
            parent_id: cat.parent_id || null,
            created_at: cat.created_at || '',
            updated_at: cat.updated_at || '',
            children: cat.children || []
          } as Category;
        }
        // 如果資料格式不正確，回傳一個預設的分類物件
        return {
          id: 0,
          name: 'Unknown Category',
          description: null,
          parent_id: null,
          created_at: '',
          updated_at: '',
          children: []
        } as Category;
      });
    } else {
      transformed[key] = [];
    }
  }
  
  return transformed;
} 