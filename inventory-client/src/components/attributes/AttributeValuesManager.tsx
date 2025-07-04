"use client";

import { useState } from "react";
import { useAttributeValues } from "@/hooks";
import { Attribute } from "@/types/attribute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Plus,
  X,
  Edit,
  Trash2,
  MoreVertical,
  Tag,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface AttributeValuesManagerProps {
  attribute: Attribute;
  onEdit: () => void;
  onDelete: () => void;
  onCreateValue: () => void;
  onDeleteValue: (valueId: number, valueName: string) => void;
  newValueInput: string;
  setNewValueInput: (value: string) => void;
  showValueInput: boolean;
  setShowValueInput: (show: boolean) => void;
  createValuePending: boolean;
}

/**
 * 屬性值管理組件
 *
 * 功能：
 * 1. 顯示選中屬性的所有值
 * 2. 支援新增、刪除屬性值
 * 3. 使用 DataTable 展示
 */
export function AttributeValuesManager({
  attribute,
  onEdit,
  onDelete,
  onCreateValue,
  onDeleteValue,
  newValueInput,
  setNewValueInput,
  showValueInput,
  setShowValueInput,
  createValuePending,
}: AttributeValuesManagerProps) {
  // 使用新的 Hook 獲取屬性值
  const { data: valuesResponse, isLoading } = useAttributeValues(attribute.id);
  const values = valuesResponse?.data || [];

  return (
    <div className="space-y-4" data-oid="jzd7zxn">
      {/* 標題區 */}
      <div className="flex items-center justify-between" data-oid="mdl-p-4">
        <div data-oid="o3ch4os">
          <h2
            className="text-2xl font-semibold flex items-center gap-2"
            data-oid="2qgkqds"
          >
            <Tag className="h-5 w-5 text-muted-foreground" data-oid="ffj.35b" />
            {attribute.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1" data-oid="iqjknit">
            管理此規格類型的所有值
          </p>
        </div>

        <DropdownMenu data-oid="5wkfxq.">
          <DropdownMenuTrigger asChild data-oid="5jfqu-o">
            <Button variant="outline" size="sm" data-oid="84y0b3j">
              <MoreVertical className="h-4 w-4" data-oid="zfu05u4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-oid="fhcy5of">
            <DropdownMenuItem onClick={onEdit} data-oid="-kbkeq8">
              <Edit className="mr-2 h-3.5 w-3.5" data-oid="pq3lxi." />
              編輯規格名稱
            </DropdownMenuItem>
            <DropdownMenuSeparator data-oid="8x.c8:9" />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
              data-oid="krf2ljq"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" data-oid="s17lve4" />
              刪除規格
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 統計卡片 - 儀表板樣式 */}
      <div
        className="grid gap-4 md:grid-cols-3 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs"
        data-oid="mw.40l0"
      >
        <Card className="@container/card" data-oid="4_ig-x3">
          <CardHeader data-oid="yvjd7es">
            <CardDescription data-oid="jei31uh">規格值總數</CardDescription>
            <CardTitle
              className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
              data-oid="ft2yfmk"
            >
              {values.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="@container/card" data-oid="ea9fj7w">
          <CardHeader data-oid="0oka.gn">
            <CardDescription data-oid="0wjn7ed">關聯商品數</CardDescription>
            <CardTitle
              className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
              data-oid="ht4wffo"
            >
              {attribute.products_count ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="@container/card" data-oid="25c:5t8">
          <CardHeader data-oid="8eekr7-">
            <CardDescription data-oid="gr7a3jq">建立時間</CardDescription>
            <CardTitle className="text-lg font-semibold" data-oid="kyhq:ek">
              {attribute.created_at
                ? new Date(attribute.created_at).toLocaleDateString("zh-TW")
                : "--"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 規格值管理 */}
      <Card data-oid="sde3u2s">
        <CardHeader data-oid="dj2xu_3">
          <div className="flex items-center justify-between" data-oid="rs_u:mz">
            <CardTitle className="text-base" data-oid="i_d8cba">
              規格值管理
            </CardTitle>
            {!showValueInput && (
              <Button
                onClick={() => setShowValueInput(true)}
                size="sm"
                data-oid="ti.-hah"
              >
                <Plus className="mr-2 h-4 w-4" data-oid="6jayyjp" />
                新增規格值
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="y8n5nm.">
          {/* 新增規格值輸入區 */}
          {showValueInput && (
            <div className="flex gap-2 pb-4 border-b" data-oid="0a_3f:v">
              <Input
                placeholder={`輸入新的${attribute.name}值`}
                value={newValueInput}
                onChange={(e) => setNewValueInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newValueInput.trim()) {
                    e.preventDefault();
                    onCreateValue();
                  }
                  if (e.key === "Escape") {
                    setShowValueInput(false);
                    setNewValueInput("");
                  }
                }}
                autoFocus
                data-oid="f44ece4"
              />

              <Button
                onClick={onCreateValue}
                disabled={createValuePending || !newValueInput.trim()}
                data-oid="z2e7a1n"
              >
                {createValuePending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    data-oid="vo27e4l"
                  />
                ) : (
                  "新增"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowValueInput(false);
                  setNewValueInput("");
                }}
                data-oid="l-n6r._"
              >
                取消
              </Button>
            </div>
          )}

          {/* 規格值列表 */}
          {isLoading ? (
            <div
              className="flex justify-center items-center py-8"
              role="status"
              aria-label="loading values"
              data-oid=".we:0v:"
            >
              <Loader2 className="h-6 w-6 animate-spin" data-oid="oze9njs" />
            </div>
          ) : values.length === 0 ? (
            <div className="text-center py-8" data-oid="4my3vzy">
              <Package
                className="h-8 w-8 mx-auto text-muted-foreground mb-2"
                data-oid="z1turgy"
              />

              <p className="text-sm text-muted-foreground" data-oid="z9ko1lf">
                尚未建立任何規格值
              </p>
            </div>
          ) : (
            <div className="rounded-md border" data-oid="a5mlhgt">
              <Table data-oid="8mhep1m">
                <TableHeader data-oid="vx58i6-">
                  <TableRow data-oid="x3el21f">
                    <TableHead data-oid="ebd2cut">規格值</TableHead>
                    <TableHead data-oid="j44ft1y">建立時間</TableHead>
                    <TableHead className="w-[100px]" data-oid="0y4ukqs">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-oid="ya10-jp">
                  {values.map((value) => (
                    <TableRow key={value.id} data-oid="yi-7bc7">
                      <TableCell className="font-medium" data-oid="6rclpxw">
                        <Badge variant="secondary" data-oid="hbzixhi">
                          {value.value}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground"
                        data-oid="u24tbwc"
                      >
                        {value.created_at
                          ? new Date(value.created_at).toLocaleDateString(
                              "zh-TW",
                            )
                          : "--"}
                      </TableCell>
                      <TableCell data-oid=".36hai7">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteValue(value.id, value.value)}
                          className="h-8 w-8"
                          aria-label={`刪除規格值 ${value.value}`}
                          data-oid="16ww9ez"
                        >
                          <Trash2
                            className="h-4 w-4 text-destructive"
                            data-oid="7dfox0x"
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
