<?php

namespace App\Exceptions\Inventory;

use Exception;

/**
 * 庫存領域基礎異常
 * 
 * 所有庫存相關異常的基礎類別
 * 提供統一的異常結構和處理機制
 */
abstract class InventoryException extends Exception
{
    /**
     * 異常上下文資訊
     * 
     * @var array
     */
    protected array $context = [];

    /**
     * 錯誤代碼
     * 
     * @var string
     */
    protected string $errorCode = 'INVENTORY_ERROR';

    /**
     * HTTP 狀態碼
     * 
     * @var int
     */
    protected int $statusCode = 400;

    /**
     * 建構函式
     * 
     * @param string $message 錯誤訊息
     * @param array $context 上下文資訊
     * @param int $code 錯誤碼
     * @param \Throwable|null $previous 前一個異常
     */
    public function __construct(string $message = "", array $context = [], int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->context = $context;
    }

    /**
     * 取得上下文資訊
     * 
     * @return array
     */
    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * 取得錯誤代碼
     * 
     * @return string
     */
    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    /**
     * 取得 HTTP 狀態碼
     * 
     * @return int
     */
    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    /**
     * 轉換為陣列（用於 API 回應）
     * 
     * @return array
     */
    public function toArray(): array
    {
        return [
            'error' => $this->errorCode,
            'message' => $this->getMessage(),
            'context' => $this->context
        ];
    }

    /**
     * 轉換為 JSON 回應
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function toResponse()
    {
        return response()->json($this->toArray(), $this->statusCode);
    }
}