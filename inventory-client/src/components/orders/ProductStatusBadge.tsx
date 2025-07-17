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
 * - 沒有 product_variant_id 或有 custom_specifications = 訂製商品
 * - 有 product_variant_id 且 is_backorder = true = 預訂商品
 * - 有 product_variant_id 且 is_stocked_sale = true = 現貨商品
 */
export function ProductStatusBadge({ item, className = "text-xs" }: ProductStatusBadgeProps) {
  // 訂製商品：沒有 product_variant_id 或有自訂規格
  if (!item.product_variant_id || item.custom_specifications) {
    return (
      <Badge variant="secondary" className={className}>
        訂製
      </Badge>
    );
  }
  
  // 預訂商品：有 product_variant_id 但標記為 backorder
  if (item.is_backorder) {
    return (
      <Badge variant="warning" className={className}>
        預訂
      </Badge>
    );
  }
  
  // 現貨商品：有 product_variant_id 且標記為 stocked_sale
  if (item.is_stocked_sale) {
    return (
      <Badge variant="outline" className={className}>
        庫存商品
      </Badge>
    );
  }
  
  // 預設：如果都不符合，顯示預訂（保護性邏輯）
  return (
    <Badge variant="warning" className={className}>
      預訂
    </Badge>
  );
} 