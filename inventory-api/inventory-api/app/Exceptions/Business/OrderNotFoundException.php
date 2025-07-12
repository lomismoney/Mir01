<?php

namespace App\Exceptions\Business;

use Exception;

/**
 * 訂單不存在異常
 * 
 * 當查找的訂單不存在時拋出此異常
 */
class OrderNotFoundException extends Exception
{
    /**
     * @var array 查詢條件詳細信息
     */
    protected array $searchCriteria;
    
    /**
     * @var string 錯誤碼
     */
    protected string $errorCode = 'ORDER_NOT_FOUND';
    
    /**
     * 創建新的異常實例
     * 
     * @param string|int $identifier 訂單識別碼（ID或訂單號）
     * @param string $identifierType 識別碼類型（'id' 或 'order_number'）
     */
    public function __construct($identifier, string $identifierType = 'id')
    {
        $this->searchCriteria = [
            'identifier' => $identifier,
            'identifier_type' => $identifierType
        ];
        
        $message = sprintf(
            '找不到訂單：%s = %s',
            $identifierType === 'id' ? '訂單ID' : '訂單編號',
            $identifier
        );
        
        parent::__construct($message, 404);
    }
    
    /**
     * 取得查詢條件詳細信息
     * 
     * @return array
     */
    public function getSearchCriteria(): array
    {
        return $this->searchCriteria;
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
            'details' => $this->searchCriteria
        ];
    }
}