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
} from "@/hooks/queries/useEntityQueries";
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
        data-oid="dbr2_.k"
      >
        <Loader2 className="h-8 w-8 animate-spin" data-oid="2pxn7ik" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Card className="border-destructive/50" data-oid="27h4-pw">
        <CardContent className="pt-6" data-oid="-74l8md">
          <div className="text-center" data-oid="whlfkxs">
            <X
              className="h-12 w-12 mx-auto text-destructive mb-4"
              data-oid="e:p1kt4"
            />

            <p
              className="text-lg font-medium text-destructive"
              data-oid="1kn12sy"
            >
              權限不足
            </p>
            <p className="text-muted-foreground mt-2" data-oid="x6_0.8x">
              您沒有權限訪問此頁面
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-oid="zegs_a5">
      {/* 頁面標題和操作區 */}
      <div className="flex items-center justify-between" data-oid="7kavki2">
        <div data-oid="5iclk9l">
          <h1 className="text-2xl font-bold" data-oid="88b.mrq">
            規格管理
          </h1>
          <p className="text-sm text-muted-foreground" data-oid="vdo:m6a">
            管理商品規格屬性和規格值
          </p>
        </div>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          data-oid="7w0-..b"
        >
          <DialogTrigger asChild data-oid="a:uzv3j">
            <Button size="sm" data-oid="om9btu3">
              <Plus className="mr-1.5 h-4 w-4" data-oid="42hlqba" />
              新增規格
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" data-oid="lq:ruo.">
            <DialogHeader data-oid="1i91ey_">
              <DialogTitle data-oid=".4.ayya">新增規格</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleCreateAttribute}
              className="space-y-4"
              data-oid="0b8s5hn"
            >
              <div className="space-y-2" data-oid="w0d3fk3">
                <Label htmlFor="name" data-oid=".d4mpix">
                  規格名稱
                </Label>
                <Input
                  id="name"
                  placeholder="例如：顏色、尺寸、材質"
                  value={attributeName}
                  onChange={(e) => setAttributeName(e.target.value)}
                  required
                  autoFocus
                  data-oid="s574gwz"
                />
              </div>
              <div className="flex justify-end gap-2" data-oid="jlz7x1q">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setAttributeName("");
                  }}
                  data-oid="g_v2t1q"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    createAttributeMutation.isPending || !attributeName.trim()
                  }
                  data-oid="i4q12bb"
                >
                  {createAttributeMutation.isPending && (
                    <Loader2
                      className="mr-1.5 h-4 w-4 animate-spin"
                      data-oid="t9zukoh"
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
        data-oid="5gdkqkd"
      >
        {/* --- 左側面板：屬性導航欄 --- */}
        <aside
          className="w-1/4 min-w-[240px] max-w-[360px] border-r bg-muted/10"
          data-oid="7sh646."
        >
          <div className="flex h-full flex-col" data-oid="g3iafi8">
            {/* 側邊欄標頭 */}
            <div className="p-4 pb-2" data-oid="wdl56f:">
              <h2 className="text-lg font-semibold" data-oid=".6g4y8r">
                規格類型
              </h2>
            </div>

            {/* 搜索區 */}
            <div className="px-4 pb-2" data-oid="9unvk6c">
              <div className="relative" data-oid="_6g04r2">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  data-oid="k-sj1tp"
                />

                <Input
                  placeholder="搜索規格..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-background"
                  data-oid="a_9t5k9"
                />
              </div>
            </div>

            {/* 內容區 */}
            <ScrollArea className="flex-1 px-2" data-oid="hy969rr">
              <div className="p-2" data-oid="sxgcn8q">
                {/* 規格列表 - 符合 shadcn 規範 */}
                {isAttributesLoading ? (
                  <div
                    className="flex justify-center items-center min-h-[200px]"
                    data-oid="sd-_a16"
                  >
                    <Loader2
                      className="h-6 w-6 animate-spin"
                      data-oid="4ut1:vc"
                    />
                  </div>
                ) : filteredAttributes.length === 0 ? (
                  <div className="text-center py-8" data-oid="hcogqtr">
                    <Package
                      className="h-8 w-8 mx-auto text-muted-foreground mb-2"
                      data-oid="q__j.an"
                    />

                    <p
                      className="text-sm text-muted-foreground"
                      data-oid="f3v0m.a"
                    >
                      {searchQuery ? "找不到符合的規格" : "尚未建立任何規格"}
                    </p>
                  </div>
                ) : (
                  <nav
                    className="space-y-1"
                    role="navigation"
                    aria-label="規格類型列表"
                    data-oid="_gor-:5"
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
                        data-oid="8a8idjf"
                      >
                        <Tag
                          className="mr-2 h-4 w-4 text-muted-foreground"
                          data-oid="1lghu6n"
                        />

                        <span className="flex-1 text-left" data-oid="_yuk1ds">
                          {attribute.name}
                        </span>
                        <Badge
                          variant={
                            selectedAttribute?.id === attribute.id
                              ? "default"
                              : "secondary"
                          }
                          className="ml-auto text-xs"
                          data-oid="qglnb70"
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
        <main className="flex-1 bg-background" data-oid="a.ee5yl">
          <ScrollArea className="h-full" data-oid="j8u21eq">
            <div className="p-6" data-oid="46q9pyi">
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
                  data-oid="-znzal3"
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center"
                  data-oid="-ex041y"
                >
                  <div className="text-center" data-oid="n83yuaj">
                    <Tag
                      className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                      data-oid="t3yy16p"
                    />

                    <p className="text-muted-foreground" data-oid="y8o8rl8">
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
        data-oid="vhyd:84"
      >
        <DialogContent className="sm:max-w-[425px]" data-oid="-6d:ptw">
          <DialogHeader data-oid="wg.0oec">
            <DialogTitle data-oid="_vx:9xx">編輯規格</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditAttribute}
            className="space-y-4"
            data-oid="::qs8:n"
          >
            <div className="space-y-2" data-oid="d4ij789">
              <Label htmlFor="edit-name" data-oid="edygrlp">
                規格名稱
              </Label>
              <Input
                id="edit-name"
                placeholder="例如：顏色、尺寸、材質"
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
                required
                autoFocus
                data-oid="rvj8h80"
              />
            </div>
            <div className="flex justify-end gap-2" data-oid="da7eopv">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setAttributeName("");
                }}
                data-oid="4lvlm7:"
              >
                取消
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  updateAttributeMutation.isPending || !attributeName.trim()
                }
                data-oid="vr6-iwx"
              >
                {updateAttributeMutation.isPending && (
                  <Loader2
                    className="mr-1.5 h-4 w-4 animate-spin"
                    data-oid="wnrwl9e"
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
        data-oid="-al68w0"
      >
        <AlertDialogContent data-oid="y6xj2l.">
          <AlertDialogHeader data-oid="70drqu_">
            <AlertDialogTitle data-oid="dcx4n67">確認刪除規格</AlertDialogTitle>
            <AlertDialogDescription data-oid="d5l35rk">
              您確定要刪除規格「{selectedAttribute?.name}」嗎？
              此操作將同時刪除該規格下的所有規格值，且無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-oid="w98zgvx">
            <AlertDialogCancel data-oid="7di837k">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttribute}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAttributeMutation.isPending}
              data-oid="7vw9fet"
            >
              {deleteAttributeMutation.isPending && (
                <Loader2
                  className="mr-1.5 h-4 w-4 animate-spin"
                  data-oid="8e3dlbq"
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
        data-oid=".y-ptrw"
      >
        <AlertDialogContent data-oid="fdxqi85">
          <AlertDialogHeader data-oid="o32j91g">
            <AlertDialogTitle data-oid="pjchg7_">
              確認刪除規格值
            </AlertDialogTitle>
            <AlertDialogDescription data-oid="o1qc_mj">
              您確定要刪除規格值「{selectedValueName}」嗎？ 此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-oid="8pgb4m-">
            <AlertDialogCancel data-oid="cnfnfx0">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteValue}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteValueMutation.isPending}
              data-oid="q-t_29."
            >
              {deleteValueMutation.isPending && (
                <Loader2
                  className="mr-1.5 h-4 w-4 animate-spin"
                  data-oid="r8hy4hz"
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
