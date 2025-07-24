<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Customer Model 單元測試
 * 
 * 測試客戶模型的基本功能，包括：
 * - 屬性設定與轉型
 * - 關聯關係
 * - 軟刪除功能
 */
class CustomerModelTest extends TestCase
{
    use RefreshDatabase;
    
    /**
     * 測試客戶有多個地址的關聯
     */
    public function test_customer_has_many_addresses()
    {
        $customer = Customer::factory()->create();
        $addresses = CustomerAddress::factory()->count(3)->create([
            'customer_id' => $customer->id
        ]);
        
        $this->assertCount(3, $customer->addresses);
        $this->assertInstanceOf(CustomerAddress::class, $customer->addresses->first());
    }
    
    /**
     * 測試客戶有預設地址的關聯
     */
    public function test_customer_has_default_address()
    {
        $customer = Customer::factory()->create();
        
        // 創建多個地址，其中一個是預設
        CustomerAddress::factory()->create([
            'customer_id' => $customer->id,
            'is_default' => false
        ]);
        
        $defaultAddress = CustomerAddress::factory()->create([
            'customer_id' => $customer->id,
            'is_default' => true
        ]);
        
        CustomerAddress::factory()->create([
            'customer_id' => $customer->id,
            'is_default' => false
        ]);
        
        $this->assertNotNull($customer->defaultAddress);
        $this->assertEquals($defaultAddress->id, $customer->defaultAddress->id);
        $this->assertTrue($customer->defaultAddress->is_default);
    }
    
    /**
     * 測試客戶沒有預設地址的情況
     */
    public function test_customer_has_no_default_address()
    {
        $customer = Customer::factory()->create();
        
        // 創建多個非預設地址
        CustomerAddress::factory()->count(2)->create([
            'customer_id' => $customer->id,
            'is_default' => false
        ]);
        
        $this->assertNull($customer->defaultAddress);
    }
    
    /**
     * 測試正確的可填充屬性
     */
    public function test_customer_has_correct_fillable_attributes()
    {
        $fillable = [
            'name',
            'phone',
            'email',
            'is_company',
            'tax_id',
            'industry_type',
            'payment_type',
            'contact_address',
            'total_unpaid_amount',
            'total_completed_amount',
            'priority_level',
            'is_priority_customer',
        ];
        
        $customer = new Customer();
        $this->assertEquals($fillable, $customer->getFillable());
    }
    
    /**
     * 測試正確的屬性轉型
     */
    public function test_customer_has_correct_casts()
    {
        $customer = new Customer();
        $casts = $customer->getCasts();
        
        $this->assertArrayHasKey('is_company', $casts);
        $this->assertEquals('boolean', $casts['is_company']);
        
        // 現在金額欄位使用整數（分為單位）
        $this->assertArrayHasKey('total_unpaid_amount', $casts);
        $this->assertEquals('integer', $casts['total_unpaid_amount']);
        
        $this->assertArrayHasKey('total_completed_amount', $casts);
        $this->assertEquals('integer', $casts['total_completed_amount']);
    }
    
    /**
     * 測試客戶可以被批量賦值創建
     */
    public function test_customer_can_be_created_with_mass_assignment()
    {
        $data = [
            'name' => '測試客戶',
            'phone' => '0912345678',
            'email' => 'test@example.com',
            'is_company' => true,
            'tax_id' => '12345678',
            'industry_type' => '科技業',
            'payment_type' => 'monthly',
            'contact_address' => '台北市信義區',
            'total_unpaid_amount' => 1000050, // 10000.50 元 = 1000050 分
            'total_completed_amount' => 5000000, // 50000.00 元 = 5000000 分
        ];
        
        $customer = Customer::create($data);
        
        $this->assertDatabaseHas('customers', [
            'name' => '測試客戶',
            'phone' => '0912345678',
            'email' => 'test@example.com',
        ]);
        
        $this->assertTrue($customer->is_company);
        $this->assertEquals(1000050, $customer->total_unpaid_amount);
        $this->assertEquals(5000000, $customer->total_completed_amount);
    }
    
    /**
     * 測試個人客戶（非公司）
     */
    public function test_individual_customer()
    {
        $customer = Customer::factory()->create([
            'is_company' => false,
            'tax_id' => null,
            'industry_type' => '個人', // industry_type 不能為 null
        ]);
        
        $this->assertFalse($customer->is_company);
        $this->assertNull($customer->tax_id);
        $this->assertEquals('個人', $customer->industry_type);
    }
    
    /**
     * 測試公司客戶
     */
    public function test_company_customer()
    {
        $customer = Customer::factory()->create([
            'is_company' => true,
            'tax_id' => '12345678',
            'industry_type' => '製造業',
        ]);
        
        $this->assertTrue($customer->is_company);
        $this->assertNotNull($customer->tax_id);
        $this->assertNotNull($customer->industry_type);
    }
    
    /**
     * 測試客戶使用 HasFactory trait
     */
    public function test_customer_uses_has_factory_trait()
    {
        $customer = Customer::factory()->make();
        $this->assertInstanceOf(Customer::class, $customer);
    }
    
    /**
     * 測試客戶使用軟刪除
     */
    public function test_customer_uses_soft_deletes()
    {
        $customer = Customer::factory()->create();
        $customerId = $customer->id;
        
        // 軟刪除客戶
        $customer->delete();
        
        // 驗證客戶被軟刪除
        $this->assertSoftDeleted('customers', ['id' => $customerId]);
        
        // 驗證仍可透過 withTrashed 查詢到
        $trashedCustomer = Customer::withTrashed()->find($customerId);
        $this->assertNotNull($trashedCustomer);
        $this->assertNotNull($trashedCustomer->deleted_at);
        
        // 驗證正常查詢查不到
        $this->assertNull(Customer::find($customerId));
    }
    
