<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Refund>
 */
class RefundFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            /**
             * 關聯的訂單ID
             * 使用 Order factory 建立新訂單，或從現有訂單中選擇
             */
            'order_id' => Order::factory(),
            
            /**
             * 創建退款的操作員ID
             * 使用 User factory 建立新用戶，或從現有用戶中選擇
             */
            'creator_id' => User::factory(),
            
            /**
             * 退款總金額
             * 產生介於 10.00 到 500.00 之間的隨機金額（以分為單位）
             */
            'total_refund_amount' => $this->faker->numberBetween(1000, 50000), // 10.00 to 500.00 in cents
            
            /**
             * 退款原因
             * 從預定義的退款原因中隨機選擇
             */
            'reason' => $this->faker->randomElement([
                '商品瑕疵',
                '配送錯誤',
                '客戶改變心意',
                '商品不符預期',
                '重複訂購',
                '其他'
            ]),
            
            /**
             * 退款備註
             * 有 70% 機率會有備註內容
             */
            'notes' => $this->faker->optional(0.7)->sentence(),
            
            /**
             * 是否回補庫存
             * 80% 的退款會回補庫存
             */
            'should_restock' => $this->faker->boolean(80),
        ];
    }
}
