<?php

namespace Database\Seeders;

use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use App\Models\InventoryTransaction;
use Illuminate\Database\Seeder;

class LowStockScenarioSeeder extends Seeder
{
    /**
     * 運行低庫存場景播種器
     * 專門創建各種庫存預警場景的測試資料
     */
    public function run(): void
    {
        $stores = Store::all();
        $variants = ProductVariant::with('product')->get();
        $user = User::first();

        if ($stores->isEmpty() || $variants->isEmpty() || !$user) {
            echo "警告：需要門市、商品變體和用戶資料才能建立低庫存場景\n";
            return;
        }

        $scenarios = [
            'critical_low_stock' => 10,      // 極低庫存（0-2件）
            'low_stock_warning' => 15,       // 低庫存警告（3-5件）
            'approaching_low' => 20,         // 接近低庫存（6-10件）
            'healthy_stock' => 30,           // 健康庫存（50+件）
            'zero_stock' => 25,              // 零庫存
        ];

        $totalCreated = 0;
        $alertsCreated = 0;

        foreach ($scenarios as $scenarioType => $count) {
            for ($i = 0; $i < $count; $i++) {
                $store = $stores->random();
                $variant = $variants->random();
                
                // 檢查是否已存在庫存記錄
                $existingInventory = Inventory::where('store_id', $store->id)
                    ->where('product_variant_id', $variant->id)
                    ->first();

                if ($existingInventory) {
                    // 更新現有庫存以符合場景
                    $this->updateInventoryForScenario($existingInventory, $scenarioType, $user);
                } else {
                    // 創建新庫存記錄
                    $inventory = $this->createInventoryForScenario($store, $variant, $scenarioType, $user);
                    $totalCreated++;
                }

                if (in_array($scenarioType, ['critical_low_stock', 'low_stock_warning', 'zero_stock'])) {
                    $alertsCreated++;
                }
            }
        }

        // 創建一些有歷史銷售記錄的低庫存商品（用於計算銷售速度）
        $this->createLowStockWithSalesHistory($stores, $variants, $user);

        echo "建立了 {$totalCreated} 個新庫存記錄，{$alertsCreated} 個預警場景\n";
    }

