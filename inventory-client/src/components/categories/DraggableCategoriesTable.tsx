"use client";

import * as React from "react";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  ExpandedState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  CategoryNode,
  useReorderCategories,
} from "@/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { GripVertical, Check, Loader2 } from "lucide-react";
import { useErrorHandler } from "@/hooks";

interface DraggableRowProps {
  row: any;
  children: React.ReactNode;
}

/**
 * 可拖曳的表格行組件
 * 使用 @dnd-kit/sortable 實現拖曳功能
 * 優化版本 - 消除頓挫感
 */
function DraggableRow({ row, children }: DraggableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
    // 關鍵優化：禁用動畫以避免衝突
    animateLayoutChanges: () => false,
  });

  // 優化樣式：最小化樣式變更，減少重渲染
  const style = React.useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition: transition,
    ...(isDragging && {
      opacity: 0.8,
      zIndex: 1000,
    }),
  }), [transform, transition, isDragging]);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && "selected"}
      className={`
        ${isDragging ? "cursor-grabbing shadow-lg border-2 border-primary/20 bg-primary/5" : ""} 
        transition-colors duration-200
      `}
     
    >
      {/* 拖曳手柄 - 增強版 */}
      <TableCell className="w-10">
        <Button
          variant="ghost"
          size="sm"
          className={`
            h-8 w-8 p-0 cursor-grab hover:bg-muted transition-colors
            ${isDragging ? "cursor-grabbing bg-primary/10" : ""}
          `}
          {...attributes}
          {...listeners}
         
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </TableCell>
      {children}
    </TableRow>
  );
}

/**
 * 拖曳預覽組件 - 顯示正在拖曳的項目
 */
function DragOverlayContent({ category }: { category: CategoryNode | null }) {
  if (!category) return null;

  return (
    <div className="bg-background border border-border rounded-md shadow-lg p-3 opacity-95 min-w-[200px]">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{category.name}</span>
      </div>
    </div>
  );
}

interface DraggableCategoriesTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: CategoryNode[];
  isLoading?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  expanded?: ExpandedState;
  onExpandedChange?: (expanded: ExpandedState) => void;
}

/**
 * 支援拖曳排序的分類表格組件 - 增強版
 *
 * 優化特點：
 * 1. 更好的視覺反饋 - 拖曳預覽、高亮效果
 * 2. 清晰的狀態指示 - 載入狀態、成功提示
 * 3. 流暢的動畫效果 - 禁用拖曳時的過渡動畫
 * 4. 即時反饋機制 - toast 通知和狀態更新
 * 5. 錯誤處理 - 失敗時自動恢復
 */
