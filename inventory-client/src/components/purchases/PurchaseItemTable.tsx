'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MoneyHelper } from '@/lib/money-helper';
import { Package, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';

interface PurchaseItem {
  id: number;
  product_variant_id: number;
  quantity: number;
  unit_price: number;
  cost_price: number;
  allocated_shipping_cost: number;
  product_variant: {
    id: number;
    sku: string;
    product: {
      id: number;
      name: string;
    };
  };
  // 關聯的訂單項目信息
  related_order_items?: Array<{
    id: number;
    order_id: number;
    order_number: string;
    quantity: number;
    fulfilled_quantity: number;
    is_fulfilled: boolean;
    customer_name: string;
  }>;
}

interface Purchase {
  id: number;
  order_number: string;
  status: string;
  items: PurchaseItem[];
}

interface PurchaseItemTableProps {
  purchase: Purchase;
  showOrderItems?: boolean;
}

export function PurchaseItemTable({ purchase, showOrderItems = true }: PurchaseItemTableProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItemExpansion = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { variant: 'outline' as const, text: '待處理' },
      'confirmed': { variant: 'secondary' as const, text: '已確認' },
      'in_transit': { variant: 'secondary' as const, text: '運輸中' },
      'received': { variant: 'secondary' as const, text: '已收貨' },
      'completed': { variant: 'default' as const, text: '已完成' },
      'cancelled': { variant: 'destructive' as const, text: '已取消' },
    };
    
    return statusMap[status as keyof typeof statusMap] || { variant: 'outline' as const, text: status };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>進貨項目明細</CardTitle>
            <CardDescription>
              進貨單 #{purchase.order_number} 的詳細項目
            </CardDescription>
          </div>
          <Badge variant={getStatusBadge(purchase.status).variant}>
            {getStatusBadge(purchase.status).text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {purchase.items.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const hasOrderItems = item.related_order_items && item.related_order_items.length > 0;
            
            // 計算總的履行統計
            const totalOrderQuantity = item.related_order_items?.reduce((sum, orderItem) => sum + orderItem.quantity, 0) || 0;
            const totalFulfilledQuantity = item.related_order_items?.reduce((sum, orderItem) => sum + orderItem.fulfilled_quantity, 0) || 0;
            const fulfillmentProgress = totalOrderQuantity > 0 ? (totalFulfilledQuantity / totalOrderQuantity) * 100 : 0;

            return (
              <Card key={item.id} className="border">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* 進貨項目基本信息 */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium">{item.product_variant.product.name}</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">SKU:</span> {item.product_variant.sku}
                          </div>
                          <div>
                            <span className="font-medium">進貨數量:</span> {item.quantity}
                          </div>
                          <div>
                            <span className="font-medium">單價:</span> {MoneyHelper.format(item.unit_price)}
                          </div>
                          <div>
                            <span className="font-medium">小計:</span> {MoneyHelper.format(item.quantity * item.unit_price)}
                          </div>
                        </div>
                      </div>
                      
                      {/* 關聯訂單數量 */}
                      {hasOrderItems && (
                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            關聯 {item.related_order_items!.length} 個訂單
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            訂單需求: {totalOrderQuantity}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 履行進度（如果有關聯訂單） */}
                    {hasOrderItems && showOrderItems && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">訂單履行進度</span>
                          <span className="text-sm text-muted-foreground">
                            {totalFulfilledQuantity} / {totalOrderQuantity}
                          </span>
                        </div>
                        <Progress value={fulfillmentProgress} className="h-2" />
                      </div>
                    )}

                    {/* 展開/收合按鈕 */}
                    {hasOrderItems && showOrderItems && (
                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="text-sm text-muted-foreground">
                          關聯訂單詳情
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleItemExpansion(item.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {isExpanded ? '收合' : '展開'}
                        </Button>
                      </div>
                    )}

                    {/* 關聯訂單詳情 */}
                    {isExpanded && hasOrderItems && (
                      <div className="border-t pt-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>訂單編號</TableHead>
                              <TableHead>客戶</TableHead>
                              <TableHead>訂購數量</TableHead>
                              <TableHead>已履行</TableHead>
                              <TableHead>履行狀態</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.related_order_items!.map((orderItem) => {
                              const itemProgress = (orderItem.fulfilled_quantity / orderItem.quantity) * 100;
                              
                              return (
                                <TableRow key={orderItem.id}>
                                  <TableCell className="font-medium">
                                    #{orderItem.order_number}
                                  </TableCell>
                                  <TableCell>{orderItem.customer_name}</TableCell>
                                  <TableCell>{orderItem.quantity}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {orderItem.is_fulfilled ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : orderItem.fulfilled_quantity > 0 ? (
                                        <Clock className="h-4 w-4 text-orange-600" />
                                      ) : (
                                        <AlertCircle className="h-4 w-4 text-gray-400" />
                                      )}
                                      <span>{orderItem.fulfilled_quantity}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <Badge variant={
                                        orderItem.is_fulfilled ? 'default' :
                                        orderItem.fulfilled_quantity > 0 ? 'secondary' :
                                        'outline'
                                      }>
                                        {orderItem.is_fulfilled ? '已履行' :
                                         orderItem.fulfilled_quantity > 0 ? '部分履行' :
                                         '未履行'}
                                      </Badge>
                                      {orderItem.quantity > 0 && (
                                        <Progress value={itemProgress} className="h-1 w-16" />
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}