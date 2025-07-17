<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Services\BaseService;
use App\Services\Traits\HandlesInventoryOperations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * 庫存服務類
 * 
 * 負責處理所有庫存相關的業務邏輯，包括：
 * - 訂單創建時的庫存扣減
 * - 訂單取消/退款時的庫存返還
 * - 庫存轉移
 * - 庫存調整
 */
class InventoryService extends BaseService
{
    use HandlesInventoryOperations;
    
    /**
     * 跨店庫存查詢
     * 
     * 查詢指定商品在所有門市的庫存狀況
     * 
     * @param array $productVariantIds 商品變體ID陣列
     * @param int|null $excludeStoreId 要排除的門市ID（通常是當前門市）
     * @return array 格式：[variant_id => [store_id => ['store_name' => string, 'quantity' => int]]]
     */
    public function checkCrossStoreAvailability(array $productVariantIds, ?int $excludeStoreId = null): array
    {
        $query = Inventory::whereIn('product_variant_id', $productVariantIds)
            ->where('quantity', '>', 0)
            ->with(['store:id,name', 'productVariant.product']);
            
        if ($excludeStoreId) {
            $query->where('store_id', '!=', $excludeStoreId);
        }
        
        $inventories = $query->get();
        
        $result = [];
        foreach ($inventories as $inventory) {
            $variantId = $inventory->product_variant_id;
            $storeId = $inventory->store_id;
            
            if (!isset($result[$variantId])) {
                $result[$variantId] = [];
            }
            
            $result[$variantId][$storeId] = [
                'store_name' => $inventory->store->name,
                'quantity' => $inventory->quantity,
                'product_name' => $inventory->productVariant->product->name ?? '',
                'sku' => $inventory->productVariant->sku ?? ''
            ];
        }
        
        return $result;
    }
    
    /**
     * 智慧庫存建議
     * 
     * 根據訂單項目和目標門市，提供最佳的庫存處理建議
     * 
     * @param array $orderItems 訂單項目 [['product_variant_id' => int, 'quantity' => int], ...]
     * @param int $targetStoreId 目標門市ID
     * @return array 每個商品的建議處理方式
     */
    public function getStockSuggestions(array $orderItems, int $targetStoreId): array
    {
        $suggestions = [];
        
        foreach ($orderItems as $item) {
            $variantId = $item['product_variant_id'];
            $requestedQty = $item['quantity'];
            
            // 1. 檢查目標門市庫存
            $targetStock = Inventory::where('product_variant_id', $variantId)
                ->where('store_id', $targetStoreId)
                ->value('quantity') ?? 0;
            
            // 2. 獲取商品資訊
            $variant = ProductVariant::with('product')->find($variantId);
            $productName = $variant ? ($variant->product->name ?? 'Unknown') : 'Unknown';
            $sku = $variant ? $variant->sku : 'Unknown';
            
            $suggestion = [
                'product_variant_id' => $variantId,
                'product_name' => $productName,
                'sku' => $sku,
                'requested_quantity' => $requestedQty,
                'current_store_stock' => $targetStock,
                'shortage' => max(0, $requestedQty - $targetStock)
            ];
            
            // 如果目標門市庫存充足，不需要建議
            if ($targetStock >= $requestedQty) {
                $suggestion['type'] = 'sufficient';
                $suggestion['message'] = '庫存充足';
                $suggestions[] = $suggestion;
                continue;
            }
            
            // 3. 查詢其他門市庫存
            $otherStores = Inventory::where('product_variant_id', $variantId)
                ->where('store_id', '!=', $targetStoreId)
                ->where('quantity', '>', 0)
                ->with('store:id,name')
                ->orderBy('quantity', 'desc')
                ->get();
            
            $totalAvailable = $targetStock;
            $transfers = [];
            $remainingNeeded = $requestedQty - $targetStock;
            
            // 4. 計算可調貨數量
            foreach ($otherStores as $inventory) {
                if ($remainingNeeded <= 0) break;
                
                $availableQty = min($inventory->quantity, $remainingNeeded);
                $transfers[] = [
                    'from_store_id' => $inventory->store_id,
                    'from_store_name' => $inventory->store->name,
                    'available_quantity' => $inventory->quantity,
                    'suggested_quantity' => $availableQty
                ];
                
                $totalAvailable += $availableQty;
                $remainingNeeded -= $availableQty;
            }
            
            // 5. 決定建議類型
            if ($totalAvailable >= $requestedQty) {
                // 可完全透過調貨滿足
                $suggestion['type'] = 'transfer';
                $suggestion['message'] = '建議從其他門市調貨';
                $suggestion['transfers'] = $transfers;
            } elseif ($totalAvailable > $targetStock) {
                // 需要混合處理（部分調貨+部分進貨）
                $suggestion['type'] = 'mixed';
                $suggestion['message'] = '建議部分調貨，部分向供應商進貨';
                $suggestion['transfers'] = $transfers;
                $suggestion['purchase_quantity'] = $remainingNeeded;
            } else {
                // 只能透過進貨滿足
                $suggestion['type'] = 'purchase';
                $suggestion['message'] = '建議向供應商進貨';
                $suggestion['purchase_quantity'] = $requestedQty - $targetStock;
            }
            
            $suggestions[] = $suggestion;
        }
        
        return $suggestions;
    }
    
