<?php

namespace App\Exceptions\Business;

use Exception;

/**
 * 退款異常
 * 
 * 處理退款相關的業務異常
 */
class RefundException extends Exception
{
    /**
     * @var array 退款詳細信息
     */
    protected array $refundInfo;
    
    /**
     * @var string 錯誤碼
     */
    protected string $errorCode = 'REFUND_ERROR';
    
    /**
     * 創建新的異常實例
     * 
     * @param string $message 錯誤訊息
     * @param string $errorCode 錯誤碼
     * @param array $refundInfo 退款詳細信息
     */
    public function __construct(string $message, string $errorCode = 'REFUND_ERROR', array $refundInfo = [])
    {
        $this->errorCode = $errorCode;
        $this->refundInfo = $refundInfo;
        
        parent::__construct($message, 422);
    }
    
    /**
     * 創建「訂單無法退款」異常
     * 
     * @param int $orderId 訂單ID
     * @param string $reason 原因
     * @return self
     */
    public static function orderNotRefundable(int $orderId, string $reason): self
    {
        return new self(
            "訂單 #{$orderId} 無法退款：{$reason}",
            'ORDER_NOT_REFUNDABLE',
            ['order_id' => $orderId, 'reason' => $reason]
        );
    }
    
    /**
     * 創建「退款金額超過限制」異常
     * 
     * @param float $requestedAmount 請求退款金額
     * @param float $availableAmount 可退款金額
     * @return self
     */
    public static function amountExceedsLimit(float $requestedAmount, float $availableAmount): self
    {
        return new self(
            sprintf('退款金額 %.2f 超過可退款金額 %.2f', $requestedAmount, $availableAmount),
            'REFUND_AMOUNT_EXCEEDS_LIMIT',
            [
                'requested_amount' => $requestedAmount,
                'available_amount' => $availableAmount,
                'exceeded_amount' => $requestedAmount - $availableAmount
            ]
        );
    }
    
    /**
     * 創建「退貨數量超過限制」異常
     * 
     * @param int $orderItemId 訂單項目ID
     * @param int $requestedQty 請求退貨數量
     * @param int $availableQty 可退貨數量
     * @return self
     */
    public static function quantityExceedsLimit(int $orderItemId, int $requestedQty, int $availableQty): self
    {
        return new self(
            sprintf('品項 #%d 的退貨數量 %d 超過可退數量 %d', $orderItemId, $requestedQty, $availableQty),
            'REFUND_QUANTITY_EXCEEDS_LIMIT',
            [
                'order_item_id' => $orderItemId,
                'requested_quantity' => $requestedQty,
                'available_quantity' => $availableQty,
                'exceeded_quantity' => $requestedQty - $availableQty
            ]
        );
    }
    
    /**
     * 取得退款詳細信息
     * 
     * @return array
     */
    public function getRefundInfo(): array
    {
        return $this->refundInfo;
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
            'details' => $this->refundInfo
        ];
    }
}