<?php

namespace Tests\Unit\Models;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * OrderStatusHistory 模型測試
 * 
 * 測試訂單狀態歷史記錄模型的所有功能
 */
class OrderStatusHistoryModelTest extends TestCase
{
    use RefreshDatabase;

    private Order $order;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試訂單和用戶
        $this->order = Order::factory()->create();
        $this->user = User::factory()->create();
    }

    /**
     * 測試訂單狀態歷史記錄可以被創建
     */
    public function test_order_status_history_can_be_created(): void
    {
        $history = OrderStatusHistory::create([
            'order_id' => $this->order->id,
            'status_type' => 'payment',
            'from_status' => 'pending',
            'to_status' => 'paid',
            'user_id' => $this->user->id,
            'notes' => '測試狀態變更'
        ]);

        $this->assertInstanceOf(OrderStatusHistory::class, $history);
        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $this->order->id,
            'status_type' => 'payment',
            'from_status' => 'pending',
            'to_status' => 'paid',
            'user_id' => $this->user->id,
            'notes' => '測試狀態變更'
        ]);
    }

    /**
     * 測試與訂單的關聯關係
     */
    public function test_belongs_to_order(): void
    {
        $history = OrderStatusHistory::factory()->create([
            'order_id' => $this->order->id
        ]);

        $this->assertInstanceOf(Order::class, $history->order);
        $this->assertEquals($this->order->id, $history->order->id);
    }

    /**
     * 測試與用戶的關聯關係
     */
    public function test_belongs_to_user(): void
    {
        $history = OrderStatusHistory::factory()->create([
            'user_id' => $this->user->id
        ]);

        $this->assertInstanceOf(User::class, $history->user);
        $this->assertEquals($this->user->id, $history->user->id);
    }

    /**
     * 測試可以創建沒有用戶的歷史記錄（系統操作）
     */
    public function test_can_be_created_without_user(): void
    {
        $history = OrderStatusHistory::create([
            'order_id' => $this->order->id,
            'status_type' => 'system',
            'from_status' => 'pending',
            'to_status' => 'processing',
            'user_id' => null,
            'notes' => '系統自動處理'
        ]);

        $this->assertNull($history->user_id);
        $this->assertNull($history->user);
        $this->assertEquals('系統自動處理', $history->notes);
    }

    /**
     * 測試可填充的欄位
     */
    public function test_fillable_attributes(): void
    {
        $fillable = [
            'order_id',
            'status_type',
            'from_status',
            'to_status',
            'user_id',
            'notes',
        ];

        $model = new OrderStatusHistory();
        $this->assertEquals($fillable, $model->getFillable());
    }

    /**
     * 測試批量賦值
     */
    public function test_mass_assignment(): void
    {
        $data = [
            'order_id' => $this->order->id,
            'status_type' => 'payment',
            'from_status' => 'pending',
            'to_status' => 'paid',
            'user_id' => $this->user->id,
            'notes' => '批量賦值測試'
        ];

        $history = OrderStatusHistory::create($data);

        foreach ($data as $key => $value) {
            $this->assertEquals($value, $history->$key);
        }
    }

    /**
     * 測試不使用 updated_at 時間戳
     */
    public function test_does_not_use_updated_at_timestamp(): void
    {
        $this->assertNull(OrderStatusHistory::UPDATED_AT);
        
        $history = OrderStatusHistory::factory()->create();
        
        // 確認 created_at 存在但 updated_at 不存在
        $this->assertNotNull($history->created_at);
        $this->assertNull($history->updated_at);
    }

    /**
     * 測試時間戳行為
     */
    public function test_timestamp_behavior(): void
    {
        $history = OrderStatusHistory::create([
            'order_id' => $this->order->id,
            'status_type' => 'payment',
            'from_status' => 'pending',
            'to_status' => 'paid'
        ]);

        // 檢查創建時間存在
        $this->assertNotNull($history->created_at);
        
        // 檢查更新時間為 null
        $this->assertNull($history->updated_at);
        
        // 更新記錄後檢查時間戳
        $history->notes = '更新備註';
        $history->save();
        
        // updated_at 應該仍為 null，因為 UPDATED_AT = null
        $this->assertNull($history->updated_at);
    }

    /**
     * 測試使用 HasFactory trait
     */
    public function test_uses_has_factory_trait(): void
    {
        $traits = class_uses(OrderStatusHistory::class);
        $this->assertContains('Illuminate\Database\Eloquent\Factories\HasFactory', $traits);
    }

    /**
     * 測試工廠創建
     */
    public function test_factory_creation(): void
    {
        $history = OrderStatusHistory::factory()->create();
        
        $this->assertInstanceOf(OrderStatusHistory::class, $history);
        $this->assertNotNull($history->order_id);
        $this->assertNotNull($history->status_type);
        $this->assertNotNull($history->from_status);
        $this->assertNotNull($history->to_status);
    }

    /**
     * 測試模型屬性存在
     */
    public function test_model_attributes_exist(): void
    {
        $history = OrderStatusHistory::factory()->create([
            'notes' => '測試備註' // 確保 notes 欄位有值
        ]);
        
        // 檢查所有必要屬性存在
        $this->assertTrue($history->offsetExists('order_id'));
        $this->assertTrue($history->offsetExists('status_type'));
        $this->assertTrue($history->offsetExists('from_status'));
        $this->assertTrue($history->offsetExists('to_status'));
        $this->assertTrue($history->offsetExists('user_id'));
        $this->assertTrue($history->offsetExists('notes'));
        $this->assertTrue($history->offsetExists('created_at'));
    }

    /**
     * 測試關聯的返回類型
     */
    public function test_relationship_return_types(): void
    {
        $history = new OrderStatusHistory();
        
        $this->assertInstanceOf(
            'Illuminate\Database\Eloquent\Relations\BelongsTo',
            $history->order()
        );
        
        $this->assertInstanceOf(
            'Illuminate\Database\Eloquent\Relations\BelongsTo',
            $history->user()
        );
    }

    /**
     * 測試不同類型的狀態變更
     */
    public function test_different_status_types(): void
    {
        $statusTypes = ['payment', 'shipping', 'fulfillment', 'system'];
        
        foreach ($statusTypes as $type) {
            $history = OrderStatusHistory::create([
                'order_id' => $this->order->id,
                'status_type' => $type,
                'from_status' => 'pending',
                'to_status' => 'processed'
            ]);
            
            $this->assertEquals($type, $history->status_type);
        }
    }

    /**
     * 測試狀態變更記錄的完整性
     */
    public function test_status_change_integrity(): void
    {
        $history = OrderStatusHistory::create([
            'order_id' => $this->order->id,
            'status_type' => 'payment',
            'from_status' => 'pending',
            'to_status' => 'paid',
            'user_id' => $this->user->id,
            'notes' => '客戶完成付款'
        ]);

        // 驗證狀態變更的完整性
        $this->assertEquals('pending', $history->from_status);
        $this->assertEquals('paid', $history->to_status);
        $this->assertNotEquals($history->from_status, $history->to_status);
    }

    /**
     * 測試可以查詢特定訂單的歷史記錄
     */
    public function test_can_query_order_history(): void
    {
        // 為同一訂單創建多條歷史記錄
        OrderStatusHistory::factory()->count(3)->create([
            'order_id' => $this->order->id
        ]);
        
        // 為另一訂單創建歷史記錄
        $anotherOrder = Order::factory()->create();
        OrderStatusHistory::factory()->count(2)->create([
            'order_id' => $anotherOrder->id
        ]);

        $orderHistories = OrderStatusHistory::where('order_id', $this->order->id)->get();
        
        $this->assertCount(3, $orderHistories);
        foreach ($orderHistories as $history) {
            $this->assertEquals($this->order->id, $history->order_id);
        }
    }

    /**
     * 測試可以查詢特定用戶的操作歷史
     */
    public function test_can_query_user_operations(): void
    {
        // 為同一用戶創建多條歷史記錄
        OrderStatusHistory::factory()->count(4)->create([
            'user_id' => $this->user->id
        ]);
        
        // 創建系統操作記錄（無用戶）
        OrderStatusHistory::factory()->count(2)->create([
            'user_id' => null
        ]);

        $userHistories = OrderStatusHistory::where('user_id', $this->user->id)->get();
        
        $this->assertCount(4, $userHistories);
        foreach ($userHistories as $history) {
            $this->assertEquals($this->user->id, $history->user_id);
        }
    }

    /**
     * 測試按時間排序查詢
     */
    public function test_can_query_by_time_order(): void
    {
        // 創建多條歷史記錄
        $histories = OrderStatusHistory::factory()->count(5)->create([
            'order_id' => $this->order->id
        ]);

        // 按時間倒序查詢（最新的在前）
        $latestHistories = OrderStatusHistory::where('order_id', $this->order->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $this->assertCount(5, $latestHistories);
        
        // 驗證排序正確性
        for ($i = 0; $i < count($latestHistories) - 1; $i++) {
            $this->assertGreaterThanOrEqual(
                $latestHistories[$i + 1]->created_at,
                $latestHistories[$i]->created_at
            );
        }
    }

    /**
     * 測試模型的表名
     */
    public function test_table_name(): void
    {
        $history = new OrderStatusHistory();
        $this->assertEquals('order_status_histories', $history->getTable());
    }

    /**
     * 測試模型的主鍵
     */
    public function test_primary_key(): void
    {
        $history = new OrderStatusHistory();
        $this->assertEquals('id', $history->getKeyName());
        $this->assertTrue($history->getIncrementing());
    }

    /**
     * 測試模型的連接
     */
    public function test_database_connection(): void
    {
        $history = new OrderStatusHistory();
        $this->assertNull($history->getConnectionName());
    }
}