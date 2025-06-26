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
import { useQueryClient } from "@tanstack/react-query";

import { useStores } from "@/hooks/queries/useEntityQueries";
import { useUserStores, useAssignUserStores } from "@/hooks/useUserStores";

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
    data-oid="vyst9_3"
  >
    <ScrollAreaPrimitive.Viewport
      className="h-full w-full rounded-[inherit]"
      data-oid="2uchd9x"
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaScrollbar orientation="vertical" data-oid="5jsm92a" />
    <ScrollAreaPrimitive.Corner data-oid="wdgfsco" />
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
    data-oid="dddpnsr"
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className="relative flex-1 rounded-full bg-border"
      data-oid=":-7y7oy"
    />
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

  // 獲取用戶當前的分店
  const { data: userStoresData, isLoading: isLoadingUserStores } =
    useUserStores(userId);

  // 分配分店到用戶的 mutation
  const assignStoresMutation = useAssignUserStores();

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
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="o1.ysim">
      <DialogContent className="sm:max-w-[500px]" data-oid="m7eiz90">
        <DialogHeader data-oid="9.z4zsn">
          <DialogTitle className="flex items-center gap-2" data-oid=":9_p30o">
            <StoreIcon className="w-5 h-5" data-oid="nc-bgm_" />
            分配分店給用戶
          </DialogTitle>
          <DialogDescription data-oid="nm3lw3b">
            為 <strong data-oid="i8ev3q8">{userName}</strong>{" "}
            選擇所屬的分店。用戶可以管理這些分店的庫存和相關數據。
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4" data-oid="-qa7e.t">
          {isLoadingStores || isLoadingUserStores ? (
            <div className="flex justify-center py-4" data-oid="h:p5ppq">
              <Loader2 className="animate-spin h-4 w-4" data-oid="p6mq969" />
            </div>
          ) : (
            <>
              <div className="space-y-2" data-oid="tsyj4bo">
                <h3 className="text-sm font-medium" data-oid="0cg9mdi">
                  選擇分店
                </h3>

                <Popover
                  open={popoverOpen}
                  onOpenChange={setPopoverOpen}
                  data-oid="kzod6ac"
                >
                  <PopoverTrigger asChild data-oid="mqkse5q">
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="w-full justify-between"
                      disabled={assignStoresMutation.isPending}
                      data-oid="e748eo8"
                    >
                      {selectedStoreIds.length === 0
                        ? "選擇分店..."
                        : `已選擇 ${selectedStoreIds.length} 間分店`}
                      <ChevronsUpDown
                        className="ml-2 h-4 w-4 shrink-0 opacity-50"
                        data-oid="-bh-1y_"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full p-0"
                    align="start"
                    data-oid="b8fs1jz"
                  >
                    <Command data-oid="7phpe3e">
                      <CommandInput
                        placeholder="搜尋分店..."
                        data-oid="9h8aq2c"
                      />

                      <CommandEmpty data-oid="09azmdb">找不到分店</CommandEmpty>
                      <CommandGroup data-oid="um3h7y0">
                        <ScrollArea className="h-60" data-oid="a_jo7tu">
                          {stores.map((store) => (
                            <CommandItem
                              key={store.id}
                              onSelect={() => handleStoreToggle(store.id)}
                              className="flex items-center gap-2"
                              data-oid="azivz93"
                            >
                              <Checkbox
                                checked={selectedStoreIds.includes(store.id)}
                                onCheckedChange={() =>
                                  handleStoreToggle(store.id)
                                }
                                data-oid="n7n9odr"
                              />

                              <span data-oid="cp5qbqr">{store.name}</span>
                              {store.address && (
                                <span
                                  className="text-sm text-muted-foreground ml-2"
                                  data-oid="nw_ecse"
                                >
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
                <div className="space-y-2" data-oid="1ltgthu">
                  <h3 className="text-sm font-medium" data-oid="lxxq-18">
                    已選擇的分店
                  </h3>
                  <div className="flex flex-wrap gap-2" data-oid="5h.lts:">
                    {selectedStoreNames.map((name) => (
                      <Badge key={name} variant="secondary" data-oid="o6:m5k6">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2" data-oid="y50vfjs">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignStoresMutation.isPending}
            data-oid="91_6d.h"
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
            data-oid="tkgt6sm"
          >
            {assignStoresMutation.isPending ? "處理中..." : "儲存設定"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
