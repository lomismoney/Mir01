<?php

namespace App\Exceptions\Business;

use Exception;

/**
 * 庫存不足異常
 * 
 * 當商品庫存不足時拋出此異常
 */
class InsufficientStockException extends Exception
{
    /**
     * @var array 庫存詳細信息
     */
    protected array $stockInfo;
    
    /**
     * @var string 錯誤碼
     */
    protected string $errorCode = 'INSUFFICIENT_STOCK';
    
    /**
     * 創建新的異常實例
     * 
     * @param int $productVariantId 商品變體ID
     * @param int $requested 請求數量
     * @param int $available 可用數量
     * @param string|null $sku SKU編號
     * @param string|null $productName 商品名稱
     */
    public function __construct(
        int $productVariantId, 
        int $requested, 
        int $available, 
        ?string $sku = null,
        ?string $productName = null
    ) {
        $this->stockInfo = [
            'product_variant_id' => $productVariantId,
            'sku' => $sku ?? 'Unknown',
            'product_name' => $productName ?? 'Unknown',
            'requested_quantity' => $requested,
            'available_quantity' => $available,
            'shortage' => $requested - $available
        ];
        
        $message = sprintf(
            '庫存不足：商品 %s (SKU: %s) 需求 %d，可用 %d',
            $this->stockInfo['product_name'],
            $this->stockInfo['sku'],
            $requested,
            $available
        );
        
        parent::__construct($message, 422);
    }
    
    /**
     * 取得庫存詳細信息
     * 
     * @return array
     */
    public function getStockInfo(): array
    {
        return $this->stockInfo;
    }
    
    /**
     * 取得錯誤碼
     * 
     * @return string
     */
    public function getErrorCode(): string
    {
        return $this->errorCode;
    }
    
    /**
     * 轉換為陣列（用於API響應）
     * 
     * @return array
     */
    public function toArray(): array
    {
        return [
            'error' => $this->errorCode,
            'message' => $this->getMessage(),
            'details' => $this->stockInfo
        ];
    }
}