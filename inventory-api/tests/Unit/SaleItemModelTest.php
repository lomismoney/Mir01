<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SaleItemModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function sale_item_belongs_to_sale()
    {
        $sale = Sale::factory()->create();
        $saleItem = SaleItem::factory()->create(['sale_id' => $sale->id]);

        $this->assertInstanceOf(Sale::class, $saleItem->sale);
        $this->assertEquals($sale->id, $saleItem->sale->id);
    }

    /** @test */
    public function sale_item_belongs_to_product()
    {
        $product = Product::factory()->create();
        $saleItem = SaleItem::factory()->create(['product_id' => $product->id]);

        $this->assertInstanceOf(Product::class, $saleItem->product);
        $this->assertEquals($product->id, $saleItem->product->id);
    }

    /** @test */
    public function sale_item_has_guarded_property_set()
    {
        $saleItem = new SaleItem();
        $this->assertEquals([], $saleItem->getGuarded());
    }

    /** @test */
    public function sale_item_can_be_created_with_mass_assignment()
    {
        $sale = Sale::factory()->create();
        $product = Product::factory()->create();

        $data = [
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_price' => 100,
        ];

        $saleItem = SaleItem::create($data);

        $this->assertDatabaseHas('sale_items', [
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_price' => 100,
        ]);
    }

    /** @test */
    public function sale_item_calculates_subtotal()
    {
        $saleItem = SaleItem::factory()->create([
            'unit_price' => 100,
            'quantity' => 2,
        ]);

        $subtotal = $saleItem->unit_price * $saleItem->quantity;

        $this->assertEquals(200, $subtotal); // 100 * 2
    }

    /** @test */
    public function sale_item_subtotal_equals_unit_price_times_quantity()
    {
        $saleItem = SaleItem::factory()->create([
            'unit_price' => 150,
            'quantity' => 3,
        ]);

        $this->assertEquals(450, $saleItem->unit_price * $saleItem->quantity);
    }
} 