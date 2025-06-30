<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class CategoryModelTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function category_has_parent_relationship()
    {
        $parent = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => $parent->id]);
        
        $this->assertInstanceOf(Category::class, $child->parent);
        $this->assertEquals($parent->id, $child->parent->id);
    }

    #[Test]
    public function category_has_children_relationship()
    {
        $parent = Category::factory()->create();
        $child1 = Category::factory()->create(['parent_id' => $parent->id]);
        $child2 = Category::factory()->create(['parent_id' => $parent->id]);
        
        $this->assertCount(2, $parent->children);
        $this->assertTrue($parent->children->contains($child1));
        $this->assertTrue($parent->children->contains($child2));
    }

    #[Test]
    public function category_has_descendants_relationship()
    {
        $grandparent = Category::factory()->create();
        $parent = Category::factory()->create(['parent_id' => $grandparent->id]);
        $child = Category::factory()->create(['parent_id' => $parent->id]);
        
        $descendants = $grandparent->descendants;
        
        $this->assertCount(1, $descendants); // 直接子分類
        $this->assertEquals($parent->id, $descendants->first()->id);
        
        // 檢查子分類的後代
        $this->assertCount(1, $descendants->first()->descendants);
        $this->assertEquals($child->id, $descendants->first()->descendants->first()->id);
    }

    #[Test]
    public function category_has_products_relationship()
    {
        $category = Category::factory()->create();
        $product1 = Product::factory()->create(['category_id' => $category->id]);
        $product2 = Product::factory()->create(['category_id' => $category->id]);
        
        $this->assertCount(2, $category->products);
        $this->assertTrue($category->products->contains($product1));
        $this->assertTrue($category->products->contains($product2));
    }

    #[Test]
    public function category_has_correct_fillable_attributes()
    {
        $fillable = ['name', 'description', 'parent_id', 'sort_order'];
        $category = new Category();
        
        $this->assertEquals($fillable, $category->getFillable());
    }

    #[Test]
    public function category_can_be_created_with_mass_assignment()
    {
        $data = [
            'name' => '電子產品',
            'description' => '所有電子相關產品',
            'parent_id' => null,
        ];
        
        $category = Category::create($data);
        
        $this->assertDatabaseHas('categories', $data);
        $this->assertEquals($data['name'], $category->name);
        $this->assertEquals($data['description'], $category->description);
        $this->assertNull($category->parent_id);
    }

    #[Test]
    public function category_can_have_parent_category()
    {
        $parent = Category::factory()->create(['name' => '電子產品']);
        $child = Category::factory()->create([
            'name' => '手機',
            'parent_id' => $parent->id,
        ]);
        
        $this->assertEquals($parent->id, $child->parent_id);
        $this->assertEquals($parent->name, $child->parent->name);
    }

    #[Test]
    public function category_can_have_multiple_levels()
    {
        $level1 = Category::factory()->create(['name' => '電子產品']);
        $level2 = Category::factory()->create(['name' => '手機', 'parent_id' => $level1->id]);
        $level3 = Category::factory()->create(['name' => 'iPhone', 'parent_id' => $level2->id]);
        
        // 檢查第三層分類
        $this->assertEquals($level2->id, $level3->parent_id);
        $this->assertEquals('iPhone', $level3->name);
        
        // 檢查第二層分類的子分類
        $this->assertCount(1, $level2->children);
        $this->assertEquals($level3->id, $level2->children->first()->id);
        
        // 檢查第一層分類的子分類
        $this->assertCount(1, $level1->children);
        $this->assertEquals($level2->id, $level1->children->first()->id);
    }

    #[Test]
    public function category_uses_has_factory_trait()
    {
        $this->assertTrue(method_exists(Category::class, 'factory'));
    }

    #[Test]
    public function category_can_have_null_parent()
    {
        $category = Category::factory()->create(['parent_id' => null]);
        
        $this->assertNull($category->parent_id);
        $this->assertNull($category->parent);
    }

    #[Test]
    public function category_can_have_null_description()
    {
        $category = Category::factory()->create(['description' => null]);
        
        $this->assertNull($category->description);
    }
} 