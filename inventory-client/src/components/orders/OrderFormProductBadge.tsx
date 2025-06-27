import { Badge } from '@/components/ui/badge';

interface OrderFormItem {
  product_variant_id: number | null;
  is_stocked_sale: boolean;
  custom_specifications?: Record<string, any> | null;
  quantity: number;
  stock?: number;
}

interface OrderFormProductBadgeProps {
  item: OrderFormItem;
  className?: string;
}

/**
 * 新增訂單表單專用的商品狀態徽章組件
 * 
 * 根據商品類型和庫存狀況智能顯示狀態：
 * - 訂製商品 = 訂製（灰色）
 * - 標準商品 + 庫存不足 = 預訂（橙色警告）
 * - 標準商品 + 庫存充足 = 庫存商品（藍色邊框）
 */
export function OrderFormProductBadge({ item, className = "text-xs" }: OrderFormProductBadgeProps) {
  // 訂製商品判斷：product_variant_id 為 null 或有自訂規格
  if (!item.product_variant_id || item.custom_specifications) {
    return (
      <Badge variant="secondary" className={className}>
        訂製
      </Badge>
    );
  }
  
  // 標準商品但庫存不足的情況
  if (item.is_stocked_sale && typeof item.stock === 'number' && item.stock < item.quantity) {
    return (
      <Badge variant="warning" className={className}>
        預訂
      </Badge>
    );
  }
  
  // 標準商品且庫存充足
  return (
    <Badge variant="outline" className={className}>
      庫存商品
    </Badge>
  );
} 