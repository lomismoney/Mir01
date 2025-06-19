<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Illuminate\Support\Carbon;

class StoreData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public ?string $address,
        public ?string $phone,
        public ?string $status,
        public ?Carbon $created_at,
        public ?Carbon $updated_at,
    ) {}
} 