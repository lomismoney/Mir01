<?php

namespace Tests\Unit\Http\Requests\Api;

use Tests\TestCase;
use App\Http\Requests\Api\ReorderCategoriesRequest;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class ReorderCategoriesRequestTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試 authorize 方法返回 true
     */
    public function test_authorize_returns_true()
    {
        $request = new ReorderCategoriesRequest();
        $this->assertTrue($request->authorize());
    }

    /**
     * 測試驗證規則定義正確
     */
    public function test_rules_are_defined_correctly()
    {
        $request = new ReorderCategoriesRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('items', $rules);
        $this->assertEquals('required|array', $rules['items']);

        $this->assertArrayHasKey('items.*.id', $rules);
        $this->assertEquals('required|integer|exists:categories,id', $rules['items.*.id']);

        $this->assertArrayHasKey('items.*.sort_order', $rules);
        $this->assertEquals('required|integer|min:0', $rules['items.*.sort_order']);
    }

    /**
     * 測試有效請求通過驗證
     */
    public function test_valid_request_passes_validation()
    {
        $category1 = Category::factory()->create();
        $category2 = Category::factory()->create();

        $data = [
            'items' => [
                [
                    'id' => $category1->id,
                    'sort_order' => 0
                ],
                [
                    'id' => $category2->id,
                    'sort_order' => 1
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試缺少 items 欄位時驗證失敗
     */
    public function test_validation_fails_when_items_is_missing()
    {
        $data = [];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items'));
    }

    /**
     * 測試 items 不是陣列時驗證失敗
     */
    public function test_validation_fails_when_items_is_not_array()
    {
        $data = [
            'items' => 'not_an_array'
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items'));
    }

    /**
     * 測試項目缺少 id 欄位時驗證失敗
     */
    public function test_validation_fails_when_item_id_is_missing()
    {
        $data = [
            'items' => [
                [
                    'sort_order' => 0
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.id'));
    }

    /**
     * 測試項目缺少 sort_order 欄位時驗證失敗
     */
    public function test_validation_fails_when_item_sort_order_is_missing()
    {
        $category = Category::factory()->create();

        $data = [
            'items' => [
                [
                    'id' => $category->id
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.sort_order'));
    }

    /**
     * 測試項目 id 不是整數時驗證失敗
     */
    public function test_validation_fails_when_item_id_is_not_integer()
    {
        $data = [
            'items' => [
                [
                    'id' => 'not_integer',
                    'sort_order' => 0
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.id'));
    }

    /**
     * 測試項目 sort_order 不是整數時驗證失敗
     */
    public function test_validation_fails_when_item_sort_order_is_not_integer()
    {
        $category = Category::factory()->create();

        $data = [
            'items' => [
                [
                    'id' => $category->id,
                    'sort_order' => 'not_integer'
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.sort_order'));
    }

    /**
     * 測試項目 sort_order 小於 0 時驗證失敗
     */
    public function test_validation_fails_when_item_sort_order_is_negative()
    {
        $category = Category::factory()->create();

        $data = [
            'items' => [
                [
                    'id' => $category->id,
                    'sort_order' => -1
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.sort_order'));
    }

    /**
     * 測試項目 id 不存在時驗證失敗
     */
    public function test_validation_fails_when_category_does_not_exist()
    {
        $data = [
            'items' => [
                [
                    'id' => 999999,
                    'sort_order' => 0
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.id'));
    }

    /**
     * 測試空陣列失敗驗證（因為規則是 required|array）
     */
    public function test_empty_items_array_fails_validation()
    {
        $data = [
            'items' => []
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        
        // 空陣列在 Laravel 中被視為 "empty"，所以 required 規則會失敗
        // 除非明確允許空陣列
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items'));
    }

    /**
     * 測試多個項目通過驗證
     */
    public function test_multiple_items_pass_validation()
    {
        $category1 = Category::factory()->create();
        $category2 = Category::factory()->create();
        $category3 = Category::factory()->create();

        $data = [
            'items' => [
                [
                    'id' => $category1->id,
                    'sort_order' => 2
                ],
                [
                    'id' => $category2->id,
                    'sort_order' => 0
                ],
                [
                    'id' => $category3->id,
                    'sort_order' => 1
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試 sort_order 為 0 通過驗證
     */
    public function test_sort_order_zero_passes_validation()
    {
        $category = Category::factory()->create();

        $data = [
            'items' => [
                [
                    'id' => $category->id,
                    'sort_order' => 0
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試相同 sort_order 值通過驗證
     */
    public function test_same_sort_order_values_pass_validation()
    {
        $category1 = Category::factory()->create();
        $category2 = Category::factory()->create();

        $data = [
            'items' => [
                [
                    'id' => $category1->id,
                    'sort_order' => 1
                ],
                [
                    'id' => $category2->id,
                    'sort_order' => 1
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試 bodyParameters 方法返回正確結構
     */
    public function test_body_parameters_returns_correct_structure()
    {
        $request = new ReorderCategoriesRequest();
        $parameters = $request->bodyParameters();

        $this->assertIsArray($parameters);
        $this->assertArrayHasKey('items', $parameters);
        $this->assertArrayHasKey('items.*.id', $parameters);
        $this->assertArrayHasKey('items.*.sort_order', $parameters);

        // 檢查 items 參數
        $this->assertArrayHasKey('description', $parameters['items']);
        $this->assertArrayHasKey('example', $parameters['items']);
        $this->assertEquals('分類排序項目陣列', $parameters['items']['description']);
        $this->assertIsArray($parameters['items']['example']);

        // 檢查 items.*.id 參數
        $this->assertArrayHasKey('description', $parameters['items.*.id']);
        $this->assertArrayHasKey('example', $parameters['items.*.id']);
        $this->assertEquals('分類 ID', $parameters['items.*.id']['description']);
        $this->assertEquals(1, $parameters['items.*.id']['example']);

        // 檢查 items.*.sort_order 參數
        $this->assertArrayHasKey('description', $parameters['items.*.sort_order']);
        $this->assertArrayHasKey('example', $parameters['items.*.sort_order']);
        $this->assertEquals('排序順序（從 0 開始）', $parameters['items.*.sort_order']['description']);
        $this->assertEquals(0, $parameters['items.*.sort_order']['example']);
    }

    /**
     * 測試 bodyParameters 範例結構正確
     */
    public function test_body_parameters_example_structure()
    {
        $request = new ReorderCategoriesRequest();
        $parameters = $request->bodyParameters();

        $example = $parameters['items']['example'];
        $this->assertIsArray($example);
        $this->assertCount(2, $example);

        // 檢查第一個範例項目
        $this->assertArrayHasKey('id', $example[0]);
        $this->assertArrayHasKey('sort_order', $example[0]);
        $this->assertEquals(1, $example[0]['id']);
        $this->assertEquals(0, $example[0]['sort_order']);

        // 檢查第二個範例項目
        $this->assertArrayHasKey('id', $example[1]);
        $this->assertArrayHasKey('sort_order', $example[1]);
        $this->assertEquals(2, $example[1]['id']);
        $this->assertEquals(1, $example[1]['sort_order']);
    }

    /**
     * 測試大數值 sort_order 通過驗證
     */
    public function test_large_sort_order_values_pass_validation()
    {
        $category = Category::factory()->create();

        $data = [
            'items' => [
                [
                    'id' => $category->id,
                    'sort_order' => 999999
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試重複的分類 ID 通過驗證（業務邏輯層面處理）
     */
    public function test_duplicate_category_ids_pass_validation()
    {
        $category = Category::factory()->create();

        $data = [
            'items' => [
                [
                    'id' => $category->id,
                    'sort_order' => 0
                ],
                [
                    'id' => $category->id,
                    'sort_order' => 1
                ]
            ]
        ];

        $request = new ReorderCategoriesRequest();
        $validator = Validator::make($data, $request->rules());
        $this->assertTrue($validator->passes());
    }
}