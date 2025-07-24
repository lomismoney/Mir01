<?php

namespace App\Services;

use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 商品變體服務類別
 * 
 * 負責處理 ProductVariant (SKU) 相關的業務邏輯
 * 將原本在 Model 層的業務邏輯移至 Service 層
 */
class ProductVariantService
{
    /**
     * 更新累計進貨數量和成本
     * 
     * 使用加權平均法計算新的平均成本
     * 所有金額以分為單位進行計算，避免浮點數精度問題
     * 
     * @param ProductVariant $variant 商品變體
     * @param int $newQuantity 新進貨數量
     * @param int|null $unitCostCents 單位成本（包含運費攤銷，分為單位），若為null則不更新成本
     * @return void
     */
    public function updatePurchasedQuantity(ProductVariant $variant, int $newQuantity, ?int $unitCostCents = null): void
    {
        if ($newQuantity <= 0) {
            return; // 不處理無效數量
        }

        DB::transaction(function () use ($variant, $newQuantity, $unitCostCents) {
            // 鎖定變體記錄以防止並發問題
            $variant = ProductVariant::lockForUpdate()->find($variant->id);
            
            $originalQuantity = $variant->total_purchased_quantity ?? 0;
            // 從資料庫取得原始分值
            $originalTotalCostCents = $variant->getRawOriginal('total_cost_amount') ?? 0;
            
            // 更新數量
            $newTotalQuantity = $originalQuantity + $newQuantity;
            
            $updates = ['total_purchased_quantity' => $newTotalQuantity];
            
            if ($unitCostCents !== null) {
                // 更新總成本（包含新進貨的成本，以分計算）
                $newTotalCostCents = $originalTotalCostCents + ($newQuantity * $unitCostCents);
                
                // 計算新的平均成本（以分計算）
                $newAverageCostCents = $newTotalQuantity > 0 ? (int) round($newTotalCostCents / $newTotalQuantity) : 0;
                
                $updates['total_cost_amount'] = $newTotalCostCents;
                $updates['average_cost'] = $newAverageCostCents;
                
                Log::info('更新商品變體累計成本', [
                    'variant_id' => $variant->id,
                    'sku' => $variant->sku,
                    'original_quantity' => $originalQuantity,
                    'new_quantity' => $newQuantity,
                    'total_quantity' => $newTotalQuantity,
                    'unit_cost_cents' => $unitCostCents,
                    'original_total_cost_cents' => $originalTotalCostCents,
                    'new_total_cost_cents' => $newTotalCostCents,
                    'new_average_cost_cents' => $newAverageCostCents
                ]);
            }
            
            // 使用 DB update 避免觸發 mutators
            DB::table('product_variants')
                ->where('id', $variant->id)
                ->update($updates);
        });
    }

    /**
     * 更新平均成本（保留此方法用於向後兼容）
     * 
     * 內部調用 updatePurchasedQuantity 方法
     * 
     * @param ProductVariant $variant 商品變體
     * @param int $newQuantity 新進貨數量
     * @param int $unitCost 單位成本（分為單位）
     * @param int $shippingCostPerUnit 每單位分攤的運費（分為單位）
     * @return void
     */
    public function updateAverageCost(ProductVariant $variant, int $newQuantity, int $unitCost, int $shippingCostPerUnit = 0): void
    {
        // 計算總單位成本（包含運費）
        $totalUnitCost = $unitCost + $shippingCostPerUnit;
        
        // 委託給 updatePurchasedQuantity 方法
        $this->updatePurchasedQuantity($variant, $newQuantity, $totalUnitCost);
    }

    /**
     * 獲取商品變體的利潤率
     * 
     * @param ProductVariant $variant 商品變體
     * @return float 利潤率百分比
     */
    public function calculateProfitMargin(ProductVariant $variant): float
    {
        // 獲取原始資料庫值（分）
        $priceCents = $variant->getRawOriginal('price') ?? 0;
        $costPriceCents = $variant->getRawOriginal('cost_price') ?? 0;
        
        // 避免除零錯誤
        if ($priceCents <= 0) {
            return 0.0;
        }
        
        return (($priceCents - $costPriceCents) / $priceCents) * 100;
    }

    /**
     * 獲取商品變體的利潤金額
     * 
     * @param ProductVariant $variant 商品變體
     * @return float 利潤金額（元）
     */
    public function calculateProfitAmount(ProductVariant $variant): float
    {
        // 獲取原始資料庫值（分）
        $priceCents = $variant->getRawOriginal('price') ?? 0;
        $costPriceCents = $variant->getRawOriginal('cost_price') ?? 0;
        
        // 計算利潤並轉換為元
        $profitCents = $priceCents - $costPriceCents;
        return round($profitCents / 100, 2);
    }

    /**
     * 批量更新商品變體的累計數據
     * 
     * @param array $updates 更新數據陣列，格式：[['variant_id' => 1, 'quantity' => 10, 'unit_cost_cents' => 1000], ...]
     * @return void
     */
    public function batchUpdatePurchasedQuantities(array $updates): void
    {
        DB::transaction(function () use ($updates) {
            foreach ($updates as $update) {
                $variant = ProductVariant::find($update['variant_id']);
                if ($variant) {
                    $this->updatePurchasedQuantity(
                        $variant,
                        $update['quantity'],
                        $update['unit_cost_cents'] ?? null
                    );
                }
            }
        });
    }
}