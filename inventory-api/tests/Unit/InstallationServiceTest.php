<?php

namespace Tests\Unit;

use App\Models\Installation;
use App\Models\InstallationItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Customer;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use App\Services\InstallationService;
use App\Services\InstallationNumberGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

/**
 * InstallationService 測試類
 * 
 * 測試安裝服務的所有業務邏輯方法
 */
class InstallationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected InstallationService $installationService;
    protected User $admin;
    protected User $installer;
    protected Customer $customer;
    protected Store $store;
    protected Order $order;
    protected OrderItem $orderItem;
    protected Product $product;
    protected ProductVariant $productVariant;
    protected Installation $installation;

    /**
     * 在每個測試前設定測試資料
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        $this->installationService = app(InstallationService::class);
        
        // 創建測試用戶
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        
        $this->installer = User::factory()->create();
        $this->installer->assignRole('installer');
        
        // 創建測試客戶和門市
        $this->customer = Customer::factory()->create([
            'phone' => '0912345678'
        ]);
        $this->store = Store::factory()->create();
        
        // 創建測試商品
        $category = Category::factory()->create();
        $this->product = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant = ProductVariant::factory()->create(['product_id' => $this->product->id]);
        
        // 創建測試訂單
        $this->order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->admin->id
        ]);
        
        // 創建測試訂單項目
        $this->orderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 2
        ]);
        
        // 創建測試安裝工程
        $this->installation = Installation::factory()->create([
            'order_id' => $this->order->id,
            'installer_user_id' => $this->installer->id,
            'created_by' => $this->admin->id
        ]);
    }

    /**
     * 測試從訂單創建安裝工程
     */
    public function test_create_from_order(): void
    {
        $itemIds = [$this->orderItem->id];
        $additionalData = [
            'installer_user_id' => $this->installer->id,
            'installation_address' => '測試安裝地址',
            'scheduled_date' => '2025-12-01',
            'notes' => '測試安裝工程備註'
        ];
        
        $installation = $this->installationService->createFromOrder(
            $this->order->id, 
            $itemIds, 
            $additionalData, 
            $this->admin->id
        );
        
        $this->assertInstanceOf(Installation::class, $installation);
        $this->assertEquals($this->order->id, $installation->order_id);
        $this->assertEquals($this->installer->id, $installation->installer_user_id);
        $this->assertEquals($this->customer->name, $installation->customer_name);
        $this->assertEquals('測試安裝地址', $installation->installation_address);
        $this->assertEquals('pending', $installation->status);
        $this->assertStringStartsWith('IN-', $installation->installation_number);
        
        // 驗證安裝工程項目也被創建
        $this->assertTrue($installation->items()->exists());
    }

    /**
     * 測試創建安裝工程（使用 createInstallation 方法）
     */
    public function test_create_installation(): void
    {
        $installationData = [
            'order_id' => $this->order->id,
            'installer_user_id' => $this->installer->id,
            'customer_name' => '測試客戶',
            'customer_phone' => '0912345678',
            'installation_address' => '測試安裝地址',
            'scheduled_date' => '2025-12-01',
            'notes' => '測試備註',
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'product_variant_id' => $this->productVariant->id,
                    'product_name' => $this->product->name,
                    'sku' => $this->productVariant->sku,
                    'quantity' => 2,
                    'specifications' => null
                ]
            ]
        ];
        
        $installation = $this->installationService->createInstallation($installationData, $this->admin->id);
        
        $this->assertInstanceOf(Installation::class, $installation);
        $this->assertEquals($this->order->id, $installation->order_id);
        $this->assertEquals($this->installer->id, $installation->installer_user_id);
        $this->assertEquals('測試客戶', $installation->customer_name);
        $this->assertEquals('0912345678', $installation->customer_phone);
        $this->assertEquals('測試安裝地址', $installation->installation_address);
        $this->assertEquals('pending', $installation->status);
        $this->assertStringStartsWith('IN-', $installation->installation_number);
        
        // 驗證安裝項目被創建
        $this->assertCount(1, $installation->items);
        $item = $installation->items->first();
        $this->assertEquals($this->orderItem->id, $item->order_item_id);
        $this->assertEquals($this->productVariant->id, $item->product_variant_id);
        $this->assertEquals(2, $item->quantity);
    }

    /**
     * 測試更新安裝工程
     */
    public function test_update_installation(): void
    {
        $updateData = [
            'installer_user_id' => $this->installer->id,
            'installation_address' => '更新後的地址',
            'notes' => '更新後的備註'
        ];
        
        $updatedInstallation = $this->installationService->updateInstallation($this->installation, $updateData);
        
        $this->assertEquals($this->installer->id, $updatedInstallation->installer_user_id);
        $this->assertEquals('更新後的地址', $updatedInstallation->installation_address);
        $this->assertEquals('更新後的備註', $updatedInstallation->notes);
    }

    /**
     * 測試更新安裝工程狀態
     */
    public function test_update_status(): void
    {
        // 測試更新為進行中狀態
        $updatedInstallation = $this->installationService->updateStatus($this->installation, 'in_progress');
        
        $this->assertEquals('in_progress', $updatedInstallation->status);
        $this->assertNotNull($updatedInstallation->actual_start_time);
        
        // 測試更新為完成狀態
        $completedInstallation = $this->installationService->updateStatus($updatedInstallation, 'completed');
        
        $this->assertEquals('completed', $completedInstallation->status);
        $this->assertNotNull($completedInstallation->actual_end_time);
    }

    /**
     * 測試取消安裝工程
     */
    public function test_cancel_installation(): void
    {
        $reason = '客戶取消';
        
        $cancelledInstallation = $this->installationService->cancelInstallation($this->installation, $reason);
        
        $this->assertEquals('cancelled', $cancelledInstallation->status);
        $this->assertStringContainsString('取消原因：客戶取消', $cancelledInstallation->notes);
    }

    /**
     * 測試無法取消已完成的工程
     */
    public function test_cannot_cancel_completed_installation(): void
    {
        // 先將安裝工程設為已完成
        $this->installation->update(['status' => 'completed']);
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('無法取消狀態為 completed 的安裝單');
        
        $this->installationService->cancelInstallation($this->installation, '測試取消');
    }

    /**
     * 測試分配安裝師傅
     */
    public function test_assign_installer(): void
    {
        $newInstaller = User::factory()->create();
        $newInstaller->assignRole('installer');
        
        $updatedInstallation = $this->installationService->assignInstaller($this->installation, $newInstaller->id);
        
        $this->assertEquals($newInstaller->id, $updatedInstallation->installer_user_id);
        $this->assertEquals('scheduled', $updatedInstallation->status); // 從 pending 變為 scheduled
    }

    /**
     * 測試更新安裝項目狀態
     */
    public function test_update_item_status(): void
    {
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'order_item_id' => $this->orderItem->id,
            'status' => 'pending'
        ]);
        
        $updatedItem = $this->installationService->updateItemStatus($installationItem, 'completed');
        
        $this->assertEquals('completed', $updatedItem->status);
    }

    /**
     * 測試當所有項目完成時自動更新安裝工程狀態
     */
    public function test_auto_complete_installation_when_all_items_done(): void
    {
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'order_item_id' => $this->orderItem->id,
            'status' => 'pending'
        ]);
        
        // 完成安裝項目
        $this->installationService->updateItemStatus($installationItem, 'completed');
        
        // 檢查安裝工程是否自動變為已完成
        $this->installation->refresh();
        $this->assertEquals('completed', $this->installation->status);
    }

    /**
     * 測試獲取安裝師傅的排程
     */
    public function test_get_installer_schedule(): void
    {
        $startDate = new \DateTime('2025-01-01');
        $endDate = new \DateTime('2025-01-31');
        
        // 更新安裝工程的排程日期
        $this->installation->update(['scheduled_date' => '2025-01-15']);
        
        // 創建其他師傅的工程（不應包含在結果中）
        $otherInstaller = User::factory()->create();
        Installation::factory()->create([
            'installer_user_id' => $otherInstaller->id,
            'scheduled_date' => '2025-01-20'
        ]);
        
        // 創建已取消的工程（不應包含在結果中）
        Installation::factory()->create([
            'installer_user_id' => $this->installer->id,
            'scheduled_date' => '2025-01-25',
            'status' => 'cancelled'
        ]);
        
        $schedule = $this->installationService->getInstallerSchedule(
            $this->installer->id, 
            $startDate, 
            $endDate
        );
        
        $this->assertCount(1, $schedule);
        $this->assertEquals($this->installation->id, $schedule->first()->id);
    }

    /**
     * 測試部分更新安裝工程
     */
    public function test_partial_update_installation(): void
    {
        $originalAddress = $this->installation->installation_address;
        $originalNotes = $this->installation->notes;
        
        // 只更新備註
        $updateData = ['notes' => '新的備註'];
        
        $updatedInstallation = $this->installationService->updateInstallation($this->installation, $updateData);
        
        // 確認只有備註被更新，其他欄位保持不變
        $this->assertEquals('新的備註', $updatedInstallation->notes);
        $this->assertEquals($originalAddress, $updatedInstallation->installation_address);
    }

    /**
     * 測試使用附加資料更新狀態
     */
    public function test_update_status_with_additional_data(): void
    {
        $additionalData = ['notes' => '開始安裝作業'];
        
        $updatedInstallation = $this->installationService->updateStatus(
            $this->installation, 
            'in_progress', 
            $additionalData
        );
        
        $this->assertEquals('in_progress', $updatedInstallation->status);
        $this->assertEquals('開始安裝作業', $updatedInstallation->notes);
        $this->assertNotNull($updatedInstallation->actual_start_time);
    }

    /**
     * 測試獲取空的排程
     */
    public function test_get_empty_installer_schedule(): void
    {
        $startDate = new \DateTime('2026-01-01');
        $endDate = new \DateTime('2026-01-31');
        
        $schedule = $this->installationService->getInstallerSchedule(
            $this->installer->id, 
            $startDate, 
            $endDate
        );
        
        $this->assertCount(0, $schedule);
    }
} 