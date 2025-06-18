<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class PurchaseItemResponseData extends Data
{
    public function __construct(
        public int $id,
        public int $product_variant_id,
        public string $sku,
        public string $product_name,
        public int $quantity,
        public float $unit_price,
        public float $cost_price,
        public float $allocated_shipping_cost,
        public float $total_cost_price,
    ) {}
}
