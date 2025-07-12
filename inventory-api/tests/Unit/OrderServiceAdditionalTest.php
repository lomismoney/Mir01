<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\OrderService;
use App\Services\InventoryService;
use App\Services\OrderNumberGenerator;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use App\Models\Inventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Mockery;

/**
 * OrderService 額外測試
 * 補充測試 OrderService 中未被覆蓋的方法和邏輯
 */
class OrderServiceAdditionalTest extends TestCase
{
    use RefreshDatabase;

    protected OrderService $orderService;
    protected $mockInventoryService;
    protected $mockOrderNumberGenerator;
    protected User $user;
    protected Customer $customer;
    protected Store $store;
    protected ProductVariant $productVariant;
    protected ProductVariant $productVariant2;
    protected ProductVariant $productVariant3;
    protected ProductVariant $productVariant4;

    protected function setUp(): void
    {
        parent::setUp();

        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Auth::login($this->user);

        // 創建測試資料
        $this->customer = Customer::factory()->create();
        $this->store = Store::factory()->create();
        
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'ORDER-MAIN-SKU-001',
            'price' => 100.00
        ]);
        
        $product2 = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant2 = ProductVariant::factory()->create([
            'product_id' => $product2->id,
            'sku' => 'ORDER-MAIN-SKU-002',
            'price' => 200.00
        ]);
        
        // 為測試創建額外的變體
        $product3 = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant3 = ProductVariant::factory()->create([
            'product_id' => $product3->id,
            'sku' => 'ORDER-STOCK-SKU-001',
            'price' => 150.00
        ]);
        
        $product4 = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant4 = ProductVariant::factory()->create([
            'product_id' => $product4->id,
            'sku' => 'ORDER-BACKORDER-SKU-001',
            'price' => 250.00
        ]);

        // Mock 依賴服務
        $this->mockInventoryService = Mockery::mock(InventoryService::class);
        $this->mockOrderNumberGenerator = Mockery::mock(OrderNumberGenerator::class);

        // 創建 OrderService 實例
        $this->orderService = new OrderService(
            $this->mockInventoryService,
            $this->mockOrderNumberGenerator
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * 測試更新訂單項目（新增、更新、刪除）
     */
    public function test_update_order_with_items_sync(): void
    {
        // 創建測試訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'subtotal' => 300.00,
            'shipping_fee' => 0.00,
            'tax' => 0.00,
            'discount_amount' => 0.00,
            'grand_total' => 300.00
        ]);

        // 創建原始訂單項目
        $item1 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'product_name' => '商品1',
            'sku' => 'ORDER-MAIN-SKU-001',
            'price' => 100.00,
            'quantity' => 2,
            'is_stocked_sale' => true
        ]);

        $item2 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant2->id,
            'product_name' => '商品2',
            'sku' => 'MAIN-SKU-002',
            'price' => 200.00,
            'quantity' => 1,
            'is_stocked_sale' => true
        ]);

        // 準備更新資料
        $updateData = [
            'items' => [
                // 更新現有項目（修改數量）
                [
                    'id' => $item1->id,
                    'product_variant_id' => $this->productVariant->id,
                    'product_name' => '商品1',
                    'sku' => 'ORDER-MAIN-SKU-001',
                    'price' => 100.00,
                    'quantity' => 3, // 從 2 增加到 3
                    'is_stocked_sale' => true
                ],
                // 刪除 item2（不在列表中）
                // 新增一個項目
                [
                    'product_variant_id' => $this->productVariant2->id,
                    'product_name' => '新商品',
                    'sku' => 'MAIN-SKU-002',
                    'price' => 150.00,
                    'quantity' => 2,
                    'is_stocked_sale' => true
                ]
            ]
        ];

        // Mock 庫存操作
        // 返還被刪除項目的庫存
        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->with($this->productVariant2->id, 1, Mockery::any(), Mockery::type('string'), Mockery::type('array'))
            ->andReturn(true);

        // 扣減新增數量的庫存（item1 增加 1 個）
        $this->mockInventoryService
            ->shouldReceive('deductStock')
            ->once()
            ->with($this->productVariant->id, 1, Mockery::any(), Mockery::type('string'), Mockery::type('array'))
            ->andReturn(true);

        // 扣減新項目的庫存
        $this->mockInventoryService
            ->shouldReceive('deductStock')
            ->once()
            ->with($this->productVariant2->id, 2, Mockery::any(), Mockery::type('string'), Mockery::type('array'))
            ->andReturn(true);

        // 執行更新
        $updatedOrder = $this->orderService->updateOrder($order, $updateData);

        // 驗證結果
        $this->assertCount(2, $updatedOrder->items);
        
        // 驗證更新的項目
        $updatedItem1 = $updatedOrder->items->where('id', $item1->id)->first();
        $this->assertEquals(3, $updatedItem1->quantity);
        
        // 驗證新增的項目
        $newItem = $updatedOrder->items->where('id', '!=', $item1->id)->first();
        $this->assertEquals('新商品', $newItem->product_name);
        $this->assertEquals(150.00, $newItem->price);
        $this->assertEquals(2, $newItem->quantity);
        
        // 驗證訂單總金額已重新計算
        $this->assertEquals(600.00, $updatedOrder->subtotal); // 100*3 + 150*2
        $this->assertEquals(600.00, $updatedOrder->grand_total);
    }

    /**
     * 測試從庫存銷售改為非庫存銷售
     */
    public function test_update_order_item_from_stocked_to_non_stocked(): void
    {
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'subtotal' => 100.00,
            'shipping_fee' => 0.00,
            'tax' => 0.00,
            'discount_amount' => 0.00,
            'grand_total' => 100.00
        ]);

        $item = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 1,
            'price' => 100.00,
            'is_stocked_sale' => true
        ]);

        $updateData = [
            'items' => [
                [
                    'id' => $item->id,
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 1,
                    'price' => 100.00,
                    'is_stocked_sale' => false // 改為非庫存銷售
                ]
            ]
        ];

        // Mock 返還庫存
        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->with($this->productVariant->id, 1, Mockery::any(), "訂單編輯：改為非庫存銷售", Mockery::type('array'))
            ->andReturn(true);

        $updatedOrder = $this->orderService->updateOrder($order, $updateData);

        $updatedItem = $updatedOrder->items->first();
        $this->assertFalse($updatedItem->is_stocked_sale);
    }

    /**
     * 測試更換商品變體
     */
    public function test_update_order_item_change_variant(): void
    {
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'subtotal' => 100.00,
            'shipping_fee' => 0.00,
            'tax' => 0.00,
            'discount_amount' => 0.00,
            'grand_total' => 100.00
        ]);

        $item = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 2,
            'price' => 100.00,
            'is_stocked_sale' => true
        ]);

        $updateData = [
            'items' => [
                [
                    'id' => $item->id,
                    'product_variant_id' => $this->productVariant2->id, // 更換變體
                    'quantity' => 2,
                    'price' => 200.00,
                    'is_stocked_sale' => true
                ]
            ]
        ];

        // Mock 返還原變體庫存
        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->with($this->productVariant->id, 2, Mockery::any(), "訂單編輯：更換商品", Mockery::type('array'))
            ->andReturn(true);

        // Mock 扣減新變體庫存
        $this->mockInventoryService
            ->shouldReceive('deductStock')
            ->once()
            ->with($this->productVariant2->id, 2, Mockery::any(), Mockery::type('string'), Mockery::type('array'))
            ->andReturn(true);

        $updatedOrder = $this->orderService->updateOrder($order, $updateData);

        $updatedItem = $updatedOrder->items->first();
        $this->assertEquals($this->productVariant2->id, $updatedItem->product_variant_id);
        $this->assertEquals(400.00, $updatedOrder->subtotal); // 200 * 2
        $this->assertEquals(400.00, $updatedOrder->grand_total);
    }

    /**
     * 測試創建訂單時現貨商品庫存不足會拋出異常
     */
    public function test_create_order_with_insufficient_stock_throws_exception(): void
    {
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                // 現貨商品但無庫存
                [
                    'product_variant_id' => $this->productVariant3->id,
                    'is_stocked_sale' => true,
                    'product_name' => '無庫存商品',
                    'sku' => 'STOCK-SKU-001',
                    'price' => 100.00,
                    'quantity' => 5,
                ]
            ]
        ];

        // Mock 訂單編號生成（因為會在檢查庫存之前調用）
        $this->mockOrderNumberGenerator
            ->shouldReceive('generateNextNumber')
            ->once()
            ->andReturn('ORD-2025-007');

        // Mock 庫存檢查（商品庫存不足）
        $stockCheckResults = [
            [
                'product_variant_id' => $this->productVariant3->id,
                'product_name' => '無庫存商品',
                'sku' => 'STOCK-SKU-001',
                'requested_quantity' => 5,
                'available_quantity' => 0,
            ]
        ];

        $this->mockInventoryService
            ->shouldReceive('batchCheckStock')
            ->once()
            ->andReturn($stockCheckResults);

        // 預期拋出異常
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('現貨商品庫存不足');

        // 執行測試
        $this->orderService->createOrder($orderData);
    }

    /**
     * 測試創建混合商品類型訂單（現貨+預訂）
     */
    public function test_create_order_with_mixed_product_types(): void
    {
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                // 現貨商品（有庫存）
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'product_name' => '現貨商品',
                    'sku' => 'ORDER-MAIN-SKU-001',
                    'price' => 100.00,
                    'quantity' => 2,
                ],
                // 預訂商品（不需要庫存）
                [
                    'product_variant_id' => $this->productVariant2->id,
                    'is_stocked_sale' => false,
                    'is_backorder' => true,
                    'product_name' => '預訂商品',
                    'sku' => 'MAIN-SKU-002',
                    'price' => 200.00,
                    'quantity' => 5,
                ]
            ]
        ];

        // Mock 訂單編號生成
        $this->mockOrderNumberGenerator
            ->shouldReceive('generateNextNumber')
            ->once()
            ->andReturn('ORD-2025-004');

        // Mock 庫存檢查（只檢查現貨商品，且有庫存）
        $this->mockInventoryService
            ->shouldReceive('batchCheckStock')
            ->once()
            ->andReturn([]); // 空陣列表示所有商品都有足夠庫存

        // Mock 批量扣減庫存（只扣減現貨商品）
        $this->mockInventoryService
            ->shouldReceive('batchDeductStock')
            ->once()
            ->with(
                Mockery::on(function ($items) {
                    // 驗證只有一個項目（現貨商品）
                    return count($items) === 1 && $items[0]['product_variant_id'] === $this->productVariant->id;
                }),
                $this->store->id,
                Mockery::type('array')
            )
            ->andReturn(true);

        // 執行測試
        $order = $this->orderService->createOrder($orderData);

        // 驗證結果
        $this->assertInstanceOf(Order::class, $order);
        $this->assertEquals(1200.00, $order->grand_total); // 100*2 + 200*5
        
        // 驗證項目標記
        $items = $order->items->sortBy('product_variant_id')->values();
        $this->assertTrue($items[0]->is_stocked_sale); // 現貨商品
        $this->assertFalse($items[0]->is_backorder);
        $this->assertTrue($items[0]->is_fulfilled); // 現貨商品自動標記為已履行
        
        $this->assertFalse($items[1]->is_stocked_sale); // 預訂商品
        $this->assertTrue($items[1]->is_backorder);
        $this->assertFalse($items[1]->is_fulfilled); // 預訂商品不會自動履行
    }

    /**
     * 測試創建訂單時運費和稅金計算
     */
    public function test_create_order_with_shipping_and_tax(): void
    {
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '信用卡',
            'order_source' => '網路訂單',
            'shipping_address' => '測試地址',
            'shipping_fee' => 50.00,
            'tax' => 100.00,
            'discount_amount' => 30.00,
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'product_name' => '測試商品',
                    'sku' => 'ORDER-MAIN-SKU-001',
                    'price' => 100.00,
                    'quantity' => 3,
                ]
            ]
        ];

        $this->mockOrderNumberGenerator
            ->shouldReceive('generateNextNumber')
            ->once()
            ->andReturn('ORD-2025-005');

        $this->mockInventoryService
            ->shouldReceive('batchCheckStock')
            ->once()
            ->andReturn([]);

        $this->mockInventoryService
            ->shouldReceive('batchDeductStock')
            ->once()
            ->andReturn(true);

        $order = $this->orderService->createOrder($orderData);

        // 驗證金額計算
        $this->assertEquals(300.00, $order->subtotal); // 100 * 3
        $this->assertEquals(50.00, $order->shipping_fee);
        $this->assertEquals(100.00, $order->tax);
        $this->assertEquals(30.00, $order->discount_amount);
        $this->assertEquals(420.00, $order->grand_total); // 300 + 50 + 100 - 30
    }

    /**
     * 測試創建訂單時現貨商品庫存不足會拋出異常
     */
    public function test_create_order_stock_item_insufficient(): void
    {
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'product_name' => '測試商品',
                    'sku' => 'ORDER-MAIN-SKU-001',
                    'price' => 100.00,
                    'quantity' => 10,
                ]
            ]
        ];

        $stockCheckResults = [
            [
                'product_variant_id' => $this->productVariant->id,
                'product_name' => '測試商品',
                'sku' => 'ORDER-MAIN-SKU-001',
                'requested_quantity' => 10,
                'available_quantity' => 5,
            ]
        ];

        // 需要先為訂單編號生成器設置預期，因為它會在庫存檢查之前被調用
        $this->mockOrderNumberGenerator
            ->shouldReceive('generateNextNumber')
            ->once()
            ->andReturn('TEST-ORDER-001');

        $this->mockInventoryService
            ->shouldReceive('batchCheckStock')
            ->once()
            ->andReturn($stockCheckResults);

        // 預期拋出異常
        try {
            $this->orderService->createOrder($orderData);
            $this->fail('應該拋出異常');
        } catch (\Exception $e) {
            $this->assertEquals('現貨商品庫存不足', $e->getMessage());
            $this->assertNotEmpty($e->stockCheckResults);
            $this->assertNotEmpty($e->insufficientStockItems);
            $this->assertEquals(5, $e->insufficientStockItems[0]['shortage']);
        }
    }

    /**
     * 測試創建貨運單
     */
    public function test_create_shipment_successfully(): void
    {
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'shipping_status' => 'processing',
            'tracking_number' => null,
            'carrier' => null,
            'shipped_at' => null
        ]);

        // 添加訂單項目
        OrderItem::factory()->count(2)->create([
            'order_id' => $order->id,
            'status' => '待處理'
        ]);

        $shipmentData = [
            'tracking_number' => 'TRACK-123456',
            'carrier' => '黑貓宅配',
            'notes' => '已出貨'
        ];

        $updatedOrder = $this->orderService->createShipment($order, $shipmentData);

        $this->assertEquals('shipped', $updatedOrder->shipping_status);
        $this->assertEquals('TRACK-123456', $updatedOrder->tracking_number);
        $this->assertEquals('黑貓宅配', $updatedOrder->carrier);
        $this->assertNotNull($updatedOrder->shipped_at);
        
        // 驗證狀態歷史
        $statusHistory = $updatedOrder->statusHistories->last();
        $this->assertEquals('shipped', $statusHistory->to_status);
        $this->assertStringContainsString('已出貨', $statusHistory->notes);
    }

    /**
     * 測試批量更新運送狀態
     */
    public function test_batch_update_shipping_status(): void
    {
        $orders = Order::factory()->count(3)->create([
            'customer_id' => $this->customer->id,
            'shipping_status' => 'pending'
        ]);

        $orderIds = $orders->pluck('id')->toArray();

        $this->orderService->batchUpdateStatus(
            $orderIds,
            'shipping_status',
            'processing',
            '批量處理中'
        );

        foreach ($orderIds as $orderId) {
            $order = Order::find($orderId);
            $this->assertEquals('processing', $order->shipping_status);
            
            $statusHistory = $order->statusHistories->last();
            $this->assertEquals('shipping', $statusHistory->status_type);
            $this->assertStringContainsString('批量操作', $statusHistory->notes);
        }
    }

    /**
     * 測試訂單編輯時減少數量的庫存處理
     */
    public function test_update_order_decrease_quantity(): void
    {
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'subtotal' => 500.00,
            'shipping_fee' => 0.00,
            'tax' => 0.00,
            'discount_amount' => 0.00,
            'grand_total' => 500.00
        ]);

        $item = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 5,
            'price' => 100.00,
            'is_stocked_sale' => true
        ]);

        $updateData = [
            'items' => [
                [
                    'id' => $item->id,
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 3, // 從 5 減少到 3
                    'price' => 100.00,
                    'is_stocked_sale' => true
                ]
            ]
        ];

        // Mock 返還減少的庫存（返還 2 個）
        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->with($this->productVariant->id, 2, Mockery::any(), Mockery::type('string'), Mockery::type('array'))
            ->andReturn(true);

        $updatedOrder = $this->orderService->updateOrder($order, $updateData);

        $updatedItem = $updatedOrder->items->first();
        $this->assertEquals(3, $updatedItem->quantity);
        $this->assertEquals(300.00, $updatedOrder->subtotal);
        $this->assertEquals(300.00, $updatedOrder->grand_total);
    }
}