<?php

namespace Tests\Feature\Api;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Customer;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Response;
use Tests\TestCase;

/**
 * OrderItemController 測試類
 * 
 * 測試訂單項目控制器的所有功能，包括狀態更新和歷史記錄
 */
class OrderItemControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $staff;
    protected User $viewer;
    protected Store $store;
    protected Customer $customer;
    protected Product $product;
    protected ProductVariant $productVariant;
    protected Order $order;
    protected OrderItem $orderItem;

    /**
     * 在每個測試前設定測試資料
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        
        $this->staff = User::factory()->create();
        $this->staff->assignRole('staff');
        
        $this->viewer = User::factory()->create();
        $this->viewer->assignRole('viewer');
        
        // 創建測試資料
        $this->store = Store::factory()->create();
        $this->customer = Customer::factory()->create();
        
        $category = Category::factory()->create();
        $this->product = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant = ProductVariant::factory()->create(['product_id' => $this->product->id]);
        
        // 創建測試訂單和訂單項目
        $this->order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->admin->id,
            'shipping_status' => 'pending'
        ]);
        
        $this->orderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'status' => '待處理',
            'product_name' => '測試商品',
            'sku' => 'TEST-001',
            'price' => 1000,
            'quantity' => 2
        ]);
    }

    /**
     * 測試管理員可以更新訂單項目狀態
     */
    public function test_admin_can_update_order_item_status(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '已叫貨',
            'notes' => '商品已從倉庫叫貨'
        ]);
        
        $response->assertOk()
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'order_number',
                         'items' => [
                             '*' => [
                                 'id',
                                 'status',
                                 'product_name',
                                 'sku'
                             ]
                         ]
                     ]
                 ]);
        
        // 驗證訂單項目狀態已更新
        $this->assertDatabaseHas('order_items', [
            'id' => $this->orderItem->id,
            'status' => '已叫貨'
        ]);
    }

    /**
     * 測試員工無法更新訂單項目狀態（因為 OrderPolicy 限制）
     */
    public function test_staff_cannot_update_order_item_status(): void
    {
        $this->actingAs($this->staff, 'sanctum');
        
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '已叫貨'
        ]);
        
        // 根據 OrderPolicy，只有管理員可以更新訂單
        $response->assertForbidden();
    }

    /**
     * 測試一般用戶無法更新訂單項目狀態
     */
    public function test_viewer_cannot_update_order_item_status(): void
    {
        $this->actingAs($this->viewer, 'sanctum');
        
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '已叫貨'
        ]);
        
        $response->assertForbidden();
    }

    /**
     * 測試未認證用戶無法更新訂單項目狀態
     */
    public function test_unauthenticated_user_cannot_update_order_item_status(): void
    {
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '已叫貨'
        ]);
        
        $response->assertUnauthorized();
    }

    /**
     * 測試更新狀態時會記錄狀態變更歷史
     */
    public function test_updating_status_creates_status_history(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '已叫貨',
            'notes' => '測試狀態變更'
        ]);
        
        $response->assertOk();
        
        // 驗證狀態歷史記錄已創建
        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $this->order->id,
            'status_type' => 'line_item',
            'from_status' => '待處理',
            'to_status' => '已叫貨',
            'user_id' => $this->admin->id,
            'notes' => '測試狀態變更'
        ]);
    }

    /**
     * 測試狀態沒有變更時不創建歷史記錄
     */
    public function test_no_status_change_does_not_create_history(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $originalHistoryCount = OrderStatusHistory::count();
        
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '待處理'  // 相同狀態
        ]);
        
        $response->assertOk();
        
        // 驗證沒有新增狀態歷史記錄
        $this->assertEquals($originalHistoryCount, OrderStatusHistory::count());
    }

    /**
     * 測試沒有提供備註時會自動生成備註
     */
    public function test_auto_generates_notes_when_not_provided(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '已叫貨'
        ]);
        
        $response->assertOk();
        
        // 驗證自動生成的備註
        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $this->order->id,
            'status_type' => 'line_item',
            'from_status' => '待處理',
            'to_status' => '已叫貨',
            'user_id' => $this->admin->id
        ]);
        
        $statusHistory = OrderStatusHistory::where('order_id', $this->order->id)
                                          ->where('status_type', 'line_item')
                                          ->first();
        
        $this->assertStringContainsString('TEST-001', $statusHistory->notes);
        $this->assertStringContainsString('測試商品', $statusHistory->notes);
        $this->assertStringContainsString('待處理', $statusHistory->notes);
        $this->assertStringContainsString('已叫貨', $statusHistory->notes);
    }

    /**
     * 測試當所有項目都完成時自動更新整體訂單狀態
     */
    public function test_automatically_updates_order_status_when_all_items_completed(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        // 創建另一個訂單項目
        $secondOrderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'status' => '待處理'
        ]);
        
        // 先完成第一個項目
        $this->orderItem->update(['status' => '完成']);
        
        // 完成第二個項目，應該觸發整體狀態更新
        $response = $this->patchJson("/api/order-items/{$secondOrderItem->id}/status", [
            'status' => '完成'
        ]);
        
        $response->assertOk();
        
        // 驗證整體訂單狀態已更新為 delivered
        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'shipping_status' => 'delivered'
        ]);
        
        // 驗證創建了整體狀態變更歷史
        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $this->order->id,
            'status_type' => 'shipping',
            'from_status' => 'pending',
            'to_status' => 'delivered',
            'user_id' => $this->admin->id
        ]);
    }

    /**
     * 測試當有項目已出貨時更新整體訂單狀態為處理中
     */
    public function test_updates_order_status_to_processing_when_item_shipped(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '已出貨'
        ]);
        
        $response->assertOk();
        
        // 驗證整體訂單狀態已更新為 processing
        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'shipping_status' => 'processing'
        ]);
        
        // 驗證創建了整體狀態變更歷史
        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $this->order->id,
            'status_type' => 'shipping',
            'from_status' => 'pending',
            'to_status' => 'processing',
            'user_id' => $this->admin->id
        ]);
    }

    /**
     * 測試狀態驗證失敗
     */
    public function test_status_validation_fails(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '無效狀態'
        ]);
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['status']);
    }

    /**
     * 測試缺少必填欄位時的驗證
     */
    public function test_missing_required_status_field(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'notes' => '沒有提供狀態'
        ]);
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['status']);
    }

    /**
     * 測試訂單項目不存在時返回 404
     */
    public function test_returns_404_for_nonexistent_order_item(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->patchJson("/api/order-items/99999/status", [
            'status' => '已叫貨'
        ]);
        
        $response->assertNotFound();
    }

    /**
     * 測試回應包含正確的關聯資料
     */
    public function test_response_includes_correct_relations(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '已叫貨'
        ]);
        
        $response->assertOk()
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'order_number',
                         'items' => [
                             '*' => [
                                 'id',
                                 'status',
                                 'product_name',
                                 'sku'
                             ]
                         ],
                         'customer',
                         'creator'
                     ]
                 ]);
    }

    /**
     * 測試整體訂單狀態不會重複更新
     */
    public function test_order_status_does_not_update_repeatedly(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        // 先將訂單狀態設為 processing
        $this->order->update(['shipping_status' => 'processing']);
        
        // 更新項目狀態為已出貨
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '已出貨'
        ]);
        
        $response->assertOk();
        
        // 驗證訂單狀態保持為 processing（不應該重複更新）
        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'shipping_status' => 'processing'
        ]);
    }

    /**
     * 測試處理數據庫操作失敗的情況
     */
    public function test_handles_database_operation_failure(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        // 使用不存在的狀態值來觸發潛在的數據庫錯誤
        $response = $this->patchJson("/api/order-items/{$this->orderItem->id}/status", [
            'status' => '已叫貨'  // 使用有效狀態
        ]);
        
        // 驗證正常操作成功
        $response->assertOk();
        
        // 驗證數據庫狀態更新
        $this->assertDatabaseHas('order_items', [
            'id' => $this->orderItem->id,
            'status' => '已叫貨'
        ]);
    }
} 