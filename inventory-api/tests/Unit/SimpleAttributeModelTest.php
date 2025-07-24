<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\Attribute;
use PHPUnit\Framework\Attributes\Test;

class SimpleAttributeModelTest extends TestCase
{
    #[Test]
    public function attribute_has_correct_fillable_attributes()
    {
        $attribute = new Attribute();
        $expected = ['name'];
        
        $this->assertEquals($expected, $attribute->getFillable());
    }

    #[Test]
    public function attribute_has_correct_casts()
    {
        $attribute = new Attribute();
        $expectedCasts = [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
        
        foreach ($expectedCasts as $key => $expectedType) {
            $this->assertArrayHasKey($key, $attribute->getCasts());
            $this->assertEquals($expectedType, $attribute->getCasts()[$key]);
        }
    }

    #[Test]
    public function attribute_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(Attribute::class)));
    }
}