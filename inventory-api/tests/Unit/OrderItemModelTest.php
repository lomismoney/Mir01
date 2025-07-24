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
            'fulfilled_quantity',
            'tax_rate',
            'discount_amount',
            'custom_product_name',
            'custom_product_specs',
            'custom_product_image',
            'custom_product_category',
            'custom_product_brand',
            'purchase_item_id',
            'is_fulfilled',
            'fulfilled_at',
            // 分配優先級欄位
            'allocation_priority_score',
            'allocation_metadata',
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
            'is_fulfilled' => 'boolean',
            'custom_specifications' => 'json',
            'quantity' => 'integer',
            'fulfilled_quantity' => 'integer',
            'fulfilled_at' => 'datetime',
            'allocation_priority_score' => 'integer',
            'allocation_metadata' => 'json',
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
            'price' => 10050, // 100.50元 = 10050分
            'cost' => 5025,   // 50.25元 = 5025分
            'quantity' => 2,
            'tax_rate' => 500, // 0.05 = 500/10000
            'discount_amount' => 1000, // 10.00元 = 1000分
            'is_stocked_sale' => true,
            'is_backorder' => false,
            'status' => '已處理',
        ];

        // 執行批量賦值
        $orderItem = OrderItem::create($orderData);

        // 驗證數據（通過 accessor 獲取，應返回元為單位）
        $this->assertEquals($order->id, $orderItem->order_id);
        $this->assertEquals($productVariant->id, $orderItem->product_variant_id);
        $this->assertEquals('測試商品', $orderItem->product_name);
        $this->assertEquals('TEST-001', $orderItem->sku);
        $this->assertEquals(100.50, $orderItem->price); // accessor 轉換：10050分→100.50元
        $this->assertEquals(50.25, $orderItem->cost);   // accessor 轉換：5025分→50.25元
        $this->assertEquals(2, $orderItem->quantity);
        $this->assertEquals(0.05, $orderItem->tax_rate); // accessor 轉換：500→0.05
        $this->assertEquals(10.00, $orderItem->discount_amount); // accessor 轉換：1000分→10.00元
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
            'price' => 500000, // 5000.00元 = 500000分
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
            'price' => 10000, // 100.00元 = 10000分
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
            'price' => 10000,  // 100.00元 = 10000分（測試accessor轉換）
            'cost' => 5000,    // 50.00元 = 5000分
            'quantity' => 3,
            'tax_rate' => 800,  // 0.08 = 800/10000
            'discount_amount' => 1550, // 15.50元 = 1550分
        ];

        // 執行創建
        $orderItem = OrderItem::create($orderData);

        // 驗證價格格式（應該通過accessor轉換為元並保留2位小數）
        $this->assertEquals(100.00, $orderItem->price);  // 10000分→100.00元
        $this->assertEquals(50.00, $orderItem->cost);    // 5000分→50.00元
        $this->assertEquals(0.08, $orderItem->tax_rate); // 800→0.08
        $this->assertEquals(15.50, $orderItem->discount_amount); // 1550分→15.50元
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
            'price' => 10000, // 100.00元 = 10000分
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
            'price' => 10000, // 100.00元 = 10000分
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

    /**
     * 測試履行數量的增加功能
     */
    public function test_add_fulfilled_quantity_method(): void
    {
        $order = Order::factory()->create();
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'quantity' => 10,
            'fulfilled_quantity' => 3,
            'is_fulfilled' => false,
            'fulfilled_at' => null,
        ]);

        // 測試增加但未完全履行
        $result = $orderItem->addFulfilledQuantity(4);
        
        $this->assertTrue($result);
        $this->assertEquals(7, $orderItem->fulfilled_quantity);
        $this->assertFalse($orderItem->is_fulfilled);
        $this->assertNull($orderItem->fulfilled_at);

        // 測試完全履行
        $result = $orderItem->addFulfilledQuantity(3);
        
        $this->assertTrue($result);
        $this->assertEquals(10, $orderItem->fulfilled_quantity);
        $this->assertTrue($orderItem->is_fulfilled);
        $this->assertNotNull($orderItem->fulfilled_at);
    }

    /**
     * 測試履行數量超過訂購數量時的限制
     */
    public function test_add_fulfilled_quantity_limits_to_order_quantity(): void
    {
        $order = Order::factory()->create();
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'quantity' => 10,
            'fulfilled_quantity' => 8,
            'is_fulfilled' => false,
        ]);

        // 嘗試增加超過限制的數量
        $result = $orderItem->addFulfilledQuantity(5);
        
        $this->assertTrue($result);
        $this->assertEquals(10, $orderItem->fulfilled_quantity); // 被限制在最大值
        $this->assertTrue($orderItem->is_fulfilled);
        $this->assertNotNull($orderItem->fulfilled_at);
    }

    /**
     * 測試剩餘待履行數量屬性
     */
    public function test_remaining_fulfillment_quantity_attribute(): void
    {
        $order = Order::factory()->create();
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'quantity' => 15,
            'fulfilled_quantity' => 6,
        ]);

        $this->assertEquals(9, $orderItem->remaining_fulfillment_quantity);

        // 測試完全履行
        $orderItem->update(['fulfilled_quantity' => 15]);
        $this->assertEquals(0, $orderItem->remaining_fulfillment_quantity);

        // 測試超過數量（確保不會回傳負數）
        $orderItem->update(['fulfilled_quantity' => 20]);
        $this->assertEquals(0, $orderItem->remaining_fulfillment_quantity);
    }

    /**
     * 測試部分履行狀態屬性
     */
    public function test_is_partially_fulfilled_attribute(): void
    {
        $order = Order::factory()->create();
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'quantity' => 10,
        ]);

        // 未履行
        $orderItem->update(['fulfilled_quantity' => 0]);
        $this->assertFalse($orderItem->is_partially_fulfilled);

        // 部分履行
        $orderItem->update(['fulfilled_quantity' => 6]);
        $this->assertTrue($orderItem->is_partially_fulfilled);

        // 完全履行
        $orderItem->update(['fulfilled_quantity' => 10]);
        $this->assertFalse($orderItem->is_partially_fulfilled);
    }

    /**
     * 測試完全履行狀態屬性
     */
    public function test_is_fully_fulfilled_attribute(): void
    {
        $order = Order::factory()->create();
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'quantity' => 10,
        ]);

        // 未履行
        $orderItem->update(['fulfilled_quantity' => 0]);
        $this->assertFalse($orderItem->is_fully_fulfilled);

        // 部分履行
        $orderItem->update(['fulfilled_quantity' => 6]);
        $this->assertFalse($orderItem->is_fully_fulfilled);

        // 完全履行
        $orderItem->update(['fulfilled_quantity' => 10]);
        $this->assertTrue($orderItem->is_fully_fulfilled);

        // 超過數量也算完全履行
        $orderItem->update(['fulfilled_quantity' => 15]);
        $this->assertTrue($orderItem->is_fully_fulfilled);
    }

    /**
     * 測試採購狀態屬性
     */
    public function test_purchase_status_attributes(): void
    {
        $order = Order::factory()->create();
        
        // 測試現貨商品（無需採購）
        $stockItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'is_stocked_sale' => true,
            'is_backorder' => false,
        ]);
        
        $this->assertEquals('not_applicable', $stockItem->purchase_status);
        $this->assertEquals('無需採購', $stockItem->purchase_status_text);

        // 測試預訂商品（待建立進貨單）
        $backorderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'is_stocked_sale' => false,
            'is_backorder' => true,
            'purchase_item_id' => null,
        ]);
        
        $this->assertEquals('pending_purchase', $backorderItem->purchase_status);
        $this->assertEquals('待建立進貨單', $backorderItem->purchase_status_text);
    }

    /**
     * 測試金額處理方法 - 基於重構後的統一金額處理
     */
    public function test_currency_handling_methods(): void
    {
        $order = Order::factory()->create();
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'price' => 9999,    // 99.99元 = 9999分
            'cost' => 5050,     // 50.50元 = 5050分
            'discount_amount' => 555, // 5.55元 = 555分
            'quantity' => 2
        ]);

        // 測試價格 accessor（分→元轉換）
        $this->assertEquals(99.99, $orderItem->price);
        $this->assertEquals(9999, $orderItem->price_cents);

        // 測試成本 accessor（分→元轉換）
        $this->assertEquals(50.50, $orderItem->cost);
        $this->assertEquals(5050, $orderItem->cost_cents);

        // 測試折扣金額 accessor（分→元轉換）
        $this->assertEquals(5.55, $orderItem->discount_amount);
        $this->assertEquals(555, $orderItem->discount_amount_cents);

        // 測試小計計算（價格 × 數量，不包含折扣）
        $expectedSubtotal = 99.99 * 2; // 199.98
        $this->assertEqualsWithDelta($expectedSubtotal, $orderItem->subtotal, 0.01);

        // 測試小計（分為單位）
        $expectedSubtotalCents = 9999 * 2; // 19998
        $this->assertEquals($expectedSubtotalCents, $orderItem->subtotal_cents);
    }

    /**
     * 測試金額精確性
     */
    public function test_currency_precision(): void
    {
        $order = Order::factory()->create();
        
        // 測試各種分為單位的金額及其對應的元顯示
        $testCases = [
            ['price_cents' => 1, 'expected_dollars' => 0.01],
            ['price_cents' => 99, 'expected_dollars' => 0.99],
            ['price_cents' => 100, 'expected_dollars' => 1.00],
            ['price_cents' => 1050, 'expected_dollars' => 10.50],
            ['price_cents' => 9999, 'expected_dollars' => 99.99],
            ['price_cents' => 12346, 'expected_dollars' => 123.46],
        ];

        foreach ($testCases as $testCase) {
            $orderItem = OrderItem::factory()->create([
                'order_id' => $order->id,
                'price' => $testCase['price_cents'] // 直接存儲分
            ]);

            // 驗證accessor正確轉換分→元
            $this->assertEquals($testCase['expected_dollars'], $orderItem->price,
                "Price {$testCase['price_cents']} cents should display as {$testCase['expected_dollars']} dollars");
            
            // 驗證可以正確獲取原始分值
            $this->assertEquals($testCase['price_cents'], $orderItem->price_cents,
                "Should be able to get raw cents value: {$testCase['price_cents']}");
        }
    }

    /**
     * 測試金額直接設置（分為單位）- 符合CLAUDE.md標準
     * 不使用Mutator，直接設置分為單位的值
     */
    public function test_currency_setter_methods(): void
    {
        $order = Order::factory()->create();
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id
        ]);

        // 測試價格設置（直接設置分為單位）
        $orderItem->price = 15075; // 150.75元 = 15075分
        $orderItem->save();
        $orderItem->refresh();
        
        $this->assertEquals(150.75, $orderItem->price); // accessor轉換顯示
        $this->assertEquals(15075, $orderItem->price_cents); // 原始分值

        // 測試成本設置（直接設置分為單位）
        $orderItem->cost = 7525; // 75.25元 = 7525分
        $orderItem->save();
        $orderItem->refresh();
        
        $this->assertEquals(75.25, $orderItem->cost); // accessor轉換顯示
        $this->assertEquals(7525, $orderItem->cost_cents); // 原始分值

        // 測試折扣設置（直接設置分為單位）
        $orderItem->discount_amount = 1250; // 12.50元 = 1250分
        $orderItem->save();
        $orderItem->refresh();
        
        $this->assertEquals(12.50, $orderItem->discount_amount); // accessor轉換顯示
        $this->assertEquals(1250, $orderItem->discount_amount_cents); // 原始分值
    }

    /**
     * 測試向後兼容性
     */
    public function test_backward_compatibility(): void
    {
        $order = Order::factory()->create();
        
        // 創建只有舊欄位數據的記錄
        $orderItem = new OrderItem([
            'order_id' => $order->id,
            'product_name' => '測試商品',
            'sku' => 'TEST-SKU-001',
            'price' => 10000, // 100.00元 = 10000分
            'cost' => 6000,   // 60.00元 = 6000分
            'discount_amount' => 1000, // 10.00元 = 1000分
            'quantity' => 1
        ]);
        $orderItem->save();

        // 驗證新的 cents 欄位自動計算
        $this->assertEquals(10000, $orderItem->price_cents);
        $this->assertEquals(6000, $orderItem->cost_cents);
        $this->assertEquals(1000, $orderItem->discount_amount_cents);

        // 驗證存取器仍然返回正確的元金額
        $this->assertEquals(100.00, $orderItem->price);
        $this->assertEquals(60.00, $orderItem->cost);
        $this->assertEquals(10.00, $orderItem->discount_amount);
    }

    /**
     * 測試 null 值處理
     */
    public function test_null_value_handling(): void
    {
        $order = Order::factory()->create();
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'price' => 10000, // 100.00元 = 10000分 // price 是必填欄位，不能為 null
            'cost' => null,     // cost 可以為 null
            'discount_amount' => 0.00
        ]);

        // price 有值
        $this->assertEquals(100.00, $orderItem->price);
        
        // cost 為 null 時應該返回 null
        $this->assertNull($orderItem->cost);
        
        // discount_amount 有值
        $this->assertEquals(0.00, $orderItem->discount_amount);

        // cents 欄位對應檢查
        $this->assertEquals(10000, $orderItem->price_cents); // 100.00 * 100
        $this->assertNull($orderItem->cost_cents);           // null 保持 null
        $this->assertEquals(0, $orderItem->discount_amount_cents);
    }

    /**
     * 測試履行狀態方法
     */
    public function test_fulfillment_methods(): void
    {
        $order = Order::factory()->create();
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'quantity' => 10,
            'fulfilled_quantity' => 0,
            'is_fulfilled' => false
        ]);

        // 測試新增履行數量
        $result = $orderItem->addFulfilledQuantity(5);
        $this->assertTrue($result);
        $this->assertEquals(5, $orderItem->fulfilled_quantity);
        $this->assertFalse($orderItem->is_fulfilled); // 尚未完全履行

        // 測試完全履行
        $result = $orderItem->addFulfilledQuantity(5);
        $this->assertTrue($result);
        $this->assertEquals(10, $orderItem->fulfilled_quantity);
        $this->assertTrue($orderItem->is_fulfilled); // 完全履行
        $this->assertNotNull($orderItem->fulfilled_at);

        // 測試超額履行（應該限制在訂購數量）
        $result = $orderItem->addFulfilledQuantity(5);
        $this->assertTrue($result);
        $this->assertEquals(10, $orderItem->fulfilled_quantity); // 不超過訂購數量
    }
} 