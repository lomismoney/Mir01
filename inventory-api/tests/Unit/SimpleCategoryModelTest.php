<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\Category;
use PHPUnit\Framework\Attributes\Test;

class SimpleCategoryModelTest extends TestCase
{
    #[Test]
    public function category_has_correct_fillable_attributes()
    {
        $fillable = ['name', 'description', 'parent_id', 'sort_order'];
        $category = new Category();
        
        $this->assertEquals($fillable, $category->getFillable());
    }

    #[Test]
    public function category_has_correct_casts()
    {
        $category = new Category();
        $expectedCasts = [
            'parent_id' => 'integer',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
        
        foreach ($expectedCasts as $key => $expectedType) {
            $this->assertArrayHasKey($key, $category->getCasts());
            $this->assertEquals($expectedType, $category->getCasts()[$key]);
        }
    }

    #[Test]
    public function category_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(Category::class)));
    }
}