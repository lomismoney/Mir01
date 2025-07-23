<?php

namespace Database\Seeders;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class TimeSeriesDataSeeder extends Seeder
{
    /**
     * 運行時序數據播種器
     * 建立過去3-6個月的歷史數據，用於報表和趨勢分析
     */
    public function run(): void
    {
        echo "開始建立時序測試數據...\n";
        
        $stores = Store::all();
        $productVariants = ProductVariant::with('product')->get();
        $users = User::all();
        
        if ($stores->isEmpty() || $productVariants->isEmpty() || $users->isEmpty()) {
            echo "警告：需要門市、商品和用戶資料才能建立時序數據\n";
            return;
        }
        
        // 建立過去6個月的數據
        $monthsToGenerate = 6;
        $startDate = now()->subMonths($monthsToGenerate)->startOfMonth();
        $endDate = now()->endOfMonth();
        
        // 1. 建立歷史庫存交易記錄
        $this->generateHistoricalInventoryTransactions($stores, $productVariants, $users, $startDate, $endDate);
        
        // 2. 建立歷史訂單趨勢
        $this->generateHistoricalOrderTrends($stores, $productVariants, $users, $startDate, $endDate);
        
        // 3. 建立季節性銷售模式
        $this->generateSeasonalSalesPatterns($stores, $productVariants, $startDate, $endDate);
        
        echo "時序測試數據建立完成！\n";
    }
    
    /**
     * 生成歷史庫存交易記錄
     */
    private function generateHistoricalInventoryTransactions($stores, $productVariants, $users, $startDate, $endDate): void
    {
        echo "建立歷史庫存交易記錄...\n";
        
        $transactionCount = 0;
        $currentDate = $startDate->copy();
        
        while ($currentDate <= $endDate) {
            foreach ($stores as $store) {
                // 每天每個門市產生2-8筆庫存變動
                $dailyTransactions = rand(2, 8);
                
                for ($i = 0; $i < $dailyTransactions; $i++) {
                    $variant = $productVariants->random();
                    $inventory = Inventory::firstOrCreate(
                        [
                            'product_variant_id' => $variant->id,
                            'store_id' => $store->id,
                        ],
                        [
                            'quantity' => rand(50, 200),
                            'low_stock_threshold' => rand(10, 30),
                        ]
                    );
                    
                    // 生成不同類型的交易
                    $transactionType = $this->getRandomTransactionType($currentDate);
                    $quantity = $this->getTransactionQuantity($transactionType, $inventory);
                    
                    if ($quantity === 0) continue;
                    
                    $beforeQuantity = $inventory->quantity;
                    $afterQuantity = max(0, $beforeQuantity + $quantity);
                    
                    InventoryTransaction::create([
                        'inventory_id' => $inventory->id,
                        'user_id' => $users->random()->id,
                        'type' => $transactionType,
                        'quantity' => $quantity,
                        'before_quantity' => $beforeQuantity,
                        'after_quantity' => $afterQuantity,
                        'notes' => $this->getTransactionNotes($transactionType, $currentDate),
                        'metadata' => $this->getTransactionMetadata($transactionType),
                        'created_at' => $currentDate->copy()->addHours(rand(8, 20))->addMinutes(rand(0, 59)),
                    ]);
                    
                    // 更新庫存數量
                    $inventory->update(['quantity' => $afterQuantity]);
                    $transactionCount++;
                }
            }
            
            $currentDate->addDay();
        }
        
        echo "建立了 {$transactionCount} 筆歷史庫存交易記錄\n";
    }
    
