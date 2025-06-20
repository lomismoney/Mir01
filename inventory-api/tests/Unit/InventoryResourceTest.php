<?php

namespace Tests\Unit;

use App\Http\Resources\Api\InventoryResource;
use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class InventoryResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_resource_without_relations()
    {
        $inventory = Inventory::factory()->create([
            'quantity' => 100,
            'low_stock_threshold' => 10,
        ]);

        $resource = new InventoryResource($inventory);
        $request = new Request();
        
        $result = $resource->toArray($request);

        // 驗證基本欄位
        $this->assertEquals($inventory->id, $result['id']);
        $this->assertEquals($inventory->product_variant_id, $result['product_variant_id']);
        $this->assertEquals($inventory->store_id, $result['store_id']);
        $this->assertEquals(100, $result['quantity']);
        $this->assertEquals(10, $result['low_stock_threshold']);
        $this->assertNotNull($result['created_at']);
        $this->assertNotNull($result['updated_at']);

        // 驗證關聯沒有載入時，Laravel Resource 會包含 MissingValue 實例
        $this->assertInstanceOf(\Illuminate\Http\Resources\MissingValue::class, $result['product_variant']);
        $this->assertInstanceOf(\Illuminate\Http\Resources\MissingValue::class, $result['store']);
    }

    public function test_inventory_resource_with_store_relation()
    {
        $store = Store::factory()->create([
            'name' => 'Test Store',
            'address' => '123 Test Street',
        ]);
        
        $inventory = Inventory::factory()->create(['store_id' => $store->id]);
        $inventory->load('store');

        $resource = new InventoryResource($inventory);
        $request = new Request();
        
        $result = $resource->toArray($request);

        // 驗證 store 關聯
        $this->assertArrayHasKey('store', $result);
        $this->assertEquals($store->id, $result['store']['id']);
        $this->assertEquals('Test Store', $result['store']['name']);
        $this->assertEquals('123 Test Street', $result['store']['address']);
    }

    public function test_inventory_resource_with_product_variant_relation()
    {
        $product = Product::factory()->create([
            'name' => 'Test Product',
            'description' => 'Test Description',
        ]);
        
        $productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'TEST-SKU-001',
            'price' => 99.99,
            'cost_price' => 50.00,
            'average_cost' => 55.00,
        ]);

        $inventory = Inventory::factory()->create(['product_variant_id' => $productVariant->id]);
        $inventory->load(['productVariant.product']);

        $resource = new InventoryResource($inventory);
        $request = new Request();
        
        $result = $resource->toArray($request);

        // 驗證 product_variant 關聯
        $this->assertArrayHasKey('product_variant', $result);
        $this->assertEquals($productVariant->id, $result['product_variant']['id']);
        $this->assertEquals('TEST-SKU-001', $result['product_variant']['sku']);
        $this->assertEquals(99.99, $result['product_variant']['price']);
        $this->assertEquals(50.00, $result['product_variant']['cost_price']);
        $this->assertEquals(55.00, $result['product_variant']['average_cost']);

        // 驗證巢狀的 product 關聯
        $this->assertArrayHasKey('product', $result['product_variant']);
        $this->assertEquals($product->id, $result['product_variant']['product']['id']);
        $this->assertEquals('Test Product', $result['product_variant']['product']['name']);
        $this->assertEquals('Test Description', $result['product_variant']['product']['description']);
    }

    public function test_inventory_resource_with_product_variant_includes_product_data()
    {
        // 建立一個有 product 的變體，測試巢狀關聯的行為
        $product = Product::factory()->create([
            'name' => 'Test Product',
            'description' => 'Test Description'
        ]);
        $productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'TEST-SKU',
            'price' => 19.99,
        ]);

        $inventory = Inventory::factory()->create(['product_variant_id' => $productVariant->id]);
        
        // 載入 productVariant（通常會自動載入關聯的 product）
        $inventory->load('productVariant');

        $resource = new InventoryResource($inventory);
        $request = new Request();
        
        $result = $resource->toArray($request);

        // 驗證 product_variant 存在
        $this->assertArrayHasKey('product_variant', $result);
        $this->assertEquals('TEST-SKU', $result['product_variant']['sku']);

        // 驗證 product 資料存在且正確
        $this->assertArrayHasKey('product', $result['product_variant']);
        $this->assertEquals($product->id, $result['product_variant']['product']['id']);
        $this->assertEquals('Test Product', $result['product_variant']['product']['name']);
        $this->assertEquals('Test Description', $result['product_variant']['product']['description']);
    }

    public function test_inventory_resource_with_attribute_values()
    {
        $attribute1 = Attribute::factory()->create(['name' => 'Color']);
        $attribute2 = Attribute::factory()->create(['name' => 'Size']);
        
        $attributeValue1 = AttributeValue::factory()->create([
            'attribute_id' => $attribute1->id,
            'value' => 'Red'
        ]);
        $attributeValue2 = AttributeValue::factory()->create([
            'attribute_id' => $attribute2->id,
            'value' => 'Large'
        ]);

        $product = Product::factory()->create();
        $productVariant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 關聯屬性值
        $productVariant->attributeValues()->attach([$attributeValue1->id, $attributeValue2->id]);

        $inventory = Inventory::factory()->create(['product_variant_id' => $productVariant->id]);
        $inventory->load(['productVariant.product', 'productVariant.attributeValues.attribute']);

        $resource = new InventoryResource($inventory);
        $request = new Request();
        
        $result = $resource->toArray($request);

        // 驗證 attribute_values 關聯
        $this->assertArrayHasKey('attribute_values', $result['product_variant']);
        $this->assertCount(2, $result['product_variant']['attribute_values']);

        $attributeValues = $result['product_variant']['attribute_values'];
        
        // 驗證第一個屬性值
        $colorValue = collect($attributeValues)->firstWhere('value', 'Red');
        $this->assertNotNull($colorValue);
        $this->assertEquals($attributeValue1->id, $colorValue['id']);
        $this->assertEquals('Red', $colorValue['value']);
        $this->assertEquals($attribute1->id, $colorValue['attribute']['id']);
        $this->assertEquals('Color', $colorValue['attribute']['name']);

        // 驗證第二個屬性值
        $sizeValue = collect($attributeValues)->firstWhere('value', 'Large');
        $this->assertNotNull($sizeValue);
        $this->assertEquals($attributeValue2->id, $sizeValue['id']);
        $this->assertEquals('Large', $sizeValue['value']);
        $this->assertEquals($attribute2->id, $sizeValue['attribute']['id']);
        $this->assertEquals('Size', $sizeValue['attribute']['name']);
    }

    public function test_inventory_resource_with_all_relations_loaded()
    {
        $store = Store::factory()->create(['name' => 'Main Store']);
        $product = Product::factory()->create(['name' => 'Complete Product']);
        $attribute = Attribute::factory()->create(['name' => 'Test Attribute']);
        $attributeValue = AttributeValue::factory()->create([
            'attribute_id' => $attribute->id,
            'value' => 'Test Value'
        ]);
        
        $productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'COMPLETE-SKU',
            'price' => 199.99,
        ]);
        $productVariant->attributeValues()->attach($attributeValue->id);

        $inventory = Inventory::factory()->create([
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'quantity' => 50,
            'low_stock_threshold' => 5,
        ]);

        // 載入所有關聯
        $inventory->load([
            'store',
            'productVariant.product',
            'productVariant.attributeValues.attribute'
        ]);

        $resource = new InventoryResource($inventory);
        $request = new Request();
        
        $result = $resource->toArray($request);

        // 驗證所有資料都正確轉換
        $this->assertEquals(50, $result['quantity']);
        $this->assertEquals(5, $result['low_stock_threshold']);

        // 驗證 store 關聯
        $this->assertArrayHasKey('store', $result);
        $this->assertEquals('Main Store', $result['store']['name']);

        // 驗證 product_variant 關聯
        $this->assertArrayHasKey('product_variant', $result);
        $this->assertEquals('COMPLETE-SKU', $result['product_variant']['sku']);
        $this->assertEquals(199.99, $result['product_variant']['price']);

        // 驗證巢狀的 product 關聯
        $this->assertEquals('Complete Product', $result['product_variant']['product']['name']);

        // 驗證屬性值關聯
        $this->assertCount(1, $result['product_variant']['attribute_values']);
        $this->assertEquals('Test Value', $result['product_variant']['attribute_values'][0]['value']);
        $this->assertEquals('Test Attribute', $result['product_variant']['attribute_values'][0]['attribute']['name']);
    }

    public function test_inventory_resource_profit_calculations()
    {
        $productVariant = ProductVariant::factory()->create([
            'price' => 100.00,
            'cost_price' => 60.00,
            'average_cost' => 65.00,
        ]);

        $inventory = Inventory::factory()->create(['product_variant_id' => $productVariant->id]);
        $inventory->load('productVariant');

        $resource = new InventoryResource($inventory);
        $request = new Request();
        
        $result = $resource->toArray($request);

        // 驗證價格和成本相關欄位都被包含
        $variant = $result['product_variant'];
        $this->assertEquals(100.00, $variant['price']);
        $this->assertEquals(60.00, $variant['cost_price']);
        $this->assertEquals(65.00, $variant['average_cost']);
        
        // 驗證利潤相關的計算欄位也被包含（如果 ProductVariant 模型有這些 accessor）
        $this->assertArrayHasKey('profit_margin', $variant);
        $this->assertArrayHasKey('profit_amount', $variant);
    }

    public function test_inventory_resource_handles_default_values()
    {
        $inventory = Inventory::factory()->create([
            'low_stock_threshold' => 0, // 使用預設值 0 而不是 null
        ]);

        $resource = new InventoryResource($inventory);
        $request = new Request();
        
        $result = $resource->toArray($request);

        // 驗證預設值被正確處理
        $this->assertEquals(0, $result['low_stock_threshold']);
        $this->assertNotNull($result['quantity']); // quantity 應該不會是 null
    }

    public function test_inventory_resource_with_empty_attribute_values()
    {
        $product = Product::factory()->create();
        $productVariant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $inventory = Inventory::factory()->create(['product_variant_id' => $productVariant->id]);
        $inventory->load(['productVariant.product', 'productVariant.attributeValues.attribute']);

        $resource = new InventoryResource($inventory);
        $request = new Request();
        
        $result = $resource->toArray($request);

        // 驗證沒有屬性值時，attribute_values 是空集合
        $this->assertArrayHasKey('attribute_values', $result['product_variant']);
        $this->assertEmpty($result['product_variant']['attribute_values']);
    }
} 