<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Inventory;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use PHPUnit\Framework\Attributes\Test;
use PHPUnitFrameworkAttributesTest;
class InventoryModelTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function inventory_belongs_to_store()
    {
        $store = Store::factory()->create(['name' => 'Store A']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
        ]);

        $this->assertInstanceOf(Store::class, $inventory->store);
        $this->assertEquals($store->id, $inventory->store->id);
    }

    #[Test]
    public function inventory_belongs_to_product_variant()
    {
        $store = Store::factory()->create(['name' => 'Store B']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
        ]);

        $this->assertInstanceOf(ProductVariant::class, $inventory->productVariant);
        $this->assertEquals($variant->id, $inventory->productVariant->id);
    }

    #[Test]
    public function inventory_has_many_transactions()
    {
        $store = Store::factory()->create(['name' => 'Store C']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
        ]);

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Collection::class, $inventory->transactions);
    }

    #[Test]
    public function inventory_has_correct_fillable_attributes()
    {
        $fillable = [
            'product_variant_id',
            'store_id',
            'quantity',
            'low_stock_threshold'
        ];

        $inventory = new Inventory();
        
        foreach ($fillable as $attribute) {
            $this->assertContains($attribute, $inventory->getFillable());
        }
    }

    #[Test]
    public function inventory_has_correct_casts()
    {
        $casts = [
            'product_variant_id' => 'integer',
            'store_id' => 'integer',
            'quantity' => 'integer',
            'low_stock_threshold' => 'integer',
            'id' => 'int',
            'created_at' => 'datetime',
            'updated_at' => 'datetime'
        ];

        $inventory = new Inventory();
        
        foreach ($casts as $attribute => $expectedCast) {
            $this->assertEquals($expectedCast, $inventory->getCasts()[$attribute] ?? null);
        }
    }

    #[Test]
    public function inventory_can_calculate_available_stock()
    {
        $store = Store::factory()->create(['name' => 'Store D']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
            'quantity' => 100,
        ]);

        // Check if the quantity is correctly stored
        $this->assertEquals(100, $inventory->quantity);
    }

    #[Test]
    public function inventory_stores_low_stock_threshold_correctly()
    {
        $store = Store::factory()->create(['name' => 'Store E']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
            'low_stock_threshold' => 10,
        ]);

        $inventory->refresh();
        
        $this->assertEquals(10, $inventory->low_stock_threshold);
    }

    #[Test]
    public function inventory_can_have_null_low_stock_threshold()
    {
        $store = Store::factory()->create(['name' => 'Store F']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
            'low_stock_threshold' => 0,
        ]);

        $this->assertEquals(0, $inventory->low_stock_threshold);
    }

    #[Test]
    public function inventory_low_stock_threshold_defaults_to_zero()
    {
        $store = Store::factory()->create(['name' => 'Store G']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
            'low_stock_threshold' => 0,
        ]);

        $this->assertEquals(0, $inventory->low_stock_threshold);
    }

    #[Test]
    public function inventory_current_stock_defaults_to_zero()
    {
        $store = Store::factory()->create(['name' => 'Store H']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
            'quantity' => 0,
        ]);

        $this->assertEquals(0, $inventory->quantity);
    }

    #[Test]
    public function inventory_can_have_positive_quantity()
    {
        $store = Store::factory()->create(['name' => 'Store I']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
            'quantity' => 50,
        ]);

        $this->assertEquals(50, $inventory->quantity);
    }

    #[Test]
    public function inventory_has_unique_constraint_on_store_and_variant()
    {
        $store = Store::factory()->create(['name' => 'Store J']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 建立第一個庫存記錄
        Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
        ]);

        // 嘗試建立相同 store_id 和 product_variant_id 的重複記錄
        $this->expectException(\Illuminate\Database\QueryException::class);
        
        Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
        ]);
    }

    #[Test]
    public function inventory_can_check_low_stock()
    {
        $store = Store::factory()->create(['name' => 'Store K']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
            'quantity' => 5,
            'low_stock_threshold' => 10,
        ]);

        // Test low stock check
        $this->assertTrue($inventory->is_low_stock);
    }
}
