'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, Package } from 'lucide-react';
import { OrderItem } from '@/types/order';

interface FulfillmentProgressProps {
  orderItems: OrderItem[];
  title?: string;
  description?: string;
}

export function FulfillmentProgress({ 
  orderItems, 
  title = "履行進度",
  description = "訂單項目的整體履行狀況"
}: FulfillmentProgressProps) {
  // 計算統計數據
  const fullyFulfilledItems = orderItems.filter(item => item.is_fulfilled).length;
  const partiallyFulfilledItems = orderItems.filter(item => 
    item.fulfilled_quantity > 0 && !item.is_fulfilled
  ).length;
  const unfulfilledItems = orderItems.filter(item => item.fulfilled_quantity === 0).length;

  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const fulfilledQuantity = orderItems.reduce((sum, item) => sum + item.fulfilled_quantity, 0);
  const overallProgress = totalQuantity > 0 ? (fulfilledQuantity / totalQuantity) * 100 : 0;

  // 按商品類型分類
  const stockItems = orderItems.filter(item => item.is_stocked_sale);
  const backorderItems = orderItems.filter(item => item.is_backorder);
  const customItems = orderItems.filter(item => !item.is_stocked_sale && !item.is_backorder);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 整體進度 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">整體履行進度</span>
            <span className="text-sm text-muted-foreground">
              {fulfilledQuantity} / {totalQuantity}
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="text-center">
            <Badge variant={overallProgress === 100 ? 'default' : 'secondary'}>
              {overallProgress.toFixed(1)}% 已履行
            </Badge>
          </div>
        </div>

        {/* 項目狀態統計 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{fullyFulfilledItems}</p>
              <p className="text-sm text-muted-foreground">已完成</p>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{partiallyFulfilledItems}</p>
              <p className="text-sm text-muted-foreground">部分履行</p>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">{unfulfilledItems}</p>
              <p className="text-sm text-muted-foreground">未履行</p>
            </div>
          </div>
        </div>

        {/* 按商品類型分組的進度 */}
        {(stockItems.length > 0 || backorderItems.length > 0 || customItems.length > 0) && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">按商品類型</h4>
            
            {stockItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">現貨商品</Badge>
                    <span className="text-sm text-muted-foreground">
                      {stockItems.length} 項
                    </span>
                  </div>
                  <span className="text-sm text-green-600">
                    {stockItems.filter(item => item.is_fulfilled).length} / {stockItems.length} 已履行
                  </span>
                </div>
                <Progress 
                  value={(stockItems.filter(item => item.is_fulfilled).length / stockItems.length) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {backorderItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">預訂商品</Badge>
                    <span className="text-sm text-muted-foreground">
                      {backorderItems.length} 項
                    </span>
                  </div>
                  <span className="text-sm text-orange-600">
                    {backorderItems.filter(item => item.is_fulfilled).length} / {backorderItems.length} 已履行
                  </span>
                </div>
                <Progress 
                  value={(backorderItems.filter(item => item.is_fulfilled).length / backorderItems.length) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {customItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">訂製商品</Badge>
                    <span className="text-sm text-muted-foreground">
                      {customItems.length} 項
                    </span>
                  </div>
                  <span className="text-sm text-blue-600">
                    {customItems.filter(item => item.is_fulfilled).length} / {customItems.length} 已履行
                  </span>
                </div>
                <Progress 
                  value={(customItems.filter(item => item.is_fulfilled).length / customItems.length) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}