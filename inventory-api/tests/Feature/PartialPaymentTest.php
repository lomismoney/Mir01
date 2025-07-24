<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Customer;
use App\Models\Order;
use App\Models\PaymentRecord;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * 部分收款功能測試
 * 
 * 測試藍圖三的核心業務邏輯實現：
 * 1. 驗證金額不超過剩餘未付金額
 * 2. 建立付款記錄
 * 3. 更新訂單的已付金額和付款狀態
 * 4. 寫入狀態變更歷史
 */
class PartialPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶並分配 admin 角色
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        $this->actingAs($this->user, 'sanctum');
    }

    #[Test]
    public function it_can_add_partial_payment_to_order()
    {
        // 準備：創建一個總金額為 1000 的測試訂單
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'creator_user_id' => $this->user->id,
            'grand_total' => 100000,  // 1000.00 * 100 = 100000 分
            'paid_amount' => 0,
            'payment_status' => 'pending',
        ]);

        // 執行：新增 300 元的部分付款
        $paymentData = [
            'amount' => 300.00,  // API 接受元為單位
            'payment_method' => 'cash',
            'notes' => '收到現金付款 300 元',
        ];

        $response = $this->postJson("/api/orders/{$order->id}/add-payment", $paymentData);

        // 驗證：HTTP 響應正確
        $response->assertStatus(200);

        // 驗證：訂單已付金額和狀態正確更新
        $order->refresh();
        $this->assertEquals(30000, $order->paid_amount);  // 300.00 * 100 = 30000 分
        $this->assertEquals('partial', $order->payment_status);

        // 驗證：付款記錄已創建
        $this->assertDatabaseHas('payment_records', [
            'order_id' => $order->id,
            'amount' => 30000,  // 300.00 * 100 = 30000 分
            'payment_method' => 'cash',
            'notes' => '收到現金付款 300 元',
            'creator_id' => $this->user->id,
        ]);

        // 驗證：狀態歷史已記錄
        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $order->id,
            'from_status' => 'pending',
            'to_status' => 'partial',
            'status_type' => 'payment',
            'user_id' => $this->user->id,
        ]);
    }

    #[Test]
    public function it_updates_payment_status_to_paid_when_fully_paid()
    {
        // 準備：創建一個總金額為 1000 元，已付 700 元的訂單
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'creator_user_id' => $this->user->id,
            'grand_total' => 100000,  // 1000.00 * 100 = 100000 分
            'paid_amount' => 70000,   // 700.00 * 100 = 70000 分
            'payment_status' => 'partial',
        ]);

        // 執行：新增最後 300 元的付款（達到全額付清）
        $paymentData = [
            'amount' => 300.00,  // API 接受元為單位
            'payment_method' => 'transfer',
            'notes' => '轉帳付清尾款',
        ];

        $response = $this->postJson("/api/orders/{$order->id}/add-payment", $paymentData);

        // 驗證：HTTP 響應正確
        $response->assertStatus(200);

        // 驗證：訂單狀態更新為已付款
        $order->refresh();
        $this->assertEquals(100000, $order->paid_amount);  // 1000.00 * 100 = 100000 分
        $this->assertEquals('paid', $order->payment_status);
        $this->assertNotNull($order->paid_at);
    }

    #[Test]
    public function it_rejects_payment_amount_exceeding_remaining_balance()
    {
        // 準備：創建一個總金額為 1000 元，已付 700 元的訂單
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'creator_user_id' => $this->user->id,
            'grand_total' => 100000,  // 1000.00 * 100 = 100000 分
            'paid_amount' => 70000,   // 700.00 * 100 = 70000 分
            'payment_status' => 'partial',
        ]);

        // 執行：嘗試新增 400 元的付款（超過剩餘 300 元）
        $paymentData = [
            'amount' => 400.00,  // API 接受元為單位
            'payment_method' => 'cash',
        ];

        $response = $this->postJson("/api/orders/{$order->id}/add-payment", $paymentData);

        // 驗證：返回 422 錯誤
        $response->assertStatus(422);
        $response->assertJsonStructure(['message', 'errors']);

        // 驗證：訂單狀態未變更
        $order->refresh();
        $this->assertEquals(70000, $order->paid_amount);  // 700.00 * 100 = 70000 分
        $this->assertEquals('partial', $order->payment_status);

        // 驗證：未創建付款記錄
        $this->assertDatabaseMissing('payment_records', [
            'order_id' => $order->id,
            'amount' => 40000,  // 400.00 * 100 = 40000 分
        ]);
    }

    #[Test]
    public function it_rejects_payment_for_fully_paid_order()
    {
        // 準備：創建一個已全額付清的訂單
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'creator_user_id' => $this->user->id,
            'grand_total' => 100000,  // 1000.00 * 100 = 100000 分
            'paid_amount' => 100000,  // 1000.00 * 100 = 100000 分
            'payment_status' => 'paid',
        ]);

        // 執行：嘗試再次新增付款
        $paymentData = [
            'amount' => 100.00,  // API 接受元為單位
            'payment_method' => 'cash',
        ];

        $response = $this->postJson("/api/orders/{$order->id}/add-payment", $paymentData);

        // 驗證：返回 422 錯誤
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['amount']);
    }

    #[Test]
    public function it_validates_required_fields()
    {
        // 準備：創建測試訂單
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'creator_user_id' => $this->user->id,
            'grand_total' => 100000,  // 1000.00 * 100 = 100000 分
            'paid_amount' => 0,
            'payment_status' => 'pending',
        ]);

        // 執行：發送空的請求數據
        $response = $this->postJson("/api/orders/{$order->id}/add-payment", []);

        // 驗證：返回驗證錯誤
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['amount', 'payment_method']);
    }

    #[Test]
    public function it_validates_payment_method_enum()
    {
        // 準備：創建測試訂單
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'creator_user_id' => $this->user->id,
            'grand_total' => 100000,  // 1000.00 * 100 = 100000 分
            'paid_amount' => 0,
            'payment_status' => 'pending',
        ]);

        // 執行：使用無效的付款方式
        $paymentData = [
            'amount' => 300.00,  // API 接受元為單位
            'payment_method' => 'invalid_method',
        ];

        $response = $this->postJson("/api/orders/{$order->id}/add-payment", $paymentData);

        // 驗證：返回驗證錯誤
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['payment_method']);
    }
}
