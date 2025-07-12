<?php

namespace App\Exceptions\Business;

use Exception;

/**
 * 無效狀態轉換異常
 * 
 * 當嘗試進行不允許的狀態轉換時拋出此異常
 */
class InvalidStatusTransitionException extends Exception
{
    /**
     * @var array 狀態轉換詳細信息
     */
    protected array $transitionInfo;
    
    /**
     * @var string 錯誤碼
     */
    protected string $errorCode = 'INVALID_STATUS_TRANSITION';
    
    /**
     * 創建新的異常實例
     * 
     * @param string $currentStatus 當前狀態
     * @param string $targetStatus 目標狀態
     * @param string $entityType 實體類型（如 'order', 'purchase'）
     * @param array $allowedTransitions 允許的狀態轉換
     */
    public function __construct(
        string $currentStatus, 
        string $targetStatus, 
        string $entityType = 'entity',
        array $allowedTransitions = []
    ) {
        $this->transitionInfo = [
            'current_status' => $currentStatus,
            'target_status' => $targetStatus,
            'entity_type' => $entityType,
            'allowed_transitions' => $allowedTransitions
        ];
        
        $message = sprintf(
            '無法將%s狀態從 %s 轉換到 %s',
            $entityType,
            $currentStatus,
            $targetStatus
        );
        
        if (!empty($allowedTransitions)) {
            $message .= sprintf(
                '。允許的轉換：%s',
                implode(', ', $allowedTransitions)
            );
        }
        
        parent::__construct($message, 422);
    }
    
    /**
     * 取得狀態轉換詳細信息
     * 
     * @return array
     */
    public function getTransitionInfo(): array
    {
        return $this->transitionInfo;
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
            'details' => $this->transitionInfo
        ];
    }
}