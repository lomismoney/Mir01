<?php

namespace Tests\Feature\Http\Resources;

use App\Http\Resources\Api\OrderItemResource;
use App\Http\Resources\Api\ProductVariantResource;
use App\Models\OrderItem;
use App\Models\Order;
use App\Models\User;
use App\Models\Store;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * OrderItemResource 測試
 * 
 * 測試訂單項目資源的輸出格式
 */
class OrderItemResourceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試基本資源輸出
     */
    public function test_basic_resource_output(): void
    {
        // 創建測試數據
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => null,
            'is_stocked_sale' => true,
            'is_backorder' => false,
            'status' => 'pending',
            'product_name' => '測試商品',
            'sku' => 'TEST-001',
            'price' => 100.50,
            'cost' => 80.00,
            'quantity' => 2,
            'tax_rate' => 0.05,
            'discount_amount' => 10.00,
            'custom_product_name' => null,
            'custom_specifications' => null,
            'custom_product_image' => null,
            'custom_product_category' => null,
            'custom_product_brand' => null,
        ]);

        // 創建資源
        $resource = new OrderItemResource($orderItem);
        $request = Request::create('/');
        $output = $resource->toArray($request);

        // 驗證基本欄位
        $this->assertEquals($orderItem->id, $output['id']);
        $this->assertEquals($orderItem->order_id, $output['order_id']);
        $this->assertEquals($orderItem->product_variant_id, $output['product_variant_id']);
        $this->assertEquals($orderItem->is_stocked_sale, $output['is_stocked_sale']);
        $this->assertEquals($orderItem->is_backorder, $output['is_backorder']);
        $this->assertEquals($orderItem->status, $output['status']);
        $this->assertEquals($orderItem->product_name, $output['product_name']);
        $this->assertEquals($orderItem->sku, $output['sku']);
        $this->assertEquals($orderItem->price, $output['price']);
        $this->assertEquals($orderItem->cost, $output['cost']);
        $this->assertEquals($orderItem->quantity, $output['quantity']);
        $this->assertEquals($orderItem->tax_rate, $output['tax_rate']);
        $this->assertEquals($orderItem->discount_amount, $output['discount_amount']);
    }

    /**
     * 測試自訂商品欄位
     */
    public function test_custom_product_fields(): void
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $customSpecifications = ['尺寸' => '100x200', '顏色' => '紅色'];
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'custom_product_name' => '自訂商品',
            'custom_specifications' => json_encode($customSpecifications),
            'custom_product_image' => 'custom-image.jpg',
            'custom_product_category' => '自訂分類',
            'custom_product_brand' => '自訂品牌',
        ]);

        $resource = new OrderItemResource($orderItem);
        $request = Request::create('/');
        $output = $resource->toArray($request);

        // 驗證自訂商品欄位
        $this->assertEquals('自訂商品', $output['custom_product_name']);
        $this->assertEquals($customSpecifications, $output['custom_specifications']);
        $this->assertEquals('custom-image.jpg', $output['custom_product_image']);
        $this->assertEquals('自訂分類', $output['custom_product_category']);
        $this->assertEquals('自訂品牌', $output['custom_product_brand']);
    }

    /**
     * 測試自訂規格 JSON 解析
     */
    public function test_custom_specifications_json_parsing(): void
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        // 測試有效的 JSON
        $validSpecifications = ['材質' => '不鏽鋼', '重量' => '2.5kg'];
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'custom_specifications' => json_encode($validSpecifications),
        ]);

        $resource1 = new OrderItemResource($orderItem1);
        $output1 = $resource1->toArray(Request::create('/'));
        $this->assertEquals($validSpecifications, $output1['custom_specifications']);

        // 測試空值
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'custom_specifications' => null,
        ]);

        $resource2 = new OrderItemResource($orderItem2);
        $output2 = $resource2->toArray(Request::create('/'));
        $this->assertNull($output2['custom_specifications']);

        // 測試空字串
        $orderItem3 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'custom_specifications' => '',
        ]);

        $resource3 = new OrderItemResource($orderItem3);
        $output3 = $resource3->toArray(Request::create('/'));
        $this->assertNull($output3['custom_specifications']);
    }

    /**
     * 測試預訂標記欄位
     */
    public function test_backorder_flag(): void
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        // 測試預訂商品
        $backorderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'is_backorder' => true,
        ]);

        $resource = new OrderItemResource($backorderItem);
        $output = $resource->toArray(Request::create('/'));
        $this->assertTrue($output['is_backorder']);

        // 測試現貨商品
        $stockedItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'is_backorder' => false,
        ]);

        $resource2 = new OrderItemResource($stockedItem);
        $output2 = $resource2->toArray(Request::create('/'));
        $this->assertFalse($output2['is_backorder']);
    }

    /**
     * 測試時間戳欄位
     */
    public function test_timestamp_fields(): void
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
        ]);

        $resource = new OrderItemResource($orderItem);
        $output = $resource->toArray(Request::create('/'));

        // 驗證時間戳欄位存在
        $this->assertArrayHasKey('created_at', $output);
        $this->assertArrayHasKey('updated_at', $output);
        $this->assertNotNull($output['created_at']);
        $this->assertNotNull($output['updated_at']);
    }

    /**
     * 測試帶有 ProductVariant 關聯的資源
     */
    public function test_resource_with_product_variant(): void
    {
        $customer = Customer::factory()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $productVariant = ProductVariant::factory()->create(['product_id' => $product->id]);

        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $productVariant->id,
        ]);

        // 載入關聯
        $orderItem->load('productVariant');

        $resource = new OrderItemResource($orderItem);
        $output = $resource->toArray(Request::create('/'));

        // 驗證 ProductVariant 關聯被包含
        $this->assertArrayHasKey('product_variant', $output);
        $this->assertInstanceOf(ProductVariantResource::class, $output['product_variant']);
    }

    /**
     * 測試沒有載入 ProductVariant 關聯的資源
     */
    public function test_resource_without_product_variant(): void
    {
        $customer = Customer::factory()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $productVariant = ProductVariant::factory()->create(['product_id' => $product->id]);

        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $productVariant->id,
        ]);

        // 不載入關聯
        $resource = new OrderItemResource($orderItem);
        $output = $resource->toArray(Request::create('/'));

        // 驗證 ProductVariant 關聯處理（Laravel Resource 的 whenLoaded 行為）
        if (array_key_exists('product_variant', $output)) {
            // 如果欄位存在，應該是 null 或 MissingValue
            $this->assertTrue(
                is_null($output['product_variant']) || 
                $output['product_variant'] instanceof \Illuminate\Http\Resources\MissingValue
            );
        } else {
            // 欄位不存在也是正確的行為
            $this->assertArrayNotHasKey('product_variant', $output);
        }
    }

    /**
     * 測試所有欄位的完整性
     */
    public function test_complete_field_coverage(): void
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => null,
            'is_stocked_sale' => true,
            'is_backorder' => false,
            'status' => 'pending',
            'product_name' => '完整測試商品',
            'sku' => 'COMPLETE-001',
            'price' => 199.99,
            'cost' => 150.00,
            'quantity' => 3,
            'tax_rate' => 0.08,
            'discount_amount' => 15.50,
            'custom_product_name' => '自訂商品名稱',
            'custom_specifications' => json_encode(['特色' => '高品質', '保固' => '2年']),
            'custom_product_image' => 'custom-product.jpg',
            'custom_product_category' => '自訂分類',
            'custom_product_brand' => '自訂品牌',
        ]);

        $resource = new OrderItemResource($orderItem);
        $output = $resource->toArray(Request::create('/'));

        // 驗證所有欄位都存在
        $expectedFields = [
            'id', 'order_id', 'product_variant_id', 'is_stocked_sale', 'is_backorder',
            'status', 'product_name', 'sku', 'price', 'cost', 'quantity', 'tax_rate',
            'discount_amount', 'custom_product_name', 'custom_specifications',
            'custom_product_image', 'custom_product_category', 'custom_product_brand',
            'created_at', 'updated_at'
        ];

        foreach ($expectedFields as $field) {
            $this->assertArrayHasKey($field, $output, "Missing field: {$field}");
        }

        // 驗證所有欄位值
        $this->assertEquals($orderItem->id, $output['id']);
        $this->assertEquals($orderItem->order_id, $output['order_id']);
        $this->assertEquals($orderItem->product_variant_id, $output['product_variant_id']);
        $this->assertEquals($orderItem->is_stocked_sale, $output['is_stocked_sale']);
        $this->assertEquals($orderItem->is_backorder, $output['is_backorder']);
        $this->assertEquals($orderItem->status, $output['status']);
        $this->assertEquals($orderItem->product_name, $output['product_name']);
        $this->assertEquals($orderItem->sku, $output['sku']);
        $this->assertEquals($orderItem->price, $output['price']);
        $this->assertEquals($orderItem->cost, $output['cost']);
        $this->assertEquals($orderItem->quantity, $output['quantity']);
        $this->assertEquals($orderItem->tax_rate, $output['tax_rate']);
        $this->assertEquals($orderItem->discount_amount, $output['discount_amount']);
        $this->assertEquals($orderItem->custom_product_name, $output['custom_product_name']);
        $this->assertEquals(['特色' => '高品質', '保固' => '2年'], $output['custom_specifications']);
        $this->assertEquals($orderItem->custom_product_image, $output['custom_product_image']);
        $this->assertEquals($orderItem->custom_product_category, $output['custom_product_category']);
        $this->assertEquals($orderItem->custom_product_brand, $output['custom_product_brand']);
    }

    /**
     * 測試數值欄位的精確性
     */
    public function test_numeric_field_precision(): void
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'price' => 123.46,
            'cost' => 98.77,
            'quantity' => 5,
            'tax_rate' => 0.125,
            'discount_amount' => 12.34,
        ]);

        $resource = new OrderItemResource($orderItem);
        $output = $resource->toArray(Request::create('/'));

        // 驗證數值精確性（考慮浮點數精度問題）
        $this->assertEquals(123.46, $output['price']);
        $this->assertEquals(98.77, $output['cost']);
        $this->assertEquals(5, $output['quantity']);
        $this->assertEquals(0.13, $output['tax_rate']); // decimal:2 cast 會截斷為兩位小數
        $this->assertEquals(12.34, $output['discount_amount']);
    }

    /**
     * 測試空值處理
     */
    public function test_null_value_handling(): void
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => null,
            'cost' => null,
            'tax_rate' => 0.0,
            'discount_amount' => 0.0, // 避免 NOT NULL 約束錯誤
            'custom_product_name' => null,
            'custom_specifications' => null,
            'custom_product_image' => null,
            'custom_product_category' => null,
            'custom_product_brand' => null,
        ]);

        $resource = new OrderItemResource($orderItem);
        $output = $resource->toArray(Request::create('/'));

        // 驗證空值處理
        $this->assertNull($output['product_variant_id']);
        $this->assertNull($output['cost']);
        $this->assertEquals(0.0, $output['tax_rate']);
        $this->assertEquals(0.0, $output['discount_amount']); // 為 0 而不是 null
        $this->assertNull($output['custom_product_name']);
        $this->assertNull($output['custom_specifications']);
        $this->assertNull($output['custom_product_image']);
        $this->assertNull($output['custom_product_category']);
        $this->assertNull($output['custom_product_brand']);
    }

    /**
     * 測試不同狀態的訂單項目
     */
    public function test_different_order_item_statuses(): void
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        foreach ($statuses as $status) {
            $orderItem = OrderItem::factory()->create([
                'order_id' => $order->id,
                'status' => $status,
            ]);

            $resource = new OrderItemResource($orderItem);
            $output = $resource->toArray(Request::create('/'));

            $this->assertEquals($status, $output['status']);
        }
    }

    /**
     * 測試包含複雜 JSON 規格的資源
     */
    public function test_complex_json_specifications(): void
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $complexSpecs = [
            '基本資訊' => [
                '品牌' => '測試品牌',
                '型號' => 'TEST-2024',
                '顏色' => '藍色',
            ],
            '技術規格' => [
                '尺寸' => '100x200x50cm',
                '重量' => '5.5kg',
                '材質' => '不鏽鋼',
            ],
            '配件' => [
                '電源線',
                '說明書',
                '保固卡',
            ],
        ];

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'custom_specifications' => json_encode($complexSpecs),
        ]);

        $resource = new OrderItemResource($orderItem);
        $output = $resource->toArray(Request::create('/'));

        $this->assertEquals($complexSpecs, $output['custom_specifications']);
    }
} 