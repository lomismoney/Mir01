<?php

namespace App\Exceptions\Inventory;

/**
 * 庫存操作異常
 * 
 * 當庫存操作失敗時拋出
 */
class InventoryOperationException extends InventoryException
{
    protected string $errorCode = 'INVENTORY_OPERATION_FAILED';
    protected int $statusCode = 500;

    /**
     * 建構函式
     * 
     * @param string $operation 操作類型
     * @param string $reason 失敗原因
     * @param array $context 上下文資訊
     */
    public function __construct(string $operation, string $reason, array $context = [])
    {
        $message = "庫存操作失敗: {$operation} - {$reason}";
        
        parent::__construct($message, array_merge([
            'operation' => $operation,
            'reason' => $reason
        ], $context));
    }
}