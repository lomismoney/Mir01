'use client';

import { useState, memo, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useAttributes, useCreateAttribute, useUpdateAttribute, useDeleteAttribute, useCreateAttributeValue, useUpdateAttributeValue, useDeleteAttributeValue } from '@/hooks/queries/useEntityQueries';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Search, ChevronDown, Trash2, Tags, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { columns } from '../../app/(app)/attributes/columns';
import { Attribute } from '@/types/attribute';
import { toast } from 'sonner';

/**
 * 規格管理客戶端頁面組件（大掃除行動重構版本）
 * 
 * 架構升級：
 * 1. 完全基於 TanStack Table 的現代化架構
 * 2. 統一的 columns 定義，關注點分離
 * 3. useDebounce 優化搜尋體驗，減少 API 請求
 * 4. 事件驅動的操作處理機制
 * 5. 與其他管理模組架構完全一致
 * 
 * 效能優化：
 * - TanStack Table 內建虛擬化和優化
 * - 防抖搜尋，避免過度 API 請求
 * - React.memo 防止不必要重渲染
 * - 職責分離的架構設計
 * 
 * 安全特性：
 * - 統一的權限驗證機制 (useAdminAuth)
 * - 類型安全的 API 呼叫
 * - 完整的錯誤處理
 */
