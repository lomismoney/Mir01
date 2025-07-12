<?php

namespace Tests\Unit\Http\Requests\Api;

use Tests\TestCase;
use App\Http\Requests\Api\CreateInstallationFromOrderRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Installation;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class CreateInstallationFromOrderRequestTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試 authorize 方法返回 true
     */
    public function test_authorize_returns_true()
    {
        $request = new CreateInstallationFromOrderRequest();
        $this->assertTrue($request->authorize());
    }

    /**
     * 測試驗證規則定義正確
     */
    public function test_rules_are_defined_correctly()
    {
        $request = new CreateInstallationFromOrderRequest();
        $rules = $request->rules();

        // 檢查必要的規則
        $this->assertArrayHasKey('order_id', $rules);
        $this->assertContains('required', $rules['order_id']);
        $this->assertContains('integer', $rules['order_id']);
        $this->assertContains('exists:orders,id', $rules['order_id']);

        $this->assertArrayHasKey('installer_user_id', $rules);
        $this->assertContains('nullable', $rules['installer_user_id']);
        $this->assertContains('integer', $rules['installer_user_id']);
        $this->assertContains('exists:users,id', $rules['installer_user_id']);

        $this->assertArrayHasKey('installation_address', $rules);
        $this->assertContains('nullable', $rules['installation_address']);
        $this->assertContains('string', $rules['installation_address']);

        $this->assertArrayHasKey('scheduled_date', $rules);
        $this->assertContains('nullable', $rules['scheduled_date']);
        $this->assertContains('date', $rules['scheduled_date']);
        $this->assertContains('after_or_equal:today', $rules['scheduled_date']);

        $this->assertArrayHasKey('notes', $rules);
        $this->assertContains('nullable', $rules['notes']);
        $this->assertContains('string', $rules['notes']);

        $this->assertArrayHasKey('order_item_ids', $rules);
        $this->assertContains('required', $rules['order_item_ids']);
        $this->assertContains('array', $rules['order_item_ids']);
        $this->assertContains('min:1', $rules['order_item_ids']);

        $this->assertArrayHasKey('order_item_ids.*', $rules);
        $this->assertContains('required', $rules['order_item_ids.*']);
        $this->assertContains('integer', $rules['order_item_ids.*']);
        $this->assertContains('exists:order_items,id', $rules['order_item_ids.*']);

        $this->assertArrayHasKey('specifications', $rules);
        $this->assertContains('nullable', $rules['specifications']);
        $this->assertContains('array', $rules['specifications']);

        $this->assertArrayHasKey('specifications.*', $rules);
        $this->assertContains('nullable', $rules['specifications.*']);
        $this->assertContains('string', $rules['specifications.*']);
    }

    /**
     * 測試有效請求通過驗證
     */
    public function test_valid_request_passes_validation()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id]);
        $user = User::factory()->create();

        $data = [
            'order_id' => $order->id,
            'installer_user_id' => $user->id,
            'installation_address' => '測試安裝地址',
            'scheduled_date' => now()->addDays(1)->toDateString(),
            'notes' => '測試備註',
            'order_item_ids' => [$orderItem->id],
            'specifications' => [
                (string)$orderItem->id => '特定安裝規格'
            ]
        ];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試缺少必填欄位時驗證失敗
     */
    public function test_validation_fails_when_required_fields_are_missing()
    {
        $data = [];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('order_id'));
        $this->assertTrue($validator->errors()->has('order_item_ids'));
    }

    /**
     * 測試訂單不存在時驗證失敗
     */
    public function test_validation_fails_when_order_does_not_exist()
    {
        $data = [
            'order_id' => 999999,
            'order_item_ids' => [1]
        ];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('order_id'));
    }

    /**
     * 測試用戶不存在時驗證失敗
     */
    public function test_validation_fails_when_user_does_not_exist()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id]);

        $data = [
            'order_id' => $order->id,
            'installer_user_id' => 999999,
            'order_item_ids' => [$orderItem->id]
        ];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('installer_user_id'));
    }

    /**
     * 測試訂單項目為空陣列時驗證失敗
     */
    public function test_validation_fails_when_order_item_ids_is_empty_array()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);

        $data = [
            'order_id' => $order->id,
            'order_item_ids' => []
        ];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('order_item_ids'));
    }

    /**
     * 測試預計安裝日期早於今天時驗證失敗
     */
    public function test_validation_fails_when_scheduled_date_is_before_today()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id]);

        $data = [
            'order_id' => $order->id,
            'scheduled_date' => now()->subDays(1)->toDateString(),
            'order_item_ids' => [$orderItem->id]
        ];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('scheduled_date'));
    }

    /**
     * 測試自定義錯誤訊息
     */
    public function test_custom_messages()
    {
        $request = new CreateInstallationFromOrderRequest();
        $messages = $request->messages();

        $this->assertArrayHasKey('order_id.required', $messages);
        $this->assertEquals('訂單ID為必填項目', $messages['order_id.required']);

        $this->assertArrayHasKey('order_id.exists', $messages);
        $this->assertEquals('指定的訂單不存在', $messages['order_id.exists']);

        $this->assertArrayHasKey('scheduled_date.after_or_equal', $messages);
        $this->assertEquals('預計安裝日期不能早於今天', $messages['scheduled_date.after_or_equal']);

        $this->assertArrayHasKey('order_item_ids.required', $messages);
        $this->assertEquals('請選擇要安裝的訂單項目', $messages['order_item_ids.required']);

        $this->assertArrayHasKey('order_item_ids.min', $messages);
        $this->assertEquals('至少需要選擇一個訂單項目', $messages['order_item_ids.min']);

        $this->assertArrayHasKey('order_item_ids.*.exists', $messages);
        $this->assertEquals('指定的訂單項目不存在', $messages['order_item_ids.*.exists']);
    }

    /**
     * 測試 body parameters 返回正確結構
     */
    public function test_body_parameters_returns_correct_structure()
    {
        $request = new CreateInstallationFromOrderRequest();
        $parameters = $request->bodyParameters();

        $this->assertIsArray($parameters);
        $this->assertArrayHasKey('order_id', $parameters);
        $this->assertArrayHasKey('installer_user_id', $parameters);
        $this->assertArrayHasKey('installation_address', $parameters);
        $this->assertArrayHasKey('scheduled_date', $parameters);
        $this->assertArrayHasKey('notes', $parameters);
        $this->assertArrayHasKey('order_item_ids', $parameters);
        $this->assertArrayHasKey('order_item_ids.*', $parameters);
        $this->assertArrayHasKey('specifications', $parameters);
        $this->assertArrayHasKey('specifications.*', $parameters);

        // 檢查每個參數都有描述和範例
        foreach ($parameters as $key => $parameter) {
            $this->assertArrayHasKey('description', $parameter);
            $this->assertArrayHasKey('example', $parameter);
        }
    }

    /**
     * 測試 withValidator 方法存在
     */
    public function test_with_validator_method_exists()
    {
        $request = new CreateInstallationFromOrderRequest();
        $this->assertTrue(method_exists($request, 'withValidator'));
    }

    /**
     * 測試可選欄位可以為 null
     */
    public function test_optional_fields_can_be_null()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id]);

        $data = [
            'order_id' => $order->id,
            'installer_user_id' => null,
            'installation_address' => null,
            'scheduled_date' => null,
            'notes' => null,
            'order_item_ids' => [$orderItem->id],
            'specifications' => null
        ];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試今天的日期可以通過驗證
     */
    public function test_today_date_passes_validation()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id]);

        $data = [
            'order_id' => $order->id,
            'scheduled_date' => now()->toDateString(),
            'order_item_ids' => [$orderItem->id]
        ];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試未來日期可以通過驗證
     */
    public function test_future_date_passes_validation()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id]);

        $data = [
            'order_id' => $order->id,
            'scheduled_date' => now()->addDays(7)->toDateString(),
            'order_item_ids' => [$orderItem->id]
        ];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試規格陣列可以包含多個項目
     */
    public function test_specifications_array_can_contain_multiple_items()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $orderItem1 = OrderItem::factory()->create(['order_id' => $order->id]);
        $orderItem2 = OrderItem::factory()->create(['order_id' => $order->id]);

        $data = [
            'order_id' => $order->id,
            'order_item_ids' => [$orderItem1->id, $orderItem2->id],
            'specifications' => [
                (string)$orderItem1->id => '第一個項目的規格',
                (string)$orderItem2->id => '第二個項目的規格'
            ]
        ];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試訂單項目 ID 必須為整數
     */
    public function test_order_item_ids_must_be_integers()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);

        $data = [
            'order_id' => $order->id,
            'order_item_ids' => ['not_integer']
        ];

        $request = new CreateInstallationFromOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('order_item_ids.0'));
    }
}