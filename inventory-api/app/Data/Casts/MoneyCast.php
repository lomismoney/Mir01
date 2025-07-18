<?php

namespace App\Data\Casts;

use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Support\DataProperty;
use Spatie\LaravelData\Support\Creation\CreationContext;

class MoneyCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): int
    {
        // 來自前端的是浮點數（元），轉換為整數（分）
        return (int) round($value * 100);
    }
} 