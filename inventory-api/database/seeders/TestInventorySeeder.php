<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Product;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransaction;
use App\Models\Purchase;
use App\Models\PurchaseItem;

class TestInventorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 建立分類
        $categories = $this->createCategories();
        
        // 建立屬性和屬性值
        $attributes = $this->createAttributes();
        
        // 建立商品和變體
        $products = $this->createProducts($categories, $attributes);
        
        // 建立庫存資料
        $this->createInventory($products);
        
        // 建立庫存變動記錄（包括轉移記錄）
        $this->createInventoryTransactions($products);
        
        // 建立進貨單資料
        $this->createPurchases($products);
        
        echo "測試資料建立完成！\n";
    }
    
    /**
     * 建立分類
     */
    private function createCategories(): array
    {
        // 頂層分類
        $electronics = Category::firstOrCreate(
            ['name' => '電子產品'],
            ['description' => '各類電子產品和配件']
        );
        
        $clothing = Category::firstOrCreate(
            ['name' => '服飾配件'],
            ['description' => '各類服裝和配件']
        );
        
        $office = Category::firstOrCreate(
            ['name' => '辦公用品'],
            ['description' => '辦公室必備用品']
        );
        
        $buttCategory = Category::firstOrCreate(
            ['name' => '屁股'],
            ['description' => '屁股相關產品']
        );
        
        // 子分類
        $phones = Category::firstOrCreate(
            ['name' => '手機', 'parent_id' => $electronics->id],
            ['description' => '智慧型手機和配件']
        );
        
        $laptops = Category::firstOrCreate(
            ['name' => '筆記型電腦', 'parent_id' => $electronics->id],
            ['description' => '各品牌筆電']
        );
        
        $tshirts = Category::firstOrCreate(
            ['name' => 'T恤', 'parent_id' => $clothing->id],
            ['description' => '各式T恤']
        );
        
        $pants = Category::firstOrCreate(
            ['name' => '褲子', 'parent_id' => $clothing->id],
            ['description' => '各式褲子']
        );
        
        $chairs = Category::firstOrCreate(
            ['name' => '辦公椅', 'parent_id' => $office->id],
            ['description' => '人體工學辦公椅']
        );
        
        echo "建立了 9 個分類\n";
        
        return compact('electronics', 'clothing', 'office', 'buttCategory', 
                      'phones', 'laptops', 'tshirts', 'pants', 'chairs');
    }
    
    /**
     * 建立屬性和屬性值
     */
    private function createAttributes(): array
    {
        // 顏色屬性
        $color = Attribute::firstOrCreate(['name' => '顏色']);
        $colorValues = [];
        foreach (['黑色', '白色', '銀色', '金色', '藍色', '紅色', '綠色'] as $colorName) {
            $colorValues[$colorName] = AttributeValue::firstOrCreate([
                'attribute_id' => $color->id,
                'value' => $colorName
            ]);
        }
        
        // 尺寸屬性
        $size = Attribute::firstOrCreate(['name' => '尺寸']);
        $sizeValues = [];
        foreach (['XS', 'S', 'M', 'L', 'XL', 'XXL'] as $sizeName) {
            $sizeValues[$sizeName] = AttributeValue::firstOrCreate([
                'attribute_id' => $size->id,
                'value' => $sizeName
            ]);
        }

        // 容量屬性（用於電子產品）
        $capacity = Attribute::firstOrCreate(['name' => '容量']);
        $capacityValues = [];
        foreach (['64GB', '128GB', '256GB', '512GB', '1TB'] as $capacityName) {
            $capacityValues[$capacityName] = AttributeValue::firstOrCreate([
                'attribute_id' => $capacity->id,
                'value' => $capacityName
            ]);
        }
        
        // 材質屬性
        $material = Attribute::firstOrCreate(['name' => '材質']);
        $materialValues = [];
        foreach (['棉', '聚酯纖維', '羊毛', '皮革', '網布', '塑膠'] as $materialName) {
            $materialValues[$materialName] = AttributeValue::firstOrCreate([
                'attribute_id' => $material->id,
                'value' => $materialName
            ]);
        }
        
        echo "建立了 4 個屬性和 24 個屬性值\n";
        
        return compact('color', 'colorValues', 'size', 'sizeValues', 
                      'capacity', 'capacityValues', 'material', 'materialValues');
        }

    /**
     * 建立商品和變體
     */
    private function createProducts($categories, $attributes): array
    {
        $products = [];
        
        // iPhone 15 Pro
        $iphone = Product::firstOrCreate(
            [
                'name' => 'iPhone 15 Pro',
                'category_id' => $categories['phones']->id
            ],
            [
                'description' => '最新款 iPhone，搭載 A17 Pro 晶片'
            ]
        );
        $iphone->attributes()->syncWithoutDetaching([$attributes['color']->id, $attributes['capacity']->id]);
        
        // 建立 iPhone 變體
        foreach (['黑色', '白色', '金色'] as $colorName) {
            foreach (['128GB', '256GB', '512GB'] as $capacityName) {
                $variant = ProductVariant::create([
                    'product_id' => $iphone->id,
                    'sku' => "IPHONE-15-PRO-{$colorName}-{$capacityName}",
                    'price' => $capacityName === '128GB' ? 3290000 : ($capacityName === '256GB' ? 3640000 : 4340000), // 以分為單位
                    'cost_price' => $capacityName === '128GB' ? 2000000 : ($capacityName === '256GB' ? 2300000 : 2800000), // 以分為單位
                ]);
                $variant->attributeValues()->attach([
                    $attributes['colorValues'][$colorName]->id,
                    $attributes['capacityValues'][$capacityName]->id
                ]);
            }
        }
        $products[] = $iphone;
        
        // MacBook Pro
        $macbook = Product::firstOrCreate(
            [
                'name' => 'MacBook Pro 14"',
                'category_id' => $categories['laptops']->id
            ],
            [
                'description' => 'M3 晶片的專業級筆電'
            ]
        );
        $macbook->attributes()->syncWithoutDetaching([$attributes['color']->id, $attributes['capacity']->id]);

        // 建立 MacBook 變體
        foreach (['銀色', '太空灰'] as $colorName) {
            foreach (['512GB', '1TB'] as $capacityName) {
                $variant = ProductVariant::create([
                    'product_id' => $macbook->id,
                    'sku' => "MACBOOK-PRO-14-{$colorName}-{$capacityName}",
                    'price' => $capacityName === '512GB' ? 6490000 : 7790000, // 以分為單位
                    'cost_price' => $capacityName === '512GB' ? 4500000 : 5500000, // 以分為單位
                ]);
                if ($colorName === '太空灰') {
                    $colorName = '黑色'; // 使用已存在的顏色值
                }
                $variant->attributeValues()->attach([
                    $attributes['colorValues'][$colorName]->id,
                    $attributes['capacityValues'][$capacityName]->id
                ]);
            }
        }
        $products[] = $macbook;

        // 基本款 T恤
        $tshirt = Product::firstOrCreate(
            [
                'name' => '純棉圓領T恤',
                'category_id' => $categories['tshirts']->id
            ],
            [
                'description' => '100% 純棉，舒適透氣'
            ]
        );
        $tshirt->attributes()->syncWithoutDetaching([$attributes['color']->id, $attributes['size']->id, $attributes['material']->id]);
        
        // 建立 T恤變體
        foreach (['黑色', '白色', '藍色', '紅色'] as $colorName) {
            foreach (['S', 'M', 'L', 'XL'] as $sizeName) {
                $variant = ProductVariant::create([
                    'product_id' => $tshirt->id,
                    'sku' => "TSHIRT-BASIC-{$colorName}-{$sizeName}",
                    'price' => 29900, // 以分為單位
                    'cost_price' => 15000, // 以分為單位
                ]);
                $variant->attributeValues()->attach([
                    $attributes['colorValues'][$colorName]->id,
                    $attributes['sizeValues'][$sizeName]->id,
                    $attributes['materialValues']['棉']->id
                ]);
            }
        }
        $products[] = $tshirt;
        
        // 牛仔褲
        $jeans = Product::firstOrCreate(
            [
                'name' => '經典直筒牛仔褲',
                'category_id' => $categories['pants']->id
            ],
            [
                'description' => '經典版型，百搭款式'
            ]
        );
        $jeans->attributes()->syncWithoutDetaching([$attributes['color']->id, $attributes['size']->id]);
        
        // 建立牛仔褲變體
        foreach (['藍色', '黑色'] as $colorName) {
            foreach (['28', '30', '32', '34', '36'] as $waistSize) {
                $sizeMap = ['28' => 'XS', '30' => 'S', '32' => 'M', '34' => 'L', '36' => 'XL'];
                $variant = ProductVariant::create([
                    'product_id' => $jeans->id,
                    'sku' => "JEANS-CLASSIC-{$colorName}-W{$waistSize}",
                    'price' => 129000, // 以分為單位
                    'cost_price' => 60000, // 以分為單位
                ]);
                $variant->attributeValues()->attach([
                    $attributes['colorValues'][$colorName]->id,
                    $attributes['sizeValues'][$sizeMap[$waistSize]]->id
                ]);
            }
        }
        $products[] = $jeans;

        // 人體工學椅
        $chair = Product::firstOrCreate(
            [
                'name' => '人體工學辦公椅',
                'category_id' => $categories['chairs']->id
            ],
            [
                'description' => '符合人體工學設計，久坐不累'
            ]
        );
        $chair->attributes()->syncWithoutDetaching([$attributes['color']->id, $attributes['material']->id]);
        
        // 建立辦公椅變體
        foreach (['黑色', '灰色'] as $colorName) {
            $colorMap = ['灰色' => '銀色']; // 映射到已存在的顏色
            $actualColor = $colorMap[$colorName] ?? $colorName;
            
            $variant = ProductVariant::create([
                'product_id' => $chair->id,
                'sku' => "CHAIR-ERGO-{$colorName}",
                'price' => 890000, // 以分為單位
                'cost_price' => 450000, // 以分為單位
            ]);
            $variant->attributeValues()->attach([
                $attributes['colorValues'][$actualColor]->id,
                $attributes['materialValues']['網布']->id
            ]);
        }
        $products[] = $chair;
        
        // 屁股相關產品 - 坐墊
        $cushion = Product::firstOrCreate(
            [
                'name' => '記憶棉坐墊',
                'category_id' => $categories['buttCategory']->id
            ],
            [
                'description' => '舒適記憶棉材質，保護您的屁股'
            ]
        );
        $cushion->attributes()->syncWithoutDetaching([$attributes['color']->id]);
        
        // 建立坐墊變體
        foreach (['黑色', '藍色'] as $colorName) {
            $variant = ProductVariant::create([
                'product_id' => $cushion->id,
                'sku' => "CUSHION-MEMORY-{$colorName}",
                'price' => 79000, // 以分為單位
                'cost_price' => 35000, // 以分為單位
            ]);
            $variant->attributeValues()->attach([
                $attributes['colorValues'][$colorName]->id
            ]);
        }
        $products[] = $cushion;
        
        echo "建立了 6 個商品和 " . ProductVariant::count() . " 個商品變體\n";
        
        return $products;
    }
    
    /**
     * 建立庫存資料
     */
    private function createInventory($products): void
    {
        $stores = Store::all();
        if ($stores->isEmpty()) {
            echo "警告：沒有找到門市，跳過庫存建立\n";
            return;
        }
        
        $inventoryCount = 0;
        
        foreach ($products as $product) {
            foreach ($product->variants as $variant) {
                foreach ($stores as $store) {
                    // 🎯 所有產品變體在所有門市都必須有庫存記錄（符合系統設計原則）
                    $quantity = rand(0, 100);
                    // 30% 機率庫存為 0，模擬缺貨情況
                    if (rand(0, 100) < 30) {
                        $quantity = 0;
                    }
                    
                    Inventory::create([
                        'product_variant_id' => $variant->id,
                        'store_id' => $store->id,
                        'quantity' => $quantity,
                        'low_stock_threshold' => rand(5, 20),
                    ]);
                    $inventoryCount++;
                }
            }
        }
        
        echo "建立了 {$inventoryCount} 筆庫存記錄\n";
    }
    
    /**
     * 建立庫存變動記錄（包括轉移記錄）
     */
    private function createInventoryTransactions($products): void
    {
        $stores = Store::all();
        $user = User::first();
        
        if ($stores->count() < 2 || !$user) {
            echo "警告：需要至少2個門市和1個用戶才能建立庫存變動記錄\n";
            return;
        }
        
        // 1. 建立庫存轉移記錄
        $this->createInventoryTransfers($stores, $user, $products);
        
        // 2. 建立其他類型的庫存變動記錄
        $this->createOtherInventoryTransactions($stores, $user, $products);
    }
    
    /**
     * 建立庫存轉移記錄
     */
    private function createInventoryTransfers($stores, $user, $products): void
    {
        $transferCount = 0;
        $transactionCount = 0;
        
        // 獲取一些有庫存的變體
        $variants = ProductVariant::whereHas('inventory', function($q) {
            $q->where('quantity', '>', 10);
        })->limit(5)->get();
        
        foreach ($variants as $variant) {
            // 隨機選擇來源和目標門市
            $fromStore = $stores->random();
            $toStore = $stores->where('id', '!=', $fromStore->id)->random();
            
            // 確保來源門市有足夠庫存
            $fromInventory = Inventory::firstOrCreate(
                ['product_variant_id' => $variant->id, 'store_id' => $fromStore->id],
                ['quantity' => 50, 'low_stock_threshold' => 5]
            );
            
            $toInventory = Inventory::firstOrCreate(
                ['product_variant_id' => $variant->id, 'store_id' => $toStore->id],
                ['quantity' => 20, 'low_stock_threshold' => 5]
            );
            
            // 確保有足夠庫存
            if ($fromInventory->quantity < 10) {
                $fromInventory->update(['quantity' => 50]);
            }
            
            $quantity = rand(3, 8);
            
            // 確保前面幾個轉移記錄是已完成狀態，後面的隨機
            if ($transferCount < 2) {
                $status = InventoryTransfer::STATUS_COMPLETED;
            } else {
                $statuses = [
                    InventoryTransfer::STATUS_COMPLETED,
                    InventoryTransfer::STATUS_IN_TRANSIT,
                    InventoryTransfer::STATUS_PENDING,
                    InventoryTransfer::STATUS_CANCELLED
                ];
                $status = $statuses[array_rand($statuses)];
            }
            
            // 創建時間（過去7天內的隨機時間）
            $createdAt = now()->subDays(rand(0, 7))->subHours(rand(0, 23));
            
            // 建立轉移記錄
            $transfer = InventoryTransfer::create([
                'from_store_id' => $fromStore->id,
                'to_store_id' => $toStore->id,
                'user_id' => $user->id,
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
                'status' => $status,
                'notes' => $this->getTransferNotes($status),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            
            $transferCount++;
            
            // 對於已完成的轉移，執行實際的庫存操作
            if ($status === InventoryTransfer::STATUS_COMPLETED) {
                $transferMetadata = [
                    'transfer_id' => "transfer_seed_" . $transfer->id,
                    'from_store_id' => $fromStore->id,
                    'from_store_name' => $fromStore->name,
                    'to_store_id' => $toStore->id,
                    'to_store_name' => $toStore->name
                ];
                
                // 執行庫存轉移
                $fromInventory->reduceStock(
                    $quantity, 
                    $user->id, 
                    "轉移到{$toStore->name}",
                    $transferMetadata
                );
                
                $toInventory->addStock(
                    $quantity, 
                    $user->id, 
                    "從{$fromStore->name}轉入",
                    $transferMetadata
                );
                
                // 更新交易記錄類型
                $fromTransaction = $fromInventory->transactions()->latest()->first();
                if ($fromTransaction) {
                    $fromTransaction->update([
                        'type' => InventoryTransaction::TYPE_TRANSFER_OUT,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                    $transactionCount++;
                }
                
                $toTransaction = $toInventory->transactions()->latest()->first();
                if ($toTransaction) {
                    $toTransaction->update([
                        'type' => InventoryTransaction::TYPE_TRANSFER_IN,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                    $transactionCount++;
                }
            }
        }
        
        echo "建立了 {$transferCount} 筆庫存轉移記錄，{$transactionCount} 筆轉移交易記錄\n";
    }
    
    /**
     * 建立其他類型的庫存變動記錄
     */
    private function createOtherInventoryTransactions($stores, $user, $products): void
    {
        $transactionCount = 0;
        
        // 獲取一些庫存記錄
        $inventories = Inventory::with(['productVariant.product', 'store'])
            ->where('quantity', '>', 0)
            ->limit(15)
            ->get();
        
        foreach ($inventories as $inventory) {
            // 隨機決定要建立什麼類型的記錄
            $actions = ['addition', 'reduction', 'adjustment'];
            $actionCount = rand(1, 3);
            
            for ($i = 0; $i < $actionCount; $i++) {
                $action = $actions[array_rand($actions)];
                $createdAt = now()->subDays(rand(0, 14))->subHours(rand(0, 23));
                
                switch ($action) {
                    case 'addition':
                        $quantity = rand(5, 20);
                        $beforeQuantity = $inventory->quantity;
                        $inventory->quantity += $quantity;
                        $inventory->save();
                        
                        InventoryTransaction::create([
                            'inventory_id' => $inventory->id,
                            'user_id' => $user->id,
                            'type' => InventoryTransaction::TYPE_ADDITION,
                            'quantity' => $quantity,
                            'before_quantity' => $beforeQuantity,
                            'after_quantity' => $inventory->quantity,
                            'notes' => $this->getAdditionNotes(),
                            'metadata' => ['reason' => 'manual_addition'],
                            'created_at' => $createdAt,
                            'updated_at' => $createdAt,
                        ]);
                        $transactionCount++;
                        break;
                        
                    case 'reduction':
                        $maxReduction = min($inventory->quantity, 15);
                        if ($maxReduction > 0) {
                            $quantity = rand(1, $maxReduction);
                            $beforeQuantity = $inventory->quantity;
                            $inventory->quantity -= $quantity;
                            $inventory->save();
                            
                            InventoryTransaction::create([
                                'inventory_id' => $inventory->id,
                                'user_id' => $user->id,
                                'type' => InventoryTransaction::TYPE_REDUCTION,
                                'quantity' => -$quantity,
                                'before_quantity' => $beforeQuantity,
                                'after_quantity' => $inventory->quantity,
                                'notes' => $this->getReductionNotes(),
                                'metadata' => ['reason' => 'manual_reduction'],
                                'created_at' => $createdAt,
                                'updated_at' => $createdAt,
                            ]);
                            $transactionCount++;
                        }
                        break;
                        
                    case 'adjustment':
                        $beforeQuantity = $inventory->quantity;
                        $adjustment = rand(-10, 10);
                        $newQuantity = max(0, $inventory->quantity + $adjustment);
                        $actualAdjustment = $newQuantity - $inventory->quantity;
                        
                        if ($actualAdjustment != 0) {
                            $inventory->quantity = $newQuantity;
                            $inventory->save();
                            
                            InventoryTransaction::create([
                                'inventory_id' => $inventory->id,
                                'user_id' => $user->id,
                                'type' => InventoryTransaction::TYPE_ADJUSTMENT,
                                'quantity' => $actualAdjustment,
                                'before_quantity' => $beforeQuantity,
                                'after_quantity' => $inventory->quantity,
                                'notes' => $this->getAdjustmentNotes(),
                                'metadata' => ['reason' => 'inventory_check'],
                                'created_at' => $createdAt,
                                'updated_at' => $createdAt,
                            ]);
                            $transactionCount++;
                        }
                        break;
                }
                
                // 避免庫存變成負數
                if ($inventory->quantity < 0) {
                    $inventory->quantity = 0;
                    $inventory->save();
                }
            }
        }
        
        echo "建立了 {$transactionCount} 筆其他庫存變動記錄\n";
    }
    
    /**
     * 獲取轉移記錄的備註
     */
    private function getTransferNotes($status): string
    {
        $notes = [
            InventoryTransfer::STATUS_COMPLETED => [
                '門市間庫存調配',
                '補充熱銷商品庫存',
                '季末庫存調整',
                '新店開幕庫存配送'
            ],
            InventoryTransfer::STATUS_IN_TRANSIT => [
                '運輸中，預計明天到達',
                '物流配送中',
                '快遞已取貨'
            ],
            InventoryTransfer::STATUS_PENDING => [
                '待確認庫存數量',
                '等待門市確認',
                '緊急調配申請'
            ],
            InventoryTransfer::STATUS_CANCELLED => [
                '已取消。原因：商品損壞',
                '已取消。原因：需求變更',
                '已取消。原因：庫存不足'
            ]
        ];
        
        return $notes[$status][array_rand($notes[$status])];
    }
    
    /**
     * 獲取新增庫存的備註
     */
    private function getAdditionNotes(): string
    {
        $notes = [
            '新進貨入庫',
            '供應商送貨',
            '退貨商品重新入庫',
            '盤點發現多出商品',
            '廠商補送貨品'
        ];
        
        return $notes[array_rand($notes)];
    }
    
    /**
     * 獲取減少庫存的備註
     */
    private function getReductionNotes(): string
    {
        $notes = [
            '商品銷售出貨',
            '商品損壞報廢',
            '展示品使用',
            '客戶退貨處理',
            '促銷活動消耗'
        ];
        
        return $notes[array_rand($notes)];
    }
    
    /**
     * 獲取庫存調整的備註
     */
    private function getAdjustmentNotes(): string
    {
        $notes = [
            '盤點數量調整',
            '系統錯誤修正',
            '庫存差異調整',
            '人工盤點修正',
            '庫存同步調整'
        ];
        
        return $notes[array_rand($notes)];
    }
    
    /**
     * 建立進貨單資料
     */
    private function createPurchases($products): void
    {
        $stores = Store::all();
        $user = User::first();
        
        if ($stores->isEmpty() || !$user) {
            echo "警告：需要門市和用戶資料才能建立進貨單\n";
            return;
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
            $purchasesForStore = rand(3, 8); // 每個門市3-8個進貨單
            
            for ($i = 0; $i < $purchasesForStore; $i++) {
                // 隨機選擇狀態，但確保有一些已完成的進貨單
                if ($i < 2) {
                    $status = Purchase::STATUS_COMPLETED; // 前兩個設為已完成
                } else {
                    $status = $statuses[array_rand($statuses)];
                }
                
                // 設定進貨日期（過去30天內）
                $purchasedAt = now()->subDays(rand(0, 30))->subHours(rand(0, 23));
                $createdAt = $purchasedAt->copy()->subHours(rand(1, 48)); // 建立時間稍早於進貨時間
                
                // 計算運費
                $shippingCost = rand(50, 500) * 100; // 50-500元（以分為單位）
                
                $purchase = Purchase::create([
                    'store_id' => $store->id,
                    'user_id' => $user->id,
                    'order_number' => $this->generateOrderNumber($createdAt),
                    'purchased_at' => $purchasedAt,
                    'shipping_cost' => $shippingCost,
                    'status' => $status,
                    'notes' => $this->getPurchaseNotes($status),
                    'total_amount' => $shippingCost, // 先設定為運費，後面會更新為總金額
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
                
                $purchaseCount++;
                
                // 為進貨單添加進貨項目
                $itemsCount = rand(1, 5); // 每個進貨單1-5個項目
                $totalAmount = $shippingCost; // 從運費開始計算
                
                // 隨機選擇一些商品變體作為進貨項目
                $availableVariants = collect($products)->flatMap(function($product) {
                    return $product->variants;
                })->shuffle()->take($itemsCount);
                
                foreach ($availableVariants as $variant) {
                    $quantity = rand(5, 50);
                    // 使用 Accessor 獲取元為單位的價格，然後計算成本價
                    $costPrice = $variant->cost_price ?: ($variant->price * 0.6); // 如果沒有成本價，用售價的60%
                    $itemTotalCost = $costPrice * $quantity;
                    $totalAmount += $itemTotalCost;
                    
                    PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_variant_id' => $variant->id,
                        'quantity' => $quantity,
                        'unit_price' => $costPrice, // 進貨單價（元為單位，Mutator會轉換為分）
                        'cost_price' => $costPrice, // 成本價（元為單位，Mutator會轉換為分）
                        'allocated_shipping_cost' => 0, // 攤銷的運費成本，先設為0
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                    
                    $itemCount++;
                    
                    // 如果進貨單狀態為已完成，更新庫存
                    if ($status === Purchase::STATUS_COMPLETED) {
                        $inventory = Inventory::firstOrCreate(
                            [
                                'product_variant_id' => $variant->id,
                                'store_id' => $store->id
                            ],
                            [
                                'quantity' => 0,
                                'low_stock_threshold' => rand(5, 20)
                            ]
                        );
                        
                        // 增加庫存
                        $inventory->addStock(
                            $quantity,
                            $user->id,
                            "進貨入庫 - {$purchase->order_number}",
                            [
                                'purchase_id' => $purchase->id,
                                'purchase_order_number' => $purchase->order_number,
                                'cost_price' => $costPrice
                            ]
                        );
                    }
                }
                
                // 更新進貨單總金額
                $purchase->update(['total_amount' => $totalAmount]);
            }
        }
        
        echo "建立了 {$purchaseCount} 筆進貨單，{$itemCount} 筆進貨項目\n";
    }
    
    /**
     * 生成進貨單號
     */
    private function generateOrderNumber($date): string
    {
        $prefix = 'PO';
        $dateStr = $date->format('Y-m-d');
        $randomSuffix = str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
        
        return "{$prefix}-{$dateStr}-{$randomSuffix}";
    }
    
    /**
     * 獲取進貨單備註
     */
    private function getPurchaseNotes($status): string
    {
        $notes = [
            Purchase::STATUS_PENDING => [
                '等待供應商確認',
                '採購申請已提交',
                '等待報價確認'
            ],
            Purchase::STATUS_CONFIRMED => [
                '已確認進貨，等待出貨',
                '供應商已確認訂單',
                '預計3-5天到貨'
            ],
            Purchase::STATUS_IN_TRANSIT => [
                '貨物運輸中',
                '已發貨，預計明天到達',
                '物流配送中'
            ],
            Purchase::STATUS_RECEIVED => [
                '貨物已到達，待入庫',
                '已收貨，正在驗收',
                '部分商品已到達'
            ],
            Purchase::STATUS_COMPLETED => [
                '進貨完成，已入庫',
                '所有商品已驗收入庫',
                '進貨流程完成'
            ],
            Purchase::STATUS_CANCELLED => [
                '已取消 - 供應商缺貨',
                '已取消 - 價格變動',
                '已取消 - 需求變更'
            ]
        ];
        
        $statusNotes = $notes[$status] ?? ['進貨單處理中'];
        return $statusNotes[array_rand($statusNotes)];
    }
} 