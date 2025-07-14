<?php

namespace App\Services\Traits;

use App\Models\Store;
use Illuminate\Support\Collection;

trait HandlesInventoryOperations
{
    /**
     * 獲取有效門市ID
     * 
     * @param int|null $storeId 門市ID
     * @return int 有效的門市ID
     * @throws \InvalidArgumentException 當門市ID不存在時
     */
    protected function ensureValidStoreId(?int $storeId = null): int
    {
        if ($storeId) {
            if (!Store::where('id', $storeId)->exists()) {
                throw new \InvalidArgumentException("門市ID {$storeId} 不存在");
            }
            return $storeId;
        }
        
        return $this->getDefaultStoreId();
    }
    
    /**
     * 獲取預設門市ID
     * 
     * @return int 預設門市ID
     * @throws \Exception 當系統中沒有任何門市時
     */
    protected function getDefaultStoreId(): int
    {
        $store = Store::orderBy('id')->first();
        
        if (!$store) {
            throw new \Exception('系統中沒有任何門市，請先創建門市後再進行庫存操作');
        }
        
        return $store->id;
    }
    
    /**
     * 批量操作ID排序（避免死鎖）
     * 通過統一的ID排序避免在批量操作中出現死鎖問題
     * 
     * @param array $ids ID陣列
     * @return array 排序後的ID陣列
     */
    protected function sortIdsForDeadlockPrevention(array $ids): array
    {
        sort($ids);
        return $ids;
    }
    
    /**
     * 批量獲取產品變體並按ID排序
     * 
     * @param array $variantIds 產品變體ID陣列
     * @return Collection 排序後的產品變體集合
     */
    protected function getProductVariantsSorted(array $variantIds): Collection
    {
        $sortedIds = $this->sortIdsForDeadlockPrevention($variantIds);
        
        if (empty($sortedIds)) {
            return collect();
        }
        
        $variants = \App\Models\ProductVariant::whereIn('id', $sortedIds)->get();
        
        // 手動按照指定順序排序，兼容不同數據庫
        return $variants->sortBy(function ($variant) use ($sortedIds) {
            return array_search($variant->id, $sortedIds);
        })->values();
    }
    
    /**
     * 驗證庫存操作權限
     * 
     * @param int $storeId 門市ID
     * @param string $operation 操作類型
     * @throws \InvalidArgumentException 當用戶無權限操作指定門市時
     */
    protected function validateInventoryPermission(int $storeId, string $operation = '庫存操作'): void
    {
        // 這裡可以根據業務需求添加更複雜的權限檢查邏輯
        // 例如：檢查用戶是否有操作特定門市的權限
        $userId = $this->requireAuthentication($operation);
        
        // 可以在此處添加更詳細的權限檢查
        // 例如：檢查用戶角色、門市歸屬等
    }
    
    /**
     * 格式化庫存操作結果
     * 
     * @param array $results 操作結果
     * @return array 格式化後的結果
     */
    protected function formatInventoryResults(array $results): array
    {
        return array_map(function ($result) {
            return [
                'product_variant_id' => $result['product_variant_id'] ?? null,
                'quantity_changed' => $result['quantity_changed'] ?? 0,
                'new_quantity' => $result['new_quantity'] ?? 0,
                'success' => $result['success'] ?? false,
                'message' => $result['message'] ?? '',
                'timestamp' => now()->toISOString()
            ];
        }, $results);
    }
    
    /**
     * 檢查庫存是否充足
     * 
     * @param array $items 要檢查的項目 [['product_variant_id' => int, 'quantity' => int], ...]
     * @param int|null $storeId 門市ID
     * @return array 檢查結果
     */
    protected function checkStockAvailability(array $items, ?int $storeId = null): array
    {
        $storeId = $this->ensureValidStoreId($storeId);
        $variantIds = array_column($items, 'product_variant_id');
        
        $inventories = \App\Models\Inventory::whereIn('product_variant_id', $variantIds)
            ->where('store_id', $storeId)
            ->get()
            ->keyBy('product_variant_id');
        
        $results = [];
        foreach ($items as $item) {
            $variantId = $item['product_variant_id'];
            $requiredQuantity = $item['quantity'];
            
            $inventory = $inventories->get($variantId);
            $availableQuantity = $inventory ? $inventory->quantity : 0;
            
            $results[] = [
                'product_variant_id' => $variantId,
                'required_quantity' => $requiredQuantity,
                'available_quantity' => $availableQuantity,
                'sufficient' => $availableQuantity >= $requiredQuantity,
                'shortage' => max(0, $requiredQuantity - $availableQuantity)
            ];
        }
        
        return $results;
    }
}