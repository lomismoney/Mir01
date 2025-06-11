<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Attributes\WithCast;
use Illuminate\Support\Carbon;

class ProductData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $name,
        public readonly string $sku,
        public readonly ?string $description,
        public readonly float|int $selling_price,
        public readonly float|int $cost_price,

        #[WithCast(DateTimeInterfaceCast::class, timeZone: 'Asia/Taipei')]
        public readonly Carbon|Lazy|null $created_at,

        #[WithCast(DateTimeInterfaceCast::class, timeZone: 'Asia/Taipei')]
        public readonly Carbon|Lazy|null $updated_at,
    ) {}
}
