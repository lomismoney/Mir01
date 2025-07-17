<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

class FixMissingInventoryRecords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:fix-missing {--dry-run : 只顯示將要創建的記錄，不實際創建}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '修復缺失的庫存記錄，確保每個商品變體在每個門市都有庫存記錄';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        
        $this->info('開始檢查缺失的庫存記錄...');
        
        // 獲取所有商品變體和門市
        $variants = ProductVariant::all();
        $stores = Store::all();
        
        $this->info("商品變體總數: {$variants->count()}");
        $this->info("門市總數: {$stores->count()}");
        $this->info("理論上應有的庫存記錄數: " . ($variants->count() * $stores->count()));
        
        // 獲取現有的庫存記錄
        $existingInventories = Inventory::select('product_variant_id', 'store_id')
            ->get()
            ->map(function ($inv) {
                return $inv->product_variant_id . '-' . $inv->store_id;
            })
            ->toArray();
        
        $this->info("現有庫存記錄數: " . count($existingInventories));
        
        $missingRecords = [];
        $createdCount = 0;
        
        // 檢查每個組合
        foreach ($variants as $variant) {
            foreach ($stores as $store) {
                $key = $variant->id . '-' . $store->id;
                
                if (!in_array($key, $existingInventories)) {
                    $missingRecords[] = [
                        'product_variant_id' => $variant->id,
                        'store_id' => $store->id,
                        'sku' => $variant->sku,
                        'store_name' => $store->name,
                    ];
                    
                    if (!$isDryRun) {
                        try {
                            Inventory::create([
                                'product_variant_id' => $variant->id,
                                'store_id' => $store->id,
                                'quantity' => 0,
                                'low_stock_threshold' => 0,
                            ]);
                            $createdCount++;
                        } catch (\Exception $e) {
                            $this->error("創建失敗: SKU {$variant->sku} 在 {$store->name} - " . $e->getMessage());
                        }
                    }
                }
            }
        }
        
        $this->info("缺失的庫存記錄數: " . count($missingRecords));
        
        if ($isDryRun) {
            $this->info("\n[DRY RUN] 以下是將要創建的記錄:");
            $this->table(
                ['商品變體ID', 'SKU', '門市ID', '門市名稱'],
                array_map(function ($record) {
                    return [
                        $record['product_variant_id'],
                        $record['sku'],
                        $record['store_id'],
                        $record['store_name'],
                    ];
                }, array_slice($missingRecords, 0, 20)) // 只顯示前20筆
            );
            
            if (count($missingRecords) > 20) {
                $this->info("... 還有 " . (count($missingRecords) - 20) . " 筆記錄未顯示");
            }
            
            $this->info("\n使用 --dry-run=false 來實際創建這些記錄");
        } else {
            $this->info("成功創建了 {$createdCount} 筆庫存記錄");
        }
        
        return Command::SUCCESS;
    }
}