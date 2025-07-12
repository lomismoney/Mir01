<?php

namespace App\Enums;

/**
 * 訂單項目類型列舉
 * 
 * 定義系統中三種主要的商品銷售類型
 */
class OrderItemType
{
    /**
     * 現貨商品
     * - 有庫存，下單時立即扣減庫存
     * - 創建訂單時立即標記為已履行（is_fulfilled = true）
     * - 退貨時總是需要返還庫存
     */
    public const STOCK = 'stock';
    
    /**
     * 預訂商品
     * - 無庫存，下單後向供應商進貨
     * - 需要建立進貨單追蹤
     * - 進貨完成後標記為已履行
     * - 只有已履行的預訂商品退貨時才返還庫存
     */
    public const BACKORDER = 'backorder';
    
    /**
     * 訂製商品
     * - 無庫存，根據客戶需求製作
     * - 需要建立製作單追蹤（未來功能）
     * - 製作完成後標記為已履行
     * - 只有已履行的訂製商品退貨時才返還庫存
     */
    public const CUSTOM = 'custom';
    
    /**
     * 取得所有選項
     *
     * @return array<string, string>
     */
    public static function getOptions(): array
    {
        return [
            self::STOCK => '現貨商品',
            self::BACKORDER => '預訂商品',
            self::CUSTOM => '訂製商品',
        ];
    }
    
    /**
     * 根據訂單項目的屬性判斷商品類型
     * 
     * @param array $itemData 訂單項目資料
     * @return string
     */
    public static function determineType(array $itemData): string
    {
        // 首先檢查 product_variant_id 是否存在
        $hasVariantId = !empty($itemData['product_variant_id']);
        
        // 沒有 product_variant_id 的一定是訂製商品
        // 無論其他標誌如何設置，沒有變體ID就不可能是現貨或預訂
        if (!$hasVariantId) {
            return self::CUSTOM;
        }
        
        // 有 product_variant_id 的情況下，按優先順序判斷
        
        // 1. 檢查是否為現貨商品（最高優先級）
        if (!empty($itemData['is_stocked_sale'])) {
            return self::STOCK;
        }
        
        // 2. 檢查是否為預訂商品
        if (!empty($itemData['is_backorder'])) {
            return self::BACKORDER;
        }
        
        // 3. 明確指定不是現貨也不是預訂的是訂製商品
        if (array_key_exists('is_stocked_sale', $itemData) && 
            array_key_exists('is_backorder', $itemData) &&
            empty($itemData['is_stocked_sale']) && 
            empty($itemData['is_backorder'])) {
            return self::CUSTOM;
        }
        
        // 4. 預設為預訂商品（有 variant_id 但沒有明確標記的情況）
        return self::BACKORDER;
    }
    
    /**
     * 判斷是否需要扣減庫存
     * 
     * @param string $type
     * @return bool
     */
    public static function shouldDeductInventory(string $type): bool
    {
        return $type === self::STOCK;
    }
    
    /**
     * 判斷創建時是否應立即標記為已履行
     * 
     * @param string $type
     * @return bool
     */
    public static function shouldMarkFulfilledOnCreate(string $type): bool
    {
        return $type === self::STOCK;
    }
}