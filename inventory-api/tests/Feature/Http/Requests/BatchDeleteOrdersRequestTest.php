<?php

namespace Tests\Feature\Http\Requests;

use App\Http\Requests\Api\BatchDeleteOrdersRequest;
use App\Models\Order;
use App\Models\User;
use App\Models\Store;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\App;
use Tests\TestCase;

/**
 * BatchDeleteOrdersRequest 測試
 * 
 * 測試批量刪除訂單請求驗證規則
 */
class BatchDeleteOrdersRequestTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試前設置
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // 設定應用程式語言為繁體中文
        App::setLocale('zh_TW');
        
        // 創建測試用戶和客戶
        $user = User::factory()->create();
        $customer = Customer::factory()->create();
        
        // 創建測試訂單
        Order::factory()->count(5)->create([
            'customer_id' => $customer->id,
        ]);
    }

    /**
     * 測試驗證規則定義
     */
    public function test_validation_rules(): void
    {
        $request = new BatchDeleteOrdersRequest();
        $rules = $request->rules();

        // 驗證規則結構
        $this->assertArrayHasKey('ids', $rules);
        $this->assertArrayHasKey('ids.*', $rules);

        // 驗證 ids 規則
        $this->assertStringContainsString('required', $rules['ids']);
        $this->assertStringContainsString('array', $rules['ids']);
        $this->assertStringContainsString('min:1', $rules['ids']);

        // 驗證 ids.* 規則
        $this->assertStringContainsString('integer', $rules['ids.*']);
        $this->assertStringContainsString('exists:orders,id', $rules['ids.*']);
    }

    /**
     * 測試有效的批量刪除請求
     */
    public function test_valid_batch_delete_request(): void
    {
        $orders = Order::take(3)->get();
        
        $data = [
            'ids' => $orders->pluck('id')->toArray(),
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->fails());
    }

    /**
     * 測試單個訂單刪除請求
     */
    public function test_single_order_delete_request(): void
    {
        $order = Order::first();
        
        $data = [
            'ids' => [$order->id],
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->fails());
    }

    /**
     * 測試必填字段驗證
     */
    public function test_required_ids_field(): void
    {
        $data = [];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('ids', $validator->errors()->toArray());
        
        $errors = $validator->errors()->get('ids');
        // 檢查是否包含自定義錯誤訊息
        $this->assertTrue(
            in_array('請選擇要刪除的訂單', $errors) || 
            in_array('The ids field is required.', $errors)
        );
    }

    /**
     * 測試 ids 必須是陣列
     */
    public function test_ids_must_be_array(): void
    {
        $data = [
            'ids' => 'not-an-array',
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('ids', $validator->errors()->toArray());
        
        $errors = $validator->errors()->get('ids');
        // 檢查是否包含自定義錯誤訊息
        $this->assertTrue(
            in_array('訂單 ID 格式不正確', $errors) || 
            in_array('The ids field must be an array.', $errors)
        );
    }

    /**
     * 測試空陣列驗證
     */
    public function test_empty_array_validation(): void
    {
        $data = ['ids' => []]; // 空陣列
        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('ids', $validator->errors()->toArray());
        
        $errors = $validator->errors()->get('ids');
        
        // 空陣列應該觸發我們的自定義 min 驗證訊息
        $this->assertContains('請選擇要刪除的訂單', $errors);
    }

    /**
     * 測試 ID 必須是整數
     */
    public function test_ids_must_be_integers(): void
    {
        $data = [
            'ids' => ['not-integer', 'also-not-integer'],
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('ids.0', $validator->errors()->toArray());
        $this->assertArrayHasKey('ids.1', $validator->errors()->toArray());
        
        $errors0 = $validator->errors()->get('ids.0');
        $errors1 = $validator->errors()->get('ids.1');
        
        // 檢查是否包含整數驗證錯誤
        $this->assertTrue(
            in_array('訂單 ID 必須是有效的數字', $errors0) || 
            str_contains(implode(' ', $errors0), 'integer')
        );
        $this->assertTrue(
            in_array('訂單 ID 必須是有效的數字', $errors1) || 
            str_contains(implode(' ', $errors1), 'integer')
        );
    }

    /**
     * 測試 ID 必須存在於訂單表中
     */
    public function test_ids_must_exist_in_orders_table(): void
    {
        $data = [
            'ids' => [99999, 99998], // 不存在的 ID
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('ids.0', $validator->errors()->toArray());
        $this->assertArrayHasKey('ids.1', $validator->errors()->toArray());
        
        $errors0 = $validator->errors()->get('ids.0');
        $errors1 = $validator->errors()->get('ids.1');
        
        // 檢查是否包含存在性驗證錯誤
        $this->assertTrue(
            in_array('選擇的訂單不存在或已被刪除', $errors0) || 
            str_contains(implode(' ', $errors0), 'does not exist')
        );
        $this->assertTrue(
            in_array('選擇的訂單不存在或已被刪除', $errors1) || 
            str_contains(implode(' ', $errors1), 'does not exist')
        );
    }

    /**
     * 測試混合有效和無效的 ID
     */
    public function test_mixed_valid_and_invalid_ids(): void
    {
        $validOrder = Order::first();
        
        $data = [
            'ids' => [$validOrder->id, 99999, 'invalid'], // 混合有效和無效的 ID
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('ids.1', $validator->errors()->toArray());
        $this->assertArrayHasKey('ids.2', $validator->errors()->toArray());
        
        $errors1 = $validator->errors()->get('ids.1');
        $errors2 = $validator->errors()->get('ids.2');
        
        // 檢查錯誤訊息
        $this->assertTrue(
            in_array('選擇的訂單不存在或已被刪除', $errors1) || 
            str_contains(implode(' ', $errors1), 'does not exist')
        );
        $this->assertTrue(
            in_array('訂單 ID 必須是有效的數字', $errors2) || 
            str_contains(implode(' ', $errors2), 'integer')
        );
    }

    /**
     * 測試重複的 ID
     */
    public function test_duplicate_ids(): void
    {
        $order = Order::first();
        
        $data = [
            'ids' => [$order->id, $order->id, $order->id], // 重複的 ID
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        // 重複的 ID 在這個驗證規則下應該是有效的
        $this->assertFalse($validator->fails());
    }

    /**
     * 測試大量 ID 的處理
     */
    public function test_large_batch_of_ids(): void
    {
        // 創建更多訂單
        $additionalOrders = Order::factory()->count(20)->create([
            'customer_id' => Customer::first()->id,
        ]);

        $allOrders = Order::take(25)->get();
        
        $data = [
            'ids' => $allOrders->pluck('id')->toArray(),
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->fails());
    }

    /**
     * 測試自定義錯誤訊息
     */
    public function test_custom_error_messages(): void
    {
        $request = new BatchDeleteOrdersRequest();
        $messages = $request->messages();

        // 驗證所有自定義訊息都存在
        $this->assertArrayHasKey('ids.required', $messages);
        $this->assertArrayHasKey('ids.array', $messages);
        $this->assertArrayHasKey('ids.min', $messages);
        $this->assertArrayHasKey('ids.*.integer', $messages);
        $this->assertArrayHasKey('ids.*.exists', $messages);

        // 驗證訊息內容
        $this->assertEquals('請選擇要刪除的訂單', $messages['ids.required']);
        $this->assertEquals('訂單 ID 格式不正確', $messages['ids.array']);
        $this->assertEquals('至少需要選擇一個訂單進行刪除', $messages['ids.min']);
        $this->assertEquals('訂單 ID 必須是有效的數字', $messages['ids.*.integer']);
        $this->assertEquals('選擇的訂單不存在或已被刪除', $messages['ids.*.exists']);
    }

    /**
     * 測試 API 文檔參數
     */
    public function test_body_parameters(): void
    {
        $request = new BatchDeleteOrdersRequest();
        $parameters = $request->bodyParameters();

        // 驗證參數結構
        $this->assertArrayHasKey('ids', $parameters);
        $this->assertArrayHasKey('description', $parameters['ids']);
        $this->assertArrayHasKey('example', $parameters['ids']);

        // 驗證參數內容
        $this->assertEquals('要刪除的訂單 ID 陣列', $parameters['ids']['description']);
        $this->assertEquals([1, 2, 3], $parameters['ids']['example']);
    }

    /**
     * 測試授權總是返回 true
     */
    public function test_authorize_always_returns_true(): void
    {
        $request = new BatchDeleteOrdersRequest();
        
        $this->assertTrue($request->authorize());
    }

    /**
     * 測試包含 null 值的 ID 陣列
     */
    public function test_ids_with_null_values(): void
    {
        $validOrder = Order::first();
        
        $data = [
            'ids' => [$validOrder->id, null, $validOrder->id],
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('ids.1', $validator->errors()->toArray());
    }

    /**
     * 測試包含浮點數的 ID 陣列
     */
    public function test_ids_with_float_values(): void
    {
        $data = [
            'ids' => [1.5, 2.7, 3.0],
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('ids.0', $validator->errors()->toArray());
        $this->assertArrayHasKey('ids.1', $validator->errors()->toArray());
        // 3.0 可能被認為是有效的整數，取決於 PHP 版本
    }

    /**
     * 測試含有布林值的 ID 陣列
     */
    public function test_ids_with_boolean_values(): void
    {
        $data = ['ids' => [true, false]];
        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertTrue($validator->fails());
        
        $errors = $validator->errors()->toArray();
        
        // false 會觸發整數驗證錯誤，而 true (轉換為 1) 可能會觸發存在性檢查錯誤
        $this->assertTrue(count($errors) > 0);
        
        // 檢查錯誤訊息內容 - 應該包含整數驗證錯誤或存在性檢查錯誤
        $allErrors = collect($errors)->flatten()->toArray();
        
        $hasIntegerError = collect($allErrors)->contains(function($error) {
            return str_contains($error, '必須是有效的數字') || str_contains($error, 'integer');
        });
        
        $hasExistsError = collect($allErrors)->contains(function($error) {
            return str_contains($error, '不存在') || str_contains($error, 'does not exist') || str_contains($error, 'exists');
        });
        
        // 應該至少有一種錯誤類型
        $this->assertTrue($hasIntegerError || $hasExistsError, '應該包含整數驗證錯誤或存在性檢查錯誤');
    }

    /**
     * 測試邊界情況：最大整數值
     */
    public function test_maximum_integer_value(): void
    {
        $data = [
            'ids' => [PHP_INT_MAX],
        ];

        $request = new BatchDeleteOrdersRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        // 應該通過整數驗證但在存在性檢查時失敗
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('ids.0', $validator->errors()->toArray());
        
        $errors = $validator->errors()->get('ids.0');
        $this->assertTrue(
            in_array('選擇的訂單不存在或已被刪除', $errors) || 
            str_contains(implode(' ', $errors), 'does not exist')
        );
    }
} 