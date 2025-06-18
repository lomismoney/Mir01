<?php

namespace App\Services;

use App\Data\PurchaseData;
use App\Models\Purchase;
use App\Models\Inventory;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

/**
 * 進貨管理服務類別
 * 
 * 處理進貨相關的業務邏輯
 */
class PurchaseService
{
    /**
     * 建立新的進貨單
     * 
     * @param PurchaseData $purchaseData 進貨單資料
     * @return mixed
     */
    public function createPurchase(PurchaseData $purchaseData)
    {
        // 使用資料庫交易，確保資料一致性
        return DB::transaction(function () use ($purchaseData) {
            // 1. 計算總金額和總數量
            $totalAmount = 0;
            $totalQuantity = 0;
            
            foreach ($purchaseData->items as $item) {
                $totalAmount += $item->quantity * $item->unit_price;
                $totalQuantity += $item->quantity;
            }

            // 2. 建立進貨單主記錄 (Purchase)
            $purchase = Purchase::create([
                'store_id' => $purchaseData->store_id,
                'order_number' => $purchaseData->order_number,
                'purchased_at' => $purchaseData->purchased_at ?? Carbon::now(),
                'total_amount' => $totalAmount,
                'shipping_cost' => $purchaseData->shipping_cost,
            ]);

            // 3. 遍歷進貨項目，建立項目記錄並更新庫存
            foreach ($purchaseData->items as $itemData) {
                // 3a. 計算運費攤銷（按數量比例分攤）
                $allocatedShippingCost = $totalQuantity > 0 
                    ? ($purchaseData->shipping_cost * $itemData->quantity) / $totalQuantity 
                    : 0;

                // 3b. 建立進貨項目記錄 (PurchaseItem)
                $purchase->items()->create([
                    'product_variant_id' => $itemData->product_variant_id,
                    'quantity' => $itemData->quantity,
                    'unit_price' => $itemData->unit_price,
                    'cost_price' => $itemData->cost_price,
                    'allocated_shipping_cost' => $allocatedShippingCost,
                ]);

                // 3c. 更新或建立對應的庫存記錄 (Inventory)
                $inventory = Inventory::firstOrCreate(
                    [
                        'store_id' => $purchaseData->store_id,
                        'product_variant_id' => $itemData->product_variant_id,
                    ],
                    ['quantity' => 0, 'low_stock_threshold' => 5]
                );

                // 使用庫存模型的方法來增加庫存
                $inventory->addStock(
                    $itemData->quantity, 
                    Auth::id() ?? 1, 
                    "進貨單 #{$purchase->order_number}",
                    ['purchase_id' => $purchase->id]
                );

                // 3d. 更新商品變體的平均成本
                $productVariant = ProductVariant::find($itemData->product_variant_id);
                if (!$productVariant) {
                    throw new \Exception("ProductVariant not found: ID {$itemData->product_variant_id}");
                }
                $productVariant->updateAverageCost(
                    $itemData->quantity, 
                    $itemData->cost_price, 
                    $allocatedShippingCost
                );
            }

            // 4. 返回建立的進貨單模型實例
            return $purchase;
        });
    }
}