    /**
     * 生成歷史訂單趨勢
     */
    private function generateHistoricalOrderTrends($stores, $productVariants, $users, $startDate, $endDate): void
    {
        echo "建立歷史訂單趨勢數據...\n";
        
        $orderCount = 0;
        $currentDate = $startDate->copy();
        
        while ($currentDate <= $endDate) {
            // 模擬週末訂單量較高的趨勢
            $isWeekend = in_array($currentDate->dayOfWeek, [0, 6]);
            $baseOrderCount = $isWeekend ? rand(3, 8) : rand(1, 5);
            
            // 模擬月底訂單量增加
            if ($currentDate->day >= 25) {
                $baseOrderCount += rand(1, 3);
            }
            
            for ($i = 0; $i < $baseOrderCount; $i++) {
                // 建立歷史訂單（簡化版）
                $order = Order::create([
                    'order_number' => $this->generateHistoricalOrderNumber($currentDate, $i),
                    'customer_id' => 1, // 使用預設客戶
                    'creator_user_id' => $users->random()->id,
                    'shipping_status' => 'delivered',
                    'payment_status' => 'paid',
                    'subtotal' => 0,
                    'shipping_fee' => rand(0, 200) * 100,
                    'tax' => 0,
                    'discount_amount' => rand(0, 100) * 100,
                    'grand_total' => 0,
                    'paid_amount' => 0,
                    'payment_method' => ['cash', 'credit_card', 'bank_transfer'][array_rand(['cash', 'credit_card', 'bank_transfer'])],
                    'order_source' => ['online', 'store'][array_rand(['online', 'store'])],
                    'is_tax_inclusive' => (bool)rand(0, 1),
                    'tax_rate' => [0, 5, 5, 5][array_rand([0, 5, 5, 5])], // 多數是5%
                    'created_at' => $currentDate->copy()->addHours(rand(9, 21)),
                    'updated_at' => $currentDate->copy()->addHours(rand(9, 21)),
                ]);
                
                // 加入訂單項目
                $itemCount = rand(1, 4);
                $subtotal = 0;
                
                for ($j = 0; $j < $itemCount; $j++) {
                    $variant = $productVariants->random();
                    $quantity = rand(1, 3);
                    $price = $variant->price;
                    
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_variant_id' => $variant->id,
                        'is_stocked_sale' => true,
                        'is_backorder' => false,
                        'product_name' => $variant->product->name,
                        'sku' => $variant->sku,
                        'price' => $price,
                        'cost' => $variant->cost_price ?: ($price * 0.6),
                        'quantity' => $quantity,
                        'fulfilled_quantity' => $quantity,
                        'is_fulfilled' => true,
                        'fulfilled_at' => $currentDate->copy()->addDays(rand(1, 3)),
                    ]);
                    
                    $subtotal += $price * $quantity;
                }
                
                // 更新訂單總額
                $tax = $order->is_tax_inclusive 
                    ? round($subtotal - ($subtotal / (1 + $order->tax_rate / 100)))
                    : round($subtotal * $order->tax_rate / 100);
                    
                $grandTotal = $order->is_tax_inclusive 
                    ? $subtotal + $order->shipping_fee - $order->discount_amount
                    : $subtotal + $tax + $order->shipping_fee - $order->discount_amount;
                
                $order->update([
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'grand_total' => $grandTotal,
                    'paid_amount' => $grandTotal,
                ]);
                
                $orderCount++;
            }
            
