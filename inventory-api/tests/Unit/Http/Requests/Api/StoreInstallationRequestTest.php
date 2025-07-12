<?php

namespace Tests\Unit\Http\Requests\Api;

use Tests\TestCase;
use App\Http\Requests\Api\StoreInstallationRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\ProductVariant;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class StoreInstallationRequestTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試 authorize 方法返回 true
     */
    public function test_authorize_returns_true()
    {
        $request = new StoreInstallationRequest();
        $this->assertTrue($request->authorize());
    }

    /**
     * 測試驗證規則定義正確
     */
    public function test_rules_are_defined_correctly()
    {
        $request = new StoreInstallationRequest();
        $rules = $request->rules();

        // 基本欄位
        $this->assertArrayHasKey('order_id', $rules);
        $this->assertContains('nullable', $rules['order_id']);
        $this->assertContains('integer', $rules['order_id']);
        $this->assertContains('exists:orders,id', $rules['order_id']);

        $this->assertArrayHasKey('installer_user_id', $rules);
        $this->assertContains('nullable', $rules['installer_user_id']);
        $this->assertContains('integer', $rules['installer_user_id']);
        $this->assertContains('exists:users,id', $rules['installer_user_id']);

        $this->assertArrayHasKey('customer_name', $rules);
        $this->assertContains('required', $rules['customer_name']);
        $this->assertContains('string', $rules['customer_name']);
        $this->assertContains('max:255', $rules['customer_name']);

        $this->assertArrayHasKey('customer_phone', $rules);
        $this->assertContains('required', $rules['customer_phone']);
        $this->assertContains('string', $rules['customer_phone']);
        $this->assertContains('max:20', $rules['customer_phone']);

        $this->assertArrayHasKey('installation_address', $rules);
        $this->assertContains('required', $rules['installation_address']);
        $this->assertContains('string', $rules['installation_address']);

        $this->assertArrayHasKey('scheduled_date', $rules);
        $this->assertContains('nullable', $rules['scheduled_date']);
        $this->assertContains('date', $rules['scheduled_date']);
        $this->assertContains('after_or_equal:today', $rules['scheduled_date']);

        $this->assertArrayHasKey('notes', $rules);
        $this->assertContains('nullable', $rules['notes']);
        $this->assertContains('string', $rules['notes']);

        // 安裝項目
        $this->assertArrayHasKey('items', $rules);
        $this->assertContains('required', $rules['items']);
        $this->assertContains('array', $rules['items']);
        $this->assertContains('min:1', $rules['items']);

        $this->assertArrayHasKey('items.*.order_item_id', $rules);
        $this->assertContains('nullable', $rules['items.*.order_item_id']);
        $this->assertContains('integer', $rules['items.*.order_item_id']);
        $this->assertContains('exists:order_items,id', $rules['items.*.order_item_id']);

        $this->assertArrayHasKey('items.*.product_variant_id', $rules);
        $this->assertContains('nullable', $rules['items.*.product_variant_id']);
        $this->assertContains('integer', $rules['items.*.product_variant_id']);
        $this->assertContains('exists:product_variants,id', $rules['items.*.product_variant_id']);

        $this->assertArrayHasKey('items.*.product_name', $rules);
        $this->assertContains('required', $rules['items.*.product_name']);
        $this->assertContains('string', $rules['items.*.product_name']);
        $this->assertContains('max:255', $rules['items.*.product_name']);

        $this->assertArrayHasKey('items.*.sku', $rules);
        $this->assertContains('required', $rules['items.*.sku']);
        $this->assertContains('string', $rules['items.*.sku']);
        $this->assertContains('max:100', $rules['items.*.sku']);

        $this->assertArrayHasKey('items.*.quantity', $rules);
        $this->assertContains('required', $rules['items.*.quantity']);
        $this->assertContains('integer', $rules['items.*.quantity']);
        $this->assertContains('min:1', $rules['items.*.quantity']);

        $this->assertArrayHasKey('items.*.specifications', $rules);
        $this->assertContains('nullable', $rules['items.*.specifications']);
        $this->assertContains('string', $rules['items.*.specifications']);

        $this->assertArrayHasKey('items.*.notes', $rules);
        $this->assertContains('nullable', $rules['items.*.notes']);
        $this->assertContains('string', $rules['items.*.notes']);
    }

    /**
     * 測試有效請求通過驗證
     */
    public function test_valid_request_passes_validation()
    {
        $data = [
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'scheduled_date' => now()->addDays(1)->toDateString(),
            'notes' => '測試備註',
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1,
                    'specifications' => '黑色，右手開門',
                    'notes' => '需要特殊工具'
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試缺少必填欄位時驗證失敗
     */
    public function test_validation_fails_when_required_fields_are_missing()
    {
        $data = [];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('customer_name'));
        $this->assertTrue($validator->errors()->has('customer_phone'));
        $this->assertTrue($validator->errors()->has('installation_address'));
        $this->assertTrue($validator->errors()->has('items'));
    }

    /**
     * 測試 items 為空陣列時驗證失敗
     */
    public function test_validation_fails_when_items_is_empty_array()
    {
        $data = [
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'items' => []
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items'));
    }

    /**
     * 測試 items 項目缺少必填欄位時驗證失敗
     */
    public function test_validation_fails_when_item_required_fields_are_missing()
    {
        $data = [
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    // 缺少 product_name, sku, quantity
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.product_name'));
        $this->assertTrue($validator->errors()->has('items.0.sku'));
        $this->assertTrue($validator->errors()->has('items.0.quantity'));
    }

    /**
     * 測試預計安裝日期早於今天時驗證失敗
     */
    public function test_validation_fails_when_scheduled_date_is_before_today()
    {
        $data = [
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'scheduled_date' => now()->subDays(1)->toDateString(),
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('scheduled_date'));
    }

    /**
     * 測試 quantity 小於 1 時驗證失敗
     */
    public function test_validation_fails_when_quantity_is_less_than_one()
    {
        $data = [
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 0
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.quantity'));
    }

    /**
     * 測試欄位超出最大長度時驗證失敗
     */
    public function test_validation_fails_when_fields_exceed_max_length()
    {
        $data = [
            'customer_name' => str_repeat('A', 256), // 超過 255 字元
            'customer_phone' => str_repeat('1', 21), // 超過 20 字元
            'installation_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    'product_name' => str_repeat('B', 256), // 超過 255 字元
                    'sku' => str_repeat('C', 101), // 超過 100 字元
                    'quantity' => 1
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('customer_name'));
        $this->assertTrue($validator->errors()->has('customer_phone'));
        $this->assertTrue($validator->errors()->has('items.0.product_name'));
        $this->assertTrue($validator->errors()->has('items.0.sku'));
    }

    /**
     * 測試關聯的訂單不存在時驗證失敗
     */
    public function test_validation_fails_when_order_does_not_exist()
    {
        $data = [
            'order_id' => 999999,
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('order_id'));
    }

    /**
     * 測試關聯的用戶不存在時驗證失敗
     */
    public function test_validation_fails_when_user_does_not_exist()
    {
        $data = [
            'installer_user_id' => 999999,
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('installer_user_id'));
    }

    /**
     * 測試關聯的商品變體不存在時驗證失敗
     */
    public function test_validation_fails_when_product_variant_does_not_exist()
    {
        $data = [
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    'product_variant_id' => 999999,
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.product_variant_id'));
    }

    /**
     * 測試關聯的訂單項目不存在時驗證失敗
     */
    public function test_validation_fails_when_order_item_does_not_exist()
    {
        $data = [
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    'order_item_id' => 999999,
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.order_item_id'));
    }

    /**
     * 測試自定義錯誤訊息
     */
    public function test_custom_messages()
    {
        $request = new StoreInstallationRequest();
        $messages = $request->messages();

        $this->assertArrayHasKey('customer_name.required', $messages);
        $this->assertEquals('客戶姓名為必填項目', $messages['customer_name.required']);

        $this->assertArrayHasKey('customer_phone.required', $messages);
        $this->assertEquals('客戶電話為必填項目', $messages['customer_phone.required']);

        $this->assertArrayHasKey('installation_address.required', $messages);
        $this->assertEquals('安裝地址為必填項目', $messages['installation_address.required']);

        $this->assertArrayHasKey('scheduled_date.after_or_equal', $messages);
        $this->assertEquals('預計安裝日期不能早於今天', $messages['scheduled_date.after_or_equal']);

        $this->assertArrayHasKey('items.required', $messages);
        $this->assertEquals('至少需要一個安裝項目', $messages['items.required']);

        $this->assertArrayHasKey('items.min', $messages);
        $this->assertEquals('至少需要一個安裝項目', $messages['items.min']);

        $this->assertArrayHasKey('items.*.product_name.required', $messages);
        $this->assertEquals('商品名稱為必填項目', $messages['items.*.product_name.required']);

        $this->assertArrayHasKey('items.*.sku.required', $messages);
        $this->assertEquals('商品編號為必填項目', $messages['items.*.sku.required']);

        $this->assertArrayHasKey('items.*.quantity.required', $messages);
        $this->assertEquals('安裝數量為必填項目', $messages['items.*.quantity.required']);

        $this->assertArrayHasKey('items.*.quantity.min', $messages);
        $this->assertEquals('安裝數量必須至少為 1', $messages['items.*.quantity.min']);
    }

    /**
     * 測試 body parameters 返回正確結構
     */
    public function test_body_parameters_returns_correct_structure()
    {
        $request = new StoreInstallationRequest();
        $parameters = $request->bodyParameters();

        $this->assertIsArray($parameters);
        $this->assertArrayHasKey('order_id', $parameters);
        $this->assertArrayHasKey('installer_user_id', $parameters);
        $this->assertArrayHasKey('customer_name', $parameters);
        $this->assertArrayHasKey('customer_phone', $parameters);
        $this->assertArrayHasKey('installation_address', $parameters);
        $this->assertArrayHasKey('scheduled_date', $parameters);
        $this->assertArrayHasKey('notes', $parameters);
        $this->assertArrayHasKey('items', $parameters);
        $this->assertArrayHasKey('items.*.order_item_id', $parameters);
        $this->assertArrayHasKey('items.*.product_variant_id', $parameters);
        $this->assertArrayHasKey('items.*.product_name', $parameters);
        $this->assertArrayHasKey('items.*.sku', $parameters);
        $this->assertArrayHasKey('items.*.quantity', $parameters);
        $this->assertArrayHasKey('items.*.specifications', $parameters);
        $this->assertArrayHasKey('items.*.notes', $parameters);

        // 檢查每個參數都有描述
        foreach ($parameters as $key => $parameter) {
            if ($key !== 'items') { // items 只有描述沒有範例
                $this->assertArrayHasKey('description', $parameter);
            }
        }
    }

    /**
     * 測試 withValidator 方法存在
     */
    public function test_with_validator_method_exists()
    {
        $request = new StoreInstallationRequest();
        $this->assertTrue(method_exists($request, 'withValidator'));
    }

    /**
     * 測試可選欄位可以為 null
     */
    public function test_optional_fields_can_be_null()
    {
        $data = [
            'order_id' => null,
            'installer_user_id' => null,
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'scheduled_date' => null,
            'notes' => null,
            'items' => [
                [
                    'order_item_id' => null,
                    'product_variant_id' => null,
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1,
                    'specifications' => null,
                    'notes' => null
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試今天的日期可以通過驗證
     */
    public function test_today_date_passes_validation()
    {
        $data = [
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'scheduled_date' => now()->toDateString(),
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試多個安裝項目通過驗證
     */
    public function test_multiple_items_pass_validation()
    {
        $data = [
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1
                ],
                [
                    'product_name' => 'B600 智能門鈴',
                    'sku' => 'BELL-B600-WHT',
                    'quantity' => 2
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試有效的關聯資料通過驗證
     */
    public function test_valid_related_data_passes_validation()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id]);
        $user = User::factory()->create();

        $data = [
            'order_id' => $order->id,
            'installer_user_id' => $user->id,
            'customer_name' => '王大明',
            'customer_phone' => '0912345678',
            'installation_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1
                ]
            ]
        ];

        $request = new StoreInstallationRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }
}