<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Product;
use App\Models\Category;
use App\Models\ProductVariant;
use App\Models\Attribute;
use App\Models\Inventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class ProductModelTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function product_belongs_to_category()
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        $this->assertInstanceOf(Category::class, $product->category);
        $this->assertEquals($category->id, $product->category->id);
    }

    #[Test]
    public function product_has_many_variants()
    {
        $product = Product::factory()->create();
        $variants = ProductVariant::factory()->count(3)->create(['product_id' => $product->id]);

        $this->assertCount(3, $product->variants);
        $this->assertInstanceOf(ProductVariant::class, $product->variants->first());
    }

    #[Test]
    public function product_has_many_attributes()
    {
        $product = Product::factory()->create();
        $attributes = Attribute::factory()->count(2)->create();
        
        $product->attributes()->attach($attributes->pluck('id'));

        $this->assertCount(2, $product->attributes);
        $this->assertInstanceOf(Attribute::class, $product->attributes->first());
    }

    #[Test]
    public function product_has_inventories_through_variants()
    {
        // 重置自增 ID
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'sqlite') {
            \Illuminate\Support\Facades\DB::statement('DELETE FROM sqlite_sequence WHERE name IN ("inventories", "product_variants", "products", "stores")');
        }
        
        // 手動清理可能殘留的數據
        \App\Models\Inventory::query()->delete();
        \App\Models\ProductVariant::query()->delete();
        \App\Models\Product::query()->delete();
        \App\Models\Store::query()->delete();
        
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 直接使用 create 並指定屬性，避免 factory 衝突
        $store = \App\Models\Store::factory()->create(['name' => 'Test Store Unique 1']);
        $inventory = \App\Models\Inventory::create([
            'product_variant_id' => $variant->id,
            'store_id' => $store->id,
            'quantity' => 50,
            'low_stock_threshold' => 10,
        ]);

        $this->assertCount(1, $product->inventories);
        $this->assertInstanceOf(Inventory::class, $product->inventories->first());
    }

    #[Test]
    public function product_has_correct_fillable_attributes()
    {
        $product = new Product();
        $expected = ['name', 'description', 'category_id'];
        
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
    public function by_category_scope_filters_products_by_category()
    {
        $category1 = Category::factory()->create();
        $category2 = Category::factory()->create();
        
        $product1 = Product::factory()->create(['category_id' => $category1->id]);
        $product2 = Product::factory()->create(['category_id' => $category1->id]);
        $product3 = Product::factory()->create(['category_id' => $category2->id]);

        $result = Product::byCategory($category1->id)->get();

        $this->assertCount(2, $result);
        $this->assertTrue($result->contains($product1));
        $this->assertTrue($result->contains($product2));
        $this->assertFalse($result->contains($product3));
    }

    #[Test]
    public function search_name_scope_filters_products_by_name()
    {
        $product1 = Product::factory()->create(['name' => 'Red T-Shirt']);
        $product2 = Product::factory()->create(['name' => 'Blue T-Shirt']);
        $product3 = Product::factory()->create(['name' => 'Green Pants']);

        $result = Product::searchName('T-Shirt')->get();

        $this->assertCount(2, $result);
        $this->assertTrue($result->contains($product1));
        $this->assertTrue($result->contains($product2));
        $this->assertFalse($result->contains($product3));
    }

    #[Test]
    public function get_total_stock_attribute_calculates_total_inventory()
    {
        // 手動清理可能殘留的數據
        \App\Models\Inventory::query()->delete();
        \App\Models\ProductVariant::query()->delete();
        \App\Models\Product::query()->delete();
        \App\Models\Store::query()->delete();
        
        $product = Product::factory()->create();
        $variant1 = ProductVariant::factory()->create(['product_id' => $product->id]);
        $variant2 = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 確保使用不同的門市來避免唯一約束衝突
        $store1 = \App\Models\Store::factory()->create(['name' => 'Test Store A']);
        $store2 = \App\Models\Store::factory()->create(['name' => 'Test Store B']);
        
        // 直接創建庫存記錄避免 factory 衝突
        \App\Models\Inventory::create([
            'product_variant_id' => $variant1->id,
            'store_id' => $store1->id,
            'quantity' => 10,
            'low_stock_threshold' => 5,
        ]);
        
        \App\Models\Inventory::create([
            'product_variant_id' => $variant2->id,
            'store_id' => $store2->id,
            'quantity' => 15,
            'low_stock_threshold' => 5,
        ]);

        $this->assertEquals(25, $product->total_stock);
    }

    #[Test]
    public function get_variant_count_attribute_counts_variants()
    {
        $product = Product::factory()->create();
        ProductVariant::factory()->count(3)->create(['product_id' => $product->id]);

        $this->assertEquals(3, $product->variant_count);
    }

    #[Test]
    public function get_price_range_attribute_returns_min_max_prices()
    {
        $product = Product::factory()->create();
        ProductVariant::factory()->create(['product_id' => $product->id, 'price' => 10000]); // 100.00 in cents
        ProductVariant::factory()->create(['product_id' => $product->id, 'price' => 15000]); // 150.00 in cents
        ProductVariant::factory()->create(['product_id' => $product->id, 'price' => 12000]); // 120.00 in cents

        // 重新載入 product 以獲取最新的 variants 關聯
        $product = $product->fresh(['variants']);
        $priceRange = $product->price_range;

        $this->assertEquals(10000, $priceRange['min']);
        $this->assertEquals(15000, $priceRange['max']);
    }

    #[Test]
    public function has_image_returns_false_when_no_image()
    {
        $product = Product::factory()->create();

        $this->assertFalse($product->hasImage());
    }

    #[Test]
    public function get_image_url_returns_null_when_no_image()
    {
        $product = Product::factory()->create();

        $this->assertNull($product->getImageUrl());
    }

    #[Test]
    public function get_image_urls_returns_empty_array_when_no_image()
    {
        $product = Product::factory()->create();

        $imageUrls = $product->getImageUrls();

        $this->assertIsArray($imageUrls);
        $this->assertArrayHasKey('original', $imageUrls);
        $this->assertArrayHasKey('thumb', $imageUrls);
        $this->assertArrayHasKey('medium', $imageUrls);
        $this->assertArrayHasKey('large', $imageUrls);
        $this->assertNull($imageUrls['original']);
    }

    #[Test]
    public function get_image_paths_returns_empty_strings_when_no_image()
    {
        $product = Product::factory()->create();

        $imagePaths = $product->getImagePaths();

        $this->assertIsArray($imagePaths);
        $this->assertEquals('', $imagePaths['original']);
        $this->assertEquals('', $imagePaths['thumb']);
        $this->assertEquals('', $imagePaths['medium']);
        $this->assertEquals('', $imagePaths['large']);
    }

    #[Test]
    public function has_conversion_returns_false_when_no_image()
    {
        $product = Product::factory()->create();

        $this->assertFalse($product->hasConversion('thumb'));
    }

    #[Test]
    public function get_available_image_url_returns_empty_string_when_no_image()
    {
        $product = Product::factory()->create();

        $this->assertEquals('', $product->getAvailableImageUrl());
    }

    #[Test]
    public function product_can_be_created_with_mass_assignment()
    {
        $category = Category::factory()->create();
        $data = [
            'name' => 'Test Product',
            'description' => 'Test Description',
            'category_id' => $category->id,
        ];

        $product = Product::create($data);

        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'description' => 'Test Description',
            'category_id' => $category->id,
        ]);
    }

    #[Test]
    public function product_implements_has_media_interface()
    {
        $product = Product::factory()->create();

        $this->assertInstanceOf(\Spatie\MediaLibrary\HasMedia::class, $product);
    }

    #[Test]
    public function product_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(Product::class)));
    }

    #[Test]
    public function product_uses_interacts_with_media_trait()
    {
        $this->assertTrue(in_array('Spatie\MediaLibrary\InteractsWithMedia', class_uses(Product::class)));
    }

    #[Test]
    public function product_can_attach_and_detach_attributes()
    {
        $product = Product::factory()->create();
        $attribute = Attribute::factory()->create();
        
        $product->attributes()->attach($attribute->id);
        $this->assertCount(1, $product->attributes);
        
        $product->attributes()->detach($attribute->id);
        $this->assertCount(0, $product->fresh()->attributes);
    }
} 