            $currentDate->addDay();
        }
        
        echo "建立了 {$orderCount} 筆歷史訂單\n";
    }
    
    /**
     * 生成季節性銷售模式
     */
    private function generateSeasonalSalesPatterns($stores, $productVariants, $startDate, $endDate): void
    {
        echo "建立季節性銷售模式數據...\n";
        
        $saleCount = 0;
        $currentDate = $startDate->copy();
        
        // 定義季節性商品
        $seasonalProducts = [
            'summer' => ['T恤', '短褲', '涼鞋'],
            'winter' => ['外套', '長褲', '毛衣'],
            'all_season' => ['手機', '筆電', '配件'],
        ];
        
        while ($currentDate <= $endDate) {
            $month = $currentDate->month;
            $season = $this->getSeason($month);
            
            foreach ($stores as $store) {
                // 根據季節調整銷售量
                $baseSales = $season === 'summer' && in_array($month, [6, 7, 8]) ? rand(3, 8) : rand(1, 5);
                $baseSales = $season === 'winter' && in_array($month, [12, 1, 2]) ? rand(3, 8) : $baseSales;
                
                for ($i = 0; $i < $baseSales; $i++) {
                    // 選擇適合季節的商品
                    $variant = $this->selectSeasonalProduct($productVariants, $season);
                    
                    if (!$variant) continue;
                    
                    // 建立簡化的銷售記錄
                    $sale = Sale::create([
                        'store_id' => $store->id,
                        'transaction_number' => $this->generateHistoricalTransactionNumber($store, $currentDate, $i),
                        'total_amount' => 0,
                        'sold_at' => $currentDate->copy()->addHours(rand(10, 20)),
                        'payment_method' => ['cash', 'credit_card'][array_rand(['cash', 'credit_card'])],
                        'created_at' => $currentDate,
                    ]);
                    
                    // 季節性商品可能買更多
                    $quantity = $this->isSeasonalProduct($variant, $season) ? rand(2, 5) : rand(1, 2);
                    
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $variant->product_id,
                        'quantity' => $quantity,
                        'unit_price' => $variant->price,
                    ]);
                    
                    $sale->update(['total_amount' => $variant->price * $quantity]);
                    $saleCount++;
                }
            }
            
            $currentDate->addDay();
        }
        
        echo "建立了 {$saleCount} 筆季節性銷售記錄\n";
    }
    
    /**
     * 獲取隨機交易類型
     */
    private function getRandomTransactionType($date): string
    {
        // 週一到週五較多進貨和調整
        $isWeekday = !in_array($date->dayOfWeek, [0, 6]);
        
        if ($isWeekday) {
            $types = [
                InventoryTransaction::TYPE_ADDITION,
                InventoryTransaction::TYPE_REDUCTION,
                InventoryTransaction::TYPE_ADJUSTMENT,
                InventoryTransaction::TYPE_TRANSFER_IN,
                InventoryTransaction::TYPE_TRANSFER_OUT,
            ];
        } else {
            // 週末主要是銷售造成的減少
            $types = [
                InventoryTransaction::TYPE_REDUCTION,
                InventoryTransaction::TYPE_REDUCTION,
                InventoryTransaction::TYPE_ADJUSTMENT,
            ];
        }
        
        return $types[array_rand($types)];
    }
    
    /**
     * 獲取交易數量
     */
    private function getTransactionQuantity(string $type, $inventory): int
    {
        switch ($type) {
            case InventoryTransaction::TYPE_ADDITION:
                return rand(20, 100);
                
            case InventoryTransaction::TYPE_REDUCTION:
                return -min(rand(1, 20), $inventory->quantity);
                
            case InventoryTransaction::TYPE_ADJUSTMENT:
                return rand(-10, 10);
                
            case InventoryTransaction::TYPE_TRANSFER_IN:
                return rand(5, 30);
                
            case InventoryTransaction::TYPE_TRANSFER_OUT:
                return -min(rand(5, 30), $inventory->quantity);
                
            default:
                return 0;
        }
    }
    
    /**
     * 獲取交易備註
     */
    private function getTransactionNotes(string $type, $date): string
    {
        $notes = [
            InventoryTransaction::TYPE_ADDITION => '定期進貨補充',
            InventoryTransaction::TYPE_REDUCTION => '正常銷售出貨',
            InventoryTransaction::TYPE_ADJUSTMENT => '月度盤點調整',
            InventoryTransaction::TYPE_TRANSFER_IN => '從其他門市調入',
            InventoryTransaction::TYPE_TRANSFER_OUT => '調撥至其他門市',
        ];
        
        return $notes[$type] . ' - ' . $date->format('Y-m-d');
    }
    
    /**
     * 獲取交易元數據
     */
    private function getTransactionMetadata(string $type): array
    {
        return [
            'source' => 'historical_seeder',
            'type' => $type,
            'generated_at' => now()->toDateTimeString(),
        ];
    }
    
    /**
     * 生成歷史訂單編號
     */
    private function generateHistoricalOrderNumber($date, int $sequence): string
    {
        return 'HIST-' . $date->format('Ymd') . '-' . str_pad($sequence + 1, 4, '0', STR_PAD_LEFT);
    }
    
    /**
     * 生成歷史交易單號
     */
    private function generateHistoricalTransactionNumber($store, $date, int $sequence): string
    {
        $storeCode = str_pad($store->id, 3, '0', STR_PAD_LEFT);
        return "HIST-S{$storeCode}-" . $date->format('Ymd') . '-' . str_pad($sequence + 1, 3, '0', STR_PAD_LEFT);
    }
    
    /**
     * 獲取季節
     */
    private function getSeason(int $month): string
    {
        if (in_array($month, [3, 4, 5])) return 'spring';
        if (in_array($month, [6, 7, 8])) return 'summer';
        if (in_array($month, [9, 10, 11])) return 'autumn';
        return 'winter';
    }
    
    /**
     * 選擇季節性商品
     */
    private function selectSeasonalProduct($productVariants, string $season)
    {
        // 簡化版：隨機選擇
        return $productVariants->random();
    }
    
    /**
     * 判斷是否為季節性商品
     */
    private function isSeasonalProduct($variant, string $season): bool
    {
        $productName = $variant->product->name;
        
        $summerProducts = ['T恤', '短褲'];
        $winterProducts = ['外套', '毛衣'];
        
        if ($season === 'summer') {
            foreach ($summerProducts as $keyword) {
                if (str_contains($productName, $keyword)) return true;
            }
        }
        
        if ($season === 'winter') {
            foreach ($winterProducts as $keyword) {
                if (str_contains($productName, $keyword)) return true;
            }
        }
        
        return false;
    }
}