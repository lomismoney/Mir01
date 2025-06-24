'use client';

import { useState } from 'react';
import { useAttributeValues } from '@/hooks/queries/useEntityQueries';
import { Attribute } from '@/types/attribute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Tag,
  Package
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
  createValuePending
}: AttributeValuesManagerProps) {
  // 使用新的 Hook 獲取屬性值
  const { data: valuesResponse, isLoading } = useAttributeValues(attribute.id);
  const values = valuesResponse?.data || [];

  return (
    <div className="space-y-4">
      {/* 標題區 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5 text-muted-foreground" />
            {attribute.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            管理此規格類型的所有值
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-3.5 w-3.5" />
              編輯規格名稱
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              刪除規格
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 統計卡片 - 儀表板樣式 */}
      <div className="grid gap-4 md:grid-cols-3 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>規格值總數</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {values.length}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>關聯商品數</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              --
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>建立時間</CardDescription>
            <CardTitle className="text-lg font-semibold">
              {attribute.created_at ? new Date(attribute.created_at).toLocaleDateString('zh-TW') : '--'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 規格值管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">規格值管理</CardTitle>
            {!showValueInput && (
              <Button
                onClick={() => setShowValueInput(true)}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增規格值
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 新增規格值輸入區 */}
          {showValueInput && (
            <div className="flex gap-2 pb-4 border-b">
              <Input
                placeholder={`輸入新的${attribute.name}值`}
                value={newValueInput}
                onChange={(e) => setNewValueInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newValueInput.trim()) {
                    e.preventDefault();
                    onCreateValue();
                  }
                  if (e.key === 'Escape') {
                    setShowValueInput(false);
                    setNewValueInput('');
                  }
                }}
                autoFocus
              />
              <Button 
                onClick={onCreateValue}
                disabled={createValuePending || !newValueInput.trim()}
              >
                {createValuePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '新增'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowValueInput(false);
                  setNewValueInput('');
                }}
              >
                取消
              </Button>
            </div>
          )}
          
          {/* 規格值列表 */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : values.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                尚未建立任何規格值
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>規格值</TableHead>
                    <TableHead>建立時間</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {values.map((value) => (
                    <TableRow key={value.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">
                          {value.value}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {value.created_at ? new Date(value.created_at).toLocaleDateString('zh-TW') : '--'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteValue(value.id, value.value)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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