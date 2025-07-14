<?php

namespace Tests\Unit\Services\Traits;

use Tests\TestCase;
use App\Models\Store;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\User;
use App\Services\Traits\HandlesInventoryOperations;
use App\Traits\AuthenticationRequired;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class HandlesInventoryOperationsTest extends TestCase
{
    use RefreshDatabase;

    private $testService;
    private User $user;
    private Store $store1;
    private Store $store2;
    private ProductVariant $variant1;
    private ProductVariant $variant2;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Sanctum::actingAs($this->user);
        
        // 創建門市
        $this->store1 = Store::factory()->create(['id' => 1]);
        $this->store2 = Store::factory()->create(['id' => 2]);
        
        // 創建產品和變體
        $product = Product::factory()->create();
        $this->variant1 = ProductVariant::factory()->for($product)->create();
        $this->variant2 = ProductVariant::factory()->for($product)->create();
        
        // 創建庫存
        Inventory::factory()->create([
            'product_variant_id' => $this->variant1->id,
            'store_id' => $this->store1->id,
            'quantity' => 10
        ]);
        
        Inventory::factory()->create([
            'product_variant_id' => $this->variant2->id,
            'store_id' => $this->store1->id,
            'quantity' => 5
        ]);
        
        // 創建使用 trait 的測試服務類
        $this->testService = new class {
            use HandlesInventoryOperations, AuthenticationRequired;
        };
    }

    public function test_ensure_valid_store_id_returns_provided_store_id_when_valid()
    {
        $result = $this->callProtectedMethod($this->testService, 'ensureValidStoreId', [$this->store1->id]);
        
        $this->assertEquals($this->store1->id, $result);
    }

    public function test_ensure_valid_store_id_throws_exception_when_store_not_exists()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('門市ID 999 不存在');
        
        $this->callProtectedMethod($this->testService, 'ensureValidStoreId', [999]);
    }

    public function test_ensure_valid_store_id_returns_default_store_when_null()
    {
        $result = $this->callProtectedMethod($this->testService, 'ensureValidStoreId', [null]);
        
        $this->assertEquals($this->store1->id, $result); // 第一個門市作為預設
    }

    public function test_get_default_store_id_returns_first_store()
    {
        $result = $this->callProtectedMethod($this->testService, 'getDefaultStoreId');
        
        $this->assertEquals($this->store1->id, $result);
    }

    public function test_get_default_store_id_throws_exception_when_no_stores()
    {
        // 刪除所有門市
        Store::query()->delete();
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('系統中沒有任何門市，請先創建門市後再進行庫存操作');
        
        $this->callProtectedMethod($this->testService, 'getDefaultStoreId');
    }

    public function test_sort_ids_for_deadlock_prevention_sorts_ids_ascending()
    {
        $ids = [5, 1, 3, 2, 4];
        $result = $this->callProtectedMethod($this->testService, 'sortIdsForDeadlockPrevention', [$ids]);
        
        $this->assertEquals([1, 2, 3, 4, 5], $result);
    }

    public function test_sort_ids_for_deadlock_prevention_handles_empty_array()
    {
        $result = $this->callProtectedMethod($this->testService, 'sortIdsForDeadlockPrevention', [[]]);
        
        $this->assertEquals([], $result);
    }

    public function test_sort_ids_for_deadlock_prevention_handles_single_id()
    {
        $result = $this->callProtectedMethod($this->testService, 'sortIdsForDeadlockPrevention', [[42]]);
        
        $this->assertEquals([42], $result);
    }

    public function test_get_product_variants_sorted_returns_variants_in_specified_order()
    {
        $variantIds = [$this->variant2->id, $this->variant1->id];
        $result = $this->callProtectedMethod($this->testService, 'getProductVariantsSorted', [$variantIds]);
        
        $this->assertCount(2, $result);
        // 結果應該按照排序後的ID順序返回
        $sortedIds = [$this->variant1->id, $this->variant2->id];
        sort($sortedIds);
        $this->assertEquals($sortedIds[0], $result->first()->id);
    }

    public function test_get_product_variants_sorted_handles_empty_array()
    {
        $result = $this->callProtectedMethod($this->testService, 'getProductVariantsSorted', [[]]);
        
        $this->assertCount(0, $result);
    }

    public function test_validate_inventory_permission_passes_with_authenticated_user()
    {
        // 應該不拋出異常
        $this->callProtectedMethod($this->testService, 'validateInventoryPermission', [$this->store1->id]);
        
        $this->assertTrue(true); // 如果沒有拋出異常則測試通過
    }

    public function test_validate_inventory_permission_with_custom_operation()
    {
        // 測試自定義操作描述
        $this->callProtectedMethod($this->testService, 'validateInventoryPermission', [$this->store1->id, '測試操作']);
        
        $this->assertTrue(true);
    }

    public function test_format_inventory_results_formats_results_correctly()
    {
        $results = [
            [
                'product_variant_id' => 1,
                'quantity_changed' => 5,
                'new_quantity' => 15,
                'success' => true,
                'message' => '庫存增加成功'
            ],
            [
                'product_variant_id' => 2,
                'quantity_changed' => -3,
                'new_quantity' => 2,
                'success' => true
            ]
        ];
        
        $formatted = $this->callProtectedMethod($this->testService, 'formatInventoryResults', [$results]);
        
        $this->assertCount(2, $formatted);
        $this->assertEquals(1, $formatted[0]['product_variant_id']);
        $this->assertEquals(5, $formatted[0]['quantity_changed']);
        $this->assertEquals(15, $formatted[0]['new_quantity']);
        $this->assertTrue($formatted[0]['success']);
        $this->assertEquals('庫存增加成功', $formatted[0]['message']);
        $this->assertArrayHasKey('timestamp', $formatted[0]);
    }

    public function test_format_inventory_results_handles_missing_fields()
    {
        $results = [
            ['product_variant_id' => 1]
        ];
        
        $formatted = $this->callProtectedMethod($this->testService, 'formatInventoryResults', [$results]);
        
        $this->assertEquals(1, $formatted[0]['product_variant_id']);
        $this->assertEquals(0, $formatted[0]['quantity_changed']);
        $this->assertEquals(0, $formatted[0]['new_quantity']);
        $this->assertFalse($formatted[0]['success']);
        $this->assertEquals('', $formatted[0]['message']);
    }

    public function test_check_stock_availability_returns_correct_availability_info()
    {
        $items = [
            ['product_variant_id' => $this->variant1->id, 'quantity' => 8], // 庫存10，足夠
            ['product_variant_id' => $this->variant2->id, 'quantity' => 7], // 庫存5，不足
        ];
        
        $result = $this->callProtectedMethod($this->testService, 'checkStockAvailability', [$items, $this->store1->id]);
        
        $this->assertCount(2, $result);
        
        // 第一個項目，庫存充足
        $this->assertEquals($this->variant1->id, $result[0]['product_variant_id']);
        $this->assertEquals(8, $result[0]['required_quantity']);
        $this->assertEquals(10, $result[0]['available_quantity']);
        $this->assertTrue($result[0]['sufficient']);
        $this->assertEquals(0, $result[0]['shortage']);
        
        // 第二個項目，庫存不足
        $this->assertEquals($this->variant2->id, $result[1]['product_variant_id']);
        $this->assertEquals(7, $result[1]['required_quantity']);
        $this->assertEquals(5, $result[1]['available_quantity']);
        $this->assertFalse($result[1]['sufficient']);
        $this->assertEquals(2, $result[1]['shortage']);
    }

    public function test_check_stock_availability_uses_default_store_when_null()
    {
        $items = [
            ['product_variant_id' => $this->variant1->id, 'quantity' => 5]
        ];
        
        $result = $this->callProtectedMethod($this->testService, 'checkStockAvailability', [$items, null]);
        
        $this->assertCount(1, $result);
        $this->assertEquals(10, $result[0]['available_quantity']); // 預設門市的庫存
    }

    public function test_check_stock_availability_handles_non_existent_inventory()
    {
        $variant3 = ProductVariant::factory()->for(Product::factory()->create())->create();
        
        $items = [
            ['product_variant_id' => $variant3->id, 'quantity' => 5]
        ];
        
        $result = $this->callProtectedMethod($this->testService, 'checkStockAvailability', [$items, $this->store1->id]);
        
        $this->assertCount(1, $result);
        $this->assertEquals($variant3->id, $result[0]['product_variant_id']);
        $this->assertEquals(5, $result[0]['required_quantity']);
        $this->assertEquals(0, $result[0]['available_quantity']);
        $this->assertFalse($result[0]['sufficient']);
        $this->assertEquals(5, $result[0]['shortage']);
    }

    public function test_check_stock_availability_handles_empty_items()
    {
        $result = $this->callProtectedMethod($this->testService, 'checkStockAvailability', [[], $this->store1->id]);
        
        $this->assertEquals([], $result);
    }

    public function test_check_stock_availability_throws_exception_for_invalid_store()
    {
        $items = [
            ['product_variant_id' => $this->variant1->id, 'quantity' => 5]
        ];
        
        $this->expectException(\InvalidArgumentException::class);
        
        $this->callProtectedMethod($this->testService, 'checkStockAvailability', [$items, 999]);
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