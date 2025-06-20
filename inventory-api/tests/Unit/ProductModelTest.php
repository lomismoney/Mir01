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

class ProductModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function product_belongs_to_category()
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        $this->assertInstanceOf(Category::class, $product->category);
        $this->assertEquals($category->id, $product->category->id);
    }

    /** @test */
    public function product_has_many_variants()
    {
        $product = Product::factory()->create();
        $variants = ProductVariant::factory()->count(3)->create(['product_id' => $product->id]);

        $this->assertCount(3, $product->variants);
        $this->assertInstanceOf(ProductVariant::class, $product->variants->first());
    }

    /** @test */
    public function product_has_many_attributes()
    {
        $product = Product::factory()->create();
        $attributes = Attribute::factory()->count(2)->create();
        
        $product->attributes()->attach($attributes->pluck('id'));

        $this->assertCount(2, $product->attributes);
        $this->assertInstanceOf(Attribute::class, $product->attributes->first());
    }

    /** @test */
    public function product_has_inventories_through_variants()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $inventory = Inventory::factory()->create(['product_variant_id' => $variant->id]);

        $this->assertCount(1, $product->inventories);
        $this->assertInstanceOf(Inventory::class, $product->inventories->first());
    }

    /** @test */
    public function product_has_correct_fillable_attributes()
    {
        $product = new Product();
        $expected = ['name', 'description', 'category_id'];
        
        $this->assertEquals($expected, $product->getFillable());
    }

    /** @test */
    public function product_has_correct_casts()
    {
        $product = new Product();
        $expectedCasts = [
            'id' => 'int',
            'category_id' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
        
        foreach ($expectedCasts as $key => $expectedType) {
            $this->assertArrayHasKey($key, $product->getCasts());
            $this->assertEquals($expectedType, $product->getCasts()[$key]);
        }
    }

    /** @test */
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

    /** @test */
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

    /** @test */
    public function get_total_stock_attribute_calculates_total_inventory()
    {
        $product = Product::factory()->create();
        $variant1 = ProductVariant::factory()->create(['product_id' => $product->id]);
        $variant2 = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        Inventory::factory()->create(['product_variant_id' => $variant1->id, 'quantity' => 10]);
        Inventory::factory()->create(['product_variant_id' => $variant2->id, 'quantity' => 15]);

        $this->assertEquals(25, $product->total_stock);
    }

    /** @test */
    public function get_variant_count_attribute_counts_variants()
    {
        $product = Product::factory()->create();
        ProductVariant::factory()->count(3)->create(['product_id' => $product->id]);

        $this->assertEquals(3, $product->variant_count);
    }

    /** @test */
    public function get_price_range_attribute_returns_min_max_prices()
    {
        $product = Product::factory()->create();
        ProductVariant::factory()->create(['product_id' => $product->id, 'price' => 100]);
        ProductVariant::factory()->create(['product_id' => $product->id, 'price' => 150]);
        ProductVariant::factory()->create(['product_id' => $product->id, 'price' => 120]);

        $priceRange = $product->price_range;

        $this->assertEquals(100, $priceRange['min']);
        $this->assertEquals(150, $priceRange['max']);
    }

    /** @test */
    public function has_image_returns_false_when_no_image()
    {
        $product = Product::factory()->create();

        $this->assertFalse($product->hasImage());
    }

    /** @test */
    public function get_image_url_returns_null_when_no_image()
    {
        $product = Product::factory()->create();

        $this->assertNull($product->getImageUrl());
    }

    /** @test */
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

    /** @test */
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

    /** @test */
    public function has_conversion_returns_false_when_no_image()
    {
        $product = Product::factory()->create();

        $this->assertFalse($product->hasConversion('thumb'));
    }

    /** @test */
    public function get_available_image_url_returns_empty_string_when_no_image()
    {
        $product = Product::factory()->create();

        $this->assertEquals('', $product->getAvailableImageUrl());
    }

    /** @test */
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

    /** @test */
    public function product_implements_has_media_interface()
    {
        $product = Product::factory()->create();

        $this->assertInstanceOf(\Spatie\MediaLibrary\HasMedia::class, $product);
    }

    /** @test */
    public function product_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(Product::class)));
    }

    /** @test */
    public function product_uses_interacts_with_media_trait()
    {
        $this->assertTrue(in_array('Spatie\MediaLibrary\InteractsWithMedia', class_uses(Product::class)));
    }

    /** @test */
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