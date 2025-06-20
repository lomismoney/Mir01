<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\WithCast;
use App\Data\Casts\MoneyCast;
use Illuminate\Support\Carbon;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\Exists;
use App\Models\Purchase;

class PurchaseData extends Data
{
    public function __construct(
        #[Rule(['required', 'integer'])]
        #[Exists('stores', 'id')]
        public int $store_id,

        #[Rule(['required', 'string', 'max:255', 'unique:purchases,order_number'])]
        public string $order_number,

        #[WithCast(MoneyCast::class)]
        #[Rule(['required', 'numeric', 'min:0'])]
        public int $shipping_cost,

        #[Rule(['required', 'array', 'min:1'])]
        #[DataCollectionOf(PurchaseItemData::class)]
        public DataCollection $items,

        #[Rule(['nullable', 'string', 'in:' . Purchase::STATUS_PENDING . ',' . Purchase::STATUS_CONFIRMED . ',' . Purchase::STATUS_IN_TRANSIT . ',' . Purchase::STATUS_RECEIVED . ',' . Purchase::STATUS_COMPLETED . ',' . Purchase::STATUS_CANCELLED . ',' . Purchase::STATUS_PARTIALLY_RECEIVED])]
        public ?string $status,

        #[Rule(['nullable', 'date'])]
        public ?Carbon $purchased_at,
    ) {}
}
