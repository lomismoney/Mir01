<?php

namespace Database\Seeders;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use App\Enums\OrderItemType;
use Illuminate\Database\Seeder;

class PurchaseOrderLinkSeeder extends Seeder
{
    /**
     * 運行進貨單與訂單關聯播種器
     * 這個 Seeder 專門建立進貨單項目與訂單項目的關聯，模擬真實的採購履行流程
     */
    public function run(): void
    {
        // 獲取預訂和訂製的訂單項目（這些需要採購）
        $backorderItems = OrderItem::where('is_backorder', true)
            ->where('fulfilled_quantity', '<', \DB::raw('quantity'))
            ->with(['productVariant', 'order.customer'])
            ->get();

        $customItems = OrderItem::where('is_stocked_sale', false)
            ->where('is_backorder', false)
            ->where('fulfilled_quantity', '<', \DB::raw('quantity'))
            ->with(['productVariant', 'order.customer'])
            ->get();

        $pendingItems = $backorderItems->merge($customItems);

        if ($pendingItems->isEmpty()) {
            echo "沒有需要採購的訂單項目\n";
            return;
        }

        $stores = Store::all();
        $user = User::first();

        if ($stores->isEmpty() || !$user) {
            echo "警告：需要門市和用戶資料才能建立進貨單\n";
            return;
        }

        $purchaseCount = 0;
        $linkCount = 0;

        // 按商品變體分組處理
        $itemsByVariant = $pendingItems->groupBy('product_variant_id');

        foreach ($itemsByVariant as $variantId => $items) {
            if (is_null($variantId)) {
                // 處理訂製商品（沒有變體ID）
                $this->handleCustomItems($items, $stores->random(), $user, $purchaseCount, $linkCount);
            } else {
                // 處理預訂商品
                $this->handleBackorderItems($items, $stores->random(), $user, $purchaseCount, $linkCount);
            }
        }

        echo "建立了 {$purchaseCount} 個新進貨單，{$linkCount} 個進貨項目與訂單項目關聯\n";
    }

