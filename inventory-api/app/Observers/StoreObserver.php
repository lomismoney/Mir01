<?php

namespace App\Observers;

use App\Models\Store;
use App\Models\ProductVariant;
use App\Models\Inventory;
use Illuminate\Support\Facades\Log;

class StoreObserver
{
    /**
     * Handle the Store "created" event.
     * 
     * 當新增分店時，自動為所有現有的商品變體創建庫存記錄
     */
    public function created(Store $store): void
    {
        // 獲取所有商品變體
        $variants = ProductVariant::all();
        
        // 批量準備要插入的數據
        $inventoryData = [];
        
        foreach ($variants as $variant) {
            $inventoryData[] = [
                'product_variant_id' => $variant->id,
                'store_id' => $store->id,
                'quantity' => 0,
                'low_stock_threshold' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        // 批量插入以提高性能
        if (!empty($inventoryData)) {
            Inventory::insert($inventoryData);
            
            Log::info("為新分店創建庫存記錄", [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'variants_count' => count($inventoryData)
            ]);
        }
    }
    
    /**
     * Handle the Store "deleting" event.
     * 
     * 當刪除分店前，確保沒有庫存的商品
     */
    public function deleting(Store $store): bool
    {
        // 檢查是否有非零庫存
        $hasStock = $store->inventories()
            ->where('quantity', '>', 0)
            ->exists();
            
        if ($hasStock) {
            throw new \Exception("無法刪除分店 [{$store->name}]，因為還有商品庫存。請先將庫存轉移至其他分店。");
        }
        
        return true;
    }
    
    /**
     * Handle the Store "deleted" event.
     * 
     * 當分店被刪除後，清理相關的庫存記錄
     */
    public function deleted(Store $store): void
    {
        // 刪除該分店的所有庫存記錄（應該都是 0）
        $deletedCount = $store->inventories()->delete();
        
        Log::info("分店刪除後清理庫存記錄", [
            'store_id' => $store->id,
            'store_name' => $store->name,
            'deleted_inventory_records' => $deletedCount
        ]);
    }
}