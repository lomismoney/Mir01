<?php

namespace Tests\Unit\Http\Requests\Api;

use Tests\TestCase;
use App\Http\Requests\Api\StoreOrderRequest;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Models\Category;
use App\Models\Store;
use Illuminate\Support\Facades\Validator;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * StoreOrderRequest 單元測試
 * 
 * 測試訂單創建請求的驗證規則
 */
class StoreOrderRequestTest extends TestCase
{
    use RefreshDatabase;
    
    protected Customer $customer;
    protected ProductVariant $productVariant;
    protected Store $store;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試資料
        $this->customer = Customer::factory()->create();
        $this->store = Store::factory()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id
        ]);
    }
    
    /**
     * 測試 authorize 方法總是返回 true
     */
    public function test_authorize_returns_true()
    {
        $request = new StoreOrderRequest();
        $this->assertTrue($request->authorize());
    }
    
    /**
     * 測試驗證規則的定義
     */
    public function test_rules_are_defined_correctly()
    {
        $request = new StoreOrderRequest();
        $rules = $request->rules();
        
        // 檢查主要欄位規則
        $this->assertArrayHasKey('customer_id', $rules);
        $this->assertEquals('required|exists:customers,id', $rules['customer_id']);
        
        $this->assertArrayHasKey('shipping_status', $rules);
        $this->assertEquals('required|string', $rules['shipping_status']);
        
        $this->assertArrayHasKey('payment_status', $rules);
        $this->assertEquals('required|string', $rules['payment_status']);
        
        $this->assertArrayHasKey('items', $rules);
        $this->assertEquals('required|array|min:1', $rules['items']);
        
        // 檢查可選欄位規則
        $this->assertArrayHasKey('shipping_fee', $rules);
        $this->assertEquals('nullable|numeric|min:0', $rules['shipping_fee']);
        
        $this->assertArrayHasKey('force_create_despite_stock', $rules);
        $this->assertEquals('sometimes|boolean', $rules['force_create_despite_stock']);
        
        // 檢查項目規則
        $this->assertArrayHasKey('items.*.product_variant_id', $rules);
        $this->assertEquals('nullable|exists:product_variants,id', $rules['items.*.product_variant_id']);
        
        $this->assertArrayHasKey('items.*.quantity', $rules);
        $this->assertEquals('required|integer|min:1', $rules['items.*.quantity']);
    }
    
    /**
     * 測試有效的請求資料通過驗證
     */
    public function test_valid_request_passes_validation()
    {
        $data = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000,
                    'quantity' => 2
                ]
            ]
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->passes());
    }
    
    /**
     * 測試缺少必要欄位時驗證失敗
     */
    public function test_validation_fails_when_required_fields_are_missing()
    {
        $data = [];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->passes());
        
        $errors = $validator->errors();
        $this->assertTrue($errors->has('customer_id'));
        $this->assertTrue($errors->has('shipping_status'));
        $this->assertTrue($errors->has('payment_status'));
        $this->assertTrue($errors->has('payment_method'));
        $this->assertTrue($errors->has('order_source'));
        $this->assertTrue($errors->has('shipping_address'));
        $this->assertTrue($errors->has('items'));
    }
    
    /**
     * 測試客戶 ID 不存在時驗證失敗
     */
    public function test_validation_fails_when_customer_id_does_not_exist()
    {
        $data = [
            'customer_id' => 99999,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000,
                    'quantity' => 1
                ]
            ]
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('customer_id'));
    }
    
    /**
     * 測試空的項目陣列時驗證失敗
     */
    public function test_validation_fails_when_items_array_is_empty()
    {
        $data = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => []
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items'));
    }
    
    /**
     * 測試商品變體 ID 不存在時驗證失敗
     */
    public function test_validation_fails_when_product_variant_id_does_not_exist()
    {
        $data = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => 99999,
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000,
                    'quantity' => 1
                ]
            ]
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.product_variant_id'));
    }
    
    /**
     * 測試訂製商品（product_variant_id 為 null）通過驗證
     */
    public function test_custom_product_with_null_product_variant_id_passes_validation()
    {
        $data = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => null,
                    'is_stocked_sale' => false,
                    'status' => 'pending',
                    'custom_specifications' => '{"尺寸": "大"}',
                    'product_name' => '訂製商品',
                    'sku' => 'CUSTOM-001',
                    'price' => 5000,
                    'quantity' => 1
                ]
            ]
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->passes());
    }
    
    /**
     * 測試無效的 JSON 格式時驗證失敗
     */
    public function test_validation_fails_when_custom_specifications_is_invalid_json()
    {
        $data = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => null,
                    'is_stocked_sale' => false,
                    'status' => 'pending',
                    'custom_specifications' => 'invalid json',
                    'product_name' => '訂製商品',
                    'sku' => 'CUSTOM-001',
                    'price' => 5000,
                    'quantity' => 1
                ]
            ]
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.custom_specifications'));
    }
    
    /**
     * 測試數量小於 1 時驗證失敗
     */
    public function test_validation_fails_when_quantity_is_less_than_one()
    {
        $data = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000,
                    'quantity' => 0
                ]
            ]
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.quantity'));
    }
    
    /**
     * 測試價格為負數時驗證失敗
     */
    public function test_validation_fails_when_price_is_negative()
    {
        $data = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => -100,
                    'quantity' => 1
                ]
            ]
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.price'));
    }
    
    /**
     * 測試運費為負數時驗證失敗
     */
    public function test_validation_fails_when_shipping_fee_is_negative()
    {
        $data = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'shipping_fee' => -50,
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000,
                    'quantity' => 1
                ]
            ]
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('shipping_fee'));
    }
    
    /**
     * 測試 force_create_despite_stock 接受各種布林值格式
     */
    public function test_force_create_despite_stock_accepts_various_boolean_formats()
    {
        // 測試整數 1 通過驗證
        $data = $this->getValidData();
        $data['force_create_despite_stock'] = 1;
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
        
        // 測試整數 0 通過驗證
        $data['force_create_despite_stock'] = 0;
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
        
        // 測試布林值 true 通過驗證
        $data['force_create_despite_stock'] = true;
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
        
        // 測試布林值 false 通過驗證
        $data['force_create_despite_stock'] = false;
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
        
        // 測試字串 "true" 通過驗證（因為 prepareForValidation 會轉換它）
        $data['force_create_despite_stock'] = 'true';
        $processedData = $this->processRequestData($data);
        $validator = Validator::make($processedData, $request->rules());
        $this->assertTrue($validator->passes());
        
        // 測試字串 "false" 通過驗證（因為 prepareForValidation 會轉換它）
        $data['force_create_despite_stock'] = 'false';
        $processedData = $this->processRequestData($data);
        $validator = Validator::make($processedData, $request->rules());
        $this->assertTrue($validator->passes());
    }
    
    /**
     * 模擬 prepareForValidation 處理數據
     */
    private function processRequestData($data)
    {
        if (isset($data['force_create_despite_stock'])) {
            $data['force_create_despite_stock'] = filter_var(
                $data['force_create_despite_stock'],
                FILTER_VALIDATE_BOOLEAN
            );
        }
        return $data;
    }
    
    /**
     * 測試沒有 force_create_despite_stock 欄位時仍然通過驗證
     */
    public function test_validation_passes_without_force_create_despite_stock_field()
    {
        $data = $this->getValidData();
        unset($data['force_create_despite_stock']);
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->passes());
    }
    
    /**
     * 獲取有效的測試資料
     */
    private function getValidData(): array
    {
        return [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '台北市信義區信義路五段7號',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000,
                    'quantity' => 2
                ]
            ]
        ];
    }
    
    /**
     * 測試 bodyParameters 方法返回正確的結構
     */
    public function test_body_parameters_returns_correct_structure()
    {
        $request = new StoreOrderRequest();
        $parameters = $request->bodyParameters();
        
        // 檢查主要參數
        $this->assertArrayHasKey('customer_id', $parameters);
        $this->assertArrayHasKey('description', $parameters['customer_id']);
        $this->assertArrayHasKey('example', $parameters['customer_id']);
        
        $this->assertArrayHasKey('items', $parameters);
        $this->assertArrayHasKey('description', $parameters['items']);
        $this->assertArrayHasKey('example', $parameters['items']);
        
        // 檢查巢狀參數
        $this->assertArrayHasKey('items.*.product_variant_id', $parameters);
        $this->assertArrayHasKey('items.*.quantity', $parameters);
        
        // 檢查範例資料的格式
        $this->assertIsArray($parameters['items']['example']);
        $this->assertIsArray($parameters['items']['example'][0]);
        $this->assertArrayHasKey('product_variant_id', $parameters['items']['example'][0]);
    }
    
    /**
     * 測試多個項目的驗證
     */
    public function test_validation_with_multiple_items()
    {
        $productVariant2 = ProductVariant::factory()->create([
            'product_id' => $this->productVariant->product_id
        ]);
        
        $data = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '信用卡',
            'order_source' => '網路訂單',
            'shipping_address' => '台北市大安區',
            'shipping_fee' => 100,
            'tax' => 50,
            'discount_amount' => 20,
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'product_name' => '商品1',
                    'sku' => 'SKU-001',
                    'price' => 1000,
                    'quantity' => 2
                ],
                [
                    'product_variant_id' => $productVariant2->id,
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'product_name' => '商品2',
                    'sku' => 'SKU-002',
                    'price' => 2000,
                    'quantity' => 1
                ],
                [
                    'product_variant_id' => null,
                    'is_stocked_sale' => false,
                    'status' => 'pending',
                    'custom_specifications' => '{"顏色": "紅色"}',
                    'product_name' => '訂製商品',
                    'sku' => 'CUSTOM-002',
                    'price' => 3000,
                    'quantity' => 1
                ]
            ]
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->passes());
    }
    
    /**
     * 測試 is_stocked_sale 非布林值時驗證失敗
     */
    public function test_validation_fails_when_is_stocked_sale_is_not_boolean()
    {
        $data = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => '現金',
            'order_source' => '現場客戶',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'is_stocked_sale' => 'yes',
                    'status' => 'pending',
                    'product_name' => '測試商品',
                    'sku' => 'TEST-001',
                    'price' => 1000,
                    'quantity' => 1
                ]
            ]
        ];
        
        $request = new StoreOrderRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.is_stocked_sale'));
    }
}