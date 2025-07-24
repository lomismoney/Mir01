<?php

namespace Tests\Feature\Api;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use App\Models\PaymentRecord;
use App\Services\OrderService;
use App\Services\RefundService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Response;
use Tests\TestCase;

/**
 * OrderController 測試類
 * 
 * 測試訂單控制器的所有功能，包括 CRUD 操作、狀態管理、付款處理等
 */
class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $staff;
    protected User $viewer;
    protected Store $store;
    protected Customer $customer;
    protected Product $product;
    protected ProductVariant $productVariant;

    /**
     * 在每個測試前設定
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
        
        // 創建足夠的庫存
        $this->productVariant->inventory()->create([
            'store_id' => $this->store->id,
            'quantity' => 100,
            'low_stock_threshold' => 5
        ]);
    }

    /**
     * 測試管理員可以獲取訂單列表
     */
    public function test_admin_can_get_orders_list(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        // 創建測試訂單
        Order::factory()->count(3)->create(['customer_id' => $this->customer->id]);
        
        $response = $this->getJson('/api/orders');
        
        $response->assertOk()
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'id',
                             'order_number',
                             'customer_id',
                             'shipping_status',
                             'payment_status',
                             'created_at',
                             'grand_total',
                             'paid_amount'
                         ]
                     ],
                     'meta' => [
                         'current_page',
                         'from',
                         'last_page',
                         'per_page',
                         'to',
                         'total'
                     ]
                 ]);
    }

    /**
     * 測試管理員可以按關鍵字搜尋訂單
     */
    public function test_admin_can_search_orders_by_keyword(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'order_number' => 'TEST-001'
        ]);
        
        Order::factory()->create([
            'customer_id' => $this->customer->id,
            'order_number' => 'OTHER-002'
        ]);
        
        $response = $this->getJson('/api/orders?search=TEST');
        
        $response->assertOk()
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.order_number', 'TEST-001');
    }

    /**
     * 測試管理員可以按狀態篩選訂單
     */
    public function test_admin_can_filter_orders_by_status(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'paid'
        ]);
        
        Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'pending'
        ]);
        
        $response = $this->getJson('/api/orders?payment_status=paid');
        
        $response->assertOk()
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.payment_status', 'paid');
    }

    /**
     * 測試管理員可以按日期範圍篩選訂單
     */
    public function test_admin_can_filter_orders_by_date_range(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        Order::factory()->create([
            'customer_id' => $this->customer->id,
            'created_at' => '2025-01-15 10:00:00'
        ]);
        
        Order::factory()->create([
            'customer_id' => $this->customer->id,
            'created_at' => '2025-02-15 10:00:00'
        ]);
        
        $response = $this->getJson('/api/orders?start_date=2025-01-01&end_date=2025-01-31');
        
        $response->assertOk()
                 ->assertJsonCount(1, 'data');
    }

    /**
     * 測試一般員工無法查看所有訂單列表（只有管理員可以）
     */
    public function test_staff_cannot_view_all_orders(): void
    {
        $this->actingAs($this->staff, 'sanctum');
        
        Order::factory()->create(['customer_id' => $this->customer->id]);
        
        $response = $this->getJson('/api/orders');
        
        // 根據 OrderPolicy，只有管理員可以查看所有訂單
        $response->assertForbidden();
    }

    /**
     * 測試未認證用戶無法獲取訂單列表
     */
    public function test_unauthenticated_user_cannot_get_orders(): void
    {
        $response = $this->getJson('/api/orders');
        
        $response->assertUnauthorized();
    }

    /**
     * 測試分頁參數驗證
     */
    public function test_index_validates_pagination_parameters(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->getJson('/api/orders?page=0&per_page=101');
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['page', 'per_page']);
    }

    /**
     * 測試日期參數驗證
     */
    public function test_index_validates_date_parameters(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->getJson('/api/orders?start_date=invalid&end_date=2025-01-01');
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['start_date', 'end_date']);
    }

    /**
     * 測試管理員可以創建訂單
     */
    public function test_admin_can_create_order(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'shipping_fee' => 100.00,  // API 接受元為單位
            'tax' => 50.00,            // API 接受元為單位
            'discount_amount' => 0,
            'payment_method' => '轉帳',
            'order_source' => '現場客戶',
            'shipping_address' => '台北市信義區信義路五段7號',
            'notes' => '請小心輕放',
            'force_create_despite_stock' => false,
            'is_tax_inclusive' => false,  // 新增必要欄位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => '待處理',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000.00,  // API 接受元為單位
                    'quantity' => 2,
                ]
            ]
        ];
        
        $response = $this->postJson('/api/orders', $orderData);
        
        $response->assertCreated()
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'order_number',
                         'customer_id',
                         'shipping_status',
                         'payment_status'
                     ]
                 ]);
        
        $this->assertDatabaseHas('orders', [
            'customer_id' => $this->customer->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'shipping_fee' => 10000,   // 100.00 * 100 = 10000 分
            'tax' => 10000             // 2000 * 5% = 100.00 元 = 10000 分 (系統自動計算)
        ]);
    }

    /**
     * 測試創建訂單時的庫存不足錯誤處理
     */
    public function test_create_order_handles_insufficient_stock(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        // 模擬 OrderService 拋出庫存不足異常
        $this->mock(OrderService::class, function ($mock) {
            $exception = new \Exception('庫存不足');
            $exception->stockCheckResults = [];
            $exception->insufficientStockItems = [
                [
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'requested_quantity' => 5,
                    'available_quantity' => 2,
                    'shortage' => 3
                ]
            ];
            $mock->shouldReceive('createOrder')->andThrow($exception);
        });
        
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '轉帳',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'is_tax_inclusive' => false,  // 新增必要欄位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => '待處理',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000.00,  // API 接受元為單位
                    'quantity' => 5,
                ]
            ]
        ];
        
        $response = $this->postJson('/api/orders', $orderData);
        
        $response->assertStatus(422)
                 ->assertJsonPath('message', '庫存不足')
                 ->assertJsonStructure([
                     'stockCheckResults',
                     'insufficientStockItems' => [
                         '*' => [
                             'product_name',
                             'sku',
                             'requested_quantity',
                             'available_quantity',
                             'shortage'
                         ]
                     ]
                 ]);
    }

    /**
     * 測試一般用戶無法創建訂單
     */
    public function test_viewer_cannot_create_order(): void
    {
        $this->actingAs($this->viewer, 'sanctum');
        
        // 提供完整的有效數據，但 viewer 角色應該因權限不足而被拒絕
        $orderData = [
            'customer_id' => $this->customer->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '轉帳',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'is_tax_inclusive' => false,  // 新增必要欄位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => '待處理',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000.00,  // API 接受元為單位
                    'quantity' => 1,
                ]
            ]
        ];
        
        $response = $this->postJson('/api/orders', $orderData);
        
        $response->assertForbidden();
    }

    /**
     * 測試創建訂單時的驗證錯誤
     */
    public function test_create_order_validation_errors(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->postJson('/api/orders', []);
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['customer_id', 'items']);
    }

    /**
     * 測試管理員可以查看訂單詳情
     */
    public function test_admin_can_view_order_details(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create(['customer_id' => $this->customer->id]);
        OrderItem::factory()->create(['order_id' => $order->id]);
        
        $response = $this->getJson("/api/orders/{$order->id}");
        
        $response->assertOk()
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'order_number',
                         'customer_id',
                         'items',
                         'customer',
                         'creator'
                     ]
                 ]);
    }

    /**
     * 測試查看不存在的訂單
     */
    public function test_show_nonexistent_order_returns_404(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->getJson('/api/orders/99999');
        
        $response->assertNotFound();
    }

    /**
     * 測試管理員可以更新訂單
     */
    public function test_admin_can_update_order(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create(['customer_id' => $this->customer->id]);
        
        $updateData = [
            'shipping_status' => 'processing',
            'payment_status' => 'paid',
            'notes' => '更新的備註'
        ];
        
        $response = $this->patchJson("/api/orders/{$order->id}", $updateData);
        
        $response->assertOk()
                 ->assertJsonPath('data.shipping_status', 'processing')
                 ->assertJsonPath('data.payment_status', 'paid');
    }

    /**
     * 測試一般用戶無法更新訂單
     */
    public function test_viewer_cannot_update_order(): void
    {
        $this->actingAs($this->viewer, 'sanctum');
        
        $order = Order::factory()->create(['customer_id' => $this->customer->id]);
        
        $response = $this->patchJson("/api/orders/{$order->id}", []);
        
        $response->assertForbidden();
    }

    /**
     * 測試管理員可以刪除訂單
     */
    public function test_admin_can_delete_order(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        // 創建可刪除狀態的訂單（非 shipped 或 delivered 狀態）
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'shipping_status' => 'pending'  // 確保訂單可以被刪除
        ]);
        
        $response = $this->deleteJson("/api/orders/{$order->id}");
        
        $response->assertNoContent();
        // 檢查訂單是否從數據庫中刪除（硬刪除）
        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
    }

    /**
     * 測試一般用戶無法刪除訂單
     */
    public function test_viewer_cannot_delete_order(): void
    {
        $this->actingAs($this->viewer, 'sanctum');
        
        $order = Order::factory()->create(['customer_id' => $this->customer->id]);
        
        $response = $this->deleteJson("/api/orders/{$order->id}");
        
        $response->assertForbidden();
    }

    /**
     * 測試確認付款功能
     */
    public function test_admin_can_confirm_payment(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'pending'
        ]);
        
        $response = $this->postJson("/api/orders/{$order->id}/confirm-payment");
        
        $response->assertOk()
                 ->assertJsonPath('data.payment_status', 'paid');
    }

    /**
     * 測試已付款訂單無法重複確認付款
     */
    public function test_cannot_confirm_payment_for_already_paid_order(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'paid'
        ]);
        
        $response = $this->postJson("/api/orders/{$order->id}/confirm-payment");
        
        $response->assertStatus(422)
                 ->assertJsonPath('message', '此訂單的付款狀態不允許確認付款操作');
    }

    /**
     * 測試新增部分付款記錄
     */
    public function test_admin_can_add_payment(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        // 先創建訂單基本資料
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'pending',
        ]);
        
        // 直接更新資料庫以確保金額正確（避免任何 accessor/mutator 問題）
        \DB::table('orders')->where('id', $order->id)->update([
            'grand_total' => 1000000,  // 10000.00 * 100 = 1000000 分
            'paid_amount' => 0         // 確保沒有已付金額
        ]);
        
        // 重新載入 Model
        $order->refresh();
        
        $paymentData = [
            'amount' => 5000.00,  // API 接受元為單位
            'payment_method' => 'cash',
            'notes' => '收到現金付款'
        ];
        
        $response = $this->postJson("/api/orders/{$order->id}/add-payment", $paymentData);
        
        $response->assertOk();
        
        $this->assertDatabaseHas('payment_records', [
            'order_id' => $order->id,
            'amount' => 500000,   // 5000.00 * 100 = 500000 分
            'payment_method' => 'cash'
        ]);
    }

    /**
     * 測試已全額付清訂單無法新增付款
     */
    public function test_cannot_add_payment_to_fully_paid_order(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'paid',
            'grand_total' => 500000,   // 5000.00 * 100 = 500000 分
            'paid_amount' => 500000    // 5000.00 * 100 = 500000 分，確保訂單已付清
        ]);
        
        $response = $this->postJson("/api/orders/{$order->id}/add-payment", [
            'amount' => 1000.00,  // API 接受元為單位
            'payment_method' => 'cash'
        ]);
        
        $response->assertStatus(422)
                 ->assertJsonPath('message', '收款金額不能超過剩餘未付金額：0');
    }

    /**
     * 測試創建出貨記錄
     */
    public function test_admin_can_create_shipment(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'shipping_status' => 'pending'
        ]);
        
        $shipmentData = [
            'tracking_number' => 'SF1234567890',
            'carrier' => '順豐速運',
            'shipped_at' => '2025-07-04 14:30:00',
            'notes' => '易碎物品'
        ];
        
        $response = $this->postJson("/api/orders/{$order->id}/create-shipment", $shipmentData);
        
        $response->assertOk()
                 ->assertJsonPath('data.shipping_status', 'shipped');
    }

    /**
     * 測試已出貨訂單無法重複創建出貨記錄
     */
    public function test_cannot_create_shipment_for_already_shipped_order(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'shipping_status' => 'shipped'
        ]);
        
        $response = $this->postJson("/api/orders/{$order->id}/create-shipment", [
            'tracking_number' => 'TEST123'
        ]);
        
        $response->assertStatus(422)
                 ->assertJsonPath('message', '此訂單的貨物狀態不允許出貨操作');
    }

    /**
     * 測試取消訂單
     */
    public function test_admin_can_cancel_order(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'shipping_status' => 'pending'
        ]);
        
        $cancelData = [
            'reason' => '客戶要求取消'
        ];
        
        $response = $this->postJson("/api/orders/{$order->id}/cancel", $cancelData);
        
        $response->assertOk()
                 ->assertJsonPath('data.shipping_status', 'cancelled');
    }

    /**
     * 測試創建退款記錄
     */
    public function test_admin_can_create_refund(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'paid',
            'shipping_status' => 'delivered',  // 設置為已交付狀態，允許退款
            'grand_total' => 500000,  // 5000.00 * 100 = 500000 分
            'paid_amount' => 500000   // 5000.00 * 100 = 500000 分
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'price' => 500000,  // 5000.00 * 100 = 500000 分
            'quantity' => 1
        ]);
        
        $refundData = [
            'reason' => '商品品質不符合要求，客戶要求退貨處理',  // 增加長度以符合驗證要求
            'notes' => '客戶退貨處理',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];
        
        $response = $this->postJson("/api/orders/{$order->id}/refunds", $refundData);
        
        $response->assertCreated()
                 ->assertJsonStructure([
                     'data' => [
                         'id',
                         'order_id',
                         'reason'
                     ]
                 ]);
    }

    /**
     * 測試批量刪除訂單
     */
    public function test_admin_can_batch_delete_orders(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $orders = Order::factory()->count(3)->create([
            'customer_id' => $this->customer->id,
            'shipping_status' => 'pending'
        ]);
        
        $orderIds = $orders->pluck('id')->toArray();
        
        // 使用 POST 方法，因為路由定義為 POST /api/orders/batch-delete
        $response = $this->postJson('/api/orders/batch-delete', [
            'ids' => $orderIds
        ]);
        
        $response->assertNoContent();
        
        // 檢查訂單是否從數據庫中刪除（硬刪除）
        foreach ($orderIds as $id) {
            $this->assertDatabaseMissing('orders', ['id' => $id]);
        }
    }

    /**
     * 測試批量刪除包含不可刪除訂單時的錯誤處理
     */
    public function test_batch_delete_handles_undeletable_orders(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $deletableOrder = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'shipping_status' => 'pending'
        ]);
        
        $shippedOrder = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'shipping_status' => 'shipped'
        ]);
        
        // 使用 POST 方法
        $response = $this->postJson('/api/orders/batch-delete', [
            'ids' => [$deletableOrder->id, $shippedOrder->id]
        ]);
        
        $response->assertStatus(422)
                 ->assertJsonStructure([
                     'message',
                     'errors' => ['orders']
                 ]);
    }

    /**
     * 測試一般用戶無法批量刪除訂單
     */
    public function test_viewer_cannot_batch_delete_orders(): void
    {
        $this->actingAs($this->viewer, 'sanctum');
        
        // 創建真實的訂單以避免驗證錯誤
        $orders = Order::factory()->count(2)->create([
            'customer_id' => $this->customer->id
        ]);
        
        $orderIds = $orders->pluck('id')->toArray();
        
        // 使用 POST 方法
        $response = $this->postJson('/api/orders/batch-delete', ['ids' => $orderIds]);
        
        $response->assertForbidden();
    }

    /**
     * 測試批量更新訂單狀態
     */
    public function test_admin_can_batch_update_order_status(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $orders = Order::factory()->count(2)->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'pending'
        ]);
        
        $orderIds = $orders->pluck('id')->toArray();
        
        $response = $this->postJson('/api/orders/batch-update-status', [
            'ids' => $orderIds,
            'status_type' => 'payment_status',
            'status_value' => 'paid',
            'notes' => '批量確認收款'
        ]);
        
        $response->assertOk()
                 ->assertJsonPath('message', '訂單狀態已成功批量更新')
                 ->assertJsonPath('updated_count', 2);
    }

    /**
     * 測試一般用戶無法批量更新訂單狀態
     */
    public function test_viewer_cannot_batch_update_order_status(): void
    {
        $this->actingAs($this->viewer, 'sanctum');
        
        // 創建真實的訂單以避免驗證錯誤
        $orders = Order::factory()->count(2)->create([
            'customer_id' => $this->customer->id
        ]);
        
        $orderIds = $orders->pluck('id')->toArray();
        
        $response = $this->postJson('/api/orders/batch-update-status', [
            'ids' => $orderIds,
            'status_type' => 'payment_status',
            'status_value' => 'paid'
        ]);
        
        $response->assertForbidden();
    }

    /**
     * 測試批量更新狀態的驗證錯誤
     */
    public function test_batch_update_status_validation_errors(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $response = $this->postJson('/api/orders/batch-update-status', []);
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['ids', 'status_type', 'status_value']);
    }

    /**
     * 測試創建出貨記錄的驗證錯誤
     */
    public function test_create_shipment_validation_errors(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create(['customer_id' => $this->customer->id]);
        
        $response = $this->postJson("/api/orders/{$order->id}/create-shipment", []);
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['tracking_number']);
    }

    /**
     * 測試新增付款的驗證錯誤
     */
    public function test_add_payment_validation_errors(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        $order = Order::factory()->create(['customer_id' => $this->customer->id]);
        
        $response = $this->postJson("/api/orders/{$order->id}/add-payment", []);
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['amount', 'payment_method']);
    }

    /**
     * 測試服務層異常處理
     */
    public function test_handles_service_layer_exceptions(): void
    {
        $this->actingAs($this->admin, 'sanctum');
        
        // 模擬 OrderService 拋出一般異常
        $this->mock(OrderService::class, function ($mock) {
            $mock->shouldReceive('createOrder')
                 ->andThrow(new \Exception('測試異常'));
        });
        
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '轉帳',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'is_tax_inclusive' => false,  // 新增必要欄位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => '待處理',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000.00,  // API 接受元為單位
                    'quantity' => 1,
                ]
            ]
        ];
        
        $response = $this->postJson('/api/orders', $orderData);
        
        $response->assertStatus(500)
                 ->assertJsonPath('message', '測試異常');
    }
} 