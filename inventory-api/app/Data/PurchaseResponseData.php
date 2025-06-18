<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\DataCollection;
use Illuminate\Support\Carbon;

class PurchaseResponseData extends Data
{
    public function __construct(
        public int $id,
        public string $order_number,
        public float $total_amount,
        public float $shipping_cost,
        public string $status,
        public Carbon $purchased_at,
        /** @var DataCollection<int, PurchaseItemResponseData> */
        public DataCollection $items,
    ) {}
}
