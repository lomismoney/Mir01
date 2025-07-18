<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\WithCast;
use App\Data\Casts\MoneyCast;

class OrderItemBindingData extends Data
{
    public function __construct(
        #[Rule(['required', 'integer'])]
        #[Exists('order_items', 'id')]
        public int $order_item_id,
        
        #[Rule(['required', 'integer', 'min:1'])]
        public int $purchase_quantity,
        
        #[WithCast(MoneyCast::class)]
        #[Rule(['nullable', 'numeric', 'min:0'])]
        public ?int $cost_price = null,
    ) {}
}