import { Badge } from '@/components/ui/badge';
import { ProcessedOrderItem } from '@/types/api-helpers';

interface ProductStatusBadgeProps {
  item: ProcessedOrderItem;
  className?: string;
}

/**
 * 商品狀態徽章組件
 * 
 * 統一的徽章顯示邏輯：
 * - 訂製商品 = 訂製
 * - 標準商品-沒庫存 = 顯示預訂  
 * - 標準商品-有庫存 = 庫存商品
 */
export function ProductStatusBadge({ item, className = "text-xs" }: ProductStatusBadgeProps) {
  // 訂製商品 = 訂製
  if (!item.is_stocked_sale || item.custom_specifications) {
    return (
      <Badge variant="secondary" className={className}>
        訂製
      </Badge>
    );
  }
  
  // 標準商品-沒庫存 = 顯示預訂
  if (item.is_backorder) {
    return (
      <Badge variant="warning" className={className}>
        預訂
      </Badge>
    );
  }
  
  // 標準商品-有庫存 = 庫存商品
  return (
    <Badge variant="outline" className={className}>
      庫存商品
    </Badge>
  );
} 