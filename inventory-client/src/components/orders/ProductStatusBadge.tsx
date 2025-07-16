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
 * - 訂製商品 = 有自訂規格 或 (非現貨且非預訂)
 * - 預訂商品 = is_backorder 為 true
 * - 庫存商品 = 其他情況（現貨商品）
 */
export function ProductStatusBadge({ item, className = "text-xs" }: ProductStatusBadgeProps) {
  // 訂製商品 = 有自訂規格 或 (非現貨且非預訂)
  if (item.custom_specifications || (!item.is_stocked_sale && !item.is_backorder)) {
    return (
      <Badge variant="secondary" className={className}>
        訂製
      </Badge>
    );
  }
  
  // 預訂商品 = is_backorder 為 true
  if (item.is_backorder) {
    return (
      <Badge variant="warning" className={className}>
        預訂
      </Badge>
    );
  }
  
  // 庫存商品 = 其他情況（現貨商品）
  return (
    <Badge variant="outline" className={className}>
      庫存商品
    </Badge>
  );
} 