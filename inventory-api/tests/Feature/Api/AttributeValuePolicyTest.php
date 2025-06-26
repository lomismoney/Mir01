<?php

namespace Tests\Feature\Api;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\User;
use App\Policies\AttributeValuePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttributeValuePolicyTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $staff;
    private User $viewer;
    private AttributeValue $attributeValue;
    private AttributeValuePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        
        $this->staff = User::factory()->create();
        $this->staff->assignRole('staff');
        
        $this->viewer = User::factory()->create();
        $this->viewer->assignRole('viewer');
        $attribute = Attribute::factory()->create();
        $this->attributeValue = AttributeValue::factory()->create(['attribute_id' => $attribute->id]);
        $this->policy = new AttributeValuePolicy();
    }

    public function test_admin_can_view_any_attribute_values()
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
    }

    public function test_staff_can_view_any_attribute_values()
    {
        $this->assertTrue($this->policy->viewAny($this->staff));
    }

    public function test_viewer_cannot_view_any_attribute_values()
    {
        $this->assertFalse($this->policy->viewAny($this->viewer));
    }
    
    public function test_admin_can_view_attribute_value()
    {
        $this->assertTrue($this->policy->view($this->admin, $this->attributeValue));
    }

    public function test_staff_can_view_attribute_value()
    {
        $this->assertTrue($this->policy->view($this->staff, $this->attributeValue));
    }

    public function test_viewer_cannot_view_attribute_value()
    {
        $this->assertFalse($this->policy->view($this->viewer, $this->attributeValue));
    }

    public function test_admin_can_create_attribute_value()
    {
        $this->assertTrue($this->policy->create($this->admin));
    }

    public function test_staff_cannot_create_attribute_value()
    {
        $this->assertFalse($this->policy->create($this->staff));
    }

    public function test_admin_can_update_attribute_value()
    {
        $this->assertTrue($this->policy->update($this->admin, $this->attributeValue));
    }

    public function test_staff_cannot_update_attribute_value()
    {
        $this->assertFalse($this->policy->update($this->staff, $this->attributeValue));
    }

    public function test_admin_can_delete_attribute_value()
    {
        $this->assertTrue($this->policy->delete($this->admin, $this->attributeValue));
    }

    public function test_staff_cannot_delete_attribute_value()
    {
        $this->assertFalse($this->policy->delete($this->staff, $this->attributeValue));
    }

    public function test_admin_can_restore_attribute_value()
    {
        $this->assertTrue($this->policy->restore($this->admin, $this->attributeValue));
    }

    public function test_staff_cannot_restore_attribute_value()
    {
        $this->assertFalse($this->policy->restore($this->staff, $this->attributeValue));
    }
    
    public function test_admin_can_force_delete_attribute_value()
    {
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->attributeValue));
    }

    public function test_staff_cannot_force_delete_attribute_value()
    {
        $this->assertFalse($this->policy->forceDelete($this->staff, $this->attributeValue));
    }
} 