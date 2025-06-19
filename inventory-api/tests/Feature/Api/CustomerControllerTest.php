<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;

class CustomerControllerTest extends TestCase
{
    use WithFaker, RefreshDatabase;

    /** @test */
    public function admin_can_get_customers_list()
    {
        // 創建測試客戶
        $customer1 = Customer::factory()->create(['name' => '測試客戶A']);
        $customer2 = Customer::factory()->create(['name' => '測試客戶B']);
        
        // 創建預設地址
        CustomerAddress::factory()->create([
            'customer_id' => $customer1->id,
            'is_default' => true
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/customers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'phone',
                        'is_company',
                        'industry_type',
                        'payment_type',
                        'default_address'
                    ]
                ],
                'links',
                'meta'
            ]);
    }

    /** @test */
    public function admin_can_search_customers_by_name()
    {
        // 創建測試客戶
        $customer1 = Customer::factory()->create(['name' => '測試設計公司']);
        $customer2 = Customer::factory()->create(['name' => '其他客戶']);

        $response = $this->actingAsAdmin()
            ->getJson('/api/customers?search=設計');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', '測試設計公司');
    }

    /** @test */
    public function admin_can_search_customers_by_phone()
    {
        // 創建測試客戶
        $customer1 = Customer::factory()->create(['phone' => '0987654321']);
        $customer2 = Customer::factory()->create(['phone' => '0912345678']);

        $response = $this->actingAsAdmin()
            ->getJson('/api/customers?search=0987');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.phone', '0987654321');
    }

    /** @test */
    public function admin_can_filter_customers_by_date_range()
    {
        // 創建不同日期的客戶
        $oldCustomer = Customer::factory()->create([
            'name' => '老客戶',
            'created_at' => now()->subDays(30)
        ]);
        
        $newCustomer = Customer::factory()->create([
            'name' => '新客戶',
            'created_at' => now()->subDays(5)
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/customers?start_date=' . now()->subDays(10)->format('Y-m-d'));

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', '新客戶');
    }

    /** @test */
    public function admin_can_create_individual_customer()
    {
        $customerData = [
            'name' => '測試個人客戶',
            'phone' => '0987654321',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'contact_address' => '台北市信義區',
            'addresses' => [
                [
                    'address' => '台北市大安區忠孝東路',
                    'is_default' => true
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/customers', $customerData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'phone',
                    'is_company',
                    'industry_type',
                    'payment_type',
                    'contact_address',
                    'addresses' => [
                        '*' => [
                            'id',
                            'address',
                            'is_default'
                        ]
                    ]
                ]
            ]);

        // 驗證數據庫記錄
        $this->assertDatabaseHas('customers', [
            'name' => '測試個人客戶',
            'phone' => '0987654321',
            'is_company' => false
        ]);

        $this->assertDatabaseHas('customer_addresses', [
            'address' => '台北市大安區忠孝東路',
            'is_default' => true
        ]);
    }

    /** @test */
    public function admin_can_create_company_customer()
    {
        $customerData = [
            'name' => '測試科技公司',
            'phone' => '02-12345678',
            'is_company' => true,
            'tax_id' => '12345678',
            'industry_type' => '科技業',
            'payment_type' => '月結30天',
            'contact_address' => '台北市內湖區'
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/customers', $customerData);

        $response->assertStatus(201);

        // 驗證數據庫記錄
        $this->assertDatabaseHas('customers', [
            'name' => '測試科技公司',
            'is_company' => true,
            'tax_id' => '12345678'
        ]);
    }

    /** @test */
    public function customer_creation_validates_required_fields()
    {
        $response = $this->actingAsAdmin()
            ->postJson('/api/customers', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'is_company', 'industry_type', 'payment_type']);
    }

    /** @test */
    public function company_customer_requires_tax_id()
    {
        $customerData = [
            'name' => '測試公司',
            'is_company' => true,
            'industry_type' => '製造業',
            'payment_type' => '現金'
            // 缺少 tax_id
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/customers', $customerData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tax_id']);
    }

    /** @test */
    public function phone_number_must_be_unique()
    {
        // 創建已存在的客戶
        Customer::factory()->create(['phone' => '0987654321']);

        $customerData = [
            'name' => '測試客戶',
            'phone' => '0987654321', // 重複的電話
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金'
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/customers', $customerData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    /** @test */
    public function tax_id_must_be_unique()
    {
        // 創建已存在的公司客戶
        Customer::factory()->create([
            'is_company' => true,
            'tax_id' => '12345678'
        ]);

        $customerData = [
            'name' => '測試公司',
            'is_company' => true,
            'tax_id' => '12345678', // 重複的統一編號
            'industry_type' => '製造業',
            'payment_type' => '現金'
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/customers', $customerData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tax_id']);
    }

    /** @test */
    public function admin_can_view_customer_details()
    {
        $customer = Customer::factory()->create();
        $address = CustomerAddress::factory()->create([
            'customer_id' => $customer->id,
            'is_default' => true
        ]);

        $response = $this->actingAsAdmin()
            ->getJson("/api/customers/{$customer->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'phone',
                    'is_company',
                    'industry_type',
                    'payment_type',
                    'addresses' => [
                        '*' => [
                            'id',
                            'address',
                            'is_default'
                        ]
                    ],
                    'default_address'
                ]
            ]);
    }

    /** @test */
    public function admin_can_update_customer()
    {
        $customer = Customer::factory()->create(['name' => '原始名稱']);

        $updateData = [
            'name' => '更新後的名稱',
            'phone' => '0987654321',
            'is_company' => false,
            'industry_type' => '更新行業',
            'payment_type' => '更新付款方式',
            'contact_address' => '更新地址'
        ];

        $response = $this->actingAsAdmin()
            ->putJson("/api/customers/{$customer->id}", $updateData);

        $response->assertStatus(200);

        // 驗證數據庫更新
        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'name' => '更新後的名稱',
            'phone' => '0987654321'
        ]);
    }

    /** @test */
    public function admin_can_update_customer_with_addresses()
    {
        $customer = Customer::factory()->create();
        $existingAddress = CustomerAddress::factory()->create([
            'customer_id' => $customer->id,
            'address' => '原始地址',
            'is_default' => true
        ]);

        $updateData = [
            'name' => '更新客戶',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金',
            'addresses' => [
                [
                    'id' => $existingAddress->id,
                    'address' => '更新後的地址',
                    'is_default' => true
                ],
                [
                    'address' => '新增地址',
                    'is_default' => false
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->putJson("/api/customers/{$customer->id}", $updateData);

        $response->assertStatus(200);

        // 驗證地址更新和新增
        $this->assertDatabaseHas('customer_addresses', [
            'id' => $existingAddress->id,
            'address' => '更新後的地址'
        ]);

        $this->assertDatabaseHas('customer_addresses', [
            'customer_id' => $customer->id,
            'address' => '新增地址',
            'is_default' => false
        ]);
    }

    /** @test */
    public function admin_can_delete_customer()
    {
        $customer = Customer::factory()->create();

        $response = $this->actingAsAdmin()
            ->deleteJson("/api/customers/{$customer->id}");

        $response->assertStatus(204);

        // 驗證軟刪除
        $this->assertSoftDeleted('customers', [
            'id' => $customer->id
        ]);
    }

    /** @test */
    public function staff_user_can_view_customers()
    {
        Customer::factory()->count(3)->create();

        $response = $this->actingAsUser()
            ->getJson('/api/customers');

        $response->assertStatus(200);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_customers()
    {
        $response = $this->getJson('/api/customers');

        $response->assertStatus(401);
    }

    /** @test */
    public function customer_creation_ensures_single_default_address()
    {
        $customerData = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金',
            'addresses' => [
                [
                    'address' => '地址1',
                    'is_default' => true
                ],
                [
                    'address' => '地址2',
                    'is_default' => true // 兩個都設為預設
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/customers', $customerData);

        $response->assertStatus(201);

        // 驗證只有一個預設地址
        $customer = Customer::latest()->first();
        $defaultAddressCount = $customer->addresses()->where('is_default', true)->count();
        
        $this->assertEquals(1, $defaultAddressCount);
    }

    /** @test */
    public function customer_creation_sets_first_address_as_default_when_none_specified()
    {
        $customerData = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金',
            'addresses' => [
                [
                    'address' => '地址1',
                    'is_default' => false
                ],
                [
                    'address' => '地址2',
                    'is_default' => false
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/customers', $customerData);

        $response->assertStatus(201);

        // 驗證第一個地址被設為預設
        $customer = Customer::latest()->first();
        $firstAddress = $customer->addresses()->orderBy('id')->first();
        
        $this->assertTrue($firstAddress->is_default);
    }

    /** @test */
    public function date_range_validation_works()
    {
        $response = $this->actingAsAdmin()
            ->getJson('/api/customers?start_date=2025-12-31&end_date=2025-01-01');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['end_date']);
    }

    protected function actingAsAdmin()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        return $this->actingAs($admin, 'sanctum');
    }

    protected function actingAsUser()
    {
        $user = User::factory()->create(['role' => 'staff']);
        return $this->actingAs($user, 'sanctum');
    }
} 