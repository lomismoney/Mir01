<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Attributes\WithCast;
use App\Data\Casts\MoneyCast;

class PurchaseItemData extends Data
{
    public function __construct(
        #[Rule(['required', 'integer'])]
        #[Exists('product_variants', 'id')]
        public int $product_variant_id,

        #[Rule(['required', 'integer', 'min:1'])]
        public int $quantity,

        #[WithCast(MoneyCast::class)]
        #[Rule(['required', 'numeric', 'min:0'])]
        public int $cost_price,
    ) {}
}
