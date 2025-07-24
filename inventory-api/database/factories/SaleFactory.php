<?php

namespace Database\Factories;

use App\Models\Sale;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

class SaleFactory extends Factory
{
    protected $model = Sale::class;

    public function definition()
    {
        static $transactionNumber = 1;
        
        return [
            'store_id' => Store::factory(),
            'transaction_number' => 'S' . date('Ymd') . '-' . str_pad($transactionNumber++, 3, '0', STR_PAD_LEFT),
            'total_amount' => $this->faker->numberBetween(10000, 1000000), // 100 到 10000 元（以分為單位）
            'sold_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'payment_method' => $this->faker->randomElement(['cash', 'credit_card']),
        ];
    }


} 