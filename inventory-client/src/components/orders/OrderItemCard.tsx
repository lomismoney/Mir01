'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { 
  OrderItem, 
  determineOrderItemType, 
  ORDER_ITEM_TYPE_OPTIONS,
  getFulfillmentBadgeVariant,
  getFulfillmentStatusText,
  getItemTypeBadgeVariant
} from '@/types/order';
import { MoneyHelper } from '@/lib/money-helper';

interface OrderItemCardProps {
  item: OrderItem;
  showFulfillmentDetails?: boolean;
}

export function OrderItemCard({ item, showFulfillmentDetails = true }: OrderItemCardProps) {
  const itemType = determineOrderItemType(item);
  const fulfillmentProgress = (item.fulfilled_quantity / item.quantity) * 100;
  const remainingQuantity = item.quantity - item.fulfilled_quantity;

  const getFulfillmentIcon = () => {
    if (item.is_fulfilled) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (item.fulfilled_quantity > 0) {
      return <Clock className="h-4 w-4 text-orange-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 商品基本信息 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">{item.product_name}</h4>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>SKU: {item.sku}</span>
                <span>數量: {item.quantity}</span>
                <span>單價: {item.price != null ? MoneyHelper.format(item.price, 'NT$') : 'N/A'}</span>
              </div>
            </div>
            
            {/* 商品類型標籤 */}
            <Badge variant={getItemTypeBadgeVariant(itemType)}>
              {ORDER_ITEM_TYPE_OPTIONS[itemType]}
            </Badge>
          </div>

          {/* 履行狀態 */}
          {showFulfillmentDetails && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFulfillmentIcon()}
                  <span className="text-sm font-medium">履行狀態</span>
                </div>
                <Badge variant={getFulfillmentBadgeVariant(item)}>
                  {getFulfillmentStatusText(item)}
                </Badge>
              </div>

              {/* 履行進度條 */}
              {item.quantity > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>已履行: {item.fulfilled_quantity}</span>
                    <span>待履行: {remainingQuantity}</span>
                  </div>
                  <Progress value={fulfillmentProgress} className="h-2" />
                </div>
              )}

              {/* 履行時間 */}
              {item.fulfilled_at && (
                <div className="text-xs text-muted-foreground">
                  履行時間: {new Date(item.fulfilled_at).toLocaleString('zh-TW')}
                </div>
              )}
            </div>
          )}

          {/* 採購狀態（預訂商品和訂製商品） */}
          {(item.is_backorder || (!item.is_stocked_sale && !item.is_backorder)) && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">採購狀態:</span>
              <Badge variant="outline">
                {item.purchase_status_text}
              </Badge>
            </div>
          )}

          {/* 訂製商品額外信息 */}
          {item.custom_specifications && (
            <div className="border-t pt-2">
              <p className="text-sm font-medium mb-1">訂製規格:</p>
              <div className="text-sm text-muted-foreground">
                {typeof item.custom_specifications === 'string' 
                  ? item.custom_specifications 
                  : JSON.stringify(item.custom_specifications)
                }
              </div>
            </div>
          )}

          {/* 小計金額 */}
          <div className="flex justify-between items-center border-t pt-2">
            <span className="text-sm text-muted-foreground">小計:</span>
            <span className="font-medium">
              {(() => {
                const subtotal = (item.price * item.quantity) - (item.discount_amount || 0);
                return subtotal != null ? MoneyHelper.format(subtotal, 'NT$') : 'N/A';
              })()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}