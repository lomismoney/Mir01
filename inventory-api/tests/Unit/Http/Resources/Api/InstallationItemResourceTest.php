<?php

namespace Tests\Unit\Http\Resources\Api;

use Tests\TestCase;
use App\Http\Resources\Api\InstallationItemResource;
use App\Http\Resources\Api\OrderItemResource;
use App\Http\Resources\Api\ProductVariantResource;
use App\Models\InstallationItem;
use App\Models\Installation;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

class InstallationItemResourceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試資源轉換為陣列
     */
    public function test_to_array_returns_correct_structure()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id]);
        $product = Product::factory()->create();
        $productVariant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'order_item_id' => $orderItem->id,
            'product_variant_id' => $productVariant->id,
            'product_name' => '測試商品',
            'sku' => 'TEST-SKU-001',
            'quantity' => 2,
            'specifications' => '測試規格',
            'status' => 'pending',
            'notes' => '測試備註',
        ]);

        $request = new Request();
        $resource = new InstallationItemResource($installationItem);
        $array = $resource->toArray($request);

        // 檢查基本欄位
        $this->assertEquals($installationItem->id, $array['id']);
        $this->assertEquals($installationItem->installation_id, $array['installation_id']);
        $this->assertEquals($installationItem->order_item_id, $array['order_item_id']);
        $this->assertEquals($installationItem->product_variant_id, $array['product_variant_id']);
        
        // 檢查商品資訊
        $this->assertEquals('測試商品', $array['product_name']);
        $this->assertEquals('TEST-SKU-001', $array['sku']);
        $this->assertEquals(2, $array['quantity']);
        $this->assertEquals('測試規格', $array['specifications']);
        
        // 檢查狀態
        $this->assertEquals('pending', $array['status']);
        
        // 檢查備註
        $this->assertEquals('測試備註', $array['notes']);
        
        // 檢查時間戳記格式
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $array['created_at']);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $array['updated_at']);
        
        // 檢查關聯資源
        $this->assertArrayHasKey('order_item', $array);
        $this->assertArrayHasKey('product_variant', $array);
        
        // 檢查計算屬性
        $this->assertArrayHasKey('is_completed', $array);
        $this->assertArrayHasKey('is_pending', $array);
        $this->assertIsBool($array['is_completed']);
        $this->assertIsBool($array['is_pending']);
    }

    /**
     * 測試資源處理 null 值
     */
    public function test_to_array_handles_null_values()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'order_item_id' => null,
            'product_variant_id' => null,
            'product_name' => '測試商品',
            'sku' => 'TEST-SKU-001',
            'quantity' => 1,
            'specifications' => null,
            'status' => 'pending',
            'notes' => null,
        ]);

        $request = new Request();
        $resource = new InstallationItemResource($installationItem);
        $array = $resource->toArray($request);

        $this->assertNull($array['order_item_id']);
        $this->assertNull($array['product_variant_id']);
        $this->assertNull($array['specifications']);
        $this->assertNull($array['notes']);
    }

    /**
     * 測試資源處理不同狀態
     */
    public function test_to_array_handles_different_statuses()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        
        $statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        
        foreach ($statuses as $status) {
            $installationItem = InstallationItem::factory()->create([
                'installation_id' => $installation->id,
                'status' => $status,
            ]);

            $request = new Request();
            $resource = new InstallationItemResource($installationItem);
            $array = $resource->toArray($request);

            $this->assertEquals($status, $array['status']);
        }
    }

    /**
     * 測試資源處理不同數量
     */
    public function test_to_array_handles_different_quantities()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        
        $quantities = [1, 5, 10, 100];
        
        foreach ($quantities as $quantity) {
            $installationItem = InstallationItem::factory()->create([
                'installation_id' => $installation->id,
                'quantity' => $quantity,
            ]);

            $request = new Request();
            $resource = new InstallationItemResource($installationItem);
            $array = $resource->toArray($request);

            $this->assertEquals($quantity, $array['quantity']);
        }
    }

    /**
     * 測試資源處理長字串
     */
    public function test_to_array_handles_long_strings()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        
        $longProductName = str_repeat('長商品名稱', 50);
        $longSpecifications = str_repeat('詳細規格說明', 100);
        $longNotes = str_repeat('重要備註', 200);
        
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'product_name' => $longProductName,
            'specifications' => $longSpecifications,
            'notes' => $longNotes,
        ]);

        $request = new Request();
        $resource = new InstallationItemResource($installationItem);
        $array = $resource->toArray($request);

        $this->assertEquals($longProductName, $array['product_name']);
        $this->assertEquals($longSpecifications, $array['specifications']);
        $this->assertEquals($longNotes, $array['notes']);
    }

    /**
     * 測試資源處理特殊字元
     */
    public function test_to_array_handles_special_characters()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        
        $specialProductName = '測試商品 & 特殊字元 "引號" <標籤>';
        $specialSku = 'TEST-SKU-001@#$%';
        $specialNotes = '特殊備註：！@#$%^&*()_+-=[]{}|;:,.<>?';
        
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'product_name' => $specialProductName,
            'sku' => $specialSku,
            'notes' => $specialNotes,
        ]);

        $request = new Request();
        $resource = new InstallationItemResource($installationItem);
        $array = $resource->toArray($request);

        $this->assertEquals($specialProductName, $array['product_name']);
        $this->assertEquals($specialSku, $array['sku']);
        $this->assertEquals($specialNotes, $array['notes']);
    }

    /**
     * 測試資源處理 Unicode 字元
     */
    public function test_to_array_handles_unicode_characters()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        
        $unicodeProductName = '測試商品 🔒 智能鎖 ⚡ 快速安裝';
        $unicodeNotes = '備註：✓ 已完成 ✗ 未完成 ⚠️ 注意事項';
        
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'product_name' => $unicodeProductName,
            'notes' => $unicodeNotes,
        ]);

        $request = new Request();
        $resource = new InstallationItemResource($installationItem);
        $array = $resource->toArray($request);

        $this->assertEquals($unicodeProductName, $array['product_name']);
        $this->assertEquals($unicodeNotes, $array['notes']);
    }

    /**
     * 測試資源繼承自 JsonResource
     */
    public function test_resource_extends_json_resource()
    {
        $reflection = new \ReflectionClass(InstallationItemResource::class);
        $this->assertTrue($reflection->isSubclassOf(\Illuminate\Http\Resources\Json\JsonResource::class));
    }

    /**
     * 測試資源命名空間正確
     */
    public function test_resource_namespace()
    {
        $reflection = new \ReflectionClass(InstallationItemResource::class);
        $this->assertEquals('App\\Http\\Resources\\Api', $reflection->getNamespaceName());
    }

    /**
     * 測試資源 toArray 方法存在
     */
    public function test_to_array_method_exists()
    {
        $this->assertTrue(method_exists(InstallationItemResource::class, 'toArray'));
    }

    /**
     * 測試資源 toArray 方法是公開的
     */
    public function test_to_array_method_is_public()
    {
        $reflection = new \ReflectionClass(InstallationItemResource::class);
        $method = $reflection->getMethod('toArray');
        $this->assertTrue($method->isPublic());
    }

    /**
     * 測試資源 toArray 方法接受 Request 參數
     */
    public function test_to_array_method_accepts_request_parameter()
    {
        $reflection = new \ReflectionClass(InstallationItemResource::class);
        $method = $reflection->getMethod('toArray');
        $parameters = $method->getParameters();
        
        $this->assertCount(1, $parameters);
        $this->assertEquals('request', $parameters[0]->getName());
        $this->assertEquals(Request::class, $parameters[0]->getType()->getName());
    }

    /**
     * 測試資源 toArray 方法返回陣列
     */
    public function test_to_array_method_returns_array()
    {
        $reflection = new \ReflectionClass(InstallationItemResource::class);
        $method = $reflection->getMethod('toArray');
        $returnType = $method->getReturnType();
        
        $this->assertNotNull($returnType);
        $this->assertEquals('array', $returnType->getName());
    }

    /**
     * 測試資源所有必要欄位都存在
     */
    public function test_all_required_fields_are_present()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
        ]);

        $request = new Request();
        $resource = new InstallationItemResource($installationItem);
        $array = $resource->toArray($request);

        $requiredFields = [
            'id', 'installation_id', 'order_item_id', 'product_variant_id',
            'product_name', 'sku', 'quantity', 'specifications', 'status',
            'notes', 'created_at', 'updated_at', 'order_item', 'product_variant',
            'is_completed', 'is_pending'
        ];

        foreach ($requiredFields as $field) {
            $this->assertArrayHasKey($field, $array, "Missing required field: {$field}");
        }
    }

    /**
     * 測試資源處理空 SKU
     */
    public function test_to_array_handles_empty_sku()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'sku' => '',
        ]);

        $request = new Request();
        $resource = new InstallationItemResource($installationItem);
        $array = $resource->toArray($request);

        $this->assertEquals('', $array['sku']);
    }

    /**
     * 測試資源處理零數量
     */
    public function test_to_array_handles_zero_quantity()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'quantity' => 0,
        ]);

        $request = new Request();
        $resource = new InstallationItemResource($installationItem);
        $array = $resource->toArray($request);

        $this->assertEquals(0, $array['quantity']);
    }

    /**
     * 測試資源處理非常大的數量
     */
    public function test_to_array_handles_very_large_quantity()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $installation = Installation::factory()->create(['order_id' => $order->id]);
        
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'quantity' => 999999,
        ]);

        $request = new Request();
        $resource = new InstallationItemResource($installationItem);
        $array = $resource->toArray($request);

        $this->assertEquals(999999, $array['quantity']);
    }
}