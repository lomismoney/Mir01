<?php

namespace App\Exceptions\Inventory;

/**
 * 庫存記錄不存在異常
 * 
 * 當找不到指定的庫存記錄時拋出
 */
class InventoryNotFoundException extends InventoryException
{
    protected string $errorCode = 'INVENTORY_NOT_FOUND';
    protected int $statusCode = 404;

    /**
     * 建構函式
     * 
     * @param int $variantId 產品變體ID
     * @param int $storeId 門市ID
     */
    public function __construct(int $variantId, int $storeId)
    {
        $message = "找不到庫存記錄: 產品變體 ID {$variantId}, 門市 ID {$storeId}";
        
        parent::__construct($message, [
            'product_variant_id' => $variantId,
            'store_id' => $storeId
        ]);
    }
}