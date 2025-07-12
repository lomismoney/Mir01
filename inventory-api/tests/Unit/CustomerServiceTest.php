<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\CustomerService;
use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * CustomerService 單元測試
 * 
 * 測試客戶服務層的各項功能，包括：
 * - 客戶創建和地址管理
 * - 預設地址邏輯處理
 * - 數據完整性驗證
 */
class CustomerServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @var CustomerService
     */
    protected $customerService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->customerService = new CustomerService();
    }

    /**
     * 測試創建個人客戶
     */
    public function test_create_individual_customer()
    {
        $data = [
            'name' => '測試客戶',
            'phone' => '0912345678',
            'is_company' => false,
            'industry_type' => 'technology',
            'payment_type' => 'cash',
            'contact_address' => '台北市信義區測試路100號',
        ];

        $customer = $this->customerService->createCustomer($data);

        $this->assertInstanceOf(Customer::class, $customer);
        $this->assertEquals('測試客戶', $customer->name);
        $this->assertEquals('0912345678', $customer->phone);
        $this->assertFalse($customer->is_company);
        $this->assertEquals('technology', $customer->industry_type);
        $this->assertEquals('cash', $customer->payment_type);
        $this->assertEquals(0, $customer->total_unpaid_amount);
        $this->assertEquals(0, $customer->total_completed_amount);
    }

    /**
     * 測試創建公司客戶
     */
    public function test_create_company_customer()
    {
        $data = [
            'name' => '測試公司',
            'phone' => '0223456789',
            'is_company' => true,
            'tax_id' => '12345678',
            'industry_type' => 'retail',
            'payment_type' => 'credit',
            'contact_address' => '台中市西屯區公司路200號',
        ];

        $customer = $this->customerService->createCustomer($data);

        $this->assertInstanceOf(Customer::class, $customer);
        $this->assertEquals('測試公司', $customer->name);
        $this->assertTrue($customer->is_company);
        $this->assertEquals('12345678', $customer->tax_id);
    }

    /**
     * 測試創建客戶時同時創建地址
     */
    public function test_create_customer_with_addresses()
    {
        $data = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => 'technology',
            'payment_type' => 'cash',
            'addresses' => [
                [
                    'address' => '台北市信義區地址一',
                    'is_default' => true,
                ],
                [
                    'address' => '台北市大安區地址二',
                    'is_default' => false,
                ],
            ],
        ];

        $customer = $this->customerService->createCustomer($data);

        $this->assertEquals(2, $customer->addresses->count());
        $this->assertEquals('台北市信義區地址一', $customer->addresses[0]->address);
        $this->assertTrue($customer->addresses[0]->is_default);
        $this->assertEquals('台北市大安區地址二', $customer->addresses[1]->address);
        $this->assertFalse($customer->addresses[1]->is_default);
    }

    /**
     * 測試自動設定第一個地址為預設地址
     */
    public function test_auto_set_first_address_as_default()
    {
        $data = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => 'technology',
            'payment_type' => 'cash',
            'addresses' => [
                [
                    'address' => '台北市信義區地址一',
                    'is_default' => false,
                ],
                [
                    'address' => '台北市大安區地址二',
                    'is_default' => false,
                ],
            ],
        ];

        $customer = $this->customerService->createCustomer($data);

        // 確認第一個地址被自動設為預設
        $this->assertTrue($customer->addresses[0]->is_default);
        $this->assertFalse($customer->addresses[1]->is_default);
    }

    /**
     * 測試處理多個預設地址的情況
     */
    public function test_handle_multiple_default_addresses()
    {
        $data = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => 'technology',
            'payment_type' => 'cash',
            'addresses' => [
                [
                    'address' => '台北市信義區地址一',
                    'is_default' => true,
                ],
                [
                    'address' => '台北市大安區地址二',
                    'is_default' => true,
                ],
                [
                    'address' => '台北市中山區地址三',
                    'is_default' => true,
                ],
            ],
        ];

        $customer = $this->customerService->createCustomer($data);

        // 確認只有最後一個預設地址保留為預設
        $defaultAddresses = $customer->addresses->where('is_default', true);
        $this->assertEquals(1, $defaultAddresses->count());
        $this->assertEquals('台北市中山區地址三', $defaultAddresses->last()->address);
    }

    /**
     * 測試更新客戶基本資料
     */
    public function test_update_customer_basic_info()
    {
        $customer = Customer::factory()->create([
            'name' => '原始名稱',
            'phone' => '0912345678',
        ]);

        $updateData = [
            'name' => '更新後名稱',
            'phone' => '0987654321',
            'contact_address' => '新的聯絡地址',
        ];

        $updatedCustomer = $this->customerService->updateCustomer($customer, $updateData);

        $this->assertEquals('更新後名稱', $updatedCustomer->name);
        $this->assertEquals('0987654321', $updatedCustomer->phone);
        $this->assertEquals('新的聯絡地址', $updatedCustomer->contact_address);
    }

    /**
     * 測試同步地址：新增、更新、刪除
     */
    public function test_sync_addresses()
    {
        // 創建客戶和初始地址
        $customer = Customer::factory()->create();
        $address1 = CustomerAddress::factory()->create([
            'customer_id' => $customer->id,
            'address' => '初始地址一',
            'is_default' => true,
        ]);
        $address2 = CustomerAddress::factory()->create([
            'customer_id' => $customer->id,
            'address' => '初始地址二',
            'is_default' => false,
        ]);

        $updateData = [
            'addresses' => [
                [
                    'id' => $address1->id,
                    'address' => '更新後的地址一',
                    'is_default' => false,
                ],
                [
                    'address' => '新增的地址三',
                    'is_default' => true,
                ],
                // address2 不在列表中，應該被刪除
            ],
        ];

        $updatedCustomer = $this->customerService->updateCustomer($customer, $updateData);

        // 驗證地址數量
        $this->assertEquals(2, $updatedCustomer->addresses->count());

        // 驗證地址更新
        $updatedAddress1 = $updatedCustomer->addresses->find($address1->id);
        $this->assertEquals('更新後的地址一', $updatedAddress1->address);
        $this->assertFalse($updatedAddress1->is_default);

        // 驗證新增地址
        $newAddress = $updatedCustomer->addresses->where('address', '新增的地址三')->first();
        $this->assertNotNull($newAddress);
        $this->assertTrue($newAddress->is_default);

        // 驗證地址刪除
        $this->assertNull($updatedCustomer->addresses->find($address2->id));
    }

    /**
     * 測試驗證客戶資料完整性 - 個人客戶
     */
    public function test_validate_individual_customer_integrity()
    {
        $customer = Customer::factory()->create([
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => 'technology',
            'payment_type' => 'cash',
        ]);

        $result = $this->customerService->validateCustomerIntegrity($customer);

        $this->assertTrue($result['is_valid']);
        $this->assertEmpty($result['issues']);
    }

    /**
     * 測試驗證客戶資料完整性 - 公司客戶缺少統編
     */
    public function test_validate_company_customer_without_tax_id()
    {
        $customer = Customer::factory()->create([
            'name' => '測試公司',
            'is_company' => true,
            'tax_id' => null,
            'industry_type' => 'retail',
            'payment_type' => 'credit',
        ]);

        $result = $this->customerService->validateCustomerIntegrity($customer);

        $this->assertFalse($result['is_valid']);
        $this->assertContains('公司客戶必須有統一編號', $result['issues']);
    }

    /**
     * 測試驗證客戶資料完整性 - 多個預設地址
     */
    public function test_validate_customer_with_multiple_default_addresses()
    {
        $customer = Customer::factory()->create();
        CustomerAddress::factory()->count(3)->create([
            'customer_id' => $customer->id,
            'is_default' => true,
        ]);

        $result = $this->customerService->validateCustomerIntegrity($customer);

        $this->assertFalse($result['is_valid']);
        $this->assertContains('客戶有多個預設地址', $result['issues']);
    }

    /**
     * 測試交易回滾
     */
    public function test_transaction_rollback_on_error()
    {
        // 模擬創建客戶時發生錯誤
        DB::shouldReceive('transaction')->andThrow(new \Exception('測試錯誤'));

        $data = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => 'technology',
            'payment_type' => 'cash',
        ];

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('測試錯誤');

        $this->customerService->createCustomer($data);
        
        // 確認沒有客戶被創建
        $this->assertEquals(0, Customer::count());
    }

    /**
     * 測試日誌記錄
     */
    public function test_logging_on_customer_creation()
    {
        Log::shouldReceive('info')
            ->with('開始創建客戶', \Mockery::any())
            ->once();
        
        Log::shouldReceive('info')
            ->with('客戶主體創建成功', \Mockery::any())
            ->once();
        
        Log::shouldReceive('info')
            ->with('客戶創建完成', \Mockery::any())
            ->once();

        $data = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => 'technology',
            'payment_type' => 'cash',
        ];

        $this->customerService->createCustomer($data);
    }

    /**
     * 測試創建客戶時地址數據處理
     */
    public function test_create_customer_without_addresses()
    {
        $data = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => 'technology',
            'payment_type' => 'cash',
        ];

        $customer = $this->customerService->createCustomer($data);

        $this->assertEquals(0, $customer->addresses->count());
    }

    /**
     * 測試更新客戶時保留地址不變
     */
    public function test_update_customer_without_changing_addresses()
    {
        $customer = Customer::factory()->create();
        $address = CustomerAddress::factory()->create([
            'customer_id' => $customer->id,
            'address' => '原始地址',
            'is_default' => true,
        ]);

        $updateData = [
            'name' => '更新後的名稱',
            // 不包含 addresses 陣列
        ];

        $updatedCustomer = $this->customerService->updateCustomer($customer, $updateData);

        // 驗證地址沒有被改變
        $this->assertEquals(1, $updatedCustomer->addresses->count());
        $this->assertEquals('原始地址', $updatedCustomer->addresses->first()->address);
    }

    /**
     * 測試驗證客戶完整性 - 缺少必要欄位
     */
    public function test_validate_customer_missing_required_fields()
    {
        // 先創建一個有效的客戶
        $customer = Customer::factory()->create([
            'name' => '測試客戶',
            'industry_type' => 'technology',
            'payment_type' => 'cash',
        ]);
        
        // 然後修改欄位為空值來測試驗證
        $customer->name = '';
        $customer->industry_type = null;
        $customer->payment_type = null;

        $result = $this->customerService->validateCustomerIntegrity($customer);

        $this->assertFalse($result['is_valid']);
        $this->assertContains('客戶姓名不能為空', $result['issues']);
        $this->assertContains('行業別不能為空', $result['issues']);
        $this->assertContains('付款類別不能為空', $result['issues']);
    }
}