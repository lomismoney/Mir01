<?php

namespace App\Repositories\Contracts;

use App\Models\Inventory;
use Illuminate\Support\Collection;

/**
 * 庫存倉儲介面
 * 
 * 定義庫存資料存取的契約，遵循依賴反轉原則 (DIP)
 * 讓 Service 層依賴於抽象而非具體實作
 */
interface InventoryRepositoryInterface
{
    /**
     * 根據 ID 查找庫存
     * 
     * @param int $id 庫存ID
     * @return Inventory|null
     */
    public function find(int $id): ?Inventory;

    /**
     * 根據變體和門市查找庫存
     * 
     * @param int $variantId 產品變體ID
     * @param int $storeId 門市ID
     * @return Inventory|null
     */
    public function findByVariantAndStore(int $variantId, int $storeId): ?Inventory;

    /**
     * 創建或獲取庫存記錄
     * 
     * @param int $variantId 產品變體ID
     * @param int $storeId 門市ID
     * @param array $attributes 額外屬性
     * @return Inventory
     */
    public function firstOrCreate(int $variantId, int $storeId, array $attributes = []): Inventory;

    /**
     * 更新庫存數量
     * 
     * @param Inventory $inventory 庫存實例
     * @param int $quantity 新數量
     * @return bool
     */
    public function updateQuantity(Inventory $inventory, int $quantity): bool;

    /**
     * 鎖定並獲取庫存記錄（悲觀鎖）
     * 
     * @param int $id 庫存ID
     * @return Inventory|null
     */
    public function lockForUpdate(int $id): ?Inventory;

    /**
     * 根據變體和門市鎖定並獲取庫存
     * 
     * @param int $variantId 產品變體ID
     * @param int $storeId 門市ID
     * @return Inventory|null
     */
    public function lockByVariantAndStore(int $variantId, int $storeId): ?Inventory;

    /**
     * 批量鎖定並獲取庫存記錄
     * 
     * @param array $ids 庫存ID陣列
     * @return Collection
     */
    public function lockMultipleForUpdate(array $ids): Collection;

    /**
     * 批量獲取庫存（根據變體ID）
     * 
     * @param array $variantIds 產品變體ID陣列
     * @param int $storeId 門市ID
     * @return Collection
     */
    public function findByVariantIds(array $variantIds, int $storeId): Collection;

    /**
     * 獲取低庫存項目
     * 
     * @param int $storeId 門市ID
     * @return Collection
     */
    public function getLowStockItems(int $storeId): Collection;

    /**
     * 獲取缺貨項目
     * 
     * @param int $storeId 門市ID
     * @return Collection
     */
    public function getOutOfStockItems(int $storeId): Collection;

    /**
     * 獲取需要補貨的項目
     * 
     * @param int $storeId 門市ID
     * @param int $threshold 庫存閾值
     * @return Collection
     */
    public function getItemsBelowThreshold(int $storeId, int $threshold): Collection;
}