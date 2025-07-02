"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Store as StoreIcon,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useStores } from "@/hooks/queries/useEntityQueries";
import { apiClient } from "@/lib/apiClient";
import { handleApiError } from "@/lib/errorHandler";

// 替代已刪除的 useUserStores hooks，使用內嵌的類型安全API調用

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// 內嵌 ScrollArea 元件定義
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaScrollbar orientation="vertical" />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollAreaScrollbar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollAreaScrollbar.displayName =
  ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

// Store 類型定義
type Store = {
  id: number;
  name: string;
  address: string | null;
  phone?: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
  inventory_count?: number;
  users_count?: number;
};

interface UserStoresDialogProps {
  userId: number;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 內嵌的用戶分店查詢Hook - 類型安全，無as any
 */
function useUserStoresInline(userId: number) {
  return useQuery({
    queryKey: ["user-stores", userId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/users/{user}/stores", {
        params: { path: { user: userId } },
      });

      if (error) {
        throw handleApiError(error);
      }

      return { data: data?.data || data || [] };
    },
    enabled: !!userId,
  });
}

/**
 * 內嵌的分店分配Hook - 類型安全，無as any
 */
function useAssignUserStoresInline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, storeIds }: { userId: number; storeIds: number[] }) => {
      const { data, error } = await apiClient.POST("/api/users/{user}/stores", {
        params: { path: { user: userId } },
        body: { store_ids: storeIds.map(id => id.toString()) },
      });

      if (error) {
        throw handleApiError(error);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-stores", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/**
 * 用戶分店管理對話框組件
 */
export function UserStoresDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: UserStoresDialogProps) {
  // 獲取分店列表
  const { data: storesData, isLoading: isLoadingStores } = useStores();

  // 獲取用戶當前的分店 - 使用內嵌的類型安全Hook
  const { data: userStoresData, isLoading: isLoadingUserStores } =
    useUserStoresInline(userId);

  // 分配分店到用戶的 mutation - 使用內嵌的類型安全Hook
  const assignStoresMutation = useAssignUserStoresInline();

  // 獲取 React Query 客戶端實例，用於手動使緩存失效
  const queryClient = useQueryClient();

  // 選擇的分店 ID 列表
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);

  // 選擇下拉框的開啟狀態
  const [popoverOpen, setPopoverOpen] = useState(false);

  // 初始化選擇的分店
  useEffect(() => {
    if (userStoresData?.data) {
      // 提取用戶當前的分店 ID
      const userStores = userStoresData.data;
      if (Array.isArray(userStores)) {
        const currentStoreIds = userStores.map((store: Store) => store.id);
        setSelectedStoreIds(currentStoreIds);
      }
    }
  }, [userStoresData]);

  // 處理分店選擇變更
  const handleStoreToggle = (storeId: number) => {
    setSelectedStoreIds((current) => {
      if (current.includes(storeId)) {
        return current.filter((id) => id !== storeId);
      } else {
        return [...current, storeId];
      }
    });
  };

  // 處理提交操作
  const handleSubmit = async () => {
    try {
      await assignStoresMutation.mutateAsync({
        userId,
        storeIds: selectedStoreIds,
      });

      toast.success("分店分配成功");

      // 使用戶列表查詢緩存失效，強制重新獲取最新數據
      queryClient.invalidateQueries({ queryKey: ["users"] });

      onOpenChange(false);
    } catch (error: unknown) {
      // handleApiError 只做 logging；仍應讓使用者看到失敗訊息
      const errorMessage =
        error instanceof Error ? error.message : "操作失敗，請稍後再試";
      toast.error(errorMessage);
    }
  };

  // 獲取所有分店
  const stores: Store[] = Array.isArray(storesData?.data)
    ? (storesData?.data as Store[])
    : [];

  // 計算選擇的分店名稱（用於顯示）
  const selectedStoreNames = stores
    .filter((store) => selectedStoreIds.includes(store.id))
    .map((store) => store.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="w-5 h-5" />
            分配分店給用戶
          </DialogTitle>
          <DialogDescription>
            為 <strong>{userName}</strong>{" "}
            選擇所屬的分店。用戶可以管理這些分店的庫存和相關數據。
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          {isLoadingStores || isLoadingUserStores ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin h-4 w-4" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">選擇分店</h3>

                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="w-full justify-between"
                      disabled={assignStoresMutation.isPending}
                    >
                      {selectedStoreIds.length === 0
                        ? "選擇分店..."
                        : `已選擇 ${selectedStoreIds.length} 間分店`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="搜尋分店..." />

                      <CommandEmpty>找不到分店</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-60">
                          {stores.map((store) => (
                            <CommandItem
                              key={store.id}
                              onSelect={() => handleStoreToggle(store.id)}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                checked={selectedStoreIds.includes(store.id)}
                                onCheckedChange={() =>
                                  handleStoreToggle(store.id)
                                }
                              />

                              <span>{store.name}</span>
                              {store.address && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({store.address})
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedStoreIds.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">已選擇的分店</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStoreNames.map((name) => (
                      <Badge key={name} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignStoresMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              assignStoresMutation.isPending ||
              isLoadingStores ||
              isLoadingUserStores
            }
          >
            {assignStoresMutation.isPending ? "處理中..." : "儲存設定"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
