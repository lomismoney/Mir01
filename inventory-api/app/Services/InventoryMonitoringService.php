<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Events\LowStockAlert;
use App\Events\StockExhausted;
use App\Events\InventoryAnomalyDetected;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class InventoryMonitoringService
{
    /**
     * 檢查低庫存商品
     * 
     * @param int|null $storeId 指定門市ID，null表示檢查所有門市
     * @return array 低庫存警報列表
     */
    public function checkLowStock(?int $storeId = null): array
    {
        Log::info('執行低庫存檢查', ['store_id' => $storeId]);
        
        $query = Inventory::with(['productVariant.product'])
            ->whereColumn('quantity', '<=', 'low_stock_threshold')
            ->where('quantity', '>', 0);
            
        if ($storeId) {
            $query->where('store_id', $storeId);
        }
        
        $lowStockItems = $query->get();
        $alerts = [];
        
        foreach ($lowStockItems as $inventory) {
            $alert = [
                'inventory_id' => $inventory->id,
                'product_variant_id' => $inventory->product_variant_id,
                'product_name' => $inventory->productVariant->product->name ?? 'Unknown',
                'sku' => $inventory->productVariant->sku ?? 'Unknown',
                'current_quantity' => $inventory->quantity,
                'threshold' => $inventory->low_stock_threshold,
                'store_id' => $inventory->store_id,
                'alert_type' => 'low_stock',
                'created_at' => now(),
            ];
            
            $alerts[] = $alert;
            
            // 觸發低庫存事件
            event(new LowStockAlert($inventory, $inventory->quantity, $inventory->low_stock_threshold));
        }
        
        Log::info('低庫存檢查完成', ['alerts_count' => count($alerts)]);
        
        return $alerts;
    }
    
    /**
     * 檢查庫存耗盡的商品
     * 
     * @param int|null $storeId
     * @return array
     */
    public function checkExhaustedStock(?int $storeId = null): array
    {
        Log::info('執行庫存耗盡檢查', ['store_id' => $storeId]);
        
        $query = Inventory::with(['productVariant.product'])
            ->where('quantity', '=', 0);
            
        if ($storeId) {
            $query->where('store_id', $storeId);
        }
        
        $exhaustedItems = $query->get();
        $alerts = [];
        
        foreach ($exhaustedItems as $inventory) {
            $alert = [
                'inventory_id' => $inventory->id,
                'product_variant_id' => $inventory->product_variant_id,
                'product_name' => $inventory->productVariant->product->name ?? 'Unknown',
                'sku' => $inventory->productVariant->sku ?? 'Unknown',
                'store_id' => $inventory->store_id,
                'alert_type' => 'stock_exhausted',
                'created_at' => now(),
            ];
            
            $alerts[] = $alert;
            
            // 觸發庫存耗盡事件
            event(new StockExhausted($inventory));
        }
        
        return $alerts;
    }
    
    /**
     * 檢測庫存異常變動
     * 
     * @param int $inventoryId
     * @param int $days 分析過去幾天的數據
     * @return array
     */
    public function detectAnomalies(int $inventoryId, int $days = 30): array
    {
        Log::info('執行庫存異常檢測', ['inventory_id' => $inventoryId, 'days' => $days]);
        
        $inventory = Inventory::findOrFail($inventoryId);
        
        // 獲取歷史交易記錄
        $transactions = InventoryTransaction::where('inventory_id', $inventoryId)
            ->where('created_at', '>=', now()->subDays($days))
            ->orderBy('created_at', 'desc')
            ->get();
            
        if ($transactions->count() < 5) {
            return []; // 數據不足，無法進行異常檢測
        }
        
        // 計算平均變動量和標準差
        $changes = $transactions->pluck('quantity')->toArray();
        $avgChange = array_sum($changes) / count($changes);
        $variance = 0;
        
        foreach ($changes as $change) {
            $variance += pow($change - $avgChange, 2);
        }
        
        $stdDev = sqrt($variance / count($changes));
        
        // 檢測異常（超過2個標準差的變動）
        $anomalies = [];
        foreach ($transactions as $transaction) {
            $deviation = abs($transaction->quantity - $avgChange);
            
            if ($stdDev > 0 && $deviation > (2 * $stdDev)) {
                $anomalyDetails = [
                    'transaction_id' => $transaction->id,
                    'quantity_change' => $transaction->quantity,
                    'average_change' => round($avgChange, 2),
                    'standard_deviation' => round($stdDev, 2),
                    'deviation' => round($deviation, 2),
                    'is_anomaly' => true,
                    'created_at' => $transaction->created_at,
                ];
                
                $anomalies[] = $anomalyDetails;
                
                // 觸發異常檢測事件
                event(new InventoryAnomalyDetected($inventory, $transaction, $anomalyDetails));
            }
        }
        
        return $anomalies;
    }
    
    /**
     * 計算庫存健康度評分
     * 
     * @param Inventory $inventory
     * @return array
     */
    public function calculateHealthScore(Inventory $inventory): array
    {
        $score = 100;
        $factors = [];
        
        // 1. 庫存水平因素 (40分)
        $stockLevel = $inventory->quantity;
        $threshold = $inventory->low_stock_threshold;
        
        if ($stockLevel == 0) {
            $stockScore = 0;
        } elseif ($stockLevel <= $threshold) {
            $stockScore = 20 * ($stockLevel / $threshold);
        } else {
            $stockScore = 40;
        }
        
        $factors['stock_level'] = $stockScore;
        
        // 2. 流動性因素 (30分)
        $recentTransactions = $inventory->transactions()
            ->where('created_at', '>=', now()->subDays(30))
            ->count();
            
        $flowScore = min(30, $recentTransactions * 3);
        $factors['flow_rate'] = $flowScore;
        
        // 3. 預測準確度因素 (30分)
        // 這裡簡化處理，實際應該基於預測vs實際的對比
        $predictionScore = 25; // 預設值
        $factors['prediction_accuracy'] = $predictionScore;
        
        // 計算總分
        $overallScore = $stockScore + $flowScore + $predictionScore;
        
        // 確定狀態
        $status = match(true) {
            $overallScore >= 80 => 'healthy',
            $overallScore >= 60 => 'warning',
            $overallScore >= 40 => 'attention',
            default => 'critical'
        };
        
        return [
            'overall_score' => $overallScore,
            'status' => $status,
            'factors' => $factors,
            'recommendations' => $this->getHealthRecommendations($status, $factors),
        ];
    }
    
    /**
     * 分析庫存趨勢
     * 
     * @param int $inventoryId
     * @param int $days
     * @return array
     */
    public function analyzeTrend(int $inventoryId, int $days = 30): array
    {
        $inventory = Inventory::findOrFail($inventoryId);
        
        // 獲取指定期間的交易記錄
        $transactions = InventoryTransaction::where('inventory_id', $inventoryId)
            ->where('created_at', '>=', now()->subDays($days))
            ->where('type', 'deduct')
            ->get();
            
        // 計算總消耗量
        $totalConsumption = abs($transactions->sum('quantity'));
        $avgDailyConsumption = $totalConsumption / $days;
        
        // 計算預計庫存耗盡天數
        $daysUntilStockout = $inventory->quantity > 0 ? 
            round($inventory->quantity / $avgDailyConsumption) : 0;
            
        // 建議補貨日期（提前7天）
        $recommendedReorderDate = $daysUntilStockout > 7 ? 
            now()->addDays($daysUntilStockout - 7) : now();
            
        return [
            'average_daily_consumption' => round($avgDailyConsumption, 2),
            'total_consumption' => $totalConsumption,
            'current_stock' => $inventory->quantity,
            'days_until_stockout' => $daysUntilStockout,
            'recommended_reorder_date' => $recommendedReorderDate->format('Y-m-d'),
            'trend_direction' => $this->calculateTrendDirection($transactions),
        ];
    }
    
    /**
     * 獲取監控儀表板數據
     * 
     * @param int|null $storeId
     * @return array
     */
    public function getDashboardMetrics(?int $storeId = null): array
    {
        $query = Inventory::with(['productVariant']);
        
        if ($storeId) {
            $query->where('store_id', $storeId);
        }
        
        $inventories = $query->get();
        
        // 統計各種狀態的商品數量
        $metrics = [
            'total_products' => $inventories->count(),
            'low_stock_count' => $inventories->filter(fn($inv) => 
                $inv->quantity > 0 && $inv->quantity <= $inv->low_stock_threshold
            )->count(),
            'out_of_stock_count' => $inventories->where('quantity', 0)->count(),
            'healthy_stock_count' => $inventories->filter(fn($inv) => 
                $inv->quantity > $inv->low_stock_threshold
            )->count(),
            'total_inventory_value' => $inventories->sum(function($inv) {
                return $inv->quantity * ($inv->productVariant->price ?? 0);
            }),
            'alerts' => $this->getActiveAlerts($storeId),
            'recent_activities' => $this->getRecentActivities($storeId, 10),
        ];
        
        return $metrics;
    }
    
    /**
     * 批量監控
     * 
     * @param int|null $storeId
     * @return array
     */
    public function batchMonitor(?int $storeId = null): array
    {
        $startTime = microtime(true);
        
        // 執行各項檢查
        $lowStockAlerts = $this->checkLowStock($storeId);
        $exhaustedAlerts = $this->checkExhaustedStock($storeId);
        
        // 獲取所有庫存項目進行異常檢測
        $query = Inventory::query();
        if ($storeId) {
            $query->where('store_id', $storeId);
        }
        
        $inventories = $query->get();
        $anomaliesCount = 0;
        
        foreach ($inventories as $inventory) {
            $anomalies = $this->detectAnomalies($inventory->id);
            $anomaliesCount += count($anomalies);
        }
        
        $executionTime = round(microtime(true) - $startTime, 2);
        
        return [
            'checked_count' => $inventories->count(),
            'alerts_generated' => count($lowStockAlerts) + count($exhaustedAlerts),
            'anomalies_detected' => $anomaliesCount,
            'execution_time' => $executionTime,
            'timestamp' => now(),
        ];
    }
    
    /**
     * 獲取自動補貨建議
     * 
     * @param int $inventoryId
     * @return array
     */
    public function getReorderSuggestions(int $inventoryId): array
    {
        $inventory = Inventory::findOrFail($inventoryId);
        $trend = $this->analyzeTrend($inventoryId);
        
        // 計算建議補貨量（基於平均消耗和提前期）
        $leadTimeDays = 7; // 預設提前期
        $safetyStockDays = 3; // 安全庫存天數
        
        $avgDailyConsumption = $trend['average_daily_consumption'];
        $reorderPoint = $avgDailyConsumption * ($leadTimeDays + $safetyStockDays);
        $suggestedQuantity = $avgDailyConsumption * 30; // 一個月的用量
        
        return [
            'current_stock' => $inventory->quantity,
            'suggested_quantity' => max(round($suggestedQuantity), 10),
            'reorder_point' => round($reorderPoint),
            'lead_time_days' => $leadTimeDays,
            'safety_stock' => round($avgDailyConsumption * $safetyStockDays),
            'average_daily_consumption' => $avgDailyConsumption,
        ];
    }
    
    /**
     * 獲取健康建議
     * 
     * @param string $status
     * @param array $factors
     * @return array
     */
    private function getHealthRecommendations(string $status, array $factors): array
    {
        $recommendations = [];
        
        if ($factors['stock_level'] < 20) {
            $recommendations[] = '庫存水平過低，建議立即補貨';
        }
        
        if ($factors['flow_rate'] < 15) {
            $recommendations[] = '商品流動性差，考慮促銷或調整定價';
        }
        
        if ($status === 'critical') {
            $recommendations[] = '庫存狀況危急，需要立即採取行動';
        }
        
        return $recommendations;
    }
    
    /**
     * 計算趨勢方向
     * 
     * @param Collection $transactions
     * @return string
     */
    private function calculateTrendDirection(Collection $transactions): string
    {
        if ($transactions->count() < 2) {
            return 'stable';
        }
        
        // 簡單的趨勢判斷：比較前半段和後半段的平均值
        $midPoint = intval($transactions->count() / 2);
        $firstHalf = $transactions->take($midPoint);
        $secondHalf = $transactions->skip($midPoint);
        
        $firstAvg = abs($firstHalf->avg('quantity'));
        $secondAvg = abs($secondHalf->avg('quantity'));
        
        if ($secondAvg > $firstAvg * 1.2) {
            return 'increasing';
        } elseif ($secondAvg < $firstAvg * 0.8) {
            return 'decreasing';
        }
        
        return 'stable';
    }
    
    /**
     * 獲取活躍警報
     * 
     * @param int|null $storeId
     * @return array
     */
    private function getActiveAlerts(?int $storeId): array
    {
        // 這裡應該從警報表中讀取，但為了簡化，我們實時計算
        $alerts = [];
        
        $lowStock = $this->checkLowStock($storeId);
        $exhausted = $this->checkExhaustedStock($storeId);
        
        return array_merge($lowStock, $exhausted);
    }
    
    /**
     * 獲取最近活動
     * 
     * @param int|null $storeId
     * @param int $limit
     * @return array
     */
    private function getRecentActivities(?int $storeId, int $limit = 10): array
    {
        $query = InventoryTransaction::with(['inventory.productVariant'])
            ->orderBy('created_at', 'desc')
            ->limit($limit);
            
        if ($storeId) {
            $query->whereHas('inventory', function($q) use ($storeId) {
                $q->where('store_id', $storeId);
            });
        }
        
        return $query->get()->map(function($transaction) {
            return [
                'type' => $transaction->type,
                'quantity' => $transaction->quantity,
                'product_name' => $transaction->inventory->productVariant->product->name ?? 'Unknown',
                'sku' => $transaction->inventory->productVariant->sku ?? 'Unknown',
                'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                'notes' => $transaction->notes,
            ];
        })->toArray();
    }
}