export function DraggableCategoriesTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  columnVisibility,
  onColumnVisibilityChange,
  expanded,
  onExpandedChange,
}: DraggableCategoriesTableProps<TData, TValue>) {
  // 🎯 增強的錯誤處理
  const { handleError, handleSuccess } = useErrorHandler();
  
  // 拖曳狀態管理
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<CategoryNode | null>(null);
  
  // 本地數據狀態管理
  const [localData, setLocalData] = useState<CategoryNode[]>(data);
  const [isReordering, setIsReordering] = useState(false);
  const [loadingToastId, setLoadingToastId] = useState<string | number | null>(null);
  // 移除 dragOverId 狀態以提升性能

  // 當外部數據變化時，更新本地狀態（但不覆蓋正在重新排序的數據）
  React.useEffect(() => {
    if (!isReordering) {
      setLocalData(data);
    }
  }, [data, isReordering]);

  // 獲取重新排序的 mutation
  const reorderMutation = useReorderCategories();

  // 優化感應器配置 - 消除頓挫感
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0, // 完全移除距離限制，提供最流暢的拖曳
        tolerance: 0,
        delay: 0,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 獲取所有頂層分類的 ID（用於拖曳）
  const categoryIds = React.useMemo(
    () => localData.map((category) => category.id),
    [localData],
  );

  // 初始化表格
  const table = useReactTable({
    data: localData as TData[],
    columns: [
      {
        id: "drag-handle",
        header: "",
        cell: () => null, // 內容在 DraggableRow 中處理
        size: 40,
      },
      ...columns,
    ],

    state: {
      columnVisibility,
      expanded,
    },
    onColumnVisibilityChange: onColumnVisibilityChange as any,
    onExpandedChange: onExpandedChange as any,
    getCoreRowModel: getCoreRowModel(),
    getSubRows: (row: any) => row.children,
    getExpandedRowModel: getExpandedRowModel(),
  });

  /**
   * 處理拖曳開始事件 - 優化版本
   */
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    
    // 找到正在拖曳的分類
    const category = localData.find(cat => cat.id === active.id);
    setDraggedCategory(category || null);
    
    // 移除開始提示，避免打斷流暢性
    // toast.info(`拖曳：${category?.name}`, {
    //   duration: 800,
    //   position: 'bottom-right',
    // });
  }, [localData]);

  /**
   * 處理拖曳結束事件 - 性能優化版本
   */
  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // 清除拖曳狀態
    setActiveId(null);
    setDraggedCategory(null);

    if (over && active.id !== over.id) {
      const oldIndex = localData.findIndex((item) => item.id === active.id);
      const newIndex = localData.findIndex((item) => item.id === over.id);


      // 只處理頂層分類的排序
      if (oldIndex === -1 || newIndex === -1) {
        handleError(new Error("僅支援頂層分類排序"));
        return;
      }

      // 獲取被拖曳的分類名稱
      const draggedCategoryName = localData[oldIndex]?.name;

      // 立即更新本地狀態（樂觀更新）
      const reorderedCategories = arrayMove(localData, oldIndex, newIndex);
      setLocalData(reorderedCategories);
      setIsReordering(true);

      // 準備更新數據
      const itemsToUpdate = reorderedCategories.map((category, index) => ({
        id: category.id,
        sort_order: index,
      }));

      // 觸發後端同步
      reorderMutation.mutate(itemsToUpdate, {
        onSuccess: () => {
          setIsReordering(false);
          handleSuccess("排序已更新");
        },
        onError: (error) => {
          console.error("❌ [DraggableCategoriesTable] 排序失敗:", error);
          
          // 恢復原始順序
          setLocalData(data);
          setIsReordering(false);
          
          handleError(error);
        },
      });
    } else {
      // 沒有有效的拖曳操作 - 不顯示提示，保持操作流暢
      // toast.info("未進行排序變更");
    }
  }, [localData, data, reorderMutation, handleError, handleSuccess]);

  // 移除 handleDragOver 以提升性能

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">載入分類數據中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
              <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
         
        >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <SortableContext
              items={categoryIds}
              strategy={verticalListSortingStrategy}
             
            >
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  // 只有頂層分類可以拖曳
                  const isTopLevel = !row.depth;
                  // 移除 dragOverId 相關邏輯

                                      if (isTopLevel) {
                      return (
                        <DraggableRow 
                          key={row.id} 
                          row={row} 
                         
                        >
                        {row
                          .getVisibleCells()
                          .slice(1)
                          .map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                      </DraggableRow>
                    );
                  } else {
                    // 子分類不可拖曳
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="w-10" />
                        {row
                          .getVisibleCells()
                          .slice(1)
                          .map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                      </TableRow>
                    );
                  }
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center"
                   
                  >
                    尚無分類資料
                  </TableCell>
                </TableRow>
              )}
            </SortableContext>
          </TableBody>
        </Table>
        
        {/* 拖曳預覽覆蓋層 */}
        <DragOverlay>
          <DragOverlayContent category={draggedCategory} />
        </DragOverlay>
      </DndContext>
      
      {/* 拖曳狀態指示器 */}
      {isReordering && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
          <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">正在更新排序...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
