<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use App\Models\Inventory;
use App\Services\PurchaseService;
use App\Data\PurchaseData;
use App\Data\PurchaseItemData;
use Spatie\LaravelData\DataCollection;
use Illuminate\Support\Facades\Auth;

class PurchaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stores = Store::all();
        $user = User::first();
        $variants = ProductVariant::with('product')->get();
        $purchaseService = app(PurchaseService::class);
        
        // 設置認證用戶
        if ($user) {
            Auth::login($user);
        }
        
        if ($stores->isEmpty() || !$user || $variants->isEmpty()) {
            echo "警告：需要門市、用戶和商品變體資料才能建立進貨單\n";
            return;
        }
        
        // 清除現有進貨單資料（處理外鍵約束）
        $existingCount = Purchase::count();
        if ($existingCount > 0) {
            echo "發現 {$existingCount} 筆現有進貨單，先清除...\n";
            PurchaseItem::query()->delete(); // 先刪除進貨項目
            Purchase::query()->delete();     // 再刪除進貨單
        }
        
        $purchaseCount = 0;
        $itemCount = 0;
        
        // 建立不同狀態的進貨單
        $statuses = [
            Purchase::STATUS_PENDING,
            Purchase::STATUS_CONFIRMED, 
            Purchase::STATUS_IN_TRANSIT,
            Purchase::STATUS_RECEIVED,
            Purchase::STATUS_COMPLETED,
            Purchase::STATUS_CANCELLED
        ];
        
        // 為每個門市建立一些進貨單
        foreach ($stores as $store) {
            $purchasesForStore = rand(4, 10); // 每個門市4-10個進貨單
            
            for ($i = 0; $i < $purchasesForStore; $i++) {
                // 隨機選擇狀態，但確保有一些已完成的進貨單
                if ($i < 3) {
                    $status = Purchase::STATUS_COMPLETED; // 前三個設為已完成
                } else {
                    $status = $statuses[array_rand($statuses)];
                }
                
                // 設定進貨日期（過去60天內）
                $purchasedAt = now()->subDays(rand(0, 60))->subHours(rand(0, 23));
                
                // 計算運費
                $shippingCost = rand(50, 500) * 100; // 50-500元（以分為單位）
                
                // 為進貨單準備項目
                $itemsCount = rand(2, 6); // 每個進貨單2-6個項目
                
                // 隨機選擇一些商品變體作為進貨項目
                $selectedVariants = $variants->shuffle()->take($itemsCount);
                
                $items = [];
                foreach ($selectedVariants as $variant) {
                    $quantity = rand(10, 100);
                    $costPrice = $variant->cost_price ?: (int)($variant->price * 0.6); // 如果沒有成本價，用售價的60%
                    
                    $items[] = new PurchaseItemData(
                        product_variant_id: $variant->id,
                        quantity: $quantity,
                        cost_price: $costPrice
                    );
                    
                    $itemCount++;
                }
                
                // 隨機生成稅務資訊
                $isTaxInclusive = (bool) rand(0, 1);
                $taxRate = collect([0, 5, 10])->random();
                
                // 使用PurchaseService創建進貨單（這會自動計算運費攤銷）
                $purchaseData = new PurchaseData(
                    store_id: $store->id,
                    order_number: null, // 讓系統自動生成
                    shipping_cost: $shippingCost,
                    items: new DataCollection(PurchaseItemData::class, $items),
                    status: $status,
                    purchased_at: $purchasedAt,
                    notes: '測試進貨單 - 包含稅務資訊',
                    order_items: null,
                    is_tax_inclusive: $isTaxInclusive,
                    tax_rate: $taxRate
                );
                
                $purchase = $purchaseService->createPurchase($purchaseData);
                $purchaseCount++;
            }
        }
        
        echo "成功建立了 {$purchaseCount} 筆進貨單，{$itemCount} 筆進貨項目\n";
    }
    

}
