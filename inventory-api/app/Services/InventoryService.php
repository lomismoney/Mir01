<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

/**
 * 庫存服務類
 * 
 * 負責處理所有庫存相關的業務邏輯，包括：
 * - 訂單創建時的庫存扣減
 * - 訂單取消/退款時的庫存返還
 * - 庫存轉移
 * - 庫存調整
 */
class InventoryService
{
    /**
     * 扣減庫存 (用於訂單創建)
     * 
     * @param int $productVariantId 商品變體ID
     * @param int $quantity 扣減數量
     * @param int|null $storeId 門市ID (預設為主倉庫)
     * @param string|null $notes 備註
     * @param array $metadata 額外資料 (如訂單號)
     * @return bool
     * @throws \Exception
     */
    public function deductStock(int $productVariantId, int $quantity, ?int $storeId = null, ?string $notes = null, array $metadata = []): bool
    {
        return DB::transaction(function () use ($productVariantId, $quantity, $storeId, $notes, $metadata) {
            // 如果沒有指定門市，使用預設門市 (ID: 1)
            if (!$storeId) {
                $storeId = 1; // TODO: 從配置或用戶設定中獲取預設門市
            }

            // 獲取或創建庫存記錄
            $inventory = Inventory::lockForUpdate()
                ->firstOrCreate(
                    [
                        'product_variant_id' => $productVariantId,
                        'store_id' => $storeId
                    ],
                    [
                        'quantity' => 0,
                        'low_stock_threshold' => 5 // 預設低庫存警戒值
                    ]
                );

            // 檢查庫存是否足夠
            if ($inventory->quantity < $quantity) {
                $variant = ProductVariant::find($productVariantId);
                throw new \Exception("庫存不足：商品 {$variant->sku} 當前庫存 {$inventory->quantity}，需求數量 {$quantity}");
            }

            // 扣減庫存
            $userId = Auth::id() ?? 1; // 如果沒有登入用戶，使用系統用戶
            $notes = $notes ?? '訂單扣減庫存';
            
            $result = $inventory->reduceStock($quantity, $userId, $notes, $metadata);
            
            if (!$result) {
                throw new \Exception("庫存扣減失敗");
            }

            return true;
        });
    }

    /**
     * 返還庫存 (用於訂單取消/退款)
     * 
     * @param int $productVariantId 商品變體ID
     * @param int $quantity 返還數量
     * @param int|null $storeId 門市ID
     * @param string|null $notes 備註
     * @param array $metadata 額外資料
     * @return bool
     * @throws \Exception
     */
    public function returnStock(int $productVariantId, int $quantity, ?int $storeId = null, ?string $notes = null, array $metadata = []): bool
    {
        return DB::transaction(function () use ($productVariantId, $quantity, $storeId, $notes, $metadata) {
            // 如果沒有指定門市，使用預設門市
            if (!$storeId) {
                $storeId = 1;
            }

            // 獲取或創建庫存記錄
            $inventory = Inventory::lockForUpdate()
                ->firstOrCreate(
                    [
                        'product_variant_id' => $productVariantId,
                        'store_id' => $storeId
                    ],
                    [
                        'quantity' => 0,
                        'low_stock_threshold' => 5
                    ]
                );

            // 返還庫存
            $userId = Auth::id() ?? 1;
            $notes = $notes ?? '訂單取消/退款返還庫存';
            
            $result = $inventory->addStock($quantity, $userId, $notes, $metadata);
            
            if (!$result) {
                throw new \Exception("庫存返還失敗");
            }

            return true;
        });
    }

    /**
     * 批量扣減庫存 (用於訂單中的多個商品)
     * 
     * @param array $items 商品項目陣列 [['product_variant_id' => 1, 'quantity' => 2], ...]
     * @param int|null $storeId 門市ID
     * @param array $metadata 額外資料
     * @return bool
     * @throws \Exception
     */
    public function batchDeductStock(array $items, ?int $storeId = null, array $metadata = []): bool
    {
        return DB::transaction(function () use ($items, $storeId, $metadata) {
            foreach ($items as $item) {
                if (isset($item['product_variant_id']) && $item['is_stocked_sale']) {
                    $this->deductStock(
                        $item['product_variant_id'],
                        $item['quantity'],
                        $storeId,
                        "訂單商品：{$item['product_name']}",
                        $metadata
                    );
                }
            }
            return true;
        });
    }

    /**
     * 批量返還庫存 (用於訂單取消/退款)
     * 
     * @param array|\Illuminate\Support\Collection $items 商品項目陣列或集合
     * @param int|null $storeId 門市ID
     * @param array $metadata 額外資料
     * @return bool
     * @throws \Exception
     */
    public function batchReturnStock($items, ?int $storeId = null, array $metadata = []): bool
    {
        return DB::transaction(function () use ($items, $storeId, $metadata) {
            foreach ($items as $item) {
                if ($item->product_variant_id && $item->is_stocked_sale) {
                    $this->returnStock(
                        $item->product_variant_id,
                        $item->quantity,
                        $storeId,
                        "訂單取消返還：{$item->product_name}",
                        $metadata
                    );
                }
            }
            return true;
        });
    }

