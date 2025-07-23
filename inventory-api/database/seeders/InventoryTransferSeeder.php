<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransaction;
use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;

class InventoryTransferSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stores = Store::all();
        $user = User::first();
        
        if ($stores->count() < 2 || !$user) {
            echo "警告：需要至少2個門市和1個用戶才能建立庫存轉移記錄\n";
            return;
        }
        
        // 創建各種轉移場景
        $this->createCompletedTransfers($stores, $user);
        $this->createInTransitTransfers($stores, $user);
        $this->createPendingTransfers($stores, $user);
        $this->createCancelledTransfers($stores, $user);
        
        echo "庫存轉移測試資料建立完成！\n";
    }
    
    /**
     * 建立已完成的轉移記錄
     */
    private function createCompletedTransfers($stores, $user): void
    {
        $transferCount = 0;
        
        // 選擇有足夠庫存的商品變體
        $variants = ProductVariant::whereHas('inventory', function($q) {
            $q->where('quantity', '>', 30);
        })->limit(10)->get();
        
        foreach ($variants as $variant) {
            // 隨機選擇來源和目標門市
            $fromStore = $stores->random();
            $toStore = $stores->where('id', '!=', $fromStore->id)->random();
            
            // 確保來源門市有足夠庫存
            $fromInventory = Inventory::where('product_variant_id', $variant->id)
                ->where('store_id', $fromStore->id)
                ->first();
                
            if (!$fromInventory || $fromInventory->quantity < 10) {
                continue;
            }
            
            $toInventory = Inventory::firstOrCreate(
                ['product_variant_id' => $variant->id, 'store_id' => $toStore->id],
                ['quantity' => 0, 'low_stock_threshold' => 10]
            );
            
            // 根據不同原因設定轉移數量
            $transferReasons = [
                ['reason' => 'balance', 'quantity' => rand(10, 20), 'notes' => '庫存平衡調配 - 從高庫存門市轉移到低庫存門市'],
                ['reason' => 'urgent', 'quantity' => rand(1, 5), 'notes' => '緊急調貨 - 客戶急需此商品'],
                ['reason' => 'seasonal', 'quantity' => rand(15, 25), 'notes' => '季節性調整 - 預期需求增加'],
                ['reason' => 'new_store', 'quantity' => rand(20, 30), 'notes' => '新店開幕調貨 - 初始庫存配置'],
            ];
            
            $reasonData = $transferReasons[array_rand($transferReasons)];
            $quantity = min($reasonData['quantity'], $fromInventory->quantity - 5); // 保留至少5個庫存
            
            if ($quantity <= 0) continue;
            
            // 設定完成時間（過去30天內）
            $createdAt = Carbon::now()->subDays(rand(1, 30))->subHours(rand(0, 23));
            $completedAt = $createdAt->copy()->addHours(rand(2, 48)); // 2-48小時後完成
            
            // 建立轉移記錄
            $transfer = InventoryTransfer::create([
                'from_store_id' => $fromStore->id,
                'to_store_id' => $toStore->id,
                'user_id' => $user->id,
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
                'status' => InventoryTransfer::STATUS_COMPLETED,
                'notes' => $reasonData['notes'],
                'created_at' => $createdAt,
                'updated_at' => $completedAt,
            ]);
            
            // 執行實際的庫存操作
            $transferMetadata = [
                'transfer_id' => $transfer->id,
                'transfer_reason' => $reasonData['reason'],
                'from_store_id' => $fromStore->id,
                'from_store_name' => $fromStore->name,
                'to_store_id' => $toStore->id,
                'to_store_name' => $toStore->name,
                'completed_at' => $completedAt->toDateTimeString()
            ];
            
            // 從來源門市減少庫存
            $fromInventory->reduceStock(
                $quantity,
                $user->id,
                "庫存轉移至{$toStore->name} - {$reasonData['notes']}",
                $transferMetadata
            );
            
            // 更新交易記錄
            $fromTransaction = $fromInventory->transactions()->latest()->first();
            if ($fromTransaction) {
                $fromTransaction->update([
                    'type' => InventoryTransaction::TYPE_TRANSFER_OUT,
                    'created_at' => $completedAt,
                    'updated_at' => $completedAt,
                ]);
            }
            
            // 向目標門市增加庫存
            $toInventory->addStock(
                $quantity,
                $user->id,
                "從{$fromStore->name}轉入 - {$reasonData['notes']}",
                $transferMetadata
            );
            
            // 更新交易記錄
            $toTransaction = $toInventory->transactions()->latest()->first();
            if ($toTransaction) {
                $toTransaction->update([
                    'type' => InventoryTransaction::TYPE_TRANSFER_IN,
                    'created_at' => $completedAt,
                    'updated_at' => $completedAt,
                ]);
            }
            
            $transferCount++;
            
            if ($transferCount >= 15) break;
        }
        
        echo "建立了 {$transferCount} 筆已完成的庫存轉移記錄\n";
    }
    
    /**
     * 建立運輸中的轉移記錄
     */
    private function createInTransitTransfers($stores, $user): void
    {
        $transferCount = 0;
        
        // 選擇有庫存的商品變體
        $variants = ProductVariant::whereHas('inventory', function($q) {
            $q->where('quantity', '>', 20);
        })->limit(8)->get();
        
        foreach ($variants as $variant) {
            $fromStore = $stores->random();
            $toStore = $stores->where('id', '!=', $fromStore->id)->random();
            
            $fromInventory = Inventory::where('product_variant_id', $variant->id)
                ->where('store_id', $fromStore->id)
                ->first();
                
            if (!$fromInventory || $fromInventory->quantity < 10) {
                continue;
            }
            
            $quantity = rand(5, 15);
            
            // 設定時間（最近3天內發起的轉移）
            $createdAt = Carbon::now()->subDays(rand(0, 3))->subHours(rand(0, 23));
            
            $inTransitNotes = [
                '運輸中 - 預計明天下午送達',
                '物流配送中 - 已發貨，追蹤號：TW' . rand(1000000, 9999999),
                '快遞運送中 - 預計2個工作日內送達',
                '已裝車出發 - 今日稍晚送達',
                '區域配送中心處理中 - 預計明早送達'
            ];
            
            InventoryTransfer::create([
                'from_store_id' => $fromStore->id,
                'to_store_id' => $toStore->id,
                'user_id' => $user->id,
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
                'status' => InventoryTransfer::STATUS_IN_TRANSIT,
                'notes' => $inTransitNotes[array_rand($inTransitNotes)],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            
            $transferCount++;
            
            if ($transferCount >= 8) break;
        }
        
        echo "建立了 {$transferCount} 筆運輸中的庫存轉移記錄\n";
    }
    
    /**
     * 建立待處理的轉移申請
     */
    private function createPendingTransfers($stores, $user): void
    {
        $transferCount = 0;
        
        // 選擇庫存較低的商品變體（模擬需要調貨的情況）
        $variants = ProductVariant::whereHas('inventory', function($q) {
            $q->where('quantity', '<=', 10)->where('quantity', '>', 0);
        })->limit(10)->get();
        
        foreach ($variants as $variant) {
            // 找到有較多庫存的門市作為來源
            $highStockInventory = Inventory::where('product_variant_id', $variant->id)
                ->where('quantity', '>', 20)
                ->first();
                
            if (!$highStockInventory) continue;
            
            // 找到庫存較低的門市作為目標
            $lowStockInventory = Inventory::where('product_variant_id', $variant->id)
                ->where('store_id', '!=', $highStockInventory->store_id)
                ->where('quantity', '<=', 10)
                ->first();
                
            if (!$lowStockInventory) continue;
            
            $quantity = rand(5, 10);
            
            // 設定時間（最近1天內的申請）
            $createdAt = Carbon::now()->subHours(rand(0, 24));
            
            $pendingNotes = [
                '待確認 - 需要主管審批',
                '申請調貨 - 客戶預訂需求',
                '庫存不足申請 - 等待來源門市確認',
                '緊急調貨申請 - 大客戶訂單需求',
                '補貨申請 - 熱銷商品庫存告急'
            ];
            
            InventoryTransfer::create([
                'from_store_id' => $highStockInventory->store_id,
                'to_store_id' => $lowStockInventory->store_id,
                'user_id' => $user->id,
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
                'status' => InventoryTransfer::STATUS_PENDING,
                'notes' => $pendingNotes[array_rand($pendingNotes)],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            
            $transferCount++;
            
            if ($transferCount >= 6) break;
        }
        
        echo "建立了 {$transferCount} 筆待處理的轉移申請\n";
    }
    
    /**
     * 建立已取消的轉移記錄
     */
    private function createCancelledTransfers($stores, $user): void
    {
        $transferCount = 0;
        
        // 隨機選擇一些商品變體
        $variants = ProductVariant::inRandomOrder()->limit(5)->get();
        
        foreach ($variants as $variant) {
            $fromStore = $stores->random();
            $toStore = $stores->where('id', '!=', $fromStore->id)->random();
            
            $quantity = rand(3, 8);
            
            // 設定時間（過去7-14天的記錄）
            $createdAt = Carbon::now()->subDays(rand(7, 14))->subHours(rand(0, 23));
            $cancelledAt = $createdAt->copy()->addHours(rand(1, 24));
            
            $cancelledReasons = [
                '已取消 - 需求變更，客戶取消訂單',
                '已取消 - 來源門市庫存不足',
                '已取消 - 找到更近的調貨來源',
                '已取消 - 商品損壞無法轉移',
                '已取消 - 運輸成本過高'
            ];
            
            InventoryTransfer::create([
                'from_store_id' => $fromStore->id,
                'to_store_id' => $toStore->id,
                'user_id' => $user->id,
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
                'status' => InventoryTransfer::STATUS_CANCELLED,
                'notes' => $cancelledReasons[array_rand($cancelledReasons)],
                'created_at' => $createdAt,
                'updated_at' => $cancelledAt,
            ]);
            
            $transferCount++;
        }
        
        echo "建立了 {$transferCount} 筆已取消的轉移記錄\n";
    }
}