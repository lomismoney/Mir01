import { CategoryItem } from "./CategoryItem";
import { Category } from "@/types/category";

/**
 * CategoryTree 元件屬性介面
 *
 * @param categories - 當前層級的分類陣列
 * @param allCategories - 所有分類的分組資料（按 parent_id 分組）
 * @param onEdit - 編輯分類的回調函數
 * @param onDelete - 刪除分類的回調函數
 * @param onAddSubCategory - 新增子分類的回調函數
 * @param isTopLevel - 是否為頂層分類（控制縮排）
 */
interface CategoryTreeProps {
  categories: Category[];
  allCategories: Record<string, Category[]>;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onAddSubCategory?: (parentId: number) => void;
  isTopLevel?: boolean;
}

/**
 * 分類樹狀結構元件
 *
 * 負責渲染一層的分類列表，每個分類項目使用 CategoryItem 元件顯示。
 * 這是遞迴結構的核心，通過 CategoryItem 實現樹狀展開。
 *
 * 功能特色：
 * - 支援無限層級嵌套
 * - 遞迴渲染子分類
 * - 智能縮排控制（頂層無縮排，子層有縮排）
 * - 類型安全的資料處理
 * - 完整的 CRUD 操作支援
 *
 * @param categories - 當前層級要顯示的分類陣列
 * @param allCategories - 完整的分類分組資料，用於查找子分類
 * @param onEdit - 編輯分類的事件處理函數
 * @param onDelete - 刪除分類的事件處理函數
 * @param onAddSubCategory - 新增子分類的事件處理函數
 * @param isTopLevel - 是否為頂層分類，控制是否應用左邊距
 * @returns 渲染的分類樹狀結構
 */
export function CategoryTree({
  categories,
  allCategories,
  onEdit,
  onDelete,
  onAddSubCategory,
  isTopLevel = false,
}: CategoryTreeProps) {
  return (
    <div className={isTopLevel ? "" : "pl-6"}>
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          allCategories={allCategories}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubCategory={onAddSubCategory}
         
        />
      ))}
    </div>
  );
}
