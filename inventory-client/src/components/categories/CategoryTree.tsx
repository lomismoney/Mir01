import { CategoryItem } from "./CategoryItem";
import { CategoryNode } from "@/hooks/queries/useEntityQueries";

/**
 * CategoryTree 元件屬性介面
 * 
 * 【完美架構重構】簡化樹狀結構處理
 * - 移除複雜的 allCategories 分組邏輯
 * - 直接使用 CategoryNode 樹狀結構
 * - 提升組件性能和類型安全性
 *
 * @param categories - 當前層級的分類陣列（CategoryNode[]）
 * @param onEdit - 編輯分類的回調函數
 * @param onDelete - 刪除分類的回調函數
 * @param onAddSubCategory - 新增子分類的回調函數
 * @param isTopLevel - 是否為頂層分類（控制縮排）
 */
interface CategoryTreeProps {
  categories: CategoryNode[];
  onEdit?: (category: CategoryNode) => void;
  onDelete?: (category: CategoryNode) => void;
  onAddSubCategory?: (parentId: number) => void;
  isTopLevel?: boolean;
}

/**
 * 分類樹狀結構元件
 * 
 * 【完美架構重構】直接處理樹狀結構
 * 
 * 重構優勢：
 * 1. 🎯 簡化接口 - 移除不再需要的 allCategories 參數
 * 2. ⚡ 性能提升 - 不再需要查找父子關係，直接使用 children
 * 3. 🔒 類型安全 - 完全使用 CategoryNode 強類型
 * 4. 🧹 代碼清晰 - 組件職責更加單一
 *
 * 功能特色：
 * - 支援無限層級嵌套
 * - 遞迴渲染子分類
 * - 智能縮排控制（頂層無縮排，子層有縮排）
 * - 類型安全的資料處理
 * - 完整的 CRUD 操作支援
 *
 * @param categories - 當前層級要顯示的分類陣列
 * @param onEdit - 編輯分類的事件處理函數
 * @param onDelete - 刪除分類的事件處理函數
 * @param onAddSubCategory - 新增子分類的事件處理函數
 * @param isTopLevel - 是否為頂層分類，控制是否應用左邊距
 * @returns 渲染的分類樹狀結構
 */
export function CategoryTree({
  categories,
  onEdit,
  onDelete,
  onAddSubCategory,
  isTopLevel = false,
}: CategoryTreeProps) {
  return (
    <div className={isTopLevel ? "" : "pl-6"} data-oid="svs2ta9">
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubCategory={onAddSubCategory}
          data-oid="fieiswa"
        />
      ))}
    </div>
  );
}
