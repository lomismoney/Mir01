<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\Auth;

/**
 * 庫存交易服務
 * 
 * 負責管理所有庫存交易記錄的創建和查詢
 * 將交易記錄邏輯從 InventoryService 中分離
 */
class InventoryTransactionService extends BaseService
{
    /**
     * 記錄庫存增加交易
     * 
     * @param int $inventoryId 庫存ID
     * @param int $quantity 增加數量
     * @param int $beforeQuantity 變動前數量
     * @param int $afterQuantity 變動後數量
     * @param array $context 上下文資訊
     * @return InventoryTransaction
     */
    public function recordAddition(
        int $inventoryId,
        int $quantity,
        int $beforeQuantity,
        int $afterQuantity,
        array $context = []
    ): InventoryTransaction {
        return $this->createTransaction(
            $inventoryId,
            InventoryTransaction::TYPE_ADDITION,
            $quantity,
            $beforeQuantity,
            $afterQuantity,
            $context['notes'] ?? '庫存增加',
            $context
        );
    }

    /**
     * 記錄庫存扣減交易
     * 
     * @param int $inventoryId 庫存ID
     * @param int $quantity 扣減數量（正數）
     * @param int $beforeQuantity 變動前數量
     * @param int $afterQuantity 變動後數量
     * @param array $context 上下文資訊
     * @return InventoryTransaction
     */
    public function recordDeduction(
        int $inventoryId,
        int $quantity,
        int $beforeQuantity,
        int $afterQuantity,
        array $context = []
    ): InventoryTransaction {
        return $this->createTransaction(
            $inventoryId,
            InventoryTransaction::TYPE_REDUCTION,
            -$quantity, // 負數表示減少
            $beforeQuantity,
            $afterQuantity,
            $context['notes'] ?? '庫存扣減',
            $context
        );
    }

    /**
     * 記錄庫存調整交易
     * 
     * @param int $inventoryId 庫存ID
     * @param int $change 變動量（正數增加，負數減少）
     * @param int $beforeQuantity 變動前數量
     * @param int $afterQuantity 變動後數量
     * @param array $context 上下文資訊
     * @return InventoryTransaction
     */
    public function recordAdjustment(
        int $inventoryId,
        int $change,
        int $beforeQuantity,
        int $afterQuantity,
        array $context = []
    ): InventoryTransaction {
        return $this->createTransaction(
            $inventoryId,
            InventoryTransaction::TYPE_ADJUSTMENT,
            $change,
            $beforeQuantity,
            $afterQuantity,
            $context['notes'] ?? '庫存調整',
            $context
        );
    }

    /**
     * 記錄庫存轉入交易
     * 
     * @param int $inventoryId 庫存ID
     * @param int $quantity 轉入數量
     * @param int $beforeQuantity 變動前數量
     * @param int $afterQuantity 變動後數量
     * @param array $context 上下文資訊
     * @return InventoryTransaction
     */
    public function recordTransferIn(
        int $inventoryId,
        int $quantity,
        int $beforeQuantity,
        int $afterQuantity,
        array $context = []
    ): InventoryTransaction {
        return $this->createTransaction(
            $inventoryId,
            InventoryTransaction::TYPE_TRANSFER_IN,
            $quantity,
            $beforeQuantity,
            $afterQuantity,
            $context['notes'] ?? '庫存轉入',
            $context
        );
    }

    /**
     * 記錄庫存轉出交易
     * 
     * @param int $inventoryId 庫存ID
     * @param int $quantity 轉出數量（正數）
     * @param int $beforeQuantity 變動前數量
     * @param int $afterQuantity 變動後數量
     * @param array $context 上下文資訊
     * @return InventoryTransaction
     */
    public function recordTransferOut(
        int $inventoryId,
        int $quantity,
        int $beforeQuantity,
        int $afterQuantity,
        array $context = []
    ): InventoryTransaction {
        return $this->createTransaction(
            $inventoryId,
            InventoryTransaction::TYPE_TRANSFER_OUT,
            -$quantity, // 負數表示減少
            $beforeQuantity,
            $afterQuantity,
            $context['notes'] ?? '庫存轉出',
            $context
        );
    }

    /**
     * 創建交易記錄
     * 
     * @param int $inventoryId 庫存ID
     * @param string $type 交易類型
     * @param int $quantity 變動數量
     * @param int $beforeQuantity 變動前數量
     * @param int $afterQuantity 變動後數量
     * @param string $notes 備註
     * @param array $metadata 元資料
     * @return InventoryTransaction
     */
    private function createTransaction(
        int $inventoryId,
        string $type,
        int $quantity,
        int $beforeQuantity,
        int $afterQuantity,
        string $notes,
        array $metadata
    ): InventoryTransaction {
        // 清理元資料中的重複欄位
        unset($metadata['notes']);
        
        return InventoryTransaction::create([
            'inventory_id' => $inventoryId,
            'user_id' => Auth::id() ?? $metadata['user_id'] ?? null,
            'type' => $type,
            'quantity' => $quantity,
            'before_quantity' => $beforeQuantity,
            'after_quantity' => $afterQuantity,
            'notes' => $notes,
            'metadata' => !empty($metadata) ? $metadata : null
        ]);
    }

    /**
     * 查詢特定庫存的交易記錄
     * 
     * @param int $inventoryId 庫存ID
     * @param array $filters 過濾條件
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getTransactions(int $inventoryId, array $filters = [])
    {
        $query = InventoryTransaction::where('inventory_id', $inventoryId)
            ->with('user');

        // 類型過濾
        if (!empty($filters['type'])) {
            $query->ofType($filters['type']);
        }

        // 日期範圍過濾
        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->betweenDates($filters['start_date'], $filters['end_date']);
        }

        // 排序
        $query->orderBy('created_at', $filters['order'] ?? 'desc');

        // 分頁
        if (!empty($filters['limit'])) {
            return $query->paginate($filters['limit']);
        }

        return $query->get();
    }

    /**
     * 計算特定期間的庫存變動總量
     * 
     * @param int $inventoryId 庫存ID
     * @param string $startDate 開始日期
     * @param string $endDate 結束日期
     * @return int
     */
    public function calculatePeriodChange(int $inventoryId, string $startDate, string $endDate): int
    {
        return InventoryTransaction::where('inventory_id', $inventoryId)
            ->betweenDates($startDate, $endDate)
            ->sum('quantity');
    }
}