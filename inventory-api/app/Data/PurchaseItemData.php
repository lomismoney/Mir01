<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\Exists;

class PurchaseItemData extends Data
{
    public function __construct(
        #[Rule(['required']), Exists('product_variants', 'id')]
        public int $product_variant_id,

        #[Rule(['required', 'integer', 'min:1'])]
        public int $quantity,

        #[Rule(['required', 'numeric', 'min:0'])]
        public float|int $unit_price,

        #[Rule(['required', 'numeric', 'min:0'])]
        public float|int $cost_price,
    ) {}
}
