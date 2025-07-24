<?php

namespace App\Exceptions\Inventory;

/**
 * 無效數量異常
 * 
 * 當提供的數量無效時拋出（如負數或零）
 */
class InvalidQuantityException extends InventoryException
{
    protected string $errorCode = 'INVALID_QUANTITY';
    protected int $statusCode = 400;

    /**
     * 建構函式
     * 
     * @param int $quantity 無效的數量
     * @param string $operation 操作類型（add/deduct/adjust）
     */
    public function __construct(int $quantity, string $operation = 'operation')
    {
        $message = "無效的數量: {$quantity}。{$operation}操作的數量必須大於 0";
        
        parent::__construct($message, [
            'quantity' => $quantity,
            'operation' => $operation
        ]);
    }
}