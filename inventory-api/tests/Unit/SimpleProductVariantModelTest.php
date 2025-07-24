<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\ProductVariant;
use PHPUnit\Framework\Attributes\Test;

class SimpleProductVariantModelTest extends TestCase
{
    #[Test]
    public function product_variant_has_correct_fillable_attributes()
    {
        $expected = [
            'product_id',
            'sku',
            'price',
            'cost_price',
            'total_purchased_quantity',
        ];
        
        $variant = new ProductVariant();
        $this->assertEquals($expected, $variant->getFillable());
    }

    #[Test]
    public function product_variant_has_correct_casts()
    {
        $variant = new ProductVariant();
        $expectedCasts = [
            'product_id' => 'integer',
            'total_purchased_quantity' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'price' => 'App\Casts\MoneyCast',
            'cost_price' => 'App\Casts\MoneyCast',
        ];
        
        foreach ($expectedCasts as $key => $expectedType) {
            $this->assertArrayHasKey($key, $variant->getCasts());
            $this->assertEquals($expectedType, $variant->getCasts()[$key]);
        }
    }

    #[Test]
    public function product_variant_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(ProductVariant::class)));
    }
}