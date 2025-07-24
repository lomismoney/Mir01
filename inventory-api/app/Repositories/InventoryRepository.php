<?php

namespace App\Repositories;

use App\Models\Inventory;
use App\Repositories\Contracts\InventoryRepositoryInterface;
use Illuminate\Support\Collection;

/**
 * 庫存倉儲實作
 * 
 * 負責所有與庫存相關的資料存取邏輯
 * 將資料庫操作細節從 Service 層中抽離
 */
class InventoryRepository implements InventoryRepositoryInterface
{
    /**
     * 根據 ID 查找庫存
     */
    public function find(int $id): ?Inventory
    {
        return Inventory::find($id);
    }

    /**
     * 根據變體和門市查找庫存
     */
    public function findByVariantAndStore(int $variantId, int $storeId): ?Inventory
    {
        return Inventory::where('product_variant_id', $variantId)
            ->where('store_id', $storeId)
            ->first();
    }

    /**
     * 創建或獲取庫存記錄
     */
    public function firstOrCreate(int $variantId, int $storeId, array $attributes = []): Inventory
    {
        return Inventory::firstOrCreate(
            [
                'product_variant_id' => $variantId,
                'store_id' => $storeId
            ],
            array_merge([
                'quantity' => 0,
                'low_stock_threshold' => 0
            ], $attributes)
        );
    }

    /**
     * 更新庫存數量
     */
    public function updateQuantity(Inventory $inventory, int $quantity): bool
    {
        $inventory->quantity = $quantity;
        return $inventory->save();
    }

    /**
     * 鎖定並獲取庫存記錄
     */
    public function lockForUpdate(int $id): ?Inventory
    {
        return Inventory::lockForUpdate()->find($id);
    }

    /**
     * 根據變體和門市鎖定並獲取庫存
     */
    public function lockByVariantAndStore(int $variantId, int $storeId): ?Inventory
    {
        return Inventory::where('product_variant_id', $variantId)
            ->where('store_id', $storeId)
            ->lockForUpdate()
            ->first();
    }

    /**
     * 批量鎖定並獲取庫存記錄
     * 
     * 注意：ID 會先排序以避免死鎖
     */
    public function lockMultipleForUpdate(array $ids): Collection
    {
        // 排序 ID 以避免死鎖
        sort($ids);
        
        return Inventory::whereIn('id', $ids)
            ->orderBy('id') // 確保鎖定順序一致
            ->lockForUpdate()
            ->get();
    }

    /**
     * 批量獲取庫存
     */
    public function findByVariantIds(array $variantIds, int $storeId): Collection
    {
        return Inventory::whereIn('product_variant_id', $variantIds)
            ->where('store_id', $storeId)
            ->get()
            ->keyBy('product_variant_id');
    }

    /**
     * 獲取低庫存項目
     */
    public function getLowStockItems(int $storeId): Collection
    {
        return Inventory::where('store_id', $storeId)
            ->lowStock()
            ->with(['productVariant.product'])
            ->orderBy('quantity')
            ->get();
    }

    /**
     * 獲取缺貨項目
     */
    public function getOutOfStockItems(int $storeId): Collection
    {
        return Inventory::where('store_id', $storeId)
            ->outOfStock()
            ->with(['productVariant.product'])
            ->get();
    }

    /**
     * 獲取需要補貨的項目
     */
    public function getItemsBelowThreshold(int $storeId, int $threshold): Collection
    {
        return Inventory::where('store_id', $storeId)
            ->where('quantity', '<=', $threshold)
            ->with(['productVariant.product'])
            ->orderBy('quantity')
            ->get();
    }
}