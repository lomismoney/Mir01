<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class CustomerAddressModelTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function customer_address_belongs_to_customer()
    {
        $customer = Customer::factory()->create();
        $address = CustomerAddress::factory()->create(['customer_id' => $customer->id]);

        $this->assertInstanceOf(Customer::class, $address->customer);
        $this->assertEquals($customer->id, $address->customer->id);
    }

    #[Test]
    public function customer_address_has_correct_fillable_attributes()
    {
        $address = new CustomerAddress();
        $fillable = ['customer_id', 'address', 'is_default'];
        
        $this->assertEquals($fillable, $address->getFillable());
    }

    #[Test]
    public function customer_address_has_correct_casts()
    {
        $address = new CustomerAddress();
        $casts = $address->getCasts();
        
        $this->assertArrayHasKey('is_default', $casts);
        $this->assertEquals('boolean', $casts['is_default']);
    }

    #[Test]
    public function customer_address_can_be_set_as_default()
    {
        $customer = Customer::factory()->create();
        
        $address1 = CustomerAddress::factory()->create([
            'customer_id' => $customer->id,
            'is_default' => false,
        ]);
        
        $address2 = CustomerAddress::factory()->create([
            'customer_id' => $customer->id,
            'is_default' => true,
        ]);

        $this->assertFalse($address1->is_default);
        $this->assertTrue($address2->is_default);
        $this->assertIsBool($address2->is_default);
    }

    #[Test]
    public function customer_address_can_be_created_with_mass_assignment()
    {
        $customer = Customer::factory()->create();
        
        $data = [
            'customer_id' => $customer->id,
            'address' => '台北市信義區信義路五段7號',
            'is_default' => true,
        ];

        $address = CustomerAddress::create($data);

        $this->assertDatabaseHas('customer_addresses', [
            'customer_id' => $customer->id,
            'address' => '台北市信義區信義路五段7號',
            'is_default' => true,
        ]);
    }

    #[Test]
    public function only_one_default_address_per_customer()
    {
        $customer = Customer::factory()->create();
        
        // 創建多個地址
        $addresses = CustomerAddress::factory()->count(3)->create([
            'customer_id' => $customer->id,
            'is_default' => false,
        ]);
        
        // 設定一個為預設
        $addresses[0]->update(['is_default' => true]);
        
        // 重新載入並檢查
        $defaultAddresses = CustomerAddress::where('customer_id', $customer->id)
            ->where('is_default', true)
            ->get();
            
        $this->assertCount(1, $defaultAddresses);
        $this->assertEquals($addresses[0]->id, $defaultAddresses->first()->id);
    }

    #[Test]
    public function customer_address_uses_has_factory_trait()
    {
        $address = CustomerAddress::factory()->make();
        
        $this->assertInstanceOf(CustomerAddress::class, $address);
        $this->assertNotNull($address->address);
    }
} 