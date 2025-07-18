<?php

namespace Database\Factories;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

class SaleItemFactory extends Factory
{
    protected $model = SaleItem::class;

    public function definition()
    {
        $quantity = $this->faker->numberBetween(1, 10);
        $unitPrice = $this->faker->numberBetween(50, 500);
        
        return [
            'sale_id' => Sale::factory(),
            'product_id' => Product::factory(),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
        ];
    }
} 