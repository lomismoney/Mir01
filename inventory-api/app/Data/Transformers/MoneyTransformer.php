<?php

namespace App\Data\Transformers;

use Spatie\LaravelData\Support\DataProperty;
use Spatie\LaravelData\Transformers\Transformer;
use Spatie\LaravelData\Support\Transformation\TransformationContext;

class MoneyTransformer implements Transformer
{
    public function transform(DataProperty $property, mixed $value, TransformationContext $context): int
    {
        // 從資料庫來的整數（分），轉換為四捨五入後的整數（元）
        return (int) round($value / 100);
    }
} 