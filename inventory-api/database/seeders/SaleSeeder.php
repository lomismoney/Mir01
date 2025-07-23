<?php

namespace Database\Seeders;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use Illuminate\Database\Seeder;

class SaleSeeder extends Seeder
{
    /**
     * 運行銷售記錄數據播種器
     */
    public function run(): void
    {
        $stores = Store::all();
        $products = Product::with('variants')->get();
        
        if ($stores->isEmpty() || $products->isEmpty()) {
            echo "警告：需要門市和商品資料才能建立銷售記錄\n";
            return;
        }
        
        $saleCount = 0;
        $itemCount = 0;
        
        // 為每個門市建立銷售記錄
        foreach ($stores as $store) {
            // 建立過去30天的銷售記錄
            $salesForStore = $this->createSalesForStore($store, $products);
            $saleCount += $salesForStore['sales'];
            $itemCount += $salesForStore['items'];
        }
        
        echo "建立了 {$saleCount} 筆銷售記錄，包含 {$itemCount} 個銷售項目\n";
    }
    
    /**
     * 為特定門市建立銷售記錄
     */
    private function createSalesForStore(Store $store, $products): array
    {
        $salesCount = 0;
        $itemsCount = 0;
        
        // 每個門市每天產生1-5筆銷售
        for ($daysAgo = 30; $daysAgo >= 0; $daysAgo--) {
            $saleDate = now()->subDays($daysAgo);
            $dailySales = rand(1, 5);
            
            for ($i = 0; $i < $dailySales; $i++) {
                $sale = $this->createSale($store, $saleDate, $i);
                $salesCount++;
                
                // 每筆銷售包含1-5個商品
                $itemCount = rand(1, 5);
                $selectedProducts = $this->selectRandomProducts($products, $store, $itemCount);
                
                foreach ($selectedProducts as $productData) {
                    $this->createSaleItem($sale, $productData);
                    $itemsCount++;
                }
                
                // 更新銷售總金額
                $this->updateSaleTotalAmount($sale);
            }
        }
        
        return ['sales' => $salesCount, 'items' => $itemsCount];
    }
    
    /**
     * 建立銷售記錄
     */
    private function createSale(Store $store, $saleDate, int $sequence): Sale
    {
        // 生成交易單號
        $transactionNumber = $this->generateTransactionNumber($store, $saleDate, $sequence);
        
        // 隨機選擇付款方式
        $paymentMethods = ['cash', 'credit_card', 'mobile_payment'];
        $weights = [60, 30, 10]; // 現金60%、信用卡30%、行動支付10%
        $paymentMethod = $this->weightedRandom($paymentMethods, $weights);
        
        // 設定銷售時間（營業時間內）
        $soldAt = $saleDate->copy()
                          ->setHour(rand(9, 21))
                          ->setMinute(rand(0, 59))
                          ->setSecond(rand(0, 59));
        
        return Sale::create([
            'store_id' => $store->id,
            'transaction_number' => $transactionNumber,
            'total_amount' => 0, // 稍後計算
            'sold_at' => $soldAt,
            'payment_method' => $paymentMethod,
            'created_at' => $soldAt,
            'updated_at' => $soldAt,
        ]);
    }
    
    /**
     * 選擇隨機商品
     */
    private function selectRandomProducts($products, Store $store, int $count): array
    {
        $selectedProducts = [];
        $availableProducts = [];
        
        // 收集該門市有庫存的商品
        foreach ($products as $product) {
            foreach ($product->variants as $variant) {
                $inventory = Inventory::where('store_id', $store->id)
                                     ->where('product_variant_id', $variant->id)
                                     ->first();
                
                if ($inventory && $inventory->quantity > 0) {
                    $availableProducts[] = [
                        'product' => $product,
                        'variant' => $variant,
                        'inventory' => $inventory,
                    ];
                }
            }
        }
        
        if (empty($availableProducts)) {
            return [];
        }
        
        // 隨機選擇商品
        $count = min($count, count($availableProducts));
        $selectedIndexes = array_rand($availableProducts, $count);
        
        if (!is_array($selectedIndexes)) {
            $selectedIndexes = [$selectedIndexes];
        }
        
        foreach ($selectedIndexes as $index) {
            $selectedProducts[] = $availableProducts[$index];
        }
        
        return $selectedProducts;
    }
    
    /**
     * 建立銷售項目
     */
    private function createSaleItem(Sale $sale, array $productData): SaleItem
    {
        $product = $productData['product'];
        $variant = $productData['variant'];
        $inventory = $productData['inventory'];
        
        // 銷售數量（不超過庫存的30%）
        $maxQuantity = max(1, (int)($inventory->quantity * 0.3));
        $quantity = rand(1, min(3, $maxQuantity));
        
        // 使用商品變體的價格
        $unitPrice = $variant->price;
        
        // 偶爾給予折扣（10%機率）
        if (rand(1, 100) <= 10) {
            $discountPercentage = rand(5, 20); // 5%-20%折扣
            $unitPrice = round($unitPrice * (1 - $discountPercentage / 100));
        }
        
        return SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'unit_price' => $unitPrice, // 使用 Mutator，自動轉換為分
        ]);
    }
    
    /**
     * 更新銷售總金額
     */
    private function updateSaleTotalAmount(Sale $sale): void
    {
        $totalAmount = $sale->items()->get()->sum(function($item) {
            return $item->unit_price * $item->quantity;
        });
        
        $sale->update(['total_amount' => $totalAmount]);
    }
    
    /**
     * 生成交易單號
     */
    private function generateTransactionNumber(Store $store, $date, int $sequence): string
    {
        $storeCode = str_pad($store->id, 3, '0', STR_PAD_LEFT);
        $dateStr = $date->format('Ymd');
        $sequenceStr = str_pad($sequence + 1, 4, '0', STR_PAD_LEFT);
        
        return "S{$storeCode}-{$dateStr}-{$sequenceStr}";
    }
    
    /**
     * 加權隨機選擇
     */
    private function weightedRandom(array $options, array $weights): string
    {
        $totalWeight = array_sum($weights);
        $random = rand(1, $totalWeight);
        
        $currentWeight = 0;
        foreach ($options as $index => $option) {
            $currentWeight += $weights[$index];
            if ($random <= $currentWeight) {
                return $option;
            }
        }
        
        return $options[0];
    }
}