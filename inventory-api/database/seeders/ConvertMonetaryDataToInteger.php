<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ConvertMonetaryDataToInteger extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 檢查是否已經轉換過（檢查是否已經是分為單位）
        $samplePurchase = \DB::table('purchases')->first();
        if ($samplePurchase && $samplePurchase->shipping_cost > 1000) {
            $this->command->info('purchases 表的數據已經轉換為分為單位，跳過轉換');
        } else {
            $this->command->info('轉換 purchases 表的金額數據');
            \DB::statement('
                UPDATE purchases SET 
                    total_amount = ROUND(total_amount * 100),
                    shipping_cost = ROUND(shipping_cost * 100)
                WHERE total_amount IS NOT NULL
            ');
        }
        
        $samplePurchaseItem = \DB::table('purchase_items')->first();
        if ($samplePurchaseItem && $samplePurchaseItem->cost_price > 1000) {
            $this->command->info('purchase_items 表的數據已經轉換為分為單位，跳過轉換');
        } else {
            $this->command->info('轉換 purchase_items 表的金額數據');
            \DB::statement('
                UPDATE purchase_items SET 
                    unit_price = ROUND(unit_price * 100),
                    cost_price = ROUND(cost_price * 100),
                    allocated_shipping_cost = ROUND(allocated_shipping_cost * 100)
                WHERE unit_price IS NOT NULL
            ');
        }

        $sampleProductVariant = \DB::table('product_variants')->first();
        if ($sampleProductVariant && $sampleProductVariant->price > 1000) {
            $this->command->info('product_variants 表的數據已經轉換為分為單位，跳過轉換');
        } else {
            $this->command->info('轉換 product_variants 表的金額數據');
            \DB::statement('
                UPDATE product_variants SET 
                    price = ROUND(price * 100),
                    cost_price = ROUND(cost_price * 100)
                WHERE price IS NOT NULL
            ');
        }

        // 轉換 orders 表的金額數據從 decimal 到 integer（分為單位）
        $sampleOrder = \DB::table('orders')->first();
        if ($sampleOrder && $sampleOrder->subtotal > 1000) {
            $this->command->info('orders 表的數據已經轉換為分為單位，跳過轉換');
        } else {
            $this->command->info('轉換 orders 表的金額數據');
            \DB::statement('
                UPDATE orders SET 
                    subtotal = ROUND(subtotal * 100),
                    shipping_fee = ROUND(shipping_fee * 100),
                    tax = ROUND(tax * 100),
                    discount_amount = ROUND(discount_amount * 100),
                    grand_total = ROUND(grand_total * 100),
                    paid_amount = ROUND(paid_amount * 100)
                WHERE subtotal IS NOT NULL
            ');
        }

        // 轉換 order_items 表的金額數據從 decimal 到 integer（分為單位）
        $sampleOrderItem = \DB::table('order_items')->first();
        if ($sampleOrderItem && $sampleOrderItem->price > 1000) {
            $this->command->info('order_items 表的數據已經轉換為分為單位，跳過轉換');
        } else {
            $this->command->info('轉換 order_items 表的金額數據');
            \DB::statement('
                UPDATE order_items SET 
                    price = ROUND(price * 100),
                    cost = ROUND(IFNULL(cost, 0) * 100),
                    discount_amount = ROUND(discount_amount * 100)
                WHERE price IS NOT NULL
            ');
        }
        
        $this->command->info('金額數據處理完成！');
    }
}