    /**
     * 檢查庫存是否足夠
     * 
     * @param int $productVariantId 商品變體ID
     * @param int $quantity 需求數量
     * @param int|null $storeId 門市ID
     * @return bool
     */
    public function checkStock(int $productVariantId, int $quantity, ?int $storeId = null): bool
    {
        if (!$storeId) {
            $storeId = 1;
        }

        $inventory = Inventory::where('product_variant_id', $productVariantId)
            ->where('store_id', $storeId)
            ->first();

        if (!$inventory) {
            return false;
        }

        return $inventory->quantity >= $quantity;
    }

    /**
     * 批量檢查庫存
     * 
     * @param array $items 商品項目陣列
     * @param int|null $storeId 門市ID
     * @return array 庫存檢查結果
     */
    public function batchCheckStock(array $items, ?int $storeId = null): array
    {
        $results = [];
        
        foreach ($items as $item) {
            if (isset($item['product_variant_id']) && $item['is_stocked_sale']) {
                $isAvailable = $this->checkStock(
                    $item['product_variant_id'],
                    $item['quantity'],
                    $storeId
                );
                
                if (!$isAvailable) {
                    $variant = ProductVariant::find($item['product_variant_id']);
                    $inventory = Inventory::where('product_variant_id', $item['product_variant_id'])
                        ->where('store_id', $storeId ?? 1)
                        ->first();
                    
                    $results[] = [
                        'product_variant_id' => $item['product_variant_id'],
                        'sku' => $variant->sku ?? 'Unknown',
                        'product_name' => $item['product_name'] ?? 'Unknown',
                        'requested_quantity' => $item['quantity'],
                        'available_quantity' => $inventory->quantity ?? 0,
                        'is_available' => false
                    ];
                }
            }
        }
        
        return $results;
    }
    
    /**
     * 獲取商品變體的庫存時序數據
     * 
     * 返回指定商品變體在特定日期範圍內的每日庫存水平數據
     * 
     * @param int $productVariantId 商品變體ID
     * @param string $startDate 開始日期 (Y-m-d)
     * @param string $endDate 結束日期 (Y-m-d)
     * @param int|null $storeId 門市ID（可選，不指定則返回所有門市總和）
     * @return array 時序數據陣列 [['date' => '2025-01-01', 'quantity' => 100], ...]
     */
    public function getInventoryTimeSeries(int $productVariantId, string $startDate, string $endDate, ?int $storeId = null): array
    {
        // 1. 獲取開始日期之前的庫存基準值（初始庫存）
        $baseQuantityQuery = DB::table('inventory_transactions')
            ->join('inventories', 'inventory_transactions.inventory_id', '=', 'inventories.id')
            ->where('inventories.product_variant_id', $productVariantId)
            ->where('inventory_transactions.created_at', '<', $startDate);
            
        if ($storeId) {
            $baseQuantityQuery->where('inventories.store_id', $storeId);
        }
        
        // 計算基準日期之前的總變動量
        $baseQuantity = $baseQuantityQuery->sum('inventory_transactions.quantity') ?? 0;
        
        // 2. 獲取日期範圍內的每日變動
        $dailyChangesQuery = DB::table('inventory_transactions')
            ->join('inventories', 'inventory_transactions.inventory_id', '=', 'inventories.id')
            ->where('inventories.product_variant_id', $productVariantId)
            ->whereBetween('inventory_transactions.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                DB::raw('DATE(inventory_transactions.created_at) as date'),
                DB::raw('SUM(inventory_transactions.quantity) as daily_change')
            )
            ->groupBy('date')
            ->orderBy('date');
            
        if ($storeId) {
            $dailyChangesQuery->where('inventories.store_id', $storeId);
        }
        
        $dailyChanges = $dailyChangesQuery->get()->keyBy('date');
        
        // 3. 生成完整的日期序列並計算每日庫存
        $result = [];
        $currentDate = new \DateTime($startDate);
        $endDateTime = new \DateTime($endDate);
        $currentQuantity = $baseQuantity;
        
        while ($currentDate <= $endDateTime) {
            $dateStr = $currentDate->format('Y-m-d');
            
            // 獲取當天的變動量
            $dailyChange = isset($dailyChanges[$dateStr]) ? $dailyChanges[$dateStr]->daily_change : 0;
            
            // 累計計算當天的庫存量
            $currentQuantity += $dailyChange;
            
            $result[] = [
                'date' => $dateStr,
                'quantity' => max(0, $currentQuantity) // 確保庫存不為負數
            ];
            
            // 移到下一天
            $currentDate->modify('+1 day');
        }
        
        return $result;
    }
} 