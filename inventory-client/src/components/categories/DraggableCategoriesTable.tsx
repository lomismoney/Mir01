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
} from "@/hooks/queries/useEntityQueries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";

interface DraggableRowProps {
  row: any;
  children: React.ReactNode;
}

/**
 * 可拖曳的表格行組件
 * 使用 @dnd-kit/sortable 實現拖曳功能
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
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && "selected"}
      className={isDragging ? "cursor-grabbing" : ""}
      data-oid="tkqrsz4"
    >
      {/* 拖曳手柄 */}
      <TableCell className="w-10" data-oid="dckyxeq">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-grab hover:bg-muted"
          {...attributes}
          {...listeners}
          data-oid="_c3:csf"
        >
          <GripVertical className="h-4 w-4" data-oid="t:g0rol" />
        </Button>
      </TableCell>
      {children}
    </TableRow>
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
 * 支援拖曳排序的分類表格組件
 *
 * 功能特點：
 * 1. 拖曳排序 - 支援滑鼠和觸控拖曳
 * 2. 樂觀更新 - 透過 React Query 實現零延遲更新
 * 3. 自動同步 - 拖曳結束後自動更新到後端
 * 4. 狀態保持 - 保持展開和選擇狀態
 *
 * 這個組件現在完全依賴 React Query 的快取管理，
 * 不再維護本地狀態，使得程式碼更簡潔且更可靠
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
  // 保留必要的狀態
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  // 本地管理排序狀態
  const [localData, setLocalData] = useState<CategoryNode[]>(data);
  const [isReordering, setIsReordering] = useState(false);

  // 當外部數據變化時，更新本地狀態（但不覆蓋正在重新排序的數據）
  React.useEffect(() => {
    if (!isReordering) {
      setLocalData(data);
    }
  }, [data, isReordering]);

  // 獲取重新排序的 mutation
  const reorderMutation = useReorderCategories();

  // 拖曳感應器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
   * 處理拖曳開始事件
   */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  /**
   * 處理拖曳結束事件
   * 立即更新本地狀態，並觸發後端同步
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null); // 清除活躍狀態

    if (over && active.id !== over.id) {
      const oldIndex = localData.findIndex((item) => item.id === active.id);
      const newIndex = localData.findIndex((item) => item.id === over.id);

      console.log("🎯 [DraggableCategoriesTable] handleDragEnd:", {
        activeId: active.id,
        overId: over.id,
        oldIndex,
        newIndex,
        dataLength: localData.length,
      });

      // 只處理頂層分類的排序
      if (oldIndex === -1 || newIndex === -1) {
        console.warn("拖曳排序目前只支援頂層分類。");
        return;
      }

      // 立即更新本地狀態（樂觀更新）
      const reorderedCategories = arrayMove(localData, oldIndex, newIndex);
      setLocalData(reorderedCategories);
      setIsReordering(true);

      // 準備更新數據
      const itemsToUpdate = reorderedCategories.map((category, index) => ({
        id: category.id,
        sort_order: index,
      }));

      console.log("📊 [DraggableCategoriesTable] 準備更新:", itemsToUpdate);

      // 觸發後端同步
      reorderMutation.mutate(itemsToUpdate, {
        onSuccess: () => {
          console.log("✅ [DraggableCategoriesTable] 排序成功");
          setIsReordering(false);
        },
        onError: () => {
          console.error("❌ [DraggableCategoriesTable] 排序失敗，恢復原始順序");
          setLocalData(data); // 恢復原始順序
          setIsReordering(false);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96" data-oid="d6regf8">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          data-oid="ipdda-f"
        ></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border" data-oid="qjxg8a8">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        data-oid="mcxusms"
      >
        <Table data-oid="dbqlyzn">
          <TableHeader data-oid="l36g4rm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} data-oid="vsmal2r">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} data-oid="od6g9m9">
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
          <TableBody data-oid="mvqvkw6">
            <SortableContext
              items={categoryIds}
              strategy={verticalListSortingStrategy}
              data-oid="4x9cnsu"
            >
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  // 只有頂層分類可以拖曳
                  const isTopLevel = !row.depth;

                  if (isTopLevel) {
                    return (
                      <DraggableRow key={row.id} row={row} data-oid="fnhv-5c">
                        {row
                          .getVisibleCells()
                          .slice(1)
                          .map((cell) => (
                            <TableCell key={cell.id} data-oid="2iww5:.">
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
                      <TableRow key={row.id} data-oid="cgnxe:l">
                        <TableCell className="w-10" data-oid="6kw__4:" />
                        {row
                          .getVisibleCells()
                          .slice(1)
                          .map((cell) => (
                            <TableCell key={cell.id} data-oid="2cb9a47">
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
                <TableRow data-oid=".qwlvln">
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center"
                    data-oid=".:d25do"
                  >
                    尚無分類資料
                  </TableCell>
                </TableRow>
              )}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}
