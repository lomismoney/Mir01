<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\Product;
use PHPUnit\Framework\Attributes\Test;

class SimpleProductModelTest extends TestCase
{
    #[Test]
    public function product_has_correct_fillable_attributes()
    {
        $expected = ['name', 'description', 'category_id'];
        
        $product = new Product();
        $this->assertEquals($expected, $product->getFillable());
    }

    #[Test]
    public function product_has_correct_casts()
    {
        $product = new Product();
        $expectedCasts = [
            'category_id' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
        
        foreach ($expectedCasts as $key => $expectedType) {
            $this->assertArrayHasKey($key, $product->getCasts());
            $this->assertEquals($expectedType, $product->getCasts()[$key]);
        }
    }

    #[Test]
    public function product_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(Product::class)));
    }

    #[Test]
    public function product_implements_has_media_interface()
    {
        $product = new Product();
        $this->assertInstanceOf(\Spatie\MediaLibrary\HasMedia::class, $product);
    }

    #[Test]
    public function product_uses_interacts_with_media_trait()
    {
        $this->assertTrue(in_array('Spatie\MediaLibrary\InteractsWithMedia', class_uses(Product::class)));
    }
}