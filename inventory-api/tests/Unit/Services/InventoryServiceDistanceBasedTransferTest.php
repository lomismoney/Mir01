<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\InventoryService;
use App\Services\StockTransferService;
use App\Models\Store;
use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class InventoryServiceDistanceBasedTransferTest extends TestCase
{
    use RefreshDatabase;

    protected InventoryService $inventoryService;
    protected $mockStockTransferService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockStockTransferService = Mockery::mock(StockTransferService::class);
        $this->inventoryService = new InventoryService($this->mockStockTransferService);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_uses_distance_based_transfer_suggestions_in_getStockSuggestions()
    {
        // 準備測試數據
        $targetStore = Store::factory()->create(['name' => '目標店舖']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        // 目標店舖庫存不足
        Inventory::factory()->create([
            'store_id' => $targetStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 3, // 需要10個但只有3個
        ]);

        // Mock StockTransferService 返回基於距離的調貨建議
        $this->mockStockTransferService
            ->shouldReceive('getTransferOptionsForStockSuggestion')
            ->once()
            ->with($variant->id, $targetStore->id, 7) // shortage = 10 - 3 = 7
            ->andReturn([
                [
                    'store_id' => 2,
                    'store_name' => '近距離店舖',
                    'available_quantity' => 5,
                    'suggested_quantity' => 5,
                    'distance' => 2.5,
                ],
                [
                    'store_id' => 3,
                    'store_name' => '遠距離店舖',
                    'available_quantity' => 8,
                    'suggested_quantity' => 2,
                    'distance' => 15.0,
                ]
            ]);

        // 執行測試
        $result = $this->inventoryService->getStockSuggestions([
            [
                'product_variant_id' => $variant->id,
                'quantity' => 10,
            ]
        ], $targetStore->id);

        // 驗證結果
        $this->assertCount(1, $result);
        $suggestion = $result[0];

        $this->assertEquals('transfer', $suggestion['type']); // 可完全透過調貨滿足
        $this->assertCount(2, $suggestion['transfers']);
        
        // 驗證第一個調貨選項（近距離）
        $this->assertEquals(2, $suggestion['transfers'][0]['from_store_id']);
        $this->assertEquals('近距離店舖', $suggestion['transfers'][0]['from_store_name']);
        $this->assertEquals(2.5, $suggestion['transfers'][0]['distance']);
        
        // 驗證第二個調貨選項（遠距離）
        $this->assertEquals(3, $suggestion['transfers'][1]['from_store_id']);
        $this->assertEquals('遠距離店舖', $suggestion['transfers'][1]['from_store_name']);
        $this->assertEquals(15.0, $suggestion['transfers'][1]['distance']);
    }

    /** @test */
    public function it_suggests_mixed_solution_when_transfer_insufficient()
    {
        $targetStore = Store::factory()->create();
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        // 目標店舖庫存
        Inventory::factory()->create([
            'store_id' => $targetStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2, // 需要20個但只有2個
        ]);

        // Mock 只能部分調貨
        $this->mockStockTransferService
            ->shouldReceive('getTransferOptionsForStockSuggestion')
            ->once()
            ->with($variant->id, $targetStore->id, 18) // shortage = 20 - 2 = 18
            ->andReturn([
                [
                    'store_id' => 2,
                    'store_name' => '店舖A',
                    'available_quantity' => 5,
                    'suggested_quantity' => 5,
                    'distance' => 3.0,
                ],
                [
                    'store_id' => 3,
                    'store_name' => '店舖B',
                    'available_quantity' => 8,
                    'suggested_quantity' => 8,
                    'distance' => null, // 無座標店舖
                ]
            ]);

        $result = $this->inventoryService->getStockSuggestions([
            [
                'product_variant_id' => $variant->id,
                'quantity' => 20,
            ]
        ], $targetStore->id);

        $suggestion = $result[0];
        
        $this->assertEquals('mixed', $suggestion['type']);
        $this->assertEquals(5, $suggestion['purchase_quantity']); // 需要進貨 20 - (2 + 5 + 8) = 5
        $this->assertNotNull($suggestion['mixed_solution']);
        $this->assertEquals(13, $suggestion['mixed_solution']['transfer_quantity']); // 5 + 8
        $this->assertEquals(5, $suggestion['mixed_solution']['purchase_quantity']);
    }

    /** @test */
    public function it_uses_distance_based_selection_in_initiateAutomatedTransfer()
    {
        // 準備認證用戶
        $user = User::factory()->create();
        $this->actingAs($user);

        $targetStore = Store::factory()->create();
        $sourceStore = Store::factory()->create(['name' => '最近店舖']); // 創建來源店舖
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'store_id' => $targetStore->id,
            'customer_id' => $customer->id,
        ]);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'quantity' => 5,
        ]);

        // Mock StockTransferService 返回基於距離的最佳選項
        $this->mockStockTransferService
            ->shouldReceive('findOptimalTransferStores')
            ->once()
            ->with($targetStore->id, $variant->id, 5)
            ->andReturn([
                [
                    'store_id' => $sourceStore->id, // 使用實際創建的店舖ID
                    'store_name' => '最近店舖',
                    'available_quantity' => 10,
                    'suggested_quantity' => 5,
                    'distance' => 1.2,
                ]
            ]);

        // 執行測試
        $result = $this->inventoryService->initiateAutomatedTransfer($orderItem, $targetStore->id);

        // 驗證結果
        $this->assertTrue($result);
        
        // 驗證訂單項目狀態更新
        $orderItem->refresh();
        $this->assertEquals('transfer_pending', $orderItem->status);
        
        // 驗證調貨單創建
        $this->assertDatabaseHas('inventory_transfers', [
            'from_store_id' => $sourceStore->id,
            'to_store_id' => $targetStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 5,
            'order_id' => $order->id,
            'status' => 'pending',
        ]);
    }

    /** @test */
    public function it_handles_no_transfer_options_available()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $targetStore = Store::factory()->create();
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'store_id' => $targetStore->id,
            'customer_id' => $customer->id,
        ]);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'quantity' => 5,
        ]);

        // Mock 沒有可用的調貨選項
        $this->mockStockTransferService
            ->shouldReceive('findOptimalTransferStores')
            ->once()
            ->with($targetStore->id, $variant->id, 5)
            ->andReturn([]);

        $result = $this->inventoryService->initiateAutomatedTransfer($orderItem, $targetStore->id);

        // 驗證結果
        $this->assertFalse($result);
        
        // 驗證訂單項目狀態更新为预订
        $orderItem->refresh();
        $this->assertEquals('backordered', $orderItem->status);
    }

    /** @test */
    public function it_handles_insufficient_stock_in_best_option()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $targetStore = Store::factory()->create();
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'store_id' => $targetStore->id,
            'customer_id' => $customer->id,
        ]);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'quantity' => 10, // 需要10個
        ]);

        // Mock 最佳選項庫存不足
        $this->mockStockTransferService
            ->shouldReceive('findOptimalTransferStores')
            ->once()
            ->with($targetStore->id, $variant->id, 10)
            ->andReturn([
                [
                    'store_id' => 2,
                    'store_name' => '庫存不足店舖',
                    'available_quantity' => 5, // 只有5個，不足10個
                    'suggested_quantity' => 5,
                    'distance' => 1.2,
                ]
            ]);

        $result = $this->inventoryService->initiateAutomatedTransfer($orderItem, $targetStore->id);

        // 驗證結果
        $this->assertFalse($result);
        
        // 驗證訂單項目狀態更新为预订
        $orderItem->refresh();
        $this->assertEquals('backordered', $orderItem->status);
    }

    /** @test */
    public function it_includes_distance_information_in_stock_suggestions()
    {
        $targetStore = Store::factory()->create();
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        Inventory::factory()->create([
            'store_id' => $targetStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 0, // 無庫存
        ]);

        // Mock 返回包含距離資訊的調貨建議
        $this->mockStockTransferService
            ->shouldReceive('getTransferOptionsForStockSuggestion')
            ->once()
            ->andReturn([
                [
                    'store_id' => 2,
                    'store_name' => '有座標店舖',
                    'available_quantity' => 8,
                    'suggested_quantity' => 5,
                    'distance' => 4.2,
                ],
                [
                    'store_id' => 3,
                    'store_name' => '無座標店舖',
                    'available_quantity' => 12,
                    'suggested_quantity' => 5,
                    'distance' => null,
                ]
            ]);

        $result = $this->inventoryService->getStockSuggestions([
            [
                'product_variant_id' => $variant->id,
                'quantity' => 5,
            ]
        ], $targetStore->id);

        $transfers = $result[0]['transfers'];
        
        // 驗證距離資訊正確包含
        $this->assertEquals(4.2, $transfers[0]['distance']);
        $this->assertNull($transfers[1]['distance']);
    }
}