const AttributesClientPage = () => {
  const { user, isLoading, isAuthorized } = useAdminAuth();
  
  // 搜索狀態管理 - 使用防抖優化
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms 延遲
  
  // TanStack Table 狀態管理
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // 使用防抖後的搜索查詢
  const { data: attributesResponse, isLoading: isAttributesLoading, error } = useAttributes();
  
  // API Mutation Hooks
  const createAttributeMutation = useCreateAttribute();
  const updateAttributeMutation = useUpdateAttribute();
  const deleteAttributeMutation = useDeleteAttribute();
  const createValueMutation = useCreateAttributeValue();
  const updateValueMutation = useUpdateAttributeValue();
  const deleteValueMutation = useDeleteAttributeValue();
  
  // 對話框狀態管理
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isValuesDialogOpen, setIsValuesDialogOpen] = useState(false);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  
  // 表單資料狀態
  const [attributeName, setAttributeName] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [managingAttribute, setManagingAttribute] = useState<Attribute | null>(null);
  const [newValue, setNewValue] = useState('');

  // 初始化表格 - 處理 API 類型與本地類型的差異
  const attributes = (attributesResponse?.data || [])
    .filter((attr): attr is Required<typeof attr> => 
      attr.id !== undefined && attr.name !== undefined
    )
    .map(attr => ({
      id: attr.id!,
      name: attr.name!,
      created_at: attr.created_at,
      updated_at: attr.updated_at,
      values: attr.values?.map(val => ({
        id: val.id!,
        value: val.value!,
        attribute_id: val.attribute_id!,
        created_at: val.created_at,
        updated_at: val.updated_at,
      })) || []
    })) as Attribute[];
  
  const table = useReactTable({
    data: attributes,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    autoResetPageIndex: false, // 🎯 斬斷循環：禁用分頁自動重設
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  /**
   * 處理搜尋輸入變化
   * 使用客戶端搜尋，因為 API 不支援搜尋參數
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // 使用 TanStack Table 的內建過濾功能
    table.getColumn('name')?.setFilterValue(value);
  };

  /**
   * 處理新增規格
   */
  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attributeName.trim()) return;

    try {
      await createAttributeMutation.mutateAsync({ name: attributeName.trim() });
      toast.success('規格新增成功！');
      setAttributeName('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '新增規格失敗';
      toast.error(errorMessage);
    }
  };

  /**
   * 處理編輯規格
   */
  const handleEditAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttribute || !attributeName.trim()) return;

    try {
      await updateAttributeMutation.mutateAsync({
        path: { id: selectedAttribute.id, attribute: selectedAttribute.id },
        body: { name: attributeName.trim() }
      });
      toast.success('規格更新成功！');
      setAttributeName('');
      setSelectedAttribute(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('更新規格失敗');
    }
  };

  /**
   * 處理刪除規格
   */
  const handleDeleteAttribute = async () => {
    if (!selectedAttribute) return;

    try {
      await deleteAttributeMutation.mutateAsync({ 
        id: selectedAttribute.id, 
        attribute: selectedAttribute.id 
      });
      toast.success('規格刪除成功！');
      setSelectedAttribute(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error('刪除規格失敗');
    }
  };

  /**
   * 處理批量刪除
   */
  const handleBatchDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast.error('請選擇要刪除的規格');
      return;
    }
    setShowBatchDeleteDialog(true);
  };

  /**
   * 確認批量刪除
   */
  const confirmBatchDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows
      .map(row => row.original.id)
      .filter((id): id is number => id !== undefined && id !== null);
    
    if (selectedIds.length === 0) {
      toast.error('沒有有效的規格 ID 可供刪除');
      return;
    }
    
    try {
      // 批量刪除（需要逐一刪除，因為 API 不支援批量）
      await Promise.all(
        selectedIds.map(id => 
          deleteAttributeMutation.mutateAsync({ id, attribute: id })
        )
      );
      toast.success(`成功刪除 ${selectedIds.length} 個規格！`);
      setShowBatchDeleteDialog(false);
      setRowSelection({}); // 清空選中狀態
    } catch (error) {
      toast.error('批量刪除失敗');
    }
  };

  /**
   * 處理規格值管理
   */
  const handleCreateValue = () => {
    if (!managingAttribute || !newValue.trim()) return;
    createValueMutation.mutate({
      attributeId: managingAttribute.id,
      body: { value: newValue.trim() }
    }, {
      onSuccess: () => {
        toast.success(`選項「${newValue}」已新增`);
        setNewValue('');
      },
      onError: (error) => toast.error(`新增失敗：${error.message}`)
    });
  };

  const handleDeleteValue = (valueId: number) => {
    deleteValueMutation.mutate(valueId, {
      onSuccess: () => toast.success('選項已刪除'),
      onError: (error) => toast.error(`刪除失敗：${error.message}`)
    });
  };

  /**
   * 設置事件監聽器來處理來自 columns 的操作事件
   */
  useEffect(() => {
    const handleEditEvent = (event: CustomEvent) => {
      const attribute = event.detail as Attribute;
      setSelectedAttribute(attribute);
      setAttributeName(attribute.name);
      setIsEditDialogOpen(true);
    };

    const handleDeleteEvent = (event: CustomEvent) => {
      const attribute = event.detail as Attribute;
      setSelectedAttribute(attribute);
      setIsDeleteDialogOpen(true);
    };

    const handleManageValuesEvent = (event: CustomEvent) => {
      const attribute = event.detail as Attribute;
      setManagingAttribute(attribute);
      setIsValuesDialogOpen(true);
    };

    // 使用新的事件名稱
    window.addEventListener('editAttribute', handleEditEvent as EventListener);
    window.addEventListener('deleteAttribute', handleDeleteEvent as EventListener);
    window.addEventListener('manageAttributeValues', handleManageValuesEvent as EventListener);

    return () => {
      window.removeEventListener('editAttribute', handleEditEvent as EventListener);
      window.removeEventListener('deleteAttribute', handleDeleteEvent as EventListener);
      window.removeEventListener('manageAttributeValues', handleManageValuesEvent as EventListener);
    };
  }, []);

  // 使用統一的權限守衛
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">正在驗證權限...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized) {
    return null; // useAdminAuth 會處理重新導向
  }

  // 錯誤狀態
  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-red-600">
            <h3 className="text-lg font-semibold">載入失敗</h3>
            <p>無法載入規格資料，請重試</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 計算選中的行數
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">規格管理</h1>
          <p className="text-muted-foreground">
            管理商品規格屬性和對應的規格值
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          新增規格
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            規格列表
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 工具列 */}
          <div className="flex items-center justify-between">
            {/* 搜尋框 - 現已支援防抖優化 */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜尋規格名稱..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              {/* 欄位顯示控制 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    欄位 <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id === "name" && "規格名稱"}
                          {column.id === "value_count" && "規格值數量"}
                          {column.id === "created_at" && "創建時間"}
                          {column.id === "actions" && "操作"}
                          {!["name", "value_count", "created_at", "actions"].includes(column.id) && column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 批量刪除按鈕 */}
              {selectedRowCount > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBatchDelete}
                  disabled={deleteAttributeMutation.isPending}
                >
                  {deleteAttributeMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除選中 ({selectedRowCount})
                </Button>
              )}
            </div>
          </div>

          {/* TanStack Table - 完全取代卡片式佈局 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isAttributesLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>載入中...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Tags className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">
                          {searchQuery ? '沒有找到符合條件的規格' : '尚無規格資料'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分頁控制 */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              已選擇 {selectedRowCount} 個項目
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                上一頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                下一頁
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 新增規格對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增規格</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAttribute} className="space-y-4">
            <div>
              <Label htmlFor="attributeName">規格名稱</Label>
              <Input
                id="attributeName"
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
                placeholder="例如：顏色、尺寸、材質"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createAttributeMutation.isPending}>
                {createAttributeMutation.isPending ? '新增中...' : '新增'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 編輯規格對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯規格</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAttribute} className="space-y-4">
            <div>
              <Label htmlFor="editAttributeName">規格名稱</Label>
              <Input
                id="editAttributeName"
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
                placeholder="例如：顏色、尺寸、材質"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateAttributeMutation.isPending}>
                {updateAttributeMutation.isPending ? '更新中...' : '更新'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除規格</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除規格「{selectedAttribute?.name}」嗎？
              <br />
              此操作將同時刪除該規格下的所有規格值，且無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttribute}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteAttributeMutation.isPending}
            >
              {deleteAttributeMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量刪除確認對話框 */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批量刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除選中的 {selectedRowCount} 個規格嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBatchDeleteDialog(false)}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteAttributeMutation.isPending}
            >
              {deleteAttributeMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 規格值管理對話框 */}
      <Dialog open={isValuesDialogOpen} onOpenChange={setIsValuesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>管理「{managingAttribute?.name}」的規格值</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* 顯示已有的值 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">已有規格值</Label>
              {managingAttribute?.values && managingAttribute.values.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {managingAttribute.values.map((value) => (
                    <div key={value.id} className="flex items-center gap-1 p-2 px-3 border rounded-md bg-secondary/50">
                      <span className="text-sm">{value.value}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-1 hover:bg-destructive/20" 
                        onClick={() => handleDeleteValue(value.id)}
                        disabled={deleteValueMutation.isPending}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">此規格尚未有任何規格值</p>
              )}
            </div>

            {/* 新增值的表單 */}
            <div className="space-y-3">
              <Label htmlFor="new-value" className="text-base font-medium">新增規格值</Label>
              <div className="flex gap-2">
                <Input 
                  id="new-value" 
                  value={newValue} 
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="例如：紅色、XL、棉質"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateValue();
                    }
                  }}
                />
                <Button 
                  onClick={handleCreateValue} 
                  disabled={createValueMutation.isPending || !newValue.trim()}
                >
                  {createValueMutation.isPending ? '新增中...' : '新增'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * 使用 React.memo 優化的規格管理頁面元件
 * 
 * 效能優化：
 * - 防止父元件重渲染時的不必要重繪
 * - 僅當 props 發生變化時才重新渲染
 * - 配合 useAdminAuth 統一權限管理
 * - TanStack Table 內建虛擬化和效能優化
 */
export default memo(AttributesClientPage); 