    /**
     * 為特定場景創建庫存記錄
     */
    private function createInventoryForScenario(Store $store, ProductVariant $variant, string $scenarioType, User $user): Inventory
    {
        $config = $this->getScenarioConfig($scenarioType);
        
        $inventory = Inventory::create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
            'quantity' => $config['quantity'],
            'low_stock_threshold' => $config['threshold'],
        ]);

        // 為某些場景添加歷史交易記錄
        if ($config['add_history']) {
            $this->addInventoryHistory($inventory, $user, $scenarioType);
        }

        return $inventory;
    }

    /**
     * 更新現有庫存以符合場景
     */
    private function updateInventoryForScenario(Inventory $inventory, string $scenarioType, User $user): void
    {
        $config = $this->getScenarioConfig($scenarioType);
        
        $originalQuantity = $inventory->quantity;
        $inventory->update([
            'quantity' => $config['quantity'],
            'low_stock_threshold' => $config['threshold'],
        ]);

        // 記錄庫存調整交易
        if ($originalQuantity !== $config['quantity']) {
            InventoryTransaction::create([
                'inventory_id' => $inventory->id,
                'user_id' => $user->id,
                'type' => InventoryTransaction::TYPE_ADJUSTMENT,
                'quantity' => $config['quantity'] - $originalQuantity,
                'before_quantity' => $originalQuantity,
                'after_quantity' => $config['quantity'],
                'notes' => "測試場景調整 - {$scenarioType}",
                'metadata' => ['scenario' => $scenarioType, 'test_data' => true],
            ]);
        }
    }

    /**
     * 獲取場景配置
     */
    private function getScenarioConfig(string $scenarioType): array
    {
        switch ($scenarioType) {
            case 'critical_low_stock':
                return [
                    'quantity' => rand(0, 2),
                    'threshold' => rand(8, 15),
                    'add_history' => true,
                ];
            
            case 'low_stock_warning':
                return [
                    'quantity' => rand(3, 5),
                    'threshold' => rand(8, 12),
                    'add_history' => true,
                ];
            
            case 'approaching_low':
                return [
                    'quantity' => rand(6, 10),
                    'threshold' => rand(10, 15),
                    'add_history' => false,
                ];
            
            case 'healthy_stock':
                return [
                    'quantity' => rand(50, 200),
                    'threshold' => rand(10, 20),
                    'add_history' => false,
                ];
            
            case 'zero_stock':
                return [
                    'quantity' => 0,
                    'threshold' => rand(5, 10),
                    'add_history' => true,
                ];
            
            default:
                return [
                    'quantity' => rand(10, 50),
                    'threshold' => 10,
                    'add_history' => false,
                ];
        }
    }

    /**
     * 添加庫存歷史記錄
     */
    private function addInventoryHistory(Inventory $inventory, User $user, string $scenarioType): void
    {
        $transactionCount = rand(5, 15);
        $currentQuantity = $inventory->quantity;
        
        // 倒序生成歷史記錄（從過去到現在）
        for ($i = $transactionCount; $i >= 1; $i--) {
            $daysAgo = $i * rand(1, 3);
            $createdAt = now()->subDays($daysAgo)->subHours(rand(0, 23));
            
            // 決定交易類型和數量
            $transactionType = $this->getRandomTransactionType($scenarioType);
            $quantity = $this->getTransactionQuantity($transactionType, $currentQuantity);
            
            $beforeQuantity = $currentQuantity;
            $currentQuantity += $quantity;
            
            // 確保庫存不會變成負數
            if ($currentQuantity < 0) {
                $quantity = -$beforeQuantity;
                $currentQuantity = 0;
            }
            
            if ($quantity !== 0) {
                InventoryTransaction::create([
                    'inventory_id' => $inventory->id,
                    'user_id' => $user->id,
                    'type' => $transactionType,
                    'quantity' => $quantity,
                    'before_quantity' => $beforeQuantity,
                    'after_quantity' => $currentQuantity,
                    'notes' => $this->getTransactionNotes($transactionType),
                    'metadata' => $this->getTransactionMetadata($transactionType),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }
    }

    /**
     * 獲取隨機交易類型
     */
    private function getRandomTransactionType(string $scenarioType): string
    {
        // 根據場景調整交易類型的機率
        switch ($scenarioType) {
            case 'critical_low_stock':
            case 'zero_stock':
                // 低庫存場景更多出貨記錄
                $types = [
                    InventoryTransaction::TYPE_REDUCTION => 60,
                    InventoryTransaction::TYPE_ADDITION => 30,
                    InventoryTransaction::TYPE_ADJUSTMENT => 10,
                ];
                break;
            
            case 'low_stock_warning':
                $types = [
                    InventoryTransaction::TYPE_REDUCTION => 50,
                    InventoryTransaction::TYPE_ADDITION => 35,
                    InventoryTransaction::TYPE_ADJUSTMENT => 15,
                ];
                break;
            
            default:
                $types = [
                    InventoryTransaction::TYPE_ADDITION => 40,
                    InventoryTransaction::TYPE_REDUCTION => 40,
                    InventoryTransaction::TYPE_ADJUSTMENT => 20,
                ];
                break;
        }
        
        return $this->getWeightedRandomChoice($types);
    }

    /**
     * 獲取交易數量
     */
    private function getTransactionQuantity(string $type, int $currentQuantity): int
    {
        switch ($type) {
            case InventoryTransaction::TYPE_ADDITION:
                return rand(5, 30);
            
            case InventoryTransaction::TYPE_REDUCTION:
                $maxReduction = min($currentQuantity, 20);
                return $maxReduction > 0 ? -rand(1, $maxReduction) : 0;
            
            case InventoryTransaction::TYPE_ADJUSTMENT:
                return rand(-10, 10);
            
            default:
                return 0;
        }
    }

    /**
     * 獲取交易備註
     */
    private function getTransactionNotes(string $type): string
    {
        $notes = [
            InventoryTransaction::TYPE_ADDITION => [
                '供應商補貨',
                '門市間調貨',
                '退貨入庫',
                '進貨入庫',
                '盤點調增',
            ],
            InventoryTransaction::TYPE_REDUCTION => [
                '客戶購買',
                '門市銷售',
                '線上訂單出貨',
                '商品損壞',
                '展示樣品使用',
                '促銷活動',
            ],
            InventoryTransaction::TYPE_ADJUSTMENT => [
                '庫存盤點調整',
                '系統錯誤修正',
                '人工調整',
                '期初庫存設定',
            ],
        ];
        
        $typeNotes = $notes[$type] ?? ['庫存異動'];
        return $typeNotes[array_rand($typeNotes)];
    }

    /**
     * 獲取交易元數據
     */
    private function getTransactionMetadata(string $type): array
    {
        $metadata = ['test_scenario' => true];
        
        switch ($type) {
            case InventoryTransaction::TYPE_ADDITION:
                $metadata['source'] = ['supplier', 'transfer', 'return'][array_rand(['supplier', 'transfer', 'return'])];
                break;
                
            case InventoryTransaction::TYPE_REDUCTION:
                $metadata['reason'] = ['sale', 'damage', 'transfer', 'promotion'][array_rand(['sale', 'damage', 'transfer', 'promotion'])];
                break;
                
            case InventoryTransaction::TYPE_ADJUSTMENT:
                $metadata['adjustment_reason'] = ['inventory_check', 'system_error', 'manual'][array_rand(['inventory_check', 'system_error', 'manual'])];
                break;
        }
        
        return $metadata;
    }

    /**
     * 創建有銷售歷史的低庫存商品
     */
    private function createLowStockWithSalesHistory($stores, $variants, $user): void
    {
        $highSalesVariants = $variants->random(8); // 選8個商品模擬熱銷商品
        
        foreach ($highSalesVariants as $variant) {
            $store = $stores->random();
            
            $inventory = Inventory::firstOrCreate(
                [
                    'store_id' => $store->id,
                    'product_variant_id' => $variant->id,
                ],
                [
                    'quantity' => rand(1, 5), // 低庫存
                    'low_stock_threshold' => rand(10, 20),
                ]
            );
            
            // 創建頻繁的銷售記錄
            $this->createFrequentSalesHistory($inventory, $user);
        }
    }

    /**
     * 創建頻繁的銷售歷史
     */
    private function createFrequentSalesHistory(Inventory $inventory, User $user): void
    {
        $currentQuantity = $inventory->quantity;
        
        // 過去30天內的頻繁銷售
        for ($day = 30; $day >= 1; $day--) {
            // 平均每天1-3筆銷售
            $salesPerDay = rand(1, 3);
            
            for ($sale = 0; $sale < $salesPerDay; $sale++) {
                $createdAt = now()->subDays($day)->addHours(rand(9, 21)); // 營業時間
                $saleQuantity = rand(1, 5);
                
                $beforeQuantity = $currentQuantity;
                $currentQuantity += $saleQuantity; // 反向模擬（因為我們是倒序建立記錄）
                
                InventoryTransaction::create([
                    'inventory_id' => $inventory->id,
                    'user_id' => $user->id,
                    'type' => InventoryTransaction::TYPE_REDUCTION,
                    'quantity' => -$saleQuantity,
                    'before_quantity' => $currentQuantity,
                    'after_quantity' => $beforeQuantity,
                    'notes' => '客戶購買 - 熱銷商品',
                    'metadata' => [
                        'sale_channel' => ['store', 'online', 'phone'][array_rand(['store', 'online', 'phone'])],
                        'high_velocity' => true,
                        'test_scenario' => true,
                    ],
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }
    }

    /**
     * 根據權重獲取隨機選擇
     */
    private function getWeightedRandomChoice(array $weights): string
    {
        $random = rand(1, 100);
        $cumulative = 0;
        
        foreach ($weights as $choice => $weight) {
            $cumulative += $weight;
            if ($random <= $cumulative) {
                return $choice;
            }
        }
        
        return array_key_first($weights);
    }
}