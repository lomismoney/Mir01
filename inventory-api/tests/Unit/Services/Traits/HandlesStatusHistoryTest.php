<?php

namespace Tests\Unit\Services\Traits;

use Tests\TestCase;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Store;
use App\Models\Customer;
use App\Services\Traits\HandlesStatusHistory;
use App\Services\Traits\HandlesInventoryOperations;
use App\Traits\AuthenticationRequired;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Laravel\Sanctum\Sanctum;

class HandlesStatusHistoryTest extends TestCase
{
    use RefreshDatabase;

    private $testService;
    private User $user;
    private Order $order;
    private Store $store;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Sanctum::actingAs($this->user);
        
        // 創建基礎數據
        $this->store = Store::factory()->create();
        $this->customer = Customer::factory()->create();
        $this->order = Order::factory()
            ->for($this->customer)
            ->for($this->store)
            ->create([
                'shipping_status' => 'pending',
                'payment_status' => 'pending'
            ]);
        
        // 創建使用 trait 的測試服務類
        $this->testService = new class {
            use HandlesStatusHistory, HandlesInventoryOperations, AuthenticationRequired;
        };
    }

    public function test_record_status_change_creates_status_history()
    {
        $history = $this->callProtectedMethod($this->testService, 'recordStatusChange', [
            $this->order,
            'pending',
            'processing',
            'shipping_status',
            '開始處理訂單'
        ]);
        
        $this->assertInstanceOf(OrderStatusHistory::class, $history);
        $this->assertEquals('pending', $history->from_status);
        $this->assertEquals('processing', $history->to_status);
        $this->assertEquals('shipping_status', $history->status_type);
        $this->assertEquals($this->user->id, $history->user_id);
        $this->assertEquals('開始處理訂單', $history->notes);
        
        // 驗證關聯關係
        $this->assertEquals($this->order->id, $history->order_id);
    }

    public function test_record_status_change_with_null_from_status()
    {
        $history = $this->callProtectedMethod($this->testService, 'recordStatusChange', [
            $this->order,
            null,
            'processing',
            'shipping_status'
        ]);
        
        $this->assertNull($history->from_status);
        $this->assertEquals('processing', $history->to_status);
    }

    public function test_record_status_change_with_null_notes()
    {
        $history = $this->callProtectedMethod($this->testService, 'recordStatusChange', [
            $this->order,
            'pending',
            'processing',
            'shipping_status'
        ]);
        
        $this->assertNull($history->notes);
    }

    public function test_batch_update_status_updates_multiple_orders()
    {
        // 創建額外的訂單
        $order2 = Order::factory()
            ->for($this->customer)
            ->for($this->store)
            ->create(['shipping_status' => 'pending']);
        
        $order3 = Order::factory()
            ->for($this->customer)
            ->for($this->store)
            ->create(['shipping_status' => 'pending']);
        
        $ids = [$this->order->id, $order2->id, $order3->id];
        
        $results = $this->callProtectedMethod($this->testService, 'batchUpdateStatus', [
            Order::class,
            $ids,
            'shipping_status',
            'processing',
            'shipping_status',
            '批量處理訂單'
        ]);
        
        $this->assertCount(3, $results);
        
        // 驗證每個結果
        foreach ($results as $result) {
            $this->assertEquals('pending', $result['from_status']);
            $this->assertEquals('processing', $result['to_status']);
            $this->assertTrue($result['success']);
        }
        
        // 驗證數據庫中的狀態已更新
        $this->order->refresh();
        $order2->refresh();
        $order3->refresh();
        
        $this->assertEquals('processing', $this->order->shipping_status);
        $this->assertEquals('processing', $order2->shipping_status);
        $this->assertEquals('processing', $order3->shipping_status);
        
        // 驗證狀態歷史記錄已創建
        $this->assertCount(1, $this->order->statusHistories);
        $this->assertCount(1, $order2->statusHistories);
        $this->assertCount(1, $order3->statusHistories);
    }

    public function test_batch_update_status_skips_unchanged_status()
    {
        // 設置訂單已經是目標狀態
        $this->order->update(['shipping_status' => 'processing']);
        
        $results = $this->callProtectedMethod($this->testService, 'batchUpdateStatus', [
            Order::class,
            [$this->order->id],
            'shipping_status',
            'processing',
            'shipping_status'
        ]);
        
        $this->assertCount(1, $results);
        $this->assertEquals('processing', $results[0]['from_status']);
        $this->assertEquals('processing', $results[0]['to_status']);
        $this->assertFalse($results[0]['success']);
        $this->assertEquals('狀態未變更', $results[0]['message']);
        
        // 確認沒有創建狀態歷史記錄
        $this->assertCount(0, $this->order->statusHistories);
    }

    public function test_batch_update_status_handles_empty_ids()
    {
        $results = $this->callProtectedMethod($this->testService, 'batchUpdateStatus', [
            Order::class,
            [],
            'shipping_status',
            'processing',
            'shipping_status'
        ]);
        
        $this->assertEquals([], $results);
    }

    public function test_is_valid_status_transition_returns_true_for_valid_transition()
    {
        $allowedTransitions = [
            'pending' => ['processing', 'cancelled'],
            'processing' => ['shipped', 'cancelled'],
            'shipped' => ['delivered'],
        ];
        
        $isValid = $this->callProtectedMethod($this->testService, 'isValidStatusTransition', [
            'pending',
            'processing',
            $allowedTransitions
        ]);
        
        $this->assertTrue($isValid);
    }

    public function test_is_valid_status_transition_returns_false_for_invalid_transition()
    {
        $allowedTransitions = [
            'pending' => ['processing', 'cancelled'],
            'processing' => ['shipped', 'cancelled'],
        ];
        
        $isValid = $this->callProtectedMethod($this->testService, 'isValidStatusTransition', [
            'pending',
            'shipped', // 不允許直接從 pending 到 shipped
            $allowedTransitions
        ]);
        
        $this->assertFalse($isValid);
    }

    public function test_is_valid_status_transition_returns_false_for_unknown_from_status()
    {
        $allowedTransitions = [
            'pending' => ['processing', 'cancelled'],
        ];
        
        $isValid = $this->callProtectedMethod($this->testService, 'isValidStatusTransition', [
            'unknown_status',
            'processing',
            $allowedTransitions
        ]);
        
        $this->assertFalse($isValid);
    }

    public function test_validate_status_transition_passes_for_valid_transition()
    {
        $allowedTransitions = [
            'pending' => ['processing', 'cancelled'],
        ];
        
        // 應該不拋出異常
        $this->callProtectedMethod($this->testService, 'validateStatusTransition', [
            'pending',
            'processing',
            $allowedTransitions
        ]);
        
        $this->assertTrue(true);
    }

    public function test_validate_status_transition_throws_exception_for_invalid_transition()
    {
        $allowedTransitions = [
            'pending' => ['processing', 'cancelled'],
        ];
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("狀態轉換：無法從 'pending' 轉換到 'shipped'。允許的轉換狀態：processing, cancelled");
        
        $this->callProtectedMethod($this->testService, 'validateStatusTransition', [
            'pending',
            'shipped',
            $allowedTransitions
        ]);
    }

    public function test_validate_status_transition_with_custom_context()
    {
        $allowedTransitions = [
            'pending' => ['processing'],
        ];
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("訂單處理：無法從 'pending' 轉換到 'shipped'");
        
        $this->callProtectedMethod($this->testService, 'validateStatusTransition', [
            'pending',
            'shipped',
            $allowedTransitions,
            '訂單處理'
        ]);
    }

    public function test_validate_status_transition_shows_no_allowed_states_for_unknown_status()
    {
        $allowedTransitions = [
            'pending' => ['processing'],
        ];
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("狀態轉換：無法從 'unknown' 轉換到 'processing'。允許的轉換狀態：無");
        
        $this->callProtectedMethod($this->testService, 'validateStatusTransition', [
            'unknown',
            'processing',
            $allowedTransitions
        ]);
    }

    public function test_get_status_history_returns_history_collection()
    {
        // 創建一些狀態歷史
        $this->order->statusHistories()->create([
            'from_status' => 'pending',
            'to_status' => 'processing',
            'status_type' => 'shipping_status',
            'user_id' => $this->user->id,
        ]);
        
        $this->order->statusHistories()->create([
            'from_status' => 'processing',
            'to_status' => 'shipped',
            'status_type' => 'shipping_status',
            'user_id' => $this->user->id,
        ]);
        
        $history = $this->callProtectedMethod($this->testService, 'getStatusHistory', [$this->order]);
        
        $this->assertInstanceOf(Collection::class, $history);
        $this->assertCount(2, $history);
        $this->assertEquals('shipped', $history->first()->to_status); // 最新的在前
    }

    public function test_get_status_history_with_status_type_filter()
    {
        // 創建不同類型的狀態歷史
        $this->order->statusHistories()->create([
            'from_status' => 'pending',
            'to_status' => 'processing',
            'status_type' => 'shipping_status',
            'user_id' => $this->user->id,
        ]);
        
        $this->order->statusHistories()->create([
            'from_status' => 'pending',
            'to_status' => 'paid',
            'status_type' => 'payment_status',
            'user_id' => $this->user->id,
        ]);
        
        $history = $this->callProtectedMethod($this->testService, 'getStatusHistory', [
            $this->order,
            'shipping_status'
        ]);
        
        $this->assertCount(1, $history);
        $this->assertEquals('shipping_status', $history->first()->status_type);
    }

    public function test_get_status_history_with_limit()
    {
        // 創建多個狀態歷史
        for ($i = 0; $i < 5; $i++) {
            $this->order->statusHistories()->create([
                'from_status' => 'pending',
                'to_status' => 'processing',
                'status_type' => 'shipping_status',
                'user_id' => $this->user->id,
            ]);
        }
        
        $history = $this->callProtectedMethod($this->testService, 'getStatusHistory', [
            $this->order,
            null,
            3
        ]);
        
        $this->assertCount(3, $history);
    }

    public function test_has_status_returns_true_for_matching_status()
    {
        $this->order->update(['shipping_status' => 'processing']);
        
        $hasStatus = $this->callProtectedMethod($this->testService, 'hasStatus', [
            $this->order,
            'shipping_status',
            'processing'
        ]);
        
        $this->assertTrue($hasStatus);
    }

    public function test_has_status_returns_false_for_non_matching_status()
    {
        $this->order->update(['shipping_status' => 'pending']);
        
        $hasStatus = $this->callProtectedMethod($this->testService, 'hasStatus', [
            $this->order,
            'shipping_status',
            'processing'
        ]);
        
        $this->assertFalse($hasStatus);
    }

    public function test_has_status_with_array_of_statuses()
    {
        $this->order->update(['shipping_status' => 'processing']);
        
        $hasStatus = $this->callProtectedMethod($this->testService, 'hasStatus', [
            $this->order,
            'shipping_status',
            ['pending', 'processing', 'shipped']
        ]);
        
        $this->assertTrue($hasStatus);
    }

    public function test_filter_by_status_separates_matching_and_non_matching()
    {
        $order2 = Order::factory()
            ->for($this->customer)
            ->for($this->store)
            ->create(['shipping_status' => 'processing']);
        
        $order3 = Order::factory()
            ->for($this->customer)
            ->for($this->store)
            ->create(['shipping_status' => 'shipped']);
        
        $orders = collect([$this->order, $order2, $order3]); // pending, processing, shipped
        
        $result = $this->callProtectedMethod($this->testService, 'filterByStatus', [
            $orders,
            'shipping_status',
            ['pending', 'processing']
        ]);
        
        $this->assertCount(2, $result['matching']);
        $this->assertCount(1, $result['non_matching']);
        
        $matchingStatuses = $result['matching']->pluck('shipping_status')->toArray();
        $this->assertContains('pending', $matchingStatuses);
        $this->assertContains('processing', $matchingStatuses);
        
        $nonMatchingStatuses = $result['non_matching']->pluck('shipping_status')->toArray();
        $this->assertContains('shipped', $nonMatchingStatuses);
    }

    public function test_filter_by_status_with_single_status_value()
    {
        $order2 = Order::factory()
            ->for($this->customer)
            ->for($this->store)
            ->create(['shipping_status' => 'processing']);
        
        $orders = collect([$this->order, $order2]); // pending, processing
        
        $result = $this->callProtectedMethod($this->testService, 'filterByStatus', [
            $orders,
            'shipping_status',
            'pending'
        ]);
        
        $this->assertCount(1, $result['matching']);
        $this->assertCount(1, $result['non_matching']);
        $this->assertEquals('pending', $result['matching']->first()->shipping_status);
        $this->assertEquals('processing', $result['non_matching']->first()->shipping_status);
    }

    /**
     * 調用受保護的方法
     */
    private function callProtectedMethod($object, $method, $parameters = [])
    {
        $reflection = new \ReflectionClass(get_class($object));
        $method = $reflection->getMethod($method);
        $method->setAccessible(true);
        
        return $method->invokeArgs($object, $parameters);
    }
}