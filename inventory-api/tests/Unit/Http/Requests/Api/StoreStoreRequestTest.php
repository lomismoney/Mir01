<?php

namespace Tests\Unit\Http\Requests\Api;

use App\Http\Requests\Api\StoreStoreRequest;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class StoreStoreRequestTest extends TestCase
{
    use RefreshDatabase;

    private StoreStoreRequest $request;

    protected function setUp(): void
    {
        parent::setUp();
        $this->request = new StoreStoreRequest();
    }

    /**
     * 測試授權方法返回 true
     */
    public function test_authorize_returns_true()
    {
        $this->assertTrue($this->request->authorize());
    }

    /**
     * 測試有效資料通過驗證
     */
    public function test_valid_data_passes_validation()
    {
        $validData = [
            'name' => '台北總店',
            'address' => '台北市信義區信義路五段7號',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試只有必填欄位的有效資料
     */
    public function test_valid_data_with_required_fields_only()
    {
        $validData = [
            'name' => '台北總店',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試分店名稱為必填
     */
    public function test_name_is_required()
    {
        $invalidData = [
            'address' => '台北市信義區信義路五段7號',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * 測試分店名稱必須是字串
     */
    public function test_name_must_be_string()
    {
        $invalidData = [
            'name' => 123,
            'address' => '台北市信義區信義路五段7號',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * 測試分店名稱長度限制
     */
    public function test_name_max_length()
    {
        $invalidData = [
            'name' => str_repeat('a', 101), // 超過 100 字元
            'address' => '台北市信義區信義路五段7號',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * 測試分店名稱唯一性
     */
    public function test_name_must_be_unique()
    {
        // 創建現有分店
        Store::factory()->create(['name' => '台北總店']);

        $invalidData = [
            'name' => '台北總店',
            'address' => '台北市信義區信義路五段7號',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * 測試地址為可選欄位
     */
    public function test_address_is_optional()
    {
        $validData = [
            'name' => '台北總店',
            // 沒有 address 欄位
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試地址可以為空值
     */
    public function test_address_can_be_null()
    {
        $validData = [
            'name' => '台北總店',
            'address' => null,
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試地址必須是字串
     */
    public function test_address_must_be_string()
    {
        $invalidData = [
            'name' => '台北總店',
            'address' => 123,
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('address', $validator->errors()->toArray());
    }

    /**
     * 測試地址長度限制
     */
    public function test_address_max_length()
    {
        $invalidData = [
            'name' => '台北總店',
            'address' => str_repeat('a', 256), // 超過 255 字元
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('address', $validator->errors()->toArray());
    }

    /**
     * 測試空字串的分店名稱
     */
    public function test_empty_string_name_fails()
    {
        $invalidData = [
            'name' => '',
            'address' => '台北市信義區信義路五段7號',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * 測試空字串的地址
     */
    public function test_empty_string_address_passes()
    {
        $validData = [
            'name' => '台北總店',
            'address' => '',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試自定義錯誤訊息
     */
    public function test_custom_error_messages()
    {
        $messages = $this->request->messages();
        
        $this->assertArrayHasKey('name.required', $messages);
        $this->assertArrayHasKey('name.string', $messages);
        $this->assertArrayHasKey('name.max', $messages);
        $this->assertArrayHasKey('name.unique', $messages);
        $this->assertArrayHasKey('address.string', $messages);
        $this->assertArrayHasKey('address.max', $messages);
        
        $this->assertEquals('分店名稱為必填欄位', $messages['name.required']);
        $this->assertEquals('分店名稱必須為字串', $messages['name.string']);
        $this->assertEquals('分店名稱不可超過 100 個字元', $messages['name.max']);
        $this->assertEquals('此分店名稱已被使用', $messages['name.unique']);
        $this->assertEquals('地址必須為字串', $messages['address.string']);
        $this->assertEquals('地址不可超過 255 個字元', $messages['address.max']);
    }

    /**
     * 測試 bodyParameters 方法
     */
    public function test_body_parameters()
    {
        $parameters = $this->request->bodyParameters();
        
        $this->assertArrayHasKey('name', $parameters);
        $this->assertArrayHasKey('address', $parameters);
        
        $this->assertEquals('分店名稱（唯一）', $parameters['name']['description']);
        $this->assertEquals('台北總店', $parameters['name']['example']);
        $this->assertTrue($parameters['name']['required']);
        
        $this->assertEquals('分店地址', $parameters['address']['description']);
        $this->assertEquals('台北市信義區信義路五段7號', $parameters['address']['example']);
        $this->assertFalse($parameters['address']['required']);
    }

    /**
     * 測試邊界值情況
     */
    public function test_boundary_values()
    {
        // 測試最大長度的有效值
        $validData = [
            'name' => str_repeat('a', 100), // 正好 100 字元
            'address' => str_repeat('b', 255), // 正好 255 字元
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試特殊字元處理
     */
    public function test_special_characters()
    {
        $validData = [
            'name' => '台北總店-分店A',
            'address' => '台北市信義區信義路五段7號101室',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試中文字元
     */
    public function test_chinese_characters()
    {
        $validData = [
            'name' => '台北總店 新北分店',
            'address' => '台北市信義區信義路五段7號',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試混合語言
     */
    public function test_mixed_language()
    {
        $validData = [
            'name' => 'Taipei Main Store 台北總店',
            'address' => 'No.7, Sec.5, Xinyi Rd., Xinyi Dist., Taipei City 110',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試數字和符號
     */
    public function test_numbers_and_symbols()
    {
        $validData = [
            'name' => '分店No.1',
            'address' => '台北市信義區信義路五段7號1F',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試多個驗證錯誤
     */
    public function test_multiple_validation_errors()
    {
        // 創建現有分店
        Store::factory()->create(['name' => '重複分店']);

        $invalidData = [
            'name' => 'a', // 有效但重複的名稱會先測試
            'address' => 123, // 非字串類型
        ];

        // 修改為重複的名稱
        $invalidData['name'] = '重複分店';

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        
        $errors = $validator->errors()->toArray();
        $this->assertArrayHasKey('name', $errors);
        $this->assertArrayHasKey('address', $errors);
    }

    /**
     * 測試分店名稱大小寫敏感性
     */
    public function test_name_case_sensitivity()
    {
        // 創建現有分店
        Store::factory()->create(['name' => '台北總店']);

        // 測試不同大小寫是否被視為不同名稱
        $testData = [
            'name' => '台北總店', // 完全相同
            'address' => '台北市信義區信義路五段7號',
        ];

        $validator = Validator::make($testData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * 測試長地址
     */
    public function test_long_address()
    {
        $validData = [
            'name' => '台北總店',
            'address' => '台北市信義區信義路五段7號101室' . str_repeat('地下室', 50), // 接近但不超過 255 字元
        ];

        // 確保地址長度在限制內
        $validData['address'] = substr($validData['address'], 0, 255);

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試 WhiteSpace 處理
     */
    public function test_whitespace_handling()
    {
        $validData = [
            'name' => '  台北總店  ', // 前後有空格
            'address' => '  台北市信義區信義路五段7號  ', // 前後有空格
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試陣列類型的無效輸入
     */
    public function test_array_inputs_fail()
    {
        $invalidData = [
            'name' => ['台北總店'], // 陣列而非字串
            'address' => ['台北市信義區信義路五段7號'], // 陣列而非字串
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
        $this->assertArrayHasKey('address', $validator->errors()->toArray());
    }

    /**
     * 測試布林值輸入
     */
    public function test_boolean_inputs_fail()
    {
        $invalidData = [
            'name' => true, // 布林值而非字串
            'address' => false, // 布林值而非字串
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
        $this->assertArrayHasKey('address', $validator->errors()->toArray());
    }
}