<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use App\Services\RefundService;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Mockery;

/**
 * 退款邏輯測試
 * 
 * 測試修正後的退款庫存處理邏輯
 */
class RefundLogicTest extends TestCase
{
    use RefreshDatabase;

    protected RefundService $refundService;
    protected $mockInventoryService;
    protected User $user;
    protected Customer $customer;
    protected Order $order;
    protected Store $store;
    protected ProductVariant $productVariant;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建 mock
        $this->mockInventoryService = Mockery::mock(InventoryService::class);
        $this->refundService = new RefundService($this->mockInventoryService);
        
        // 創建測試用戶並登入
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        $this->actingAs($this->user);
        
        // 創建測試資料
        $this->customer = Customer::factory()->create();
        $this->store = Store::factory()->create();
        
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'MAIN-SKU-001',
            'price' => 100.00
        ]);

        // 創建測試訂單
        $this->order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'paid',
            'shipping_status' => 'delivered',
            'grand_total' => 1000.00,
            'paid_amount' => 1000.00,
        ]);
    }

    /**
     * 測試現貨商品退款會返還庫存
     */
    public function test_refund_stocked_item_returns_inventory(): void
    {
        // 創建現貨商品訂單項目
        $orderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'product_name' => '現貨商品',
            'sku' => 'MAIN-SKU-001',
            'price' => 100.00,
            'quantity' => 2,
            'is_stocked_sale' => true,   // 現貨
            'is_backorder' => false,     // 非預訂
            'discount_amount' => 0.00
        ]);

        $refundData = [
            'reason' => '商品有瑕疵',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        // 驗證會呼叫庫存返還
        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->with(
                $this->productVariant->id,
                1,
                null,
                Mockery::pattern('/退款回補庫存 - 退款單 #\d+ 項目 #\d+/'),
                Mockery::type('array')
            )
            ->andReturn(true);

        $refund = $this->refundService->createRefund($this->order, $refundData);

        $this->assertInstanceOf(\App\Models\Refund::class, $refund);
        $this->assertEquals(100.00, $refund->total_refund_amount);
    }

    /**
     * 測試未履行的預訂商品退款不會返還庫存
     */
    public function test_refund_unfulfilled_backorder_item_does_not_return_inventory(): void
    {
        // 創建不同的商品變體以避免 SKU 衝突
        $backorderVariant = ProductVariant::factory()->create([
            'product_id' => $this->productVariant->product_id,
            'sku' => 'BACKORDER-SKU-001',
            'price' => 100.00
        ]);

        // 創建預訂商品訂單項目
        $orderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $backorderVariant->id,
            'product_name' => '預訂商品',
            'sku' => 'BACKORDER-SKU-001',
            'price' => 100.00,
            'quantity' => 2,
            'is_stocked_sale' => false,  // 非現貨
            'is_backorder' => true,      // 預訂商品
            'discount_amount' => 0.00
        ]);

        $refundData = [
            'reason' => '客戶取消',
            'should_restock' => true, // 即使設為 true，預訂商品也不會返還庫存
            'items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        // 驗證不會呼叫庫存返還
        $this->mockInventoryService
            ->shouldNotReceive('returnStock');

        $refund = $this->refundService->createRefund($this->order, $refundData);

        $this->assertInstanceOf(\App\Models\Refund::class, $refund);
        $this->assertEquals(100.00, $refund->total_refund_amount);
    }

    /**
     * 測試訂製商品退款不會返還庫存
     */
    public function test_refund_custom_item_does_not_return_inventory(): void
    {
        // 創建訂製商品訂單項目
        $orderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => null, // 訂製商品無 variant
            'product_name' => '訂製櫃子',
            'sku' => 'CUSTOM-001',
            'price' => 5000.00,
            'quantity' => 1,
            'is_stocked_sale' => false,  // 非現貨
            'is_backorder' => false,     // 非預訂
            'custom_product_name' => '客戶訂製櫃子',
            'discount_amount' => 0.00
        ]);

        $refundData = [
            'reason' => '客戶不滿意',
            'should_restock' => true, // 即使設為 true，訂製商品也不會返還庫存
            'items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        // 驗證不會呼叫庫存返還
        $this->mockInventoryService
            ->shouldNotReceive('returnStock');

        $refund = $this->refundService->createRefund($this->order, $refundData);

        $this->assertInstanceOf(\App\Models\Refund::class, $refund);
        $this->assertEquals(5000.00, $refund->total_refund_amount);
    }

    /**
     * 測試混合商品類型退款
     */
    public function test_refund_mixed_item_types(): void
    {
        // 現貨商品
        $stockedItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'product_name' => '現貨商品',
            'sku' => 'STOCKED-001',
            'price' => 100.00,
            'quantity' => 1,
            'is_stocked_sale' => true,
            'is_backorder' => false,
            'discount_amount' => 0.00
        ]);

        // 預訂商品  
        $backorderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'product_name' => '預訂商品',
            'sku' => 'BACKORDER-001',
            'price' => 200.00,
            'quantity' => 1,
            'is_stocked_sale' => false,
            'is_backorder' => true,
            'discount_amount' => 0.00
        ]);

        $refundData = [
            'reason' => '混合退款測試',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $stockedItem->id,
                    'quantity' => 1
                ],
                [
                    'order_item_id' => $backorderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        // 只有現貨商品會呼叫庫存返還
        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->andReturn(true);

        $refund = $this->refundService->createRefund($this->order, $refundData);

        $this->assertEquals(300.00, $refund->total_refund_amount); // 100 + 200
    }

    /**
     * 測試已履行的預訂商品退款會返還庫存
     */
    public function test_refund_fulfilled_backorder_item_returns_inventory(): void
    {
        // 創建不同的商品變體以避免 SKU 衝突
        $fulfilledVariant = ProductVariant::factory()->create([
            'product_id' => $this->productVariant->product_id,
            'sku' => 'FULFILLED-SKU-001',
            'price' => 100.00
        ]);

        // 創建已履行的預訂商品訂單項目
        $orderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $fulfilledVariant->id,
            'product_name' => '預訂商品（已到貨）',
            'sku' => 'FULFILLED-SKU-001',
            'price' => 100.00,
            'quantity' => 2,
            'is_stocked_sale' => false,  // 非現貨
            'is_backorder' => true,       // 預訂商品
            'is_fulfilled' => true,       // 已履行
            'fulfilled_at' => now()->subDays(2), // 2天前完成進貨
            'discount_amount' => 0.00
        ]);

        $refundData = [
            'reason' => '商品有瑕疵',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        // 驗證會呼叫庫存返還（因為已履行）
        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->with(
                $fulfilledVariant->id,
                1,
                null,
                Mockery::pattern('/退款回補庫存 - 退款單 #\d+ 項目 #\d+/'),
                Mockery::type('array')
            )
            ->andReturn(true);

        $refund = $this->refundService->createRefund($this->order, $refundData);

        $this->assertInstanceOf(\App\Models\Refund::class, $refund);
        $this->assertEquals(100.00, $refund->total_refund_amount);
    }

    /**
     * 測試已履行的訂製商品退款會返還庫存（假設有 SKU）
     */
    public function test_refund_fulfilled_custom_item_with_variant_returns_inventory(): void
    {
        // 創建另一個商品變體（用於訂製商品）
        $customVariant = ProductVariant::factory()->create([
            'product_id' => $this->productVariant->product_id,
            'sku' => 'CUSTOM-SKU-001',
            'price' => 5000.00
        ]);

        // 創建已履行的訂製商品訂單項目（但有關聯變體）
        $orderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $customVariant->id, // 有變體（用於管理庫存）
            'product_name' => '訂製櫃子（已完成製作）',
            'sku' => 'CUSTOM-SKU-001',
            'price' => 5000.00,
            'quantity' => 1,
            'is_stocked_sale' => false,  // 非現貨
            'is_backorder' => false,      // 非預訂
            'is_fulfilled' => true,       // 已履行（製作完成）
            'fulfilled_at' => now()->subDays(5), // 5天前完成製作
            'custom_product_name' => '客戶訂製櫃子',
            'discount_amount' => 0.00
        ]);

        $refundData = [
            'reason' => '客戶不滿意',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        // 驗證會呼叫庫存返還（因為已履行且有變體）
        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->with(
                $customVariant->id,
                1,
                null,
                Mockery::pattern('/退款回補庫存 - 退款單 #\d+ 項目 #\d+/'),
                Mockery::type('array')
            )
            ->andReturn(true);

        $refund = $this->refundService->createRefund($this->order, $refundData);

        $this->assertInstanceOf(\App\Models\Refund::class, $refund);
        $this->assertEquals(5000.00, $refund->total_refund_amount);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}