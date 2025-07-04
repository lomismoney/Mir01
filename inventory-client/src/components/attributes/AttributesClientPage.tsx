"use client";

import { useState, memo, useEffect } from "react";
import {
  useAttributes,
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
  useCreateAttributeValue,
  useUpdateAttributeValue,
  useDeleteAttributeValue,
  useAttributeValues,
} from "@/hooks";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
  Edit,
  MoreVertical,
  Package,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Attribute } from "@/types/attribute";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AttributeValuesManager } from "./AttributeValuesManager";

/**
 * 規格管理客戶端頁面組件（雙面板版本）
 *
 * 設計理念：
 * 1. 左側面板：屬性導航列表
 * 2. 右側面板：選中屬性的值管理
 * 3. 可調整面板寬度
 * 4. 保留原有的所有功能
 */
const AttributesClientPage = () => {
  const { user, isLoading, isAuthorized } = useAdminAuth();

  // 搜索狀態管理 - 使用防抖優化
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // 選中的屬性
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(
    null,
  );

  const {
    data: hookResponse,
    isLoading: isAttributesLoading,
    error,
  } = useAttributes();

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
  const [isValueDeleteDialogOpen, setIsValueDeleteDialogOpen] = useState(false);

  // 表單資料狀態
  const [attributeName, setAttributeName] = useState("");
  const [selectedValueId, setSelectedValueId] = useState<number | null>(null);
  const [selectedValueName, setSelectedValueName] = useState<string>("");

  // 規格值新增狀態
  const [newValueInput, setNewValueInput] = useState("");
  const [showValueInput, setShowValueInput] = useState(false);

  /**
   * 🎯 標準化數據獲取 - 直接從 Hook 返回的結構中解構
   * Hook 已經在 select 函數中處理好了數據結構
   */
  const attributes = (hookResponse?.data ?? []) as Attribute[];
  const meta = hookResponse?.meta;

  /**
   * 根據搜索條件過濾規格
   */
  const filteredAttributes = attributes.filter((attr) =>
    attr.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
  );

  /**
   * 處理新增規格
   */
  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attributeName.trim()) return;

    try {
      await createAttributeMutation.mutateAsync({ name: attributeName.trim() });
      toast.success("規格新增成功！");
      setAttributeName("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "新增規格失敗";
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
        id: selectedAttribute.id,
        body: { name: attributeName.trim() },
      });
      toast.success("規格更新成功！");
      setAttributeName("");
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error("更新規格失敗");
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
        attribute: selectedAttribute.id,
      });
      toast.success("規格刪除成功！");
      setSelectedAttribute(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("刪除規格失敗");
    }
  };

  /**
   * 開始編輯規格
   */
  const startEditAttribute = (attribute: Attribute) => {
    setAttributeName(attribute.name);
    setIsEditDialogOpen(true);
  };

  /**
   * 開始刪除規格
   */
  const startDeleteAttribute = (attribute: Attribute) => {
    setIsDeleteDialogOpen(true);
  };

  /**
   * 處理新增規格值
   */
  const handleCreateValue = async () => {
    if (!selectedAttribute || !newValueInput.trim()) return;

    try {
      await createValueMutation.mutateAsync({
        attributeId: selectedAttribute.id,
        body: { value: newValueInput.trim() },
      });
      toast.success("規格值新增成功！");
      setNewValueInput("");
      setShowValueInput(false);
    } catch (error) {
      toast.error("新增規格值失敗");
    }
  };

  /**
   * 處理刪除規格值
   */
  const handleDeleteValue = async () => {
    if (!selectedValueId) return;

    try {
      await deleteValueMutation.mutateAsync(selectedValueId);
      toast.success("規格值刪除成功！");
      setSelectedValueId(null);
      setSelectedValueName("");
      setIsValueDeleteDialogOpen(false);
    } catch (error) {
      toast.error("刪除規格值失敗");
    }
  };

  /**
   * 開始刪除規格值
   */
  const startDeleteValue = (valueId: number, valueName: string) => {
    setSelectedValueId(valueId);
    setSelectedValueName(valueName);
    setIsValueDeleteDialogOpen(true);
  };

  // 權限檢查
  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center min-h-[400px]"
        role="status"
        aria-label="loading"
        data-oid="0n.m-lj"
      >
        <Loader2 className="h-8 w-8 animate-spin" data-oid="xakl14v" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Card className="border-destructive/50" data-oid="_dgdzk7">
        <CardContent className="pt-6" data-oid="x-n9tzu">
          <div className="text-center" data-oid="zupj.i3">
            <X
              className="h-12 w-12 mx-auto text-destructive mb-4"
              data-oid=".o:kuz9"
            />

            <p
              className="text-lg font-medium text-destructive"
              data-oid="osetzci"
            >
              權限不足
            </p>
            <p className="text-muted-foreground mt-2" data-oid="hjv09jf">
              您沒有權限訪問此頁面
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-oid="3xarzgp">
      {/* 頁面標題和操作區 */}
      <div className="flex items-center justify-between" data-oid="t-yjqaf">
        <div data-oid="pj8ncg5">
          <h1 className="text-2xl font-bold" data-oid="__vx.h2">
            規格管理
          </h1>
          <p className="text-sm text-muted-foreground" data-oid="gukmh8d">
            管理商品規格屬性和規格值
          </p>
        </div>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          data-oid="jt6e9:."
        >
          <DialogTrigger asChild data-oid="-y5k8sf">
            <Button size="sm" data-oid="yxp1rh9">
              <Plus className="mr-1.5 h-4 w-4" data-oid="risyqz9" />
              新增規格
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" data-oid="el03rk1">
            <DialogHeader data-oid="3ee:h4j">
              <DialogTitle data-oid=".4rn5s6">新增規格</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleCreateAttribute}
              className="space-y-4"
              data-oid="5drvrus"
            >
              <div className="space-y-2" data-oid="0no7yjz">
                <Label htmlFor="name" data-oid="a7:-vb:">
                  規格名稱
                </Label>
                <Input
                  id="name"
                  placeholder="例如：顏色、尺寸、材質"
                  value={attributeName}
                  onChange={(e) => setAttributeName(e.target.value)}
                  required
                  autoFocus
                  data-oid="q.zoclv"
                />
              </div>
              <div className="flex justify-end gap-2" data-oid="-kyulh9">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setAttributeName("");
                  }}
                  data-oid=":20a1s."
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    createAttributeMutation.isPending || !attributeName.trim()
                  }
                  data-oid="1i1y1ry"
                >
                  {createAttributeMutation.isPending && (
                    <Loader2
                      className="mr-1.5 h-4 w-4 animate-spin"
                      data-oid="ktw133e"
                    />
                  )}
                  新增
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 雙面板佈局 */}
      <div
        className="h-[calc(100vh-10rem)] rounded-lg border flex"
        data-oid="o5ndkwg"
      >
        {/* --- 左側面板：屬性導航欄 --- */}
        <aside
          className="w-1/4 min-w-[240px] max-w-[360px] border-r bg-muted/10"
          data-oid="fjmoefz"
        >
          <div className="flex h-full flex-col" data-oid="3cx-xt8">
            {/* 側邊欄標頭 */}
            <div className="p-4 pb-2" data-oid="aubwlal">
              <h2 className="text-lg font-semibold" data-oid="f17_7vr">
                規格類型
              </h2>
            </div>

            {/* 搜索區 */}
            <div className="px-4 pb-2" data-oid="h4hffgj">
              <div className="relative" data-oid="h8-_gxv">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  data-oid="cf7vj_3"
                />

                <Input
                  placeholder="搜索規格..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-background"
                  data-oid="12zl0rx"
                />
              </div>
            </div>

            {/* 內容區 */}
            <ScrollArea className="flex-1 px-2" data-oid="zof2l70">
              <div className="p-2" data-oid="lwypxg_">
                {/* 規格列表 - 符合 shadcn 規範 */}
                {isAttributesLoading ? (
                  <div
                    className="flex justify-center items-center min-h-[200px]"
                    data-oid="-fpia-g"
                  >
                    <Loader2
                      className="h-6 w-6 animate-spin"
                      data-oid="xcrbv:h"
                    />
                  </div>
                ) : filteredAttributes.length === 0 ? (
                  <div className="text-center py-8" data-oid="-ztss8e">
                    <Package
                      className="h-8 w-8 mx-auto text-muted-foreground mb-2"
                      data-oid="gofzwoh"
                    />

                    <p
                      className="text-sm text-muted-foreground"
                      data-oid="rqjv-fo"
                    >
                      {searchQuery ? "找不到符合的規格" : "尚未建立任何規格"}
                    </p>
                  </div>
                ) : (
                  <nav
                    className="space-y-1"
                    role="navigation"
                    aria-label="規格類型列表"
                    data-oid="-ocmbvo"
                  >
                    {filteredAttributes.map((attribute) => (
                      <Button
                        key={attribute.id}
                        variant="ghost"
                        onClick={() => setSelectedAttribute(attribute)}
                        className={cn(
                          "w-full justify-start px-3 py-2 h-auto font-normal",
                          selectedAttribute?.id === attribute.id &&
                            "bg-muted hover:bg-muted",
                        )}
                        aria-current={
                          selectedAttribute?.id === attribute.id
                            ? "page"
                            : undefined
                        }
                        data-oid=".dk7sgm"
                      >
                        <Tag
                          className="mr-2 h-4 w-4 text-muted-foreground"
                          data-oid="wl2kgee"
                        />

                        <span className="flex-1 text-left" data-oid=":ibs:z8">
                          {attribute.name}
                        </span>
                        <Badge
                          variant={
                            selectedAttribute?.id === attribute.id
                              ? "default"
                              : "secondary"
                          }
                          className="ml-auto text-xs"
                          data-oid="zxn0yqe"
                        >
                          {attribute.values?.length || 0}
                        </Badge>
                      </Button>
                    ))}
                  </nav>
                )}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* --- 右側面板：規格值工作區 --- */}
        <main className="flex-1 bg-background" data-oid="2ccuoe7">
          <ScrollArea className="h-full" data-oid="tg-es:3">
            <div className="p-6" data-oid="62pdzl9">
              {selectedAttribute ? (
                <AttributeValuesManager
                  attribute={selectedAttribute}
                  onEdit={() => startEditAttribute(selectedAttribute)}
                  onDelete={() => startDeleteAttribute(selectedAttribute)}
                  onCreateValue={handleCreateValue}
                  onDeleteValue={startDeleteValue}
                  newValueInput={newValueInput}
                  setNewValueInput={setNewValueInput}
                  showValueInput={showValueInput}
                  setShowValueInput={setShowValueInput}
                  createValuePending={createValueMutation.isPending}
                  data-oid="fi991u8"
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center"
                  data-oid="4449a9p"
                >
                  <div className="text-center" data-oid="vd-7sq-">
                    <Tag
                      className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                      data-oid="277z5_5"
                    />

                    <p className="text-muted-foreground" data-oid="fxq8e-f">
                      請從左側選擇一個規格類型進行管理
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>

      {/* 編輯規格對話框 */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        data-oid="r1dnbw6"
      >
        <DialogContent className="sm:max-w-[425px]" data-oid="9_woj2n">
          <DialogHeader data-oid="8xa_snb">
            <DialogTitle data-oid="ah:62ni">編輯規格</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditAttribute}
            className="space-y-4"
            data-oid="6l2uxkx"
          >
            <div className="space-y-2" data-oid="8bhpv1u">
              <Label htmlFor="edit-name" data-oid="t0rpicf">
                規格名稱
              </Label>
              <Input
                id="edit-name"
                placeholder="例如：顏色、尺寸、材質"
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
                required
                autoFocus
                data-oid="55bjo._"
              />
            </div>
            <div className="flex justify-end gap-2" data-oid="tqov4g0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setAttributeName("");
                }}
                data-oid="a-gsy3a"
              >
                取消
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  updateAttributeMutation.isPending || !attributeName.trim()
                }
                data-oid="zely0nu"
              >
                {updateAttributeMutation.isPending && (
                  <Loader2
                    className="mr-1.5 h-4 w-4 animate-spin"
                    data-oid="awn0ek2"
                  />
                )}
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除規格確認對話框 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        data-oid="s.avqzc"
      >
        <AlertDialogContent data-oid="slzzgsa">
          <AlertDialogHeader data-oid="r3xud:0">
            <AlertDialogTitle data-oid="nvbd:l9">確認刪除規格</AlertDialogTitle>
            <AlertDialogDescription data-oid="uw:l3-b">
              您確定要刪除規格「{selectedAttribute?.name}」嗎？
              此操作將同時刪除該規格下的所有規格值，且無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-oid="f632oui">
            <AlertDialogCancel data-oid="..98ac5">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttribute}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAttributeMutation.isPending}
              data-oid="lle6:ix"
            >
              {deleteAttributeMutation.isPending && (
                <Loader2
                  className="mr-1.5 h-4 w-4 animate-spin"
                  data-oid="hctm67-"
                />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 刪除規格值確認對話框 */}
      <AlertDialog
        open={isValueDeleteDialogOpen}
        onOpenChange={setIsValueDeleteDialogOpen}
        data-oid="81agk0j"
      >
        <AlertDialogContent data-oid="r8.k_6m">
          <AlertDialogHeader data-oid="rcqj:ew">
            <AlertDialogTitle data-oid="w977eo2">
              確認刪除規格值
            </AlertDialogTitle>
            <AlertDialogDescription data-oid="lhjzuq8">
              您確定要刪除規格值「{selectedValueName}」嗎？ 此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-oid="3xb6jkp">
            <AlertDialogCancel data-oid="l.1tddj">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteValue}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteValueMutation.isPending}
              data-oid="brns678"
            >
              {deleteValueMutation.isPending && (
                <Loader2
                  className="mr-1.5 h-4 w-4 animate-spin"
                  data-oid="j:g:hrv"
                />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttributesClientPage;