    /**
     * 處理預訂商品項目
     */
    private function handleBackorderItems($items, Store $store, User $user, &$purchaseCount, &$linkCount): void
    {
        // 計算總需求量
        $totalQuantityNeeded = $items->sum(function($item) {
            return $item->quantity - $item->fulfilled_quantity;
        });

        if ($totalQuantityNeeded <= 0) {
            return;
        }

        // 獲取第一個項目的變體資訊
        $firstItem = $items->first();
        $variant = $firstItem->productVariant;

        if (!$variant) {
            return;
        }

        // 決定進貨數量（通常會多進一些）
        $purchaseQuantity = $totalQuantityNeeded + rand(5, 15);

        // 創建進貨單
        $purchase = $this->createPurchaseForBackorder($store, $user, $variant, $purchaseQuantity, $items);
        $purchaseCount++;

        // 創建進貨項目
        $purchaseItem = PurchaseItem::create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $variant->id,
            'quantity' => $purchaseQuantity,
            'cost_price' => $variant->cost_price ?: ($variant->price * 0.6),
        ]);

        // 關聯所有相關的訂單項目
        foreach ($items as $orderItem) {
            $orderItem->update(['purchase_item_id' => $purchaseItem->id]);
            $linkCount++;
        }

        // 如果進貨單狀態為已完成，執行履行邏輯
        if ($purchase->status === Purchase::STATUS_COMPLETED) {
            $this->fulfillOrderItemsFromPurchase($purchaseItem, $items);
        }
    }

    /**
     * 處理訂製商品項目
     */
    private function handleCustomItems($items, Store $store, User $user, &$purchaseCount, &$linkCount): void
    {
        // 訂製商品通常按訂單分別處理
        $itemsByOrder = $items->groupBy('order_id');

        foreach ($itemsByOrder as $orderId => $orderItems) {
            // 為每個訂單的訂製商品創建專門的進貨單
            $purchase = $this->createPurchaseForCustom($store, $user, $orderItems);
            $purchaseCount++;

            foreach ($orderItems as $orderItem) {
                $quantity = $orderItem->quantity - $orderItem->fulfilled_quantity;
                
                if ($quantity <= 0) continue;

                // 為訂製商品創建進貨項目
                $purchaseItem = PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_variant_id' => null, // 訂製商品沒有標準變體
                    'quantity' => $quantity,
                    'cost_price' => $orderItem->cost,
                    'custom_product_name' => $orderItem->custom_product_name ?: ('客製化 ' . $orderItem->product_name),
                    'custom_specifications' => $orderItem->custom_specifications,
                ]);

                // 關聯訂單項目
                $orderItem->update(['purchase_item_id' => $purchaseItem->id]);
                $linkCount++;

                // 訂製商品通常需要較長時間，這裡隨機決定是否已完成
                if ($purchase->status === Purchase::STATUS_COMPLETED && rand(1, 100) <= 30) {
                    // 30% 機率訂製商品已完成
                    $this->fulfillCustomOrderItem($orderItem, $quantity);
                }
            }
        }
    }

    /**
     * 為預訂商品創建進貨單
     */
    private function createPurchaseForBackorder(Store $store, User $user, ProductVariant $variant, int $quantity, $orderItems): Purchase
    {
        $createdAt = now()->subDays(rand(1, 14))->subHours(rand(0, 23));
        
        // 進貨單狀態：70%已完成，30%其他狀態
        $statuses = [
            Purchase::STATUS_COMPLETED => 70,
            Purchase::STATUS_RECEIVED => 15,
            Purchase::STATUS_IN_TRANSIT => 10,
            Purchase::STATUS_CONFIRMED => 5,
        ];
        
        $status = $this->getWeightedRandomStatus($statuses);
        
        $shippingCost = rand(100, 300) * 100; // 100-300元
        $totalCost = ($variant->cost_price ?: ($variant->price * 0.6)) * $quantity + $shippingCost;

        $customerNames = $orderItems->map(function($item) {
            return $item->order->customer->name;
        })->unique()->implode(', ');

        return Purchase::create([
            'store_id' => $store->id,
            'user_id' => $user->id,
            'order_number' => $this->generatePurchaseOrderNumber($createdAt),
            'purchased_at' => $createdAt,
            'shipping_cost' => $shippingCost,
            'total_amount' => $totalCost,
            'status' => $status,
            'notes' => "預訂商品採購 - {$variant->product->name} (客戶: {$customerNames})",
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    /**
     * 為訂製商品創建進貨單
     */
    private function createPurchaseForCustom(Store $store, User $user, $orderItems): Purchase
    {
        $createdAt = now()->subDays(rand(5, 20))->subHours(rand(0, 23)); // 訂製商品較早開始採購
        
        // 訂製商品狀態：40%已完成，60%進行中
        $statuses = [
            Purchase::STATUS_COMPLETED => 40,
            Purchase::STATUS_RECEIVED => 20,
            Purchase::STATUS_IN_TRANSIT => 20,
            Purchase::STATUS_CONFIRMED => 20,
        ];
        
        $status = $this->getWeightedRandomStatus($statuses);
        
        $shippingCost = rand(200, 500) * 100; // 訂製商品運費較高
        $totalCost = $orderItems->sum(function($item) {
            return $item->cost * ($item->quantity - $item->fulfilled_quantity);
        }) + $shippingCost;

        $orderNumber = $orderItems->first()->order->order_number;
        $customerName = $orderItems->first()->order->customer->name;

        return Purchase::create([
            'store_id' => $store->id,
            'user_id' => $user->id,
            'order_number' => $this->generateCustomPurchaseOrderNumber($createdAt, $orderNumber),
            'purchased_at' => $createdAt,
            'shipping_cost' => $shippingCost,
            'total_amount' => $totalCost,
            'status' => $status,
            'notes' => "訂製商品採購 - 訂單 {$orderNumber} (客戶: {$customerName})",
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    /**
     * 從進貨履行訂單項目
     */
    private function fulfillOrderItemsFromPurchase(PurchaseItem $purchaseItem, $orderItems): void
    {
        $availableQuantity = $purchaseItem->quantity;

        foreach ($orderItems as $orderItem) {
            if ($availableQuantity <= 0) break;

            $neededQuantity = $orderItem->quantity - $orderItem->fulfilled_quantity;
            if ($neededQuantity <= 0) continue;

            $toFulfill = min($availableQuantity, $neededQuantity);
            
            $orderItem->addFulfilledQuantity($toFulfill);
            $availableQuantity -= $toFulfill;
        }
    }

    /**
     * 履行訂製商品項目
     */
    private function fulfillCustomOrderItem(OrderItem $orderItem, int $quantity): void
    {
        $orderItem->addFulfilledQuantity($quantity);
    }

    /**
     * 生成預訂商品進貨單號
     */
    private function generatePurchaseOrderNumber($date): string
    {
        $prefix = 'PO-BO'; // PO = Purchase Order, BO = Backorder
        $dateStr = $date->format('ymd');
        $randomSuffix = str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
        
        return "{$prefix}-{$dateStr}-{$randomSuffix}";
    }

    /**
     * 生成訂製商品進貨單號
     */
    private function generateCustomPurchaseOrderNumber($date, $orderNumber): string
    {
        $prefix = 'PO-CUSTOM';
        $dateStr = $date->format('ymd');
        $orderSuffix = substr($orderNumber, -4); // 取訂單號後4位
        
        return "{$prefix}-{$dateStr}-{$orderSuffix}";
    }

    /**
     * 根據權重獲取隨機狀態
     */
    private function getWeightedRandomStatus(array $weights): string
    {
        $random = rand(1, 100);
        $cumulative = 0;
        
        foreach ($weights as $status => $weight) {
            $cumulative += $weight;
            if ($random <= $cumulative) {
                return $status;
            }
        }
        
        return array_key_first($weights);
    }
}