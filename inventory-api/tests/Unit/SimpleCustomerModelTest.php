<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\Customer;
use PHPUnit\Framework\Attributes\Test;

class SimpleCustomerModelTest extends TestCase
{
    #[Test]
    public function customer_has_correct_fillable_attributes()
    {
        $expected = [
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
        $this->assertEquals($expected, $customer->getFillable());
    }

    #[Test]
    public function customer_has_correct_casts()
    {
        $customer = new Customer();
        $expectedCasts = [
            'is_company' => 'boolean',
            'is_priority_customer' => 'boolean',
            'total_unpaid_amount' => 'integer',
            'total_completed_amount' => 'integer',
        ];
        
        foreach ($expectedCasts as $key => $expectedType) {
            $this->assertArrayHasKey($key, $customer->getCasts());
            $this->assertEquals($expectedType, $customer->getCasts()[$key]);
        }
    }

    #[Test]
    public function customer_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(Customer::class)));
    }
}