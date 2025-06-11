import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommandItem } from '@/components/ui/command';
import { Category } from '@/types/category';

/**
 * 分類選項遞迴渲染器組件
 * 
 * 功能說明：
 * 1. 遞迴渲染單個分類及其所有子分類
 * 2. 根據分類層級自動計算縮排距離
 * 3. 支援選中狀態的視覺反饋
 * 4. 提供點擊選擇功能
 * 
 * @param category - 當前要渲染的分類
 * @param allCategories - 所有分類的分組結構
 * @param currentValue - 當前選中的分類 ID
 * @param onSelect - 選擇分類的回調函數
 * @param level - 當前分類的層級深度，用於計算縮排
 */
interface CategoryOptionRendererProps {
  category: Category;
  allCategories: Record<string, Category[]>;
  currentValue: number | null;
  onSelect: (id: number | null) => void;
  level?: number;
}

export function CategoryOptionRenderer({
  category,
  allCategories,
  currentValue,
  onSelect,
  level = 0,
}: CategoryOptionRendererProps) {
  // 獲取當前分類的子分類
  const children = allCategories[category.id] || [];

  return (
    <>
      {/* 渲染當前分類選項 */}
      <CommandItem
        key={category.id}
        value={category.name} // value 用於搜尋功能
        onSelect={() => onSelect(category.id)}
        style={{ paddingLeft: `${1 + level * 1.5}rem` }} // 根據層級計算縮排距離
      >
        {/* 選中狀態的勾選圖標 */}
        <Check
          className={cn('mr-2 h-4 w-4', currentValue === category.id ? 'opacity-100' : 'opacity-0')}
        />
        {category.name}
      </CommandItem>
      
      {/* 遞迴渲染子分類，層級加一 */}
      {children.map((child) => (
        <CategoryOptionRenderer
          key={child.id}
          category={child}
          allCategories={allCategories}
          currentValue={currentValue}
          onSelect={onSelect}
          level={level + 1} // 遞迴時層級加一，增加縮排
        />
      ))}
    </>
  );
} 