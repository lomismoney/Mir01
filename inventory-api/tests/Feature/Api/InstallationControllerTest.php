<?php

namespace Tests\Feature\Api;

use App\Models\Installation;
use App\Models\InstallationItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * InstallationController 完整測試
 * 
 * 測試所有 API 端點和業務邏輯
 */
class InstallationControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $installer;
    private User $staff;
    private User $viewer;
    private Installation $installation;
    private Order $order;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        // 運行角色遷移
        $this->artisan('roles:migrate');

        // 創建測試用戶
        $this->admin = User::factory()->admin()->create();
        $this->installer = User::factory()->installer()->create();
        $this->staff = User::factory()->staff()->create();
        $this->viewer = User::factory()->viewer()->create();

        // 創建測試客戶
        $this->customer = Customer::factory()->create([
            'name' => '測試客戶',
            'phone' => '0912345678'
        ]);

        // 創建測試訂單
        $this->order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'shipping_address' => '台北市信義區信義路五段7號'
        ]);

        // 創建訂單項目
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        OrderItem::factory()->count(3)->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $variant->id
        ]);

        // 創建測試安裝單
        $this->installation = Installation::factory()->create([
            'installer_user_id' => $this->installer->id,
            'order_id' => $this->order->id,
            'status' => 'pending'
        ]);

        // 創建安裝項目
        InstallationItem::factory()->count(2)->create([
            'installation_id' => $this->installation->id
        ]);
    }

    /**
     * 測試獲取安裝單列表 - 使用各種篩選條件
     */
    public function test_index_with_filters()
    {
        $this->actingAs($this->admin);

        // 創建額外的安裝單用於測試篩選
        Installation::factory()->create([
            'status' => 'completed',
            'scheduled_date' => now()->addDays(5),
            'customer_name' => '王小明'
        ]);

        // 測試狀態篩選
        $response = $this->getJson('/api/installations?filter[status]=pending');
        $response->assertOk();
        $data = $response->json('data');
        $this->assertTrue(count($data) >= 1);
        $this->assertEquals('pending', $data[0]['status']);

        // 測試安裝師傅篩選
        $response = $this->getJson("/api/installations?filter[installer_user_id]={$this->installer->id}");
        $response->assertOk();

        // 測試日期篩選
        $response = $this->getJson('/api/installations?filter[scheduled_date]=' . now()->addDays(5)->format('Y-m-d'));
        $response->assertOk();

        // 測試客戶姓名篩選
        $response = $this->getJson('/api/installations?filter[customer_name]=王小明');
        $response->assertOk();
        $data = $response->json('data');
        $this->assertTrue(count($data) >= 1);

        // 測試安裝單號篩選
        $response = $this->getJson("/api/installations?filter[installation_number]={$this->installation->installation_number}");
        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals(1, count($data));
    }

    /**
     * 測試獲取安裝單列表 - 包含關聯資源
     */
    public function test_index_with_includes()
    {
        $this->actingAs($this->admin);

        $response = $this->getJson('/api/installations?include=items,order,installer,creator');
        $response->assertOk();
        
        $data = $response->json('data.0');
        $this->assertArrayHasKey('items', $data);
        $this->assertArrayHasKey('order', $data);
        $this->assertArrayHasKey('installer', $data);
        $this->assertArrayHasKey('creator', $data);
    }

    /**
     * 測試獲取安裝單列表 - 排序
     */
    public function test_index_with_sorting()
    {
        $this->actingAs($this->admin);

        // 創建多個安裝單
        Installation::factory()->create(['created_at' => now()->subDays(2)]);
        Installation::factory()->create(['created_at' => now()->subDays(1)]);

        // 測試按創建時間降序排序（預設）
        $response = $this->getJson('/api/installations');
        $response->assertOk();
        $data = $response->json('data');
        $this->assertTrue($data[0]['created_at'] > $data[count($data) - 1]['created_at']);

        // 測試按創建時間升序排序
        $response = $this->getJson('/api/installations?sort=created_at');
        $response->assertOk();
        $data = $response->json('data');
        $this->assertTrue($data[0]['created_at'] < $data[count($data) - 1]['created_at']);

        // 測試按預定日期排序
        $response = $this->getJson('/api/installations?sort=-scheduled_date');
        $response->assertOk();
    }

    /**
     * 測試獲取安裝單列表 - 分頁
     */
    public function test_index_with_pagination()
    {
        $this->actingAs($this->admin);

        // 創建多個安裝單
        Installation::factory()->count(20)->create();

        // 測試自定義每頁數量
        $response = $this->getJson('/api/installations?per_page=5');
        $response->assertOk();
        $this->assertEquals(5, count($response->json('data')));
        $this->assertEquals(5, $response->json('meta.per_page'));

        // 測試預設每頁數量
        $response = $this->getJson('/api/installations');
        $response->assertOk();
        $this->assertEquals(15, $response->json('meta.per_page'));
    }

    /**
     * 測試創建安裝單
     */
    public function test_store_installation()
    {
        $this->actingAs($this->admin);

        $data = [
            'customer_name' => '張三',
            'customer_phone' => '0923456789',
            'installation_address' => '台北市大安區復興南路一段1號',
            'scheduled_date' => now()->addDays(3)->format('Y-m-d'),
            'notes' => '請於下午2點後安裝',
            'items' => [
                [
                    'product_name' => '辦公桌',
                    'sku' => 'DESK-001',
                    'quantity' => 2,
                    'specifications' => '靠窗安裝',
                    'notes' => '需要特殊固定器'
                ],
                [
                    'product_name' => '辦公椅',
                    'sku' => 'CHAIR-001',
                    'quantity' => 2
                ]
            ]
        ];

        $response = $this->postJson('/api/installations', $data);
        $response->assertOk();
        
        $installation = $response->json('data');
        $this->assertEquals('張三', $installation['customer_name']);
        $this->assertEquals('0923456789', $installation['customer_phone']);
        $this->assertEquals(2, count($installation['items']));
        $this->assertNotNull($installation['installation_number']);
    }

    /**
     * 測試創建安裝單 - 帶有訂單ID和安裝師傅
     */
    public function test_store_installation_with_order_and_installer()
    {
        $this->actingAs($this->admin);

        $data = [
            'order_id' => $this->order->id,
            'installer_user_id' => $this->installer->id,
            'customer_name' => '李四',
            'customer_phone' => '0934567890',
            'installation_address' => '台北市中正區重慶南路一段122號',
            'items' => [
                [
                    'order_item_id' => $this->order->items->first()->id,
                    'product_name' => '產品A',
                    'sku' => 'PROD-A',
                    'quantity' => 1
                ]
            ]
        ];

        $response = $this->postJson('/api/installations', $data);
        $response->assertOk();
        
        $installation = $response->json('data');
        $this->assertEquals($this->order->id, $installation['order_id']);
        $this->assertEquals($this->installer->id, $installation['installer_user_id']);
    }

    /**
     * 測試從訂單創建安裝單
     */
    public function test_create_from_order()
    {
        $this->actingAs($this->admin);

        // 創建一個新的訂單，避免與之前的測試產生衝突
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $newOrder = Order::factory()->create(['customer_id' => $this->customer->id]);
        $newOrder->items()->saveMany([
            OrderItem::factory()->make(['product_variant_id' => $variant->id]),
            OrderItem::factory()->make(['product_variant_id' => $variant->id]),
            OrderItem::factory()->make(['product_variant_id' => $variant->id]),
        ]);

        $orderItems = $newOrder->items;
        
        $data = [
            'order_id' => $newOrder->id,
            'order_item_ids' => $orderItems->pluck('id')->toArray(),
            'installer_user_id' => $this->installer->id,
            'installation_address' => '新北市板橋區文化路一段23號',
            'scheduled_date' => now()->addDays(2)->format('Y-m-d'),
            'notes' => '客戶要求上午安裝',
            'specifications' => [
                '靠窗安裝',
                '靠牆安裝',
                '中央位置'
            ]
        ];

        $response = $this->postJson('/api/installations/create-from-order', $data);
        $response->assertOk();
        
        $installation = $response->json('data');
        $this->assertEquals($newOrder->id, $installation['order_id']);
        $this->assertEquals(3, count($installation['items']));
        $this->assertEquals($this->customer->name, $installation['customer_name']);
    }

    /**
     * 測試查看安裝單詳情
     */
    public function test_show_installation()
    {
        $this->actingAs($this->admin);

        // 不帶 include 參數
        $response = $this->getJson("/api/installations/{$this->installation->id}");
        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals($this->installation->id, $data['id']);
        $this->assertArrayHasKey('items', $data); // 預設載入 items

        // 帶 include 參數
        $response = $this->getJson("/api/installations/{$this->installation->id}?include=items,order,installer");
        $response->assertOk();
        $data = $response->json('data');
        $this->assertArrayHasKey('items', $data);
        $this->assertArrayHasKey('order', $data);
        $this->assertArrayHasKey('installer', $data);
    }

    /**
     * 測試更新安裝單
     */
    public function test_update_installation()
    {
        $this->actingAs($this->admin);

        $newInstaller = User::factory()->installer()->create();
        
        $data = [
            'installer_user_id' => $newInstaller->id,
            'customer_name' => '更新的客戶名',
            'customer_phone' => '0945678901',
            'installation_address' => '更新的地址',
            'status' => 'scheduled',
            'scheduled_date' => now()->addDays(5)->format('Y-m-d'),
            'notes' => '更新的備註',
            'items' => [
                [
                    'id' => $this->installation->items->first()->id,
                    'product_name' => '更新的產品',
                    'sku' => 'UPD-001',
                    'quantity' => 3,
                    'specifications' => '更新的規格',
                    'status' => 'completed',
                    'notes' => '已完成'
                ],
                [
                    'product_name' => '新增的產品',
                    'sku' => 'NEW-001',
                    'quantity' => 1
                ]
            ]
        ];

        $response = $this->putJson("/api/installations/{$this->installation->id}", $data);
        $response->assertOk();
        
        $updated = $response->json('data');
        $this->assertEquals('更新的客戶名', $updated['customer_name']);
        $this->assertEquals('scheduled', $updated['status']);
        $this->assertEquals($newInstaller->id, $updated['installer_user_id']);
    }

    /**
     * 測試更新安裝單 - 帶有實際時間
     */
    public function test_update_installation_with_actual_times()
    {
        $this->actingAs($this->admin);

        // 先將安裝單狀態設為 scheduled，這樣才能轉換到 in_progress
        $this->installation->update(['status' => 'scheduled']);

        $data = [
            'status' => 'in_progress',
            'actual_start_time' => now()->format('Y-m-d H:i:s'),
            'actual_end_time' => now()->addHours(2)->format('Y-m-d H:i:s')
        ];

        $response = $this->putJson("/api/installations/{$this->installation->id}", $data);
        $response->assertOk();
        
        $updated = $response->json('data');
        $this->assertEquals('in_progress', $updated['status']);
        $this->assertNotNull($updated['actual_start_time']);
        $this->assertNotNull($updated['actual_end_time']);
    }

    /**
     * 測試刪除安裝單
     */
    public function test_destroy_installation()
    {
        $this->actingAs($this->admin);

        $response = $this->deleteJson("/api/installations/{$this->installation->id}");
        $response->assertNoContent();

        $this->assertDatabaseMissing('installations', ['id' => $this->installation->id]);
    }

    /**
     * 測試分配安裝師傅
     */
    public function test_assign_installer()
    {
        $this->actingAs($this->admin);

        $newInstaller = User::factory()->installer()->create();

        $response = $this->postJson("/api/installations/{$this->installation->id}/assign", [
            'installer_user_id' => $newInstaller->id
        ]);
        
        $response->assertOk();
        $updated = $response->json('data');
        $this->assertEquals($newInstaller->id, $updated['installer_user_id']);
        $this->assertArrayHasKey('installer', $updated);
    }

    /**
     * 測試更新狀態
     */
    public function test_update_status()
    {
        $this->actingAs($this->admin);

        // 測試更新為進行中
        $response = $this->postJson("/api/installations/{$this->installation->id}/status", [
            'status' => 'in_progress'
        ]);
        
        $response->assertOk();
        $updated = $response->json('data');
        $this->assertEquals('in_progress', $updated['status']);

        // 測試取消安裝單 - 由於 in_progress 狀態無法取消，改為測試 scheduled 狀態
        $this->installation->update(['status' => 'scheduled']);
        $response = $this->postJson("/api/installations/{$this->installation->id}/status", [
            'status' => 'cancelled',
            'reason' => '客戶要求取消'
        ]);
        
        $response->assertOk();
        $updated = $response->json('data');
        $this->assertEquals('cancelled', $updated['status']);
    }

    /**
     * 測試獲取安裝師傅行程
     */
    public function test_get_schedule()
    {
        $this->actingAs($this->admin);

        // 創建多個安裝單給同一個安裝師傅
        Installation::factory()->count(3)->create([
            'installer_user_id' => $this->installer->id,
            'scheduled_date' => now()->addDays(1)
        ]);

        $response = $this->getJson('/api/installations/schedule?' . http_build_query([
            'installer_user_id' => $this->installer->id,
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->addMonth()->format('Y-m-d')
        ]));

        $response->assertOk();
        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(3, count($data));
    }

    /**
     * 測試權限檢查 - viewer 不能創建
     */
    public function test_viewer_cannot_create()
    {
        $this->actingAs($this->viewer);

        $response = $this->postJson('/api/installations', [
            'customer_name' => 'Test',
            'customer_phone' => '0912345678',
            'installation_address' => 'Test Address',
            'items' => []
        ]);

        $response->assertForbidden();
    }

    /**
     * 測試權限檢查 - installer 只能更新自己的安裝單狀態
     */
    public function test_installer_can_only_update_own_installation_status()
    {
        $this->actingAs($this->installer);

        // 可以更新自己的安裝單
        $response = $this->postJson("/api/installations/{$this->installation->id}/status", [
            'status' => 'in_progress'
        ]);
        $response->assertOk();

        // 不能更新他人的安裝單
        $otherInstallation = Installation::factory()->create([
            'installer_user_id' => User::factory()->installer()->create()->id
        ]);

        $response = $this->postJson("/api/installations/{$otherInstallation->id}/status", [
            'status' => 'in_progress'
        ]);
        $response->assertForbidden();
    }

    /**
     * 測試驗證錯誤
     */
    public function test_validation_errors()
    {
        $this->actingAs($this->admin);

        // 測試缺少必填欄位
        $response = $this->postJson('/api/installations', []);
        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['customer_name', 'customer_phone', 'installation_address', 'items']);

        // 測試分配不存在的安裝師傅
        $response = $this->postJson("/api/installations/{$this->installation->id}/assign", [
            'installer_user_id' => 99999
        ]);
        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['installer_user_id']);

        // 測試無效的狀態
        $response = $this->postJson("/api/installations/{$this->installation->id}/status", [
            'status' => 'invalid_status'
        ]);
        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['status']);

        // 測試取消時缺少原因
        $response = $this->postJson("/api/installations/{$this->installation->id}/status", [
            'status' => 'cancelled'
        ]);
        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['reason']);
    }

    /**
     * 測試查詢參數驗證
     */
    public function test_query_parameter_validation()
    {
        $this->actingAs($this->admin);

        // 測試無效的日期格式
        $response = $this->getJson('/api/installations/schedule?' . http_build_query([
            'installer_user_id' => $this->installer->id,
            'start_date' => 'invalid-date',
            'end_date' => now()->format('Y-m-d')
        ]));
        $response->assertUnprocessable();

        // 測試缺少必要參數
        $response = $this->getJson('/api/installations/schedule');
        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['installer_user_id', 'start_date', 'end_date']);

        // 測試結束日期早於開始日期
        $response = $this->getJson('/api/installations/schedule?' . http_build_query([
            'installer_user_id' => $this->installer->id,
            'start_date' => now()->addDays(5)->format('Y-m-d'),
            'end_date' => now()->format('Y-m-d')
        ]));
        $response->assertUnprocessable();
    }

    /**
     * 測試複雜的混合角色權限
     */
    public function test_mixed_role_permissions()
    {
        // 創建有多個角色的用戶
        $staffInstaller = User::factory()->create();
        $staffInstaller->assignRole(['staff', 'installer']);

        $this->actingAs($staffInstaller);

        // 即使有 installer 角色，但因為也有 staff 角色，所以可以看到所有安裝單
        $response = $this->getJson('/api/installations');
        $response->assertOk();
        
        // 可以查看他人的行程
        $response = $this->getJson('/api/installations/schedule?' . http_build_query([
            'installer_user_id' => $this->installer->id,
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->addMonth()->format('Y-m-d')
        ]));
        $response->assertOk();
    }
}