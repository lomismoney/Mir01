<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Illuminate\Support\Carbon;

class PurchaseData extends Data
{
    public function __construct(
        #[Rule(['required']), Exists('stores', 'id')]
        public int $store_id,

        #[Rule(['required', 'string', 'unique:purchases,order_number'])]
        public string $order_number,

        #[Rule(['nullable', 'date'])]
        public ?Carbon $purchased_at,

        #[Rule(['required', 'numeric', 'min:0'])]
        public float $shipping_cost,

        #[Rule(['required', 'array', 'min:1'])]
        #[DataCollectionOf(PurchaseItemData::class)]
        public array $items,

        // 這個欄位不由客戶端提供，我們會在服務中計算
        public ?float $total_amount = null,
    ) {}
}
