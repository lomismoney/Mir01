<?php

namespace Tests\Unit;

use App\Models\OrderItem;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * OrderItem 模型測試
 * 
 * 測試訂單項目模型的所有功能
 */
class OrderItemModelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試 OrderItem 與 Order 的關聯關係
     */
    public function test_order_item_belongs_to_order(): void
    {
        // 準備測試數據
        $order = Order::factory()->create();
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id]);

        // 驗證關聯關係
        $this->assertInstanceOf(Order::class, $orderItem->order);
        $this->assertEquals($order->id, $orderItem->order->id);
    }

    /**
     * 測試 OrderItem 與 ProductVariant 的關聯關係
     */
    public function test_order_item_belongs_to_product_variant(): void
    {
        // 準備測試數據
        $productVariant = ProductVariant::factory()->create();
        $orderItem = OrderItem::factory()->create(['product_variant_id' => $productVariant->id]);

        // 驗證關聯關係
        $this->assertInstanceOf(ProductVariant::class, $orderItem->productVariant);
        $this->assertEquals($productVariant->id, $orderItem->productVariant->id);
    }

    /**
     * 測試 OrderItem 可以沒有 ProductVariant（訂製商品）
     */
    public function test_order_item_can_have_null_product_variant(): void
    {
        // 準備測試數據（訂製商品）
        $orderItem = OrderItem::factory()->create([
            'product_variant_id' => null,
            'custom_product_name' => '客製化商品',
        ]);

        // 驗證關聯關係
        $this->assertNull($orderItem->productVariant);
        $this->assertEquals('客製化商品', $orderItem->custom_product_name);
    }

    /**
     * 測試 OrderItem 的可填充字段
     */
    public function test_order_item_has_correct_fillable_attributes(): void
    {
        $orderItem = new OrderItem();
        
        $expectedFillable = [
            'order_id',
            'product_variant_id',
            'is_stocked_sale',
            'is_backorder',
            'status',
            'custom_specifications',
            'product_name',
            'sku',
            'price',
            'cost',
            'quantity',
            'tax_rate',
            'discount_amount',
            'custom_product_name',
            'custom_product_specs',
            'custom_product_image',
            'custom_product_category',
            'custom_product_brand',
        ];

        $this->assertEquals($expectedFillable, $orderItem->getFillable());
    }

    /**
     * 測試 OrderItem 的類型轉換
     */
    public function test_order_item_has_correct_casts(): void
    {
        $orderItem = new OrderItem();
        
        $expectedCasts = [
            'id' => 'int',
            'is_stocked_sale' => 'boolean',
            'is_backorder' => 'boolean',
            'custom_specifications' => 'json',
            'price' => 'decimal:2',
            'cost' => 'decimal:2',
            'quantity' => 'integer',
            'tax_rate' => 'decimal:2',
            'discount_amount' => 'decimal:2',
        ];

        $this->assertEquals($expectedCasts, $orderItem->getCasts());
    }

    /**
     * 測試 OrderItem 的預設屬性值
     */
    public function test_order_item_has_correct_default_attributes(): void
    {
        $orderItem = new OrderItem();
        
        $this->assertEquals('待處理', $orderItem->status);
        $this->assertTrue($orderItem->is_stocked_sale);
        $this->assertFalse($orderItem->is_backorder);
    }

    /**
     * 測試 OrderItem 可以進行批量賦值
     */
    public function test_order_item_can_be_mass_assigned(): void
    {
        // 準備測試數據
        $order = Order::factory()->create();
        $productVariant = ProductVariant::factory()->create();
        
        $orderData = [
            'order_id' => $order->id,
            'product_variant_id' => $productVariant->id,
            'product_name' => '測試商品',
            'sku' => 'TEST-001',
            'price' => 100.50,
            'cost' => 50.25,
            'quantity' => 2,
            'tax_rate' => 0.05,
            'discount_amount' => 10.00,
            'is_stocked_sale' => true,
            'is_backorder' => false,
            'status' => '已處理',
        ];

        // 執行批量賦值
        $orderItem = OrderItem::create($orderData);

        // 驗證數據
        $this->assertEquals($order->id, $orderItem->order_id);
        $this->assertEquals($productVariant->id, $orderItem->product_variant_id);
        $this->assertEquals('測試商品', $orderItem->product_name);
        $this->assertEquals('TEST-001', $orderItem->sku);
        $this->assertEquals(100.50, $orderItem->price);
        $this->assertEquals(50.25, $orderItem->cost);
        $this->assertEquals(2, $orderItem->quantity);
        $this->assertEquals(0.05, $orderItem->tax_rate);
        $this->assertEquals(10.00, $orderItem->discount_amount);
        $this->assertTrue($orderItem->is_stocked_sale);
        $this->assertFalse($orderItem->is_backorder);
        $this->assertEquals('已處理', $orderItem->status);
    }

    /**
     * 測試 OrderItem 可以儲存客製化商品資訊
     */
    public function test_order_item_can_store_custom_product_info(): void
    {
        // 準備測試數據
        $order = Order::factory()->create();
        
        $customData = [
            'order_id' => $order->id,
            'product_variant_id' => null,
            'product_name' => '客製化櫥櫃',
            'sku' => 'CUSTOM-001',
            'custom_product_name' => '客製化櫥櫃',
            'custom_product_specs' => '尺寸：200x100x50cm',
            'custom_product_image' => 'custom-cabinet.jpg',
            'custom_product_category' => '客製化家具',
            'custom_product_brand' => '自有品牌',
            'custom_specifications' => [
                'width' => 200,
                'height' => 100,
                'depth' => 50,
                'material' => '實木',
            ],
            'price' => 5000.00,
            'quantity' => 1,
            'is_stocked_sale' => false,
        ];

        // 執行創建
        $orderItem = OrderItem::create($customData);

        // 驗證客製化商品資訊
        $this->assertEquals('客製化櫥櫃', $orderItem->custom_product_name);
        $this->assertEquals('尺寸：200x100x50cm', $orderItem->custom_product_specs);
        $this->assertEquals('custom-cabinet.jpg', $orderItem->custom_product_image);
        $this->assertEquals('客製化家具', $orderItem->custom_product_category);
        $this->assertEquals('自有品牌', $orderItem->custom_product_brand);
        $this->assertFalse($orderItem->is_stocked_sale);
        
        // 驗證 JSON 格式的客製化規格
        $this->assertIsArray($orderItem->custom_specifications);
        $this->assertEquals(200, $orderItem->custom_specifications['width']);
        $this->assertEquals('實木', $orderItem->custom_specifications['material']);
    }

    /**
     * 測試 OrderItem 可以設定預訂標記
     */
    public function test_order_item_can_set_backorder_flag(): void
    {
        // 準備測試數據
        $order = Order::factory()->create();
        $productVariant = ProductVariant::factory()->create();
        
        $orderData = [
            'order_id' => $order->id,
            'product_variant_id' => $productVariant->id,
            'product_name' => '缺貨商品',
            'sku' => 'BACKORDER-001',
            'quantity' => 1,
            'price' => 100.00,
            'is_backorder' => true,
        ];

        // 執行創建
        $orderItem = OrderItem::create($orderData);

        // 驗證預訂標記
        $this->assertTrue($orderItem->is_backorder);
    }

    /**
     * 測試 OrderItem 的價格計算和格式
     */
    public function test_order_item_handles_price_calculations(): void
    {
        // 準備測試數據
        $order = Order::factory()->create();
        
        $orderData = [
            'order_id' => $order->id,
            'product_name' => '價格測試商品',
            'sku' => 'PRICE-TEST-001',
            'price' => 99.999,  // 測試小數位處理
            'cost' => 49.995,
            'quantity' => 3,
            'tax_rate' => 0.08,
            'discount_amount' => 15.50,
        ];

        // 執行創建
        $orderItem = OrderItem::create($orderData);

        // 驗證價格格式（應該保留2位小數）
        $this->assertEquals('100.00', $orderItem->price);
        $this->assertEquals('50.00', $orderItem->cost);
        $this->assertEquals('0.08', $orderItem->tax_rate);
        $this->assertEquals('15.50', $orderItem->discount_amount);
    }

    /**
     * 測試 OrderItem 的狀態管理
     */
    public function test_order_item_status_management(): void
    {
        // 準備測試數據
        $order = Order::factory()->create();
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'status' => '待處理',
        ]);

        // 驗證預設狀態
        $this->assertEquals('待處理', $orderItem->status);

        // 更新狀態
        $orderItem->update(['status' => '已完成']);
        $this->assertEquals('已完成', $orderItem->status);
    }

    /**
     * 測試 OrderItem 使用 HasFactory trait
     */
    public function test_order_item_uses_has_factory_trait(): void
    {
        $orderItem = new OrderItem();
        
        $this->assertTrue(method_exists($orderItem, 'factory'));
    }

    /**
     * 測試 OrderItem 可以處理空的客製化規格
     */
    public function test_order_item_handles_empty_custom_specifications(): void
    {
        // 準備測試數據
        $order = Order::factory()->create();
        
        $orderData = [
            'order_id' => $order->id,
            'product_name' => '空規格測試商品',
            'sku' => 'EMPTY-SPEC-001',
            'price' => 100.00,
            'quantity' => 1,
            'custom_specifications' => null,
        ];

        // 執行創建
        $orderItem = OrderItem::create($orderData);

        // 驗證空的客製化規格
        $this->assertNull($orderItem->custom_specifications);
    }

    /**
     * 測試 OrderItem 可以處理複雜的客製化規格
     */
    public function test_order_item_handles_complex_custom_specifications(): void
    {
        // 準備測試數據
        $order = Order::factory()->create();
        
        $complexSpecs = [
            'dimensions' => [
                'width' => 200,
                'height' => 100,
                'depth' => 50,
                'unit' => 'cm',
            ],
            'materials' => [
                'primary' => '實木',
                'secondary' => '鋼材',
            ],
            'colors' => ['紅色', '藍色'],
            'options' => [
                'delivery' => true,
                'installation' => true,
                'warranty' => 2,
            ],
        ];
        
        $orderData = [
            'order_id' => $order->id,
            'product_name' => '複雜規格測試商品',
            'sku' => 'COMPLEX-SPEC-001',
            'price' => 100.00,
            'quantity' => 1,
            'custom_specifications' => $complexSpecs,
        ];

        // 執行創建
        $orderItem = OrderItem::create($orderData);

        // 驗證複雜的客製化規格
        $this->assertIsArray($orderItem->custom_specifications);
        $this->assertEquals(200, $orderItem->custom_specifications['dimensions']['width']);
        $this->assertEquals('實木', $orderItem->custom_specifications['materials']['primary']);
        $this->assertContains('紅色', $orderItem->custom_specifications['colors']);
        $this->assertTrue($orderItem->custom_specifications['options']['delivery']);
    }
} 