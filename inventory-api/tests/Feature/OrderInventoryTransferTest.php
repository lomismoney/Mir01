<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\InventoryTransfer;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class OrderInventoryTransferTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private OrderService $orderService;
    private User $user;
    private Store $fromStore;
    private Store $toStore;
    private Customer $customer;
    private ProductVariant $productVariant;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 在 SQLite 中啟用外鍵約束
        if (config('database.default') === 'sqlite') {
            \DB::statement('PRAGMA foreign_keys = ON');
        }
        
        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        
        // 創建測試門市
        $this->fromStore = Store::factory()->create(['name' => '門市A']);
        $this->toStore = Store::factory()->create(['name' => '門市B']);
        
        // 創建測試客戶
        $this->customer = Customer::factory()->create();
        
        // 創建測試商品
        $this->productVariant = ProductVariant::factory()->create();
        
        // 初始化服務
        $this->orderService = app(OrderService::class);
    }

    /**
     * 測試刪除訂單時會自動取消相關的待處理庫存轉移
     */
    public function test_deleting_order_cancels_pending_inventory_transfers()
    {
        // 1. 創建一個訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->toStore->id,
            'creator_user_id' => $this->user->id,
        ]);

        // 2. 創建多個與訂單關聯的庫存轉移記錄
        $pendingTransfer = InventoryTransfer::factory()->create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'order_id' => $order->id,
            'status' => 'pending',
            'quantity' => 10,
            'notes' => '因訂單庫存不足而調貨',
        ]);

        $processingTransfer = InventoryTransfer::factory()->create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'order_id' => $order->id,
            'status' => 'in_transit',
            'quantity' => 5,
            'notes' => '正在運送中的調貨',
        ]);

        // 已完成的轉移不應該被取消
        $completedTransfer = InventoryTransfer::factory()->create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'order_id' => $order->id,
            'status' => 'completed',
            'quantity' => 3,
            'notes' => '已完成的調貨',
        ]);

        // 3. 刪除訂單前，先確認庫存轉移的狀態
        $this->assertDatabaseHas('inventory_transfers', [
            'id' => $pendingTransfer->id,
            'status' => 'pending',
            'order_id' => $order->id,
        ]);

        // 3. 刪除訂單前，先確認庫存轉移的狀態
        $this->assertDatabaseHas('inventory_transfers', [
            'id' => $pendingTransfer->id,
            'status' => 'pending',
            'order_id' => $order->id,
        ]);

        // 刪除訂單
        $this->orderService->deleteOrder($order);
        
        // 驗證庫存轉移記錄仍然存在（不會被級聯刪除）
        $this->assertDatabaseHas('inventory_transfers', [
            'id' => $pendingTransfer->id,
        ]);

        // 4. 驗證待處理和處理中的庫存轉移已被取消
        $pendingTransfer->refresh();
        $processingTransfer->refresh();
        $completedTransfer->refresh();

        // 驗證狀態
        $this->assertEquals('cancelled', $pendingTransfer->status);
        $this->assertEquals('cancelled', $processingTransfer->status);
        $this->assertEquals('completed', $completedTransfer->status); // 已完成的不應該被取消

        // 驗證備註已更新
        $this->assertStringContainsString("因訂單 {$order->order_number} 被刪除/取消", $pendingTransfer->notes);
        $this->assertStringContainsString("因訂單 {$order->order_number} 被刪除/取消", $processingTransfer->notes);
        $this->assertStringNotContainsString("被刪除/取消", $completedTransfer->notes);
        
        // 驗證 order_id 已被設為 null（避免外鍵約束）
        $this->assertNull($pendingTransfer->order_id);
        $this->assertNull($processingTransfer->order_id);
        $this->assertNull($completedTransfer->order_id);

        // 驗證訂單已被刪除
        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
    }

    /**
     * 測試取消訂單時會自動取消相關的待處理庫存轉移
     */
    public function test_cancelling_order_cancels_pending_inventory_transfers()
    {
        // 1. 創建一個訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->toStore->id,
            'creator_user_id' => $this->user->id,
            'shipping_status' => 'pending',
        ]);

        // 2. 創建與訂單關聯的庫存轉移記錄
        $pendingTransfer = InventoryTransfer::factory()->create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'order_id' => $order->id,
            'status' => 'pending',
            'quantity' => 10,
        ]);

        // 3. 取消訂單
        $cancelledOrder = $this->orderService->cancelOrder($order, '客戶要求取消');

        // 4. 驗證庫存轉移已被取消
        $pendingTransfer->refresh();
        $this->assertEquals('cancelled', $pendingTransfer->status);
        $this->assertStringContainsString("因訂單 {$order->order_number} 被刪除/取消", $pendingTransfer->notes);

        // 驗證訂單狀態已更新
        $this->assertEquals('cancelled', $cancelledOrder->shipping_status);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'shipping_status' => 'cancelled',
        ]);
    }

    /**
     * 測試無法刪除有未取消庫存轉移的訂單（外鍵約束）
     */
    public function test_cannot_delete_order_with_active_transfers_due_to_foreign_key()
    {
        // 1. 創建一個訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->toStore->id,
            'creator_user_id' => $this->user->id,
        ]);

        // 2. 創建與訂單關聯的庫存轉移記錄
        $transfer = InventoryTransfer::factory()->create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'order_id' => $order->id,
            'status' => 'pending',
            'quantity' => 10,
        ]);

        // 3. 嘗試直接刪除訂單（繞過服務層）
        // 這應該會失敗，因為外鍵約束
        try {
            $order->delete();
            $this->fail('Expected foreign key constraint violation');
        } catch (\Illuminate\Database\QueryException $e) {
            // 預期會有外鍵約束錯誤
            $this->assertTrue(
                str_contains($e->getMessage(), 'FOREIGN KEY constraint failed') || 
                str_contains($e->getMessage(), 'foreign key constraint fails'),
                'Expected foreign key constraint violation'
            );
        }

        // 驗證訂單仍然存在
        $this->assertDatabaseHas('orders', ['id' => $order->id]);
        
        // 驗證庫存轉移仍然是待處理狀態
        $this->assertDatabaseHas('inventory_transfers', [
            'id' => $transfer->id,
            'status' => 'pending',
        ]);
    }

    /**
     * 測試沒有關聯庫存轉移的訂單可以正常刪除
     */
    public function test_can_delete_order_without_inventory_transfers()
    {
        // 1. 創建一個訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->toStore->id,
            'creator_user_id' => $this->user->id,
        ]);

        // 2. 刪除訂單
        $result = $this->orderService->deleteOrder($order);

        // 3. 驗證訂單已被刪除
        $this->assertTrue($result);
        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
    }
}