    /**
     * 測試恢復軟刪除的客戶
     */
    public function test_restore_soft_deleted_customer()
    {
        $customer = Customer::factory()->create();
        $customerId = $customer->id;
        
        // 軟刪除
        $customer->delete();
        $this->assertSoftDeleted('customers', ['id' => $customerId]);
        
        // 恢復
        $customer->restore();
        
        // 驗證客戶已恢復
        $restoredCustomer = Customer::find($customerId);
        $this->assertNotNull($restoredCustomer);
        $this->assertNull($restoredCustomer->deleted_at);
    }
    
    /**
     * 測試金額欄位的精度
     */
    public function test_amount_fields_precision()
    {
        $customer = Customer::factory()->create([
            'total_unpaid_amount' => 1234568, // 12345.68 元 = 1234568 分
            'total_completed_amount' => 9876543, // 98765.43 元 = 9876543 分
        ]);
        
        // 重新載入以確保從資料庫讀取
        $customer->refresh();
        
        // 驗證金額以分為單位存儲
        $this->assertEquals(1234568, $customer->total_unpaid_amount);
        $this->assertEquals(9876543, $customer->total_completed_amount);
    }
    
    /**
     * 測試電話號碼唯一性
     */
    public function test_phone_is_unique()
    {
        $customer1 = Customer::factory()->create(['phone' => '0912345678']);
        
        // 嘗試創建相同電話號碼的客戶應該失敗
        $this->expectException(\Illuminate\Database\QueryException::class);
        Customer::factory()->create(['phone' => '0912345678']);
    }
    
    /**
     * 測試可以有 null email
     */
    public function test_customer_can_have_null_email()
    {
        $customer = Customer::factory()->create(['email' => null]);
        
        $this->assertNull($customer->email);
        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'email' => null
        ]);
    }
    
    /**
     * 測試付款類型的各種值
     */
    public function test_payment_type_values()
    {
        $paymentTypes = ['cash', 'monthly', 'credit', 'transfer'];
        
        foreach ($paymentTypes as $type) {
            $customer = Customer::factory()->create(['payment_type' => $type]);
            $this->assertEquals($type, $customer->payment_type);
        }
    }
    
    /**
     * 測試客戶地址的級聯關係
     */
    public function test_customer_addresses_relationship_cascade()
    {
        $customer = Customer::factory()->create();
        $addresses = CustomerAddress::factory()->count(3)->create([
            'customer_id' => $customer->id
        ]);
        
        // 軟刪除客戶時，地址應該仍然存在（因為 CustomerAddress 沒有軟刪除）
        $customer->delete();
        
        foreach ($addresses as $address) {
            // CustomerAddress 沒有 deleted_at 欄位，所以只檢查記錄是否存在
            $this->assertDatabaseHas('customer_addresses', [
                'id' => $address->id,
                'customer_id' => $customer->id
            ]);
        }
    }

    /**
     * 測試 HandlesCurrency trait 功能
     */
    public function test_currency_handling()
    {
        $customer = Customer::factory()->create([
            'total_unpaid_amount' => 99999, // 999.99 元 = 99999 分
            'total_completed_amount' => 500050 // 5000.50 元 = 500050 分
        ]);
        
        // 驗證金額正確儲存為分
        $this->assertEquals(99999, $customer->total_unpaid_amount_cents);
        $this->assertEquals(500050, $customer->total_completed_amount_cents);
        
        // 驗證原始金額值（現在以分為單位）
        $this->assertEquals(99999, $customer->total_unpaid_amount);
        $this->assertEquals(500050, $customer->total_completed_amount);
    }

    /**
     * 測試 HandlesCurrency trait 的轉換方法
     */
    public function test_currency_conversion_methods()
    {
        // 測試 yuanToCents
        $this->assertEquals(0, Customer::yuanToCents(null));
        $this->assertEquals(0, Customer::yuanToCents(0));
        $this->assertEquals(100, Customer::yuanToCents(1));
        $this->assertEquals(99999, Customer::yuanToCents(999.99));
        
        // 測試 centsToYuan
        $this->assertEquals(0.00, Customer::centsToYuan(0));
        $this->assertEquals(1.00, Customer::centsToYuan(100));
        $this->assertEquals(999.99, Customer::centsToYuan(99999));
    }

    /**
     * 測試更新客戶金額
     */
    public function test_update_customer_amounts()
    {
        $customer = Customer::factory()->create([
            'total_unpaid_amount' => 10000, // 100.00 元 = 10000 分
            'total_completed_amount' => 20000 // 200.00 元 = 20000 分
        ]);
        
        // 更新金額（以分為單位）
        $customer->update([
            'total_unpaid_amount' => 15050, // 150.50 元 = 15050 分
            'total_completed_amount' => 35075 // 350.75 元 = 35075 分
        ]);
        
        // 驗證更新後的值
        $customer->refresh();
        $this->assertEquals(15050, $customer->total_unpaid_amount_cents);
        $this->assertEquals(35075, $customer->total_completed_amount_cents);
        $this->assertEquals(15050, $customer->total_unpaid_amount);
        $this->assertEquals(35075, $customer->total_completed_amount);
    }
}