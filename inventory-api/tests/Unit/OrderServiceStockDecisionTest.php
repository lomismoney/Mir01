<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\OrderService;
use App\Services\InventoryService;
use App\Services\OrderNumberGenerator;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

/**
 * OrderService 庫存決策測試
 * 
 * 此測試類專注於驗證 OrderService 正確處理用戶的庫存決策
 * 根據 CLAUDE.md 的 TDD 原則：先寫失敗的測試，再修復代碼
 */
class OrderServiceStockDecisionTest extends TestCase
{
    use RefreshDatabase;

    private OrderService $orderService;
    private Customer $customer;
    private ProductVariant $productVariant;
    private Store $store;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試數據
        $this->customer = Customer::factory()->create();
        $this->productVariant = ProductVariant::factory()->create();
        $this->store = Store::factory()->create();
        $this->user = User::factory()->create();
        
        // Mock 依賴服務
        $mockInventoryService = Mockery::mock(InventoryService::class);
        $mockOrderNumberGenerator = Mockery::mock(OrderNumberGenerator::class);
        $mockOrderNumberGenerator->shouldReceive('generateNextNumber')->andReturn('SO-TEST-001');
        
        // 創建 OrderService 實例
        $this->orderService = new OrderService($mockInventoryService, $mockOrderNumberGenerator);
        
        // Mock 認證用戶
        $this->actingAs($this->user);
    }

    /**
     * 測試：用戶選擇「調貨」時，系統應該調用 initiateAutomatedTransfer
     * 
     * @test
     */
    public function test_user_chooses_transfer_action_should_initiate_transfer()
    {
        // Mock InventoryService 期望被調用
        $mockInventoryService = Mockery::mock(InventoryService::class);
        
        // Mock batchCheckStock 方法 - 返回空陣列表示庫存充足
        $mockInventoryService->shouldReceive('batchCheckStock')
            ->once()
            ->andReturn([]);
            
        // Mock batchDeductStock 方法
        $mockInventoryService->shouldReceive('batchDeductStock')
            ->once()
            ->andReturn(true);
            
        $mockInventoryService->shouldReceive('initiateAutomatedTransfer')
            ->once()
            ->with(Mockery::type(OrderItem::class), Mockery::type('integer'))
            ->andReturn(true);
        
        $mockOrderNumberGenerator = Mockery::mock(OrderNumberGenerator::class);
        $mockOrderNumberGenerator->shouldReceive('generateNextNumber')->andReturn('SO-TEST-001');
        
        $orderService = new OrderService($mockInventoryService, $mockOrderNumberGenerator);
        
        // 準備訂單數據 - 用戶選擇調貨
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'order_source' => 'manual',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => '待處理',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-SKU',
                    'price' => 100.00,
                    'quantity' => 2,
                ]
            ],
            // 🎯 關鍵：用戶選擇調貨
            'stock_decisions' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'action' => 'transfer',  // 用戶選擇調貨
                    'quantity' => 2
                ]
            ]
        ];

        $order = $orderService->createOrder($orderData);
        
        // 驗證訂單創建成功
        $this->assertInstanceOf(Order::class, $order);
        
        // Mock 驗證：確保 initiateAutomatedTransfer 被調用
        // 這個驗證會在 tearDown 時自動進行
    }

    /**
     * 測試：用戶選擇「進貨」時，系統不應該調用 initiateAutomatedTransfer
     * 
     * @test
     */
    public function test_user_chooses_purchase_action_should_not_initiate_transfer()
    {
        // Mock InventoryService 期望不被調用
        $mockInventoryService = Mockery::mock(InventoryService::class);
        
        // 預訂商品不會檢查庫存，所以 batchCheckStock 不應該被調用
        $mockInventoryService->shouldNotReceive('batchCheckStock');
        $mockInventoryService->shouldNotReceive('initiateAutomatedTransfer');
        
        $mockOrderNumberGenerator = Mockery::mock(OrderNumberGenerator::class);
        $mockOrderNumberGenerator->shouldReceive('generateNextNumber')->andReturn('SO-TEST-002');
        
        $orderService = new OrderService($mockInventoryService, $mockOrderNumberGenerator);
        
        // 準備訂單數據 - 用戶選擇進貨
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'order_source' => 'manual',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => false, // 預訂商品
                    'is_backorder' => true,
                    'status' => '待處理',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-SKU',
                    'price' => 100.00,
                    'quantity' => 2,
                ]
            ],
            // 🎯 關鍵：用戶選擇進貨
            'stock_decisions' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'action' => 'purchase',  // 用戶選擇進貨
                    'quantity' => 2
                ]
            ]
        ];

        $order = $orderService->createOrder($orderData);
        
        // 驗證訂單創建成功
        $this->assertInstanceOf(Order::class, $order);
        
        // 驗證商品狀態為預訂
        $orderItem = $order->items->first();
        $this->assertFalse($orderItem->is_stocked_sale);
        $this->assertTrue($orderItem->is_backorder);
        
        // Mock 驗證：確保 initiateAutomatedTransfer 不被調用
        // 這個驗證會在 tearDown 時自動進行
    }

    /**
     * 測試：用戶選擇「混合」方案時，系統應該調用 initiateAutomatedTransfer
     * 
     * @test
     */
    public function test_user_chooses_mixed_action_should_initiate_transfer()
    {
        // Mock InventoryService 期望被調用
        $mockInventoryService = Mockery::mock(InventoryService::class);
        
        // Mock batchCheckStock 方法 - 返回空陣列表示庫存充足
        $mockInventoryService->shouldReceive('batchCheckStock')
            ->once()
            ->andReturn([]);
            
        // Mock batchDeductStock 方法
        $mockInventoryService->shouldReceive('batchDeductStock')
            ->once()
            ->andReturn(true);
            
        $mockInventoryService->shouldReceive('initiateAutomatedTransfer')
            ->once()
            ->with(Mockery::type(OrderItem::class), Mockery::type('integer'))
            ->andReturn(true);
        
        $mockOrderNumberGenerator = Mockery::mock(OrderNumberGenerator::class);
        $mockOrderNumberGenerator->shouldReceive('generateNextNumber')->andReturn('SO-TEST-003');
        
        $orderService = new OrderService($mockInventoryService, $mockOrderNumberGenerator);
        
        // 準備訂單數據 - 用戶選擇混合方案
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'order_source' => 'manual',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => '待處理',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-SKU',
                    'price' => 100.00,
                    'quantity' => 2,
                ]
            ],
            // 🎯 關鍵：用戶選擇混合方案
            'stock_decisions' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'action' => 'mixed',  // 用戶選擇混合方案
                    'quantity' => 2,
                    'transfers' => [
                        ['from_store_id' => 2, 'quantity' => 1]
                    ],
                    'purchase_quantity' => 1
                ]
            ]
        ];

        $order = $orderService->createOrder($orderData);
        
        // 驗證訂單創建成功
        $this->assertInstanceOf(Order::class, $order);
        
        // Mock 驗證：確保 initiateAutomatedTransfer 被調用
        // 這個驗證會在 tearDown 時自動進行
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}