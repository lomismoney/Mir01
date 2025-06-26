"use client";

import { useState } from "react";
import { useAttributeValues } from "@/hooks/queries/useEntityQueries";
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
    <div className="space-y-4" data-oid="ohtrelz">
      {/* 標題區 */}
      <div className="flex items-center justify-between" data-oid="ay0x_jd">
        <div data-oid="v04:xha">
          <h2
            className="text-2xl font-semibold flex items-center gap-2"
            data-oid="w5anbu9"
          >
            <Tag className="h-5 w-5 text-muted-foreground" data-oid="bt5q8r8" />
            {attribute.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1" data-oid="v5w9u4a">
            管理此規格類型的所有值
          </p>
        </div>

        <DropdownMenu data-oid="re7hb:n">
          <DropdownMenuTrigger asChild data-oid="h63kq56">
            <Button variant="outline" size="sm" data-oid="fjzyxyp">
              <MoreVertical className="h-4 w-4" data-oid="hmquznh" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-oid="hrru-1j">
            <DropdownMenuItem onClick={onEdit} data-oid="x_7ur7q">
              <Edit className="mr-2 h-3.5 w-3.5" data-oid="a8nmqp_" />
              編輯規格名稱
            </DropdownMenuItem>
            <DropdownMenuSeparator data-oid="mp9meoy" />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
              data-oid="3z.-fgb"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" data-oid="xrb05g5" />
              刪除規格
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 統計卡片 - 儀表板樣式 */}
      <div
        className="grid gap-4 md:grid-cols-3 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs"
        data-oid="okf8c6h"
      >
        <Card className="@container/card" data-oid="hhjimbx">
          <CardHeader data-oid="rc82p:c">
            <CardDescription data-oid="2f-frvf">規格值總數</CardDescription>
            <CardTitle
              className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
              data-oid="yw9zs64"
            >
              {values.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="@container/card" data-oid="e_5o9u9">
          <CardHeader data-oid="lm3lbyx">
            <CardDescription data-oid="r5rf7i-">關聯商品數</CardDescription>
            <CardTitle
              className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
              data-oid="mj42_yb"
            >
              {attribute.products_count ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="@container/card" data-oid="eo0hx2i">
          <CardHeader data-oid="762px7w">
            <CardDescription data-oid="fanj1j3">建立時間</CardDescription>
            <CardTitle className="text-lg font-semibold" data-oid="d6lav5f">
              {attribute.created_at
                ? new Date(attribute.created_at).toLocaleDateString("zh-TW")
                : "--"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 規格值管理 */}
      <Card data-oid=".96t3u1">
        <CardHeader data-oid="p7r7z_7">
          <div className="flex items-center justify-between" data-oid="v-xhxq4">
            <CardTitle className="text-base" data-oid="jbw5m6i">
              規格值管理
            </CardTitle>
            {!showValueInput && (
              <Button
                onClick={() => setShowValueInput(true)}
                size="sm"
                data-oid="2-eltzi"
              >
                <Plus className="mr-2 h-4 w-4" data-oid="5h3sfhy" />
                新增規格值
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="8fype.9">
          {/* 新增規格值輸入區 */}
          {showValueInput && (
            <div className="flex gap-2 pb-4 border-b" data-oid="8ov95_7">
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
                data-oid="un4kbzi"
              />

              <Button
                onClick={onCreateValue}
                disabled={createValuePending || !newValueInput.trim()}
                data-oid="73dy2af"
              >
                {createValuePending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    data-oid="n8en8ep"
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
                data-oid="zgfl88a"
              >
                取消
              </Button>
            </div>
          )}

          {/* 規格值列表 */}
          {isLoading ? (
            <div
              className="flex justify-center items-center py-8"
              data-oid="2j988gt"
            >
              <Loader2 className="h-6 w-6 animate-spin" data-oid="bax9ixx" />
            </div>
          ) : values.length === 0 ? (
            <div className="text-center py-8" data-oid="v6qas4r">
              <Package
                className="h-8 w-8 mx-auto text-muted-foreground mb-2"
                data-oid="vs5a9zq"
              />

              <p className="text-sm text-muted-foreground" data-oid="bmv__mg">
                尚未建立任何規格值
              </p>
            </div>
          ) : (
            <div className="rounded-md border" data-oid="02-vf.1">
              <Table data-oid="_1riamq">
                <TableHeader data-oid="kcf6cj-">
                  <TableRow data-oid="59w2hyz">
                    <TableHead data-oid="mf-oa7q">規格值</TableHead>
                    <TableHead data-oid="av69yvf">建立時間</TableHead>
                    <TableHead className="w-[100px]" data-oid="qs4x8vo">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-oid="2.y-8nf">
                  {values.map((value) => (
                    <TableRow key={value.id} data-oid="rds2yr7">
                      <TableCell className="font-medium" data-oid="ilfxidi">
                        <Badge variant="secondary" data-oid="_r:9yzr">
                          {value.value}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground"
                        data-oid="wg3.7dw"
                      >
                        {value.created_at
                          ? new Date(value.created_at).toLocaleDateString(
                              "zh-TW",
                            )
                          : "--"}
                      </TableCell>
                      <TableCell data-oid="cnmnpcu">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteValue(value.id, value.value)}
                          className="h-8 w-8"
                          data-oid="v1.vkm-"
                        >
                          <Trash2
                            className="h-4 w-4 text-destructive"
                            data-oid="t5_wqsg"
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
