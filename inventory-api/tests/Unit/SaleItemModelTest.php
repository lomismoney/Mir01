<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class SaleItemModelTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function sale_item_belongs_to_sale()
    {
        $sale = Sale::factory()->create();
        $saleItem = SaleItem::factory()->create(['sale_id' => $sale->id]);

        $this->assertInstanceOf(Sale::class, $saleItem->sale);
        $this->assertEquals($sale->id, $saleItem->sale->id);
    }

    #[Test]
    public function sale_item_belongs_to_product()
    {
        $product = Product::factory()->create();
        $saleItem = SaleItem::factory()->create(['product_id' => $product->id]);

        $this->assertInstanceOf(Product::class, $saleItem->product);
        $this->assertEquals($product->id, $saleItem->product->id);
    }

    #[Test]
    public function sale_item_has_guarded_property_set()
    {
        $saleItem = new SaleItem();
        $this->assertEquals([], $saleItem->getGuarded());
    }

    #[Test]
    public function sale_item_can_be_created_with_mass_assignment()
    {
        $sale = Sale::factory()->create();
        $product = Product::factory()->create();

        $data = [
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_price' => 10000, // 100元 = 10000分
        ];

        $saleItem = SaleItem::create($data);

        $this->assertDatabaseHas('sale_items', [
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_price' => 10000, // 期望值也是分
        ]);
    }

    #[Test]
    public function sale_item_calculates_subtotal()
    {
        $saleItem = SaleItem::factory()->create([
            'unit_price' => 10000, // 100元 = 10000分
            'quantity' => 2,
        ]);

        $subtotal = $saleItem->unit_price * $saleItem->quantity;

        $this->assertEquals(20000, $subtotal); // 10000 * 2 = 20000分
    }

    #[Test]
    public function sale_item_subtotal_equals_unit_price_times_quantity()
    {
        $saleItem = SaleItem::factory()->create([
            'unit_price' => 15000, // 150元 = 15000分
            'quantity' => 3,
        ]);

        $this->assertEquals(45000, $saleItem->unit_price * $saleItem->quantity); // 15000 * 3 = 45000分
    }
} 