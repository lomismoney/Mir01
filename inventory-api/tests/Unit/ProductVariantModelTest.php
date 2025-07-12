<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Models\AttributeValue;
use App\Models\Attribute;
use App\Models\Inventory;
use App\Models\PurchaseItem;
use App\Models\OrderItem;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * ProductVariant Model 單元測試
 * 
 * 測試商品變體模型的所有功能，包括：
 * - 關聯關係
 * - 作用域查詢
 * - 自定義屬性
 * - 成本計算邏輯
 */
class ProductVariantModelTest extends TestCase
{
    use RefreshDatabase;
    
    /**
     * 測試變體屬於商品的關聯
     */
    public function test_product_variant_belongs_to_product()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id
        ]);
        
        $this->assertInstanceOf(Product::class, $variant->product);
        $this->assertEquals($product->id, $variant->product->id);
    }
    
    /**
     * 測試變體有多個屬性值的關聯
     */
    public function test_product_variant_has_many_attribute_values()
    {
        $variant = ProductVariant::factory()->create();
        
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $sValue = AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'S'
        ]);
        
        $variant->attributeValues()->attach([$redValue->id, $sValue->id]);
        
        $this->assertCount(2, $variant->attributeValues);
        $this->assertTrue($variant->attributeValues->contains($redValue));
        $this->assertTrue($variant->attributeValues->contains($sValue));
    }
    
    /**
     * 測試變體有多個庫存記錄的關聯
     */
    public function test_product_variant_has_many_inventory()
    {
        $variant = ProductVariant::factory()->create();
        $stores = Store::factory()->count(3)->create();
        
        foreach ($stores as $store) {
            Inventory::factory()->create([
                'product_variant_id' => $variant->id,
                'store_id' => $store->id,
                'quantity' => 100
            ]);
        }
        
        $this->assertCount(3, $variant->inventory);
        $this->assertInstanceOf(Inventory::class, $variant->inventory->first());
    }
    
    /**
     * 測試變體有多個進貨單項目的關聯
     */
    public function test_product_variant_has_many_purchase_items()
    {
        $variant = ProductVariant::factory()->create();
        $purchaseItems = PurchaseItem::factory()->count(2)->create([
            'product_variant_id' => $variant->id
        ]);
        
        $this->assertCount(2, $variant->purchaseItems);
        $this->assertInstanceOf(PurchaseItem::class, $variant->purchaseItems->first());
    }
    
    /**
     * 測試變體有多個訂單項目的關聯
     */
    public function test_product_variant_has_many_order_items()
    {
        $variant = ProductVariant::factory()->create();
        $orderItems = OrderItem::factory()->count(3)->create([
            'product_variant_id' => $variant->id
        ]);
        
        $this->assertCount(3, $variant->orderItems);
        $this->assertInstanceOf(OrderItem::class, $variant->orderItems->first());
    }
    
    /**
     * 測試正確的可填充屬性
     */
    public function test_product_variant_has_correct_fillable_attributes()
    {
        $fillable = [
            'product_id',
            'sku',
            'price',
            'cost_price',
            'average_cost',
            'total_purchased_quantity',
            'total_cost_amount',
            // 金額欄位（分為單位）
            'price_cents',
            'cost_price_cents', 
            'average_cost_cents',
            'total_cost_amount_cents',
        ];
        
        $variant = new ProductVariant();
        $this->assertEquals($fillable, $variant->getFillable());
    }
    
    /**
     * 測試正確的屬性轉型
     */
    public function test_product_variant_has_correct_casts()
    {
        $variant = new ProductVariant();
        $casts = $variant->getCasts();
        
        $this->assertEquals('integer', $casts['product_id']);
        $this->assertEquals('integer', $casts['total_purchased_quantity']);
        // 新的金額欄位（分為單位）
        $this->assertEquals('integer', $casts['price_cents']);
        $this->assertEquals('integer', $casts['cost_price_cents']);
        $this->assertEquals('integer', $casts['average_cost_cents']);
        $this->assertEquals('integer', $casts['total_cost_amount_cents']);
    }
    
    /**
     * 測試根據商品篩選變體的作用域
     */
    public function test_by_product_scope()
    {
        $product1 = Product::factory()->create();
        $product2 = Product::factory()->create();
        
        $variant1 = ProductVariant::factory()->create(['product_id' => $product1->id]);
        $variant2 = ProductVariant::factory()->create(['product_id' => $product1->id]);
        $variant3 = ProductVariant::factory()->create(['product_id' => $product2->id]);
        
        $results = ProductVariant::byProduct($product1->id)->get();
        
        $this->assertCount(2, $results);
        $this->assertTrue($results->contains($variant1));
        $this->assertTrue($results->contains($variant2));
        $this->assertFalse($results->contains($variant3));
    }
    
    /**
     * 測試根據 SKU 查找變體的作用域
     */
    public function test_by_sku_scope()
    {
        $variant1 = ProductVariant::factory()->create(['sku' => 'SKU001']);
        $variant2 = ProductVariant::factory()->create(['sku' => 'SKU002']);
        
        $result = ProductVariant::bySku('SKU001')->first();
        
        $this->assertNotNull($result);
        $this->assertEquals($variant1->id, $result->id);
        $this->assertEquals('SKU001', $result->sku);
    }
    
    /**
     * 測試獲取屬性組合描述
     */
    public function test_get_attribute_combination_attribute()
    {
        $variant = ProductVariant::factory()->create();
        
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $sValue = AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'S'
        ]);
        
        $variant->attributeValues()->attach([$redValue->id, $sValue->id]);
        
        // 重新載入關聯
        $variant->load('attributeValues');
        
        $combination = $variant->attribute_combination;
        $this->assertStringContainsString('紅色', $combination);
        $this->assertStringContainsString('S', $combination);
        $this->assertStringContainsString(' + ', $combination);
    }
    
    /**
     * 測試獲取變體的完整顯示名稱
     */
    public function test_get_full_name_attribute()
    {
        $product = Product::factory()->create(['name' => '經典棉質T-shirt']);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $variant->attributeValues()->attach([$redValue->id]);
        
        // 重新載入關聯
        $variant->load(['product', 'attributeValues']);
        
        $fullName = $variant->full_name;
        $this->assertEquals('經典棉質T-shirt - 紅色', $fullName);
    }
    
    /**
     * 測試沒有屬性值的變體完整名稱
     */
    public function test_get_full_name_attribute_without_attributes()
    {
        $product = Product::factory()->create(['name' => '基本款商品']);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 重新載入關聯
        $variant->load('product');
        
        $fullName = $variant->full_name;
        $this->assertEquals('基本款商品', $fullName);
    }
    
    /**
     * 測試更新平均成本
     */
    public function test_update_average_cost()
    {
        $variant = ProductVariant::factory()->create([
            'total_purchased_quantity' => 100,
            'total_cost_amount' => 10000, // 平均成本 100
            'average_cost' => 100
        ]);
        
        // 新進貨：50個，單價120，運費攤銷10
        $variant->updateAverageCost(50, 120, 10);
        
        // 驗證計算
        // 新成本 = (120 + 10) * 50 = 6500
        // 總數量 = 100 + 50 = 150
        // 總成本 = 10000 + 6500 = 16500
        // 平均成本 = 16500 / 150 = 110
        
        $this->assertEquals(150, $variant->total_purchased_quantity);
        $this->assertEquals(16500, $variant->total_cost_amount);
        $this->assertEquals(110, $variant->average_cost);
    }
    
    /**
     * 測試第一次進貨時更新平均成本
     */
    public function test_update_average_cost_first_purchase()
    {
        $variant = ProductVariant::factory()->create([
            'total_purchased_quantity' => 0,
            'total_cost_amount' => 0,
            'average_cost' => 0
        ]);
        
        // 第一次進貨：100個，單價50，運費攤銷5
        $variant->updateAverageCost(100, 50, 5);
        
        // 驗證計算
        // 新成本 = (50 + 5) * 100 = 5500
        // 平均成本 = 5500 / 100 = 55
        
        $this->assertEquals(100, $variant->total_purchased_quantity);
        $this->assertEquals(5500, $variant->total_cost_amount);
        $this->assertEquals(55, $variant->average_cost);
    }
    
    /**
     * 測試避免除以零的情況
     */
    public function test_update_average_cost_avoid_division_by_zero()
    {
        $variant = ProductVariant::factory()->create([
            'total_purchased_quantity' => 0,
            'total_cost_amount' => 0,
            'average_cost' => 0
        ]);
        
        // 進貨數量為0的邊界情況
        $variant->updateAverageCost(0, 100, 0);
        
        $this->assertEquals(0, $variant->total_purchased_quantity);
        $this->assertEquals(0, $variant->total_cost_amount);
        $this->assertEquals(0, $variant->average_cost);
    }
    
    /**
     * 測試獲取利潤率
     */
    public function test_get_profit_margin_attribute()
    {
        $variant = ProductVariant::factory()->create([
            'price' => 200,
            'average_cost' => 120
        ]);
        
        // 利潤率 = ((200 - 120) / 200) * 100 = 40%
        $this->assertEquals(40, $variant->profit_margin);
    }
    
    /**
     * 測試平均成本為零時的利潤率
     */
    public function test_get_profit_margin_attribute_with_zero_cost()
    {
        $variant = ProductVariant::factory()->create([
            'price' => 200,
            'average_cost' => 0
        ]);
        
        $this->assertEquals(0, $variant->profit_margin);
    }
    
    /**
     * 測試獲取利潤金額
     */
    public function test_get_profit_amount_attribute()
    {
        $variant = ProductVariant::factory()->create([
            'price' => 200,
            'average_cost' => 120
        ]);
        
        // 利潤金額 = 200 - 120 = 80
        $this->assertEquals(80, $variant->profit_amount);
    }
    
    /**
     * 測試變體可以被批量賦值創建
     */
    public function test_product_variant_can_be_created_with_mass_assignment()
    {
        $product = Product::factory()->create();
        
        $data = [
            'product_id' => $product->id,
            'sku' => 'TEST-SKU-001',
            'price' => 150.50,
            'cost_price' => 80.00,
            'average_cost' => 85.00,
            'total_purchased_quantity' => 200,
            'total_cost_amount' => 17000.00,
        ];
        
        $variant = ProductVariant::create($data);
        
        $this->assertDatabaseHas('product_variants', [
            'sku' => 'TEST-SKU-001',
            'price' => 150.50,
            'cost_price' => 80.00,
        ]);
        
        $this->assertEquals($product->id, $variant->product_id);
        $this->assertEquals('150.50', $variant->price);
        $this->assertEquals('80.00', $variant->cost_price);
    }
    
    /**
     * 測試變體使用 HasFactory trait
     */
    public function test_product_variant_uses_has_factory_trait()
    {
        $variant = ProductVariant::factory()->make();
        $this->assertInstanceOf(ProductVariant::class, $variant);
    }
    
    /**
     * 測試 SKU 的唯一性
     */
    public function test_sku_is_unique()
    {
        $variant1 = ProductVariant::factory()->create(['sku' => 'UNIQUE-SKU']);
        
        // 嘗試創建相同 SKU 的變體應該失敗
        $this->expectException(\Illuminate\Database\QueryException::class);
        ProductVariant::factory()->create(['sku' => 'UNIQUE-SKU']);
    }

    /**
     * 測試 HandlesCurrency trait 功能
     */
    public function test_currency_handling()
    {
        $variant = ProductVariant::factory()->create([
            'price' => 99.50,
            'cost_price' => 50.25,
            'average_cost' => 60.75,
            'total_cost_amount' => 1215.00
        ]);
        
        // 驗證金額正確轉換為分並儲存
        $this->assertEquals(9950, $variant->price_cents);
        $this->assertEquals(5025, $variant->cost_price_cents);
        $this->assertEquals(6075, $variant->average_cost_cents);
        $this->assertEquals(121500, $variant->total_cost_amount_cents);
        
        // 驗證金額正確從分轉換為元顯示
        $this->assertEquals(99.50, $variant->price);
        $this->assertEquals(50.25, $variant->cost_price);
        $this->assertEquals(60.75, $variant->average_cost);
        $this->assertEquals(1215.00, $variant->total_cost_amount);
    }

    /**
     * 測試 HandlesCurrency trait 的 yuanToCents 靜態方法
     */
    public function test_yuan_to_cents_conversion()
    {
        $this->assertEquals(0, ProductVariant::yuanToCents(null));
        $this->assertEquals(0, ProductVariant::yuanToCents(0));
        $this->assertEquals(100, ProductVariant::yuanToCents(1));
        $this->assertEquals(9950, ProductVariant::yuanToCents(99.50));
        $this->assertEquals(12345, ProductVariant::yuanToCents('123.45'));
        $this->assertEquals(1, ProductVariant::yuanToCents(0.01));
    }

    /**
     * 測試 HandlesCurrency trait 的 centsToYuan 靜態方法
     */
    public function test_cents_to_yuan_conversion()
    {
        $this->assertEquals(0.00, ProductVariant::centsToYuan(0));
        $this->assertEquals(1.00, ProductVariant::centsToYuan(100));
        $this->assertEquals(99.50, ProductVariant::centsToYuan(9950));
        $this->assertEquals(123.45, ProductVariant::centsToYuan(12345));
        $this->assertEquals(0.01, ProductVariant::centsToYuan(1));
    }
}