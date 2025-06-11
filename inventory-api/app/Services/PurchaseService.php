<?php

namespace App\Services;

use App\Data\PurchaseData;
use App\Models\Purchase;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;
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
            // 1. 計算總金額
            $totalAmount = 0;
            foreach ($purchaseData->items as $item) {
                $totalAmount += $item->quantity * $item->unit_price;
            }

            // 2. 建立進貨單主記錄 (Purchase)
            $purchase = Purchase::create([
                'store_id' => $purchaseData->store_id,
                'order_number' => $purchaseData->order_number,
                'purchased_at' => $purchaseData->purchased_at ?? Carbon::now(),
                'total_amount' => $totalAmount,
            ]);

            // 3. 遍歷進貨項目，建立項目記錄並更新庫存
            foreach ($purchaseData->items as $itemData) {
                // 3a. 建立進貨項目記錄 (PurchaseItem)
                $purchase->items()->create([
                    'product_id' => $itemData->product_id,
                    'quantity' => $itemData->quantity,
                    'unit_price' => $itemData->unit_price,
                ]);

                // 3b. 更新或建立對應的庫存記錄 (Inventory)
                $inventory = Inventory::firstOrCreate(
                    [
                        'store_id' => $purchaseData->store_id,
                        'product_id' => $itemData->product_id,
                    ],
                    ['quantity' => 0]
                );

                // 使用 increment 以避免競爭條件 (race condition)
                $inventory->increment('quantity', $itemData->quantity);
            }

            // 4. 返回建立的進貨單模型實例
            return $purchase;
        });
    }
}
