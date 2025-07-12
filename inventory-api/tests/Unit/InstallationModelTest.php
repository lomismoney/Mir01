<?php

namespace Tests\Unit;

use App\Models\Installation;
use App\Models\InstallationItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Installation Model 完整測試
 * 
 * 測試安裝模型的所有關聯、屬性和業務邏輯方法
 */
class InstallationModelTest extends TestCase
{
    use RefreshDatabase;

    private Installation $installation;
    private User $installer;
    private User $creator;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        // 創建測試數據
        $this->installer = User::factory()->installer()->create();
        $this->creator = User::factory()->create();
        $this->order = Order::factory()->create();
        
        $this->installation = Installation::factory()->create([
            'installer_user_id' => $this->installer->id,
            'created_by' => $this->creator->id,
            'order_id' => $this->order->id,
            'status' => 'pending'
        ]);
    }

    /**
     * 測試 Installation 模型有正確的 fillable 屬性
     */
    public function test_installation_has_correct_fillable_attributes(): void
    {
        $expectedFillable = [
            'installation_number',
            'order_id',
            'installer_user_id',
            'created_by',
            'customer_name',
            'customer_phone',
            'installation_address',
            'status',
            'scheduled_date',
            'actual_start_time',
            'actual_end_time',
            'notes',
        ];

        $this->assertEquals($expectedFillable, $this->installation->getFillable());
    }

    /**
     * 測試 Installation 模型有正確的屬性轉換
     */
    public function test_installation_has_correct_casts(): void
    {
        $expectedCasts = [
            'id' => 'int',
            'scheduled_date' => 'date',
            'actual_start_time' => 'datetime',
            'actual_end_time' => 'datetime',
        ];

        $casts = $this->installation->getCasts();
        
        foreach ($expectedCasts as $attribute => $cast) {
            $this->assertArrayHasKey($attribute, $casts);
            $this->assertEquals($cast, $casts[$attribute]);
        }
    }

    /**
     * 測試 Installation 可以進行批量賦值
     */
    public function test_installation_can_be_mass_assigned(): void
    {
        $creator = User::factory()->create();
        
        $data = [
            'installation_number' => 'INST-2025-001',
            'created_by' => $creator->id,
            'customer_name' => '測試客戶',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區測試路123號',
            'status' => 'scheduled',
            'notes' => '測試備註'
        ];

        $installation = Installation::create($data);

        $this->assertInstanceOf(Installation::class, $installation);
        $this->assertEquals($data['installation_number'], $installation->installation_number);
        $this->assertEquals($data['created_by'], $installation->created_by);
        $this->assertEquals($data['customer_name'], $installation->customer_name);
        $this->assertEquals($data['customer_phone'], $installation->customer_phone);
        $this->assertEquals($data['installation_address'], $installation->installation_address);
        $this->assertEquals($data['status'], $installation->status);
        $this->assertEquals($data['notes'], $installation->notes);
    }

    /**
     * 測試 Installation 使用 HasFactory trait
     */
    public function test_installation_uses_has_factory_trait(): void
    {
        $traits = class_uses(Installation::class);
        $this->assertContains('Illuminate\Database\Eloquent\Factories\HasFactory', $traits);
    }

    /**
     * 測試 Installation 與 InstallationItem 的一對多關聯
     */
    public function test_installation_has_many_installation_items(): void
    {
        // 創建安裝項目
        $item1 = InstallationItem::factory()->create(['installation_id' => $this->installation->id]);
        $item2 = InstallationItem::factory()->create(['installation_id' => $this->installation->id]);

        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\HasMany', $this->installation->items());
        
        $items = $this->installation->items;
        $this->assertCount(2, $items);
        $this->assertTrue($items->contains($item1));
        $this->assertTrue($items->contains($item2));
    }

    /**
     * 測試 Installation 與 InstallationItem 的關聯方法
     */
    public function test_installation_has_installation_items_alias_relationship(): void
    {
        $item = InstallationItem::factory()->create(['installation_id' => $this->installation->id]);

        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\HasMany', $this->installation->items());
        
        $items = $this->installation->items;
        $this->assertCount(1, $items);
        $this->assertTrue($items->contains($item));
    }

    /**
     * 測試 Installation 與 Order 的多對一關聯
     */
    public function test_installation_belongs_to_order(): void
    {
        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\BelongsTo', $this->installation->order());
        $this->assertInstanceOf(Order::class, $this->installation->order);
        $this->assertEquals($this->order->id, $this->installation->order->id);
    }

    /**
     * 測試 Installation 與 User (installer) 的多對一關聯
     */
    public function test_installation_belongs_to_installer(): void
    {
        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\BelongsTo', $this->installation->installer());
        $this->assertInstanceOf(User::class, $this->installation->installer);
        $this->assertEquals($this->installer->id, $this->installation->installer->id);
    }

    /**
     * 測試 Installation 與 User (creator) 的多對一關聯
     */
    public function test_installation_belongs_to_creator(): void
    {
        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\BelongsTo', $this->installation->creator());
        $this->assertInstanceOf(User::class, $this->installation->creator);
        $this->assertEquals($this->creator->id, $this->installation->creator->id);
    }

    /**
     * 測試 Installation 可以沒有關聯的 Order（可選關聯）
     */
    public function test_installation_can_have_null_order(): void
    {
        $installation = Installation::factory()->create(['order_id' => null]);
        
        $this->assertNull($installation->order_id);
        $this->assertNull($installation->order);
    }

    /**
     * 測試 isCompleted 方法
     */
    public function test_is_completed_method(): void
    {
        // 測試未完成狀態
        $this->installation->status = 'pending';
        $this->assertFalse($this->installation->isCompleted());
        
        $this->installation->status = 'scheduled';
        $this->assertFalse($this->installation->isCompleted());
        
        $this->installation->status = 'in_progress';
        $this->assertFalse($this->installation->isCompleted());
        
        // 測試已完成狀態
        $this->installation->status = 'completed';
        $this->assertTrue($this->installation->isCompleted());
    }

    /**
     * 測試 canBeCancelled 方法
     */
    public function test_can_be_cancelled_method(): void
    {
        // 測試可以取消的狀態
        $this->installation->status = 'pending';
        $this->assertTrue($this->installation->canBeCancelled());
        
        $this->installation->status = 'scheduled';
        $this->assertTrue($this->installation->canBeCancelled());
        
        // 測試不能取消的狀態
        $this->installation->status = 'in_progress';
        $this->assertFalse($this->installation->canBeCancelled());
        
        $this->installation->status = 'completed';
        $this->assertFalse($this->installation->canBeCancelled());
        
        $this->installation->status = 'cancelled';
        $this->assertFalse($this->installation->canBeCancelled());
    }

    /**
     * 測試 hasStarted 方法
     */
    public function test_has_started_method(): void
    {
        // 測試未開始的狀態
        $this->installation->status = 'pending';
        $this->assertFalse($this->installation->hasStarted());
        
        $this->installation->status = 'scheduled';
        $this->assertFalse($this->installation->hasStarted());
        
        $this->installation->status = 'cancelled';
        $this->assertFalse($this->installation->hasStarted());
        
        // 測試已開始的狀態
        $this->installation->status = 'in_progress';
        $this->assertTrue($this->installation->hasStarted());
        
        $this->installation->status = 'completed';
        $this->assertTrue($this->installation->hasStarted());
    }

    /**
     * 測試 getPendingItemsCountAttribute 方法（未加載關聯時）
     */
    public function test_get_pending_items_count_attribute_without_loaded_relation(): void
    {
        // 創建不同狀態的安裝項目
        InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'status' => 'pending'
        ]);
        InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'status' => 'pending'
        ]);
        InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'status' => 'completed'
        ]);

        // 不預先加載關聯，測試資料庫查詢
        $freshInstallation = Installation::find($this->installation->id);
        $this->assertEquals(2, $freshInstallation->pending_items_count);
    }

    /**
     * 測試 getPendingItemsCountAttribute 方法（已加載關聯時）
     */
    public function test_get_pending_items_count_attribute_with_loaded_relation(): void
    {
        // 創建不同狀態的安裝項目
        InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'status' => 'pending'
        ]);
        InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'status' => 'in_progress'
        ]);
        InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'status' => 'completed'
        ]);

        // 預先加載關聯，測試集合操作
        $installationWithItems = Installation::with('items')->find($this->installation->id);
        $this->assertEquals(1, $installationWithItems->pending_items_count);
    }

    /**
     * 測試 areAllItemsCompleted 方法
     */
    public function test_are_all_items_completed_method(): void
    {
        // 沒有安裝項目時，應該返回 true
        $this->assertTrue($this->installation->areAllItemsCompleted());

        // 有待完成項目時，應該返回 false
        InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'status' => 'pending'
        ]);
        
        $this->installation->refresh();
        $this->assertFalse($this->installation->areAllItemsCompleted());

        // 所有項目都完成時，應該返回 true
        InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'status' => 'completed'
        ]);
        
        // 更新第一個項目為完成狀態
        $this->installation->items()->update(['status' => 'completed']);
        
        $this->installation->refresh();
        $this->assertTrue($this->installation->areAllItemsCompleted());
    }

    /**
     * 測試 Installation 的日期屬性轉換
     */
    public function test_installation_date_casting(): void
    {
        $installation = Installation::factory()->create([
            'scheduled_date' => '2025-07-15',
            'actual_start_time' => '2025-07-15 09:00:00',
            'actual_end_time' => '2025-07-15 17:00:00'
        ]);

        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $installation->scheduled_date);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $installation->actual_start_time);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $installation->actual_end_time);
        
        $this->assertEquals('2025-07-15', $installation->scheduled_date->format('Y-m-d'));
        $this->assertEquals('2025-07-15 09:00:00', $installation->actual_start_time->format('Y-m-d H:i:s'));
        $this->assertEquals('2025-07-15 17:00:00', $installation->actual_end_time->format('Y-m-d H:i:s'));
    }

    /**
     * 測試 Installation 的狀態變化
     */
    public function test_installation_status_transitions(): void
    {
        $statuses = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];
        
        foreach ($statuses as $status) {
            $this->installation->status = $status;
            $this->assertEquals($status, $this->installation->status);
        }
    }

    /**
     * 測試 Installation 的業務邏輯一致性
     */
    public function test_installation_business_logic_consistency(): void
    {
        // 測試 pending 狀態的業務邏輯
        $this->installation->status = 'pending';
        $this->assertFalse($this->installation->isCompleted());
        $this->assertTrue($this->installation->canBeCancelled());
        $this->assertFalse($this->installation->hasStarted());

        // 測試 completed 狀態的業務邏輯
        $this->installation->status = 'completed';
        $this->assertTrue($this->installation->isCompleted());
        $this->assertFalse($this->installation->canBeCancelled());
        $this->assertTrue($this->installation->hasStarted());

        // 測試 in_progress 狀態的業務邏輯
        $this->installation->status = 'in_progress';
        $this->assertFalse($this->installation->isCompleted());
        $this->assertFalse($this->installation->canBeCancelled());
        $this->assertTrue($this->installation->hasStarted());
    }

    /**
     * 測試 Installation 與 InstallationItem 的關聯完整性
     */
    public function test_installation_relationship_integrity(): void
    {
        // 創建安裝項目
        $item1 = InstallationItem::factory()->create(['installation_id' => $this->installation->id]);
        $item2 = InstallationItem::factory()->create(['installation_id' => $this->installation->id]);

        $this->assertCount(2, $this->installation->items);

        // 檢查關聯的安裝項目確實屬於此安裝單
        $this->assertEquals($this->installation->id, $item1->installation_id);
        $this->assertEquals($this->installation->id, $item2->installation_id);
        
        // 檢查從安裝單可以訪問到項目
        $this->assertTrue($this->installation->items->contains($item1));
        $this->assertTrue($this->installation->items->contains($item2));
    }
}