<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * OrderStatusHistory Model 完整測試
 * 
 * 測試訂單狀態歷史模型的所有關聯、屬性和業務邏輯方法
 */
class OrderStatusHistoryModelTest extends TestCase
{
    use RefreshDatabase;

    private OrderStatusHistory $orderStatusHistory;
    private Order $order;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        // 創建測試數據
        $this->order = Order::factory()->create();
        $this->user = User::factory()->create();
        
        $this->orderStatusHistory = OrderStatusHistory::factory()->create([
            'order_id' => $this->order->id,
            'user_id' => $this->user->id,
        ]);
    }

    /**
     * 測試 OrderStatusHistory 模型有正確的 fillable 屬性
     */
    public function test_order_status_history_has_correct_fillable_attributes(): void
    {
        $expectedFillable = [
            'order_id',
            'status_type',
            'from_status',
            'to_status',
            'user_id',
            'notes',
        ];

        $this->assertEquals($expectedFillable, $this->orderStatusHistory->getFillable());
    }

    /**
     * 測試 OrderStatusHistory 模型使用正確的時間戳設定
     */
    public function test_order_status_history_timestamp_configuration(): void
    {
        // 檢查 UPDATED_AT 常數設定為 null
        $this->assertNull(OrderStatusHistory::UPDATED_AT);
        
        // 檢查模型實例只有 created_at，沒有 updated_at
        $this->assertNotNull($this->orderStatusHistory->created_at);
        $this->assertNull($this->orderStatusHistory->updated_at);
    }

    /**
     * 測試 OrderStatusHistory 可以進行批量賦值
     */
    public function test_order_status_history_can_be_mass_assigned(): void
    {
        $data = [
            'order_id' => $this->order->id,
            'status_type' => 'order_status',
            'from_status' => 'pending',
            'to_status' => 'confirmed',
            'user_id' => $this->user->id,
            'notes' => '訂單狀態變更測試',
        ];

        $history = OrderStatusHistory::create($data);

        $this->assertInstanceOf(OrderStatusHistory::class, $history);
        $this->assertEquals($data['order_id'], $history->order_id);
        $this->assertEquals($data['status_type'], $history->status_type);
        $this->assertEquals($data['from_status'], $history->from_status);
        $this->assertEquals($data['to_status'], $history->to_status);
        $this->assertEquals($data['user_id'], $history->user_id);
        $this->assertEquals($data['notes'], $history->notes);
    }

    /**
     * 測試 OrderStatusHistory 使用 HasFactory trait
     */
    public function test_order_status_history_uses_has_factory_trait(): void
    {
        $traits = class_uses(OrderStatusHistory::class);
        $this->assertContains('Illuminate\\Database\\Eloquent\\Factories\\HasFactory', $traits);
    }

    /**
     * 測試 OrderStatusHistory 與 Order 的多對一關聯
     */
    public function test_order_status_history_belongs_to_order(): void
    {
        $this->assertInstanceOf('Illuminate\\Database\\Eloquent\\Relations\\BelongsTo', $this->orderStatusHistory->order());
        $this->assertInstanceOf(Order::class, $this->orderStatusHistory->order);
        $this->assertEquals($this->order->id, $this->orderStatusHistory->order->id);
    }

    /**
     * 測試 OrderStatusHistory 與 User 的多對一關聯
     */
    public function test_order_status_history_belongs_to_user(): void
    {
        $this->assertInstanceOf('Illuminate\\Database\\Eloquent\\Relations\\BelongsTo', $this->orderStatusHistory->user());
        $this->assertInstanceOf(User::class, $this->orderStatusHistory->user);
        $this->assertEquals($this->user->id, $this->orderStatusHistory->user->id);
    }

    /**
     * 測試 OrderStatusHistory 可以沒有關聯的 User（系統操作）
     */
    public function test_order_status_history_can_have_null_user(): void
    {
        $history = OrderStatusHistory::factory()->create([
            'order_id' => $this->order->id,
            'user_id' => null,
            'notes' => '系統自動操作'
        ]);
        
        $this->assertNull($history->user_id);
        $this->assertNull($history->user);
        $this->assertEquals('系統自動操作', $history->notes);
    }

    /**
     * 測試創建不同類型的狀態歷史記錄
     */
    public function test_create_different_status_types(): void
    {
        $statusTypes = [
            'order_status',
            'payment_status', 
            'shipping_status',
            'system_action'
        ];

        foreach ($statusTypes as $type) {
            $history = OrderStatusHistory::factory()->create([
                'order_id' => $this->order->id,
                'status_type' => $type,
                'from_status' => 'old_status',
                'to_status' => 'new_status'
            ]);

            $this->assertEquals($type, $history->status_type);
            $this->assertEquals('old_status', $history->from_status);
            $this->assertEquals('new_status', $history->to_status);
        }
    }

    /**
     * 測試狀態變更記錄的時間順序
     */
    public function test_status_history_chronological_order(): void
    {
        // 創建多個狀態變更記錄
        $history1 = OrderStatusHistory::factory()->create([
            'order_id' => $this->order->id,
            'from_status' => 'pending',
            'to_status' => 'confirmed'
        ]);

        sleep(1); // 確保時間差異

        $history2 = OrderStatusHistory::factory()->create([
            'order_id' => $this->order->id,
            'from_status' => 'confirmed',
            'to_status' => 'processing'
        ]);

        $this->assertTrue($history2->created_at->greaterThan($history1->created_at));
    }

    /**
     * 測試一個訂單可以有多個狀態歷史記錄
     */
    public function test_order_can_have_multiple_status_histories(): void
    {
        $histories = [];
        $statusFlow = [
            ['pending', 'confirmed'],
            ['confirmed', 'processing'],
            ['processing', 'shipped'],
            ['shipped', 'delivered']
        ];

        foreach ($statusFlow as [$from, $to]) {
            $histories[] = OrderStatusHistory::factory()->create([
                'order_id' => $this->order->id,
                'from_status' => $from,
                'to_status' => $to,
                'user_id' => $this->user->id
            ]);
        }

        $this->assertCount(4, $histories);
        
        // 檢查每個歷史記錄都屬於同一個訂單
        foreach ($histories as $history) {
            $this->assertEquals($this->order->id, $history->order_id);
        }
    }

    /**
     * 測試狀態歷史記錄可以包含詳細備註
     */
    public function test_status_history_can_contain_detailed_notes(): void
    {
        $detailedNotes = '客戶要求變更配送地址，從台北市改為新北市，配送時間延後一天。客服人員：張小明，變更時間：2025-07-10 10:30:00';

        $history = OrderStatusHistory::factory()->create([
            'order_id' => $this->order->id,
            'status_type' => 'shipping_status',
            'from_status' => 'preparing',
            'to_status' => 'delayed',
            'user_id' => $this->user->id,
            'notes' => $detailedNotes
        ]);

        $this->assertEquals($detailedNotes, $history->notes);
        $this->assertStringContainsString('客戶要求變更', $history->notes);
        $this->assertStringContainsString('張小明', $history->notes);
    }

    /**
     * 測試系統自動記錄與人工記錄的區別
     */
    public function test_system_vs_manual_status_changes(): void
    {
        // 系統自動記錄（無 user_id）
        $systemHistory = OrderStatusHistory::factory()->create([
            'order_id' => $this->order->id,
            'user_id' => null,
            'notes' => '系統自動更新：付款確認成功'
        ]);

        // 人工記錄（有 user_id）
        $manualHistory = OrderStatusHistory::factory()->create([
            'order_id' => $this->order->id,
            'user_id' => $this->user->id,
            'notes' => '客服人員手動調整訂單狀態'
        ]);

        $this->assertNull($systemHistory->user_id);
        $this->assertNull($systemHistory->user);
        $this->assertStringContainsString('系統自動', $systemHistory->notes);

        $this->assertNotNull($manualHistory->user_id);
        $this->assertInstanceOf(User::class, $manualHistory->user);
        $this->assertStringContainsString('客服人員手動', $manualHistory->notes);
    }

    /**
     * 測試狀態歷史記錄的必要欄位
     */
    public function test_status_history_required_fields(): void
    {
        $history = OrderStatusHistory::factory()->create([
            'order_id' => $this->order->id,
            'status_type' => 'order_status',
            'from_status' => 'pending',
            'to_status' => 'confirmed'
        ]);

        $this->assertNotNull($history->order_id);
        $this->assertNotNull($history->status_type);
        $this->assertNotNull($history->from_status);
        $this->assertNotNull($history->to_status);
        $this->assertNotNull($history->created_at);
    }

    /**
     * 測試狀態歷史記錄的可選欄位
     */
    public function test_status_history_optional_fields(): void
    {
        $history = OrderStatusHistory::factory()->create([
            'order_id' => $this->order->id,
            'status_type' => 'order_status',
            'from_status' => 'pending',
            'to_status' => 'confirmed',
            'user_id' => null,
            'notes' => null
        ]);

        $this->assertNull($history->user_id);
        $this->assertNull($history->notes);
        $this->assertNotNull($history->order_id);
        $this->assertNotNull($history->status_type);
    }

    /**
     * 測試相同訂單的狀態歷史記錄關聯完整性
     */
    public function test_order_status_history_relationship_integrity(): void
    {
        // 創建多個狀態歷史記錄
        $history1 = OrderStatusHistory::factory()->create(['order_id' => $this->order->id]);
        $history2 = OrderStatusHistory::factory()->create(['order_id' => $this->order->id]);
        $history3 = OrderStatusHistory::factory()->create(['order_id' => $this->order->id]);

        // 檢查所有歷史記錄都正確關聯到訂單
        $this->assertEquals($this->order->id, $history1->order_id);
        $this->assertEquals($this->order->id, $history2->order_id);
        $this->assertEquals($this->order->id, $history3->order_id);

        // 檢查反向關聯（如果 Order 模型有 statusHistories 關聯）
        $this->assertTrue($this->order->exists());
    }
}