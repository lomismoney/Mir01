<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Data\PurchaseData;
use App\Data\PurchaseItemData;
use App\Services\PurchaseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

class CostCalculationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Store $store;
    protected Product $product;
    protected ProductVariant $variant1;
    protected ProductVariant $variant2;

    protected function setUp(): void
    {
        parent::setUp();

        // 建立測試用戶
        $this->user = User::factory()->admin()->create();

        // 建立測試門市
        $this->store = Store::create([
            'name' => '測試門市',
            'address' => '台北市信義區'
        ]);

        // 建立測試分類
        $category = Category::create([
            'name' => '服飾',
            'description' => '服飾用品'
        ]);

        // 建立測試產品
        $this->product = Product::create([
            'name' => '經典棉質T-shirt',
            'description' => '100%純棉製作',
            'category_id' => $category->id
        ]);

        // 建立測試屬性
        $colorAttribute = Attribute::create(['name' => '顏色']);
        $sizeAttribute = Attribute::create(['name' => '尺寸']);

        // 建立屬性值
        $redValue = AttributeValue::create(['attribute_id' => $colorAttribute->id, 'value' => '紅色']);
        $blueValue = AttributeValue::create(['attribute_id' => $colorAttribute->id, 'value' => '藍色']);
        $sValue = AttributeValue::create(['attribute_id' => $sizeAttribute->id, 'value' => 'S']);

        // 關聯產品與屬性
        $this->product->attributes()->attach([$colorAttribute->id, $sizeAttribute->id]);

        // 建立測試變體
        $this->variant1 = $this->product->variants()->create([
            'sku' => 'T-SHIRT-RED-S',
            'price' => 299.00
        ]);
        $this->variant1->attributeValues()->attach([$redValue->id, $sValue->id]);

        $this->variant2 = $this->product->variants()->create([
            'sku' => 'T-SHIRT-BLUE-S',
            'price' => 299.00
        ]);
        $this->variant2->attributeValues()->attach([$blueValue->id, $sValue->id]);
    }

    /** @test */
    public function it_can_create_purchase_with_cost_calculation()
    {
        $this->actingAs($this->user);

        $purchaseService = new PurchaseService();

        $purchaseData = new PurchaseData(
            store_id: $this->store->id,
            order_number: 'PO-TEST-001',
            purchased_at: Carbon::now(),
            shipping_cost: 200.00, // 運費 200 元
            items: [
                new PurchaseItemData(
                    product_variant_id: $this->variant1->id,
                    quantity: 10,
                    unit_price: 299.00,
                    cost_price: 150.00
                ),
                new PurchaseItemData(
                    product_variant_id: $this->variant2->id,
                    quantity: 5,
                    unit_price: 299.00,
                    cost_price: 160.00
                ),
            ]
        );

        $purchase = $purchaseService->createPurchase($purchaseData);

        // 驗證進貨單建立成功
        $this->assertDatabaseHas('purchases', [
            'id' => $purchase->id,
            'order_number' => 'PO-TEST-001',
            'total_amount' => (10 * 299) + (5 * 299), // 2990 + 1495 = 4485
            'shipping_cost' => 200.00
        ]);

        // 驗證進貨項目的運費攤銷計算
        $items = $purchase->items;
        
        // 第一個項目：10 件，應該攤銷 200 * (10/15) = 133.33
        $item1 = $items->where('product_variant_id', $this->variant1->id)->first();
        $this->assertEquals(133.33, round($item1->allocated_shipping_cost, 2));
        $this->assertEquals(283.33, round($item1->total_cost_price, 2)); // 150 + 133.33

        // 第二個項目：5 件，應該攤銷 200 * (5/15) = 66.67
        $item2 = $items->where('product_variant_id', $this->variant2->id)->first();
        $this->assertEquals(66.67, round($item2->allocated_shipping_cost, 2));
        $this->assertEquals(226.67, round($item2->total_cost_price, 2)); // 160 + 66.67

        // 驗證商品變體的平均成本更新
        $this->variant1->refresh();
        $this->variant2->refresh();

        // variant1: 平均成本 = (150 + 133.33) = 283.33
        $this->assertEquals(283.33, round($this->variant1->average_cost, 2));
        $this->assertEquals(10, $this->variant1->total_purchased_quantity);

        // variant2: 平均成本 = (160 + 66.67) = 226.67
        $this->assertEquals(226.67, round($this->variant2->average_cost, 2));
        $this->assertEquals(5, $this->variant2->total_purchased_quantity);

        // 驗證利潤計算
        // variant1: 利潤 = 299 - 283.33 = 15.67，利潤率 = (15.67/299) * 100 = 5.24%
        $this->assertEquals(15.67, round($this->variant1->profit_amount, 2));
        $this->assertEquals(5.24, round($this->variant1->profit_margin, 2));

        // variant2: 利潤 = 299 - 226.67 = 72.33，利潤率 = (72.33/299) * 100 = 24.19%
        $this->assertEquals(72.33, round($this->variant2->profit_amount, 2));
        $this->assertEquals(24.19, round($this->variant2->profit_margin, 2));
    }

    /** @test */
    public function it_can_handle_multiple_purchases_with_average_cost_calculation()
    {
        $this->actingAs($this->user);

        $purchaseService = new PurchaseService();

        // 第一次進貨
        $purchase1Data = new PurchaseData(
            store_id: $this->store->id,
            order_number: 'PO-TEST-001',
            purchased_at: Carbon::now(),
            shipping_cost: 100.00,
            items: [
                new PurchaseItemData(
                    product_variant_id: $this->variant1->id,
                    quantity: 10,
                    unit_price: 299.00,
                    cost_price: 150.00
                ),
            ]
        );

        $purchaseService->createPurchase($purchase1Data);

        // 第二次進貨
        $purchase2Data = new PurchaseData(
            store_id: $this->store->id,
            order_number: 'PO-TEST-002',
            purchased_at: Carbon::now(),
            shipping_cost: 200.00,
            items: [
                new PurchaseItemData(
                    product_variant_id: $this->variant1->id,
                    quantity: 5,
                    unit_price: 299.00,
                    cost_price: 180.00
                ),
            ]
        );

        $purchaseService->createPurchase($purchase2Data);

        $this->variant1->refresh();

        // 驗證平均成本計算
        // 第一次：10 件，成本 150 + 100 = 250，總成本 = 250 * 10 = 2500
        // 第二次：5 件，成本 180 + 200 = 380，總成本 = 380 * 5 = 1900
        // 平均成本 = (2500 + 1900) / (10 + 5) = 4400 / 15 = 293.33

        $this->assertEquals(293.33, round($this->variant1->average_cost, 2));
        $this->assertEquals(15, $this->variant1->total_purchased_quantity);
        $this->assertEquals(4400, $this->variant1->total_cost_amount);
    }
}
