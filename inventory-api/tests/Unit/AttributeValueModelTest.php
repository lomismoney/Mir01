<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class AttributeValueModelTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function attribute_value_belongs_to_attribute()
    {
        $attribute = Attribute::factory()->create();
        $attributeValue = AttributeValue::factory()->create(['attribute_id' => $attribute->id]);

        $this->assertInstanceOf(Attribute::class, $attributeValue->attribute);
        $this->assertEquals($attribute->id, $attributeValue->attribute->id);
    }

    #[Test]
    public function attribute_value_has_many_product_variants()
    {
        $attributeValue = AttributeValue::factory()->create();
        $productVariants = ProductVariant::factory()->count(2)->create();
        
        $attributeValue->productVariants()->attach($productVariants->pluck('id'));

        $this->assertCount(2, $attributeValue->productVariants);
        $this->assertInstanceOf(ProductVariant::class, $attributeValue->productVariants->first());
    }

    #[Test]
    public function attribute_value_has_correct_fillable_attributes()
    {
        $attributeValue = new AttributeValue();
        $expected = ['attribute_id', 'value'];
        
        $this->assertEquals($expected, $attributeValue->getFillable());
    }

    #[Test]
    public function attribute_value_has_correct_casts()
    {
        $attributeValue = new AttributeValue();
        $expectedCasts = [
            'id' => 'int',
            'attribute_id' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
        
        foreach ($expectedCasts as $key => $expectedType) {
            $this->assertArrayHasKey($key, $attributeValue->getCasts());
            $this->assertEquals($expectedType, $attributeValue->getCasts()[$key]);
        }
    }

    #[Test]
    public function attribute_value_can_be_created_with_mass_assignment()
    {
        $attribute = Attribute::factory()->create();
        $data = [
            'attribute_id' => $attribute->id,
            'value' => 'Red',
        ];

        $attributeValue = AttributeValue::create($data);

        $this->assertDatabaseHas('attribute_values', [
            'attribute_id' => $attribute->id,
            'value' => 'Red',
        ]);
    }

    #[Test]
    public function by_attribute_scope_filters_values_by_attribute_id()
    {
        $attribute1 = Attribute::factory()->create();
        $attribute2 = Attribute::factory()->create();
        
        $value1 = AttributeValue::factory()->create(['attribute_id' => $attribute1->id]);
        $value2 = AttributeValue::factory()->create(['attribute_id' => $attribute1->id]);
        $value3 = AttributeValue::factory()->create(['attribute_id' => $attribute2->id]);

        $result = AttributeValue::byAttribute($attribute1->id)->get();

        $this->assertCount(2, $result);
        $this->assertTrue($result->contains($value1));
        $this->assertTrue($result->contains($value2));
        $this->assertFalse($result->contains($value3));
    }

    #[Test]
    public function attribute_value_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(AttributeValue::class)));
    }

    #[Test]
    public function attribute_value_can_detach_from_product_variants()
    {
        $attributeValue = AttributeValue::factory()->create();
        $productVariant = ProductVariant::factory()->create();
        
        $attributeValue->productVariants()->attach($productVariant->id);
        $this->assertCount(1, $attributeValue->productVariants);
        
        $attributeValue->productVariants()->detach($productVariant->id);
        $this->assertCount(0, $attributeValue->fresh()->productVariants);
    }
} 