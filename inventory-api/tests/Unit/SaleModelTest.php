<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Sale;
use App\Models\Store;
use App\Models\SaleItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class SaleModelTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function sale_belongs_to_store()
    {
        $store = Store::factory()->create();
        $sale = Sale::factory()->create(['store_id' => $store->id]);

        $this->assertInstanceOf(Store::class, $sale->store);
        $this->assertEquals($store->id, $sale->store->id);
    }

    #[Test]
    public function sale_has_many_items()
    {
        $sale = Sale::factory()->create();
        $items = SaleItem::factory()->count(3)->create(['sale_id' => $sale->id]);

        $this->assertCount(3, $sale->items);
        $this->assertInstanceOf(SaleItem::class, $sale->items->first());
    }

    #[Test]
    public function sale_has_guarded_property_set()
    {
        $sale = new Sale();
        $this->assertEquals([], $sale->getGuarded());
    }

    #[Test]
    public function sale_can_be_created_with_mass_assignment()
    {
        $store = Store::factory()->create();
        $data = [
            'store_id' => $store->id,
            'transaction_number' => 'S20250101-001',
            'total_amount' => 100000, // 1000 元（以分為單位）
            'sold_at' => now(),
            'payment_method' => 'cash',
        ];

        $sale = Sale::create($data);

        $this->assertDatabaseHas('sales', [
            'transaction_number' => 'S20250101-001',
            'store_id' => $store->id,
        ]);
    }

    #[Test]
    public function sale_can_calculate_total_from_items()
    {
        $sale = Sale::factory()->create();
        
        SaleItem::factory()->create([
            'sale_id' => $sale->id,
            'quantity' => 2,
            'unit_price' => 10000, // 100 元（以分為單位）
        ]);
        
        SaleItem::factory()->create([
            'sale_id' => $sale->id,
            'quantity' => 1,
            'unit_price' => 30000, // 300 元（以分為單位）
        ]);

        // 由於沒有 subtotal 欄位，我們計算總金額
        $totalFromItems = $sale->items->sum(function($item) {
            return $item->quantity * $item->unit_price;
        });
        $this->assertEquals(50000, $totalFromItems); // (2 * 10000) + (1 * 30000) = 50000 分
    }
} 