    /**
     * 獲取預設門市ID
     * 
     * 優先級：
     * 1. 查找標記為主門市的門市
     * 2. 如果沒有主門市，返回ID最小的門市
     * 3. 如果沒有任何門市，拋出異常
     * 
     * @return int
     * @throws \Exception
     */
    protected function getDefaultStoreId(): int
    {
        // 🎯 直接使用第一個門市作為預設門市（按 ID 排序）
        $store = Store::orderBy('id')->first();
        
        if (!$store) {
            throw new \Exception('系統中沒有任何門市，請先創建門市後再進行庫存操作');
        }
        
        return $store->id;
    }

    /**
     * 確保門市ID有效
     * 
     * 如果未提供門市ID，則使用預設門市
     * 
     * @param int|null $storeId 門市ID
     * @return int 有效的門市ID
     * @throws \Exception
     */
    protected function ensureValidStoreId(?int $storeId = null): int
    {
        if ($storeId) {
            // 驗證門市是否存在
            if (!Store::where('id', $storeId)->exists()) {
                throw new \InvalidArgumentException("門市ID {$storeId} 不存在");
            }
            return $storeId;
        }
        
        return $this->getDefaultStoreId();
    }

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
        return $this->executeInTransaction(function () use ($productVariantId, $quantity, $storeId, $notes, $metadata) {
            // 🎯 使用預設門市邏輯，確保門市ID有效
            $effectiveStoreId = $this->ensureValidStoreId($storeId);

            // 獲取或創建庫存記錄
            $inventory = Inventory::lockForUpdate()
                ->firstOrCreate(
                    [
                        'product_variant_id' => $productVariantId,
                        'store_id' => $effectiveStoreId
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
            $userId = $this->requireAuthentication('庫存操作');
            
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
        return $this->executeInTransaction(function () use ($productVariantId, $quantity, $storeId, $notes, $metadata) {
            // 🎯 使用預設門市邏輯，確保門市ID有效
            $effectiveStoreId = $this->ensureValidStoreId($storeId);

            // 獲取或創建庫存記錄
            $inventory = Inventory::lockForUpdate()
                ->firstOrCreate(
                    [
                        'product_variant_id' => $productVariantId,
                        'store_id' => $effectiveStoreId
                    ],
                    [
                        'quantity' => 0,
                        'low_stock_threshold' => 5
                    ]
                );

            // 返還庫存
            $userId = $this->requireAuthentication('庫存操作');
            
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
        return $this->executeInTransaction(function () use ($items, $storeId, $metadata) {
            return $this->processBatchDeduct($items, $storeId, $metadata);
        });
    }
    
    /**
     * 處理批量扣減的實際邏輯
     */
    private function processBatchDeduct(array $items, ?int $storeId, array $metadata): bool
    {
        $effectiveStoreId = $this->ensureValidStoreId($storeId);
        $userId = auth()->id();
        
        if (!$userId) {
            throw new \InvalidArgumentException('用戶必須經過認證才能扣減庫存');
        }
        
        // 收集需要處理的商品變體ID
        $variantIds = collect($items)
            ->filter(fn($item) => isset($item['product_variant_id']) && $item['is_stocked_sale'])
            ->pluck('product_variant_id')
            ->unique()
            ->sort() // 統一排序避免死鎖
            ->values();
        
        if ($variantIds->isEmpty()) {
            return true;
        }
        
        // 批量獲取並鎖定庫存記錄
        $inventories = Inventory::whereIn('product_variant_id', $variantIds)
            ->where('store_id', $effectiveStoreId)
            ->lockForUpdate()
            ->get()
            ->keyBy('product_variant_id');
        
        // 處理每個項目
        foreach ($items as $item) {
            if (!isset($item['product_variant_id']) || !$item['is_stocked_sale']) {
                continue;
            }
            
            $inventory = $inventories->get($item['product_variant_id']);
            
            if (!$inventory) {
                // 🎯 自動創建缺失的庫存記錄，初始數量為 0
                $inventory = Inventory::create([
                    'product_variant_id' => $item['product_variant_id'],
                    'store_id' => $effectiveStoreId,
                    'quantity' => 0,
                    'low_stock_threshold' => 0,
                ]);
                
                // 記錄自動創建的日誌
                \Log::warning("自動創建庫存記錄", [
                    'product_variant_id' => $item['product_variant_id'],
                    'store_id' => $effectiveStoreId,
                    'context' => '訂單扣減庫存時發現缺失記錄'
                ]);
                
                // 將新創建的記錄加入集合，以便後續使用
                $inventories->put($item['product_variant_id'], $inventory);
            }
            
            if ($inventory->quantity < $item['quantity']) {
                $productVariant = ProductVariant::find($item['product_variant_id']);
                throw new \Exception(
                    "庫存不足：商品 {$productVariant->sku} 需求 {$item['quantity']}，可用 {$inventory->quantity}"
                );
            }
            
            // 扣減庫存
            $inventory->quantity -= $item['quantity'];
            $inventory->save();
            
            // 記錄交易
            $inventory->transactions()->create([
                'quantity' => -$item['quantity'],
                'before_quantity' => $inventory->quantity + $item['quantity'],
                'after_quantity' => $inventory->quantity,
                'user_id' => $userId,
                'type' => 'deduct',
                'notes' => "訂單商品：{$item['product_name']}",
                'metadata' => json_encode($metadata),
            ]);
        }
        
        return true;
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
        return $this->executeInTransaction(function () use ($items, $storeId, $metadata) {
            return $this->processBatchReturn($items, $storeId, $metadata);
        });
    }
    
    /**
     * 處理批量返還的實際邏輯
     */
    private function processBatchReturn($items, ?int $storeId, array $metadata): bool
    {
        $effectiveStoreId = $this->ensureValidStoreId($storeId);
        $userId = auth()->id();
        
        if (!$userId) {
            throw new \InvalidArgumentException('用戶必須經過認證才能返還庫存');
        }
        
        // 統一轉換為陣列格式並收集需要處理的商品變體ID
        $processItems = [];
        foreach ($items as $item) {
            $productVariantId = is_array($item) ? ($item['product_variant_id'] ?? null) : $item->product_variant_id;
            $isStockedSale = is_array($item) ? ($item['is_stocked_sale'] ?? false) : $item->is_stocked_sale;
            $quantity = is_array($item) ? ($item['quantity'] ?? 0) : $item->quantity;
            $productName = is_array($item) ? ($item['product_name'] ?? '') : $item->product_name;
            
            if ($productVariantId && $isStockedSale) {
                $processItems[] = [
                    'product_variant_id' => $productVariantId,
                    'quantity' => $quantity,
                    'product_name' => $productName
                ];
            }
        }
        
        if (empty($processItems)) {
            return true;
        }
        
        // 收集並排序商品變體ID（避免死鎖）
        $variantIds = collect($processItems)
            ->pluck('product_variant_id')
            ->unique()
            ->sort()
            ->values();
        
        // 批量獲取並鎖定庫存記錄
        $inventories = Inventory::whereIn('product_variant_id', $variantIds)
            ->where('store_id', $effectiveStoreId)
            ->lockForUpdate()
            ->get()
            ->keyBy('product_variant_id');
        
        // 處理每個項目
        foreach ($processItems as $item) {
            $inventory = $inventories->get($item['product_variant_id']);
            
            if (!$inventory) {
                // 如果庫存記錄不存在，創建新的
                $inventory = Inventory::create([
                    'product_variant_id' => $item['product_variant_id'],
                    'store_id' => $effectiveStoreId,
                    'quantity' => 0,
                    'low_stock_threshold' => 5
                ]);
            }
            
            // 返還庫存
            $inventory->quantity += $item['quantity'];
            $inventory->save();
            
            // 記錄交易
            $inventory->transactions()->create([
                'quantity' => $item['quantity'],
                'before_quantity' => $inventory->quantity - $item['quantity'],
                'after_quantity' => $inventory->quantity,
                'user_id' => $userId,
                'type' => 'return',
                'notes' => "訂單取消返還：{$item['product_name']}",
                'metadata' => json_encode($metadata),
            ]);
        }
        
        return true;
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
        // 🎯 使用預設門市邏輯，確保門市ID有效
        $effectiveStoreId = $this->ensureValidStoreId($storeId);

        $inventory = Inventory::where('product_variant_id', $productVariantId)
            ->where('store_id', $effectiveStoreId)
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
        $effectiveStoreId = $this->ensureValidStoreId($storeId);
        
        // 收集需要檢查的商品變體ID
        $variantIds = collect($items)
            ->filter(fn($item) => isset($item['product_variant_id']) && $item['is_stocked_sale'])
            ->pluck('product_variant_id')
            ->unique()
            ->values();
        
        if ($variantIds->isEmpty()) {
            return $results;
        }
        
        // 批量獲取庫存記錄
        $inventories = Inventory::whereIn('product_variant_id', $variantIds)
            ->where('store_id', $effectiveStoreId)
            ->get()
            ->keyBy('product_variant_id');
        
        // 批量獲取商品變體信息
        $variants = ProductVariant::whereIn('id', $variantIds)
            ->get()
            ->keyBy('id');
        
        // 檢查每個項目
        foreach ($items as $item) {
            if (!isset($item['product_variant_id']) || !$item['is_stocked_sale']) {
                continue;
            }
            
            $inventory = $inventories->get($item['product_variant_id']);
            $variant = $variants->get($item['product_variant_id']);
            
            // 🎯 如果沒有庫存記錄，自動創建
            if (!$inventory && $variant) {
                $inventory = Inventory::create([
                    'product_variant_id' => $item['product_variant_id'],
                    'store_id' => $effectiveStoreId,
                    'quantity' => 0,
                    'low_stock_threshold' => 0,
                ]);
                
                \Log::info("庫存檢查時自動創建庫存記錄", [
                    'product_variant_id' => $item['product_variant_id'],
                    'store_id' => $effectiveStoreId,
                    'sku' => $variant->sku
                ]);
            }
            
            $availableQuantity = $inventory ? $inventory->quantity : 0;
            
            // 如果庫存不足，加入結果列表
            if ($availableQuantity < $item['quantity']) {
                $results[] = [
                    'product_variant_id' => $item['product_variant_id'],
                    'sku' => $variant ? $variant->sku : 'Unknown',
                    'product_name' => $item['product_name'] ?? 'Unknown',
                    'requested_quantity' => $item['quantity'],
                    'available_quantity' => $availableQuantity,
                    'is_available' => false
                ];
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

    /**
     * 智能化的自動調貨機制
     *
     * 當訂單項目庫存不足時，此方法會被觸發，嘗試從其他分店自動調貨
     *
     * @param \App\Models\OrderItem $orderItem 庫存不足的訂單項目
     * @param int $requestingStoreId 發起調貨請求的門市ID
     * @return bool 是否成功發起調貨
     */
    public function initiateAutomatedTransfer(\App\Models\OrderItem $orderItem, int $requestingStoreId): bool
    {
        return $this->executeInTransaction(function () use ($orderItem, $requestingStoreId) {
            // 1. 尋找最佳貨源分店
            $sourceStore = Inventory::where('product_variant_id', $orderItem->product_variant_id)
                ->where('store_id', '!=', $requestingStoreId)
                ->where('quantity', '>=', $orderItem->quantity)
                ->orderBy('quantity', 'desc') // 優先從庫存最多的門市調貨
                ->first();

            // 2. 如果找不到貨源，記錄日誌並返回
            if (!$sourceStore) {
                Log::info('自動調貨失敗：所有分店庫存均不足', [
                    'order_item_id' => $orderItem->id,
                    'product_variant_id' => $orderItem->product_variant_id,
                    'requested_quantity' => $orderItem->quantity
                ]);
                // 將狀態更新為預訂中
                $orderItem->update(['status' => 'backordered']);
                return false;
            }

            // 3. 建立調貨單
            $transfer = \App\Models\InventoryTransfer::create([
                'from_store_id' => $sourceStore->store_id,
                'to_store_id' => $requestingStoreId,
                'product_variant_id' => $orderItem->product_variant_id,
                'quantity' => $orderItem->quantity,
                'order_id' => $orderItem->order_id, // 關聯訂單
                'status' => 'pending', // 初始狀態為待處理
                'notes' => '由訂單 ' . $orderItem->order->order_number . ' 自動觸發的庫存調配',
                'user_id' => $this->requireAuthentication('自動調貨')
            ]);

            \Log::info('庫存轉移建立成功', [
                'transfer_id' => $transfer->id,
                'order_id' => $transfer->order_id,
                'status' => $transfer->status,
                'notes' => $transfer->notes,
            ]);

            // 4. 更新訂單項目狀態為「調貨中」
            $orderItem->update(['status' => 'transfer_pending']);

            Log::info('自動調貨成功', [
                'order_item_id' => $orderItem->id,
                'from_store_id' => $sourceStore->store_id,
                'to_store_id' => $requestingStoreId,
                'transfer_id' => $transfer->id
            ]);

            return true;
        });
    }
} 