<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\User;
use App\Policies\CategoryPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryPolicyTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $staff;
    private User $viewer;
    private Category $category;
    private CategoryPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        
        $this->staff = User::factory()->create();
        $this->staff->assignRole('staff');
        
        $this->viewer = User::factory()->create();
        $this->viewer->assignRole('viewer');
        $this->category = Category::factory()->create();
        $this->policy = new CategoryPolicy();
    }

    public function test_all_users_can_view_any_categories()
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->viewer));
    }
    
    public function test_all_users_can_view_category()
    {
        $this->assertTrue($this->policy->view($this->admin, $this->category));
        $this->assertTrue($this->policy->view($this->staff, $this->category));
        $this->assertTrue($this->policy->view($this->viewer, $this->category));
    }

    public function test_admin_can_create_category()
    {
        $this->assertTrue($this->policy->create($this->admin));
    }

    public function test_staff_and_viewer_cannot_create_category()
    {
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->create($this->viewer));
    }

    public function test_admin_can_update_category()
    {
        $this->assertTrue($this->policy->update($this->admin, $this->category));
    }

    public function test_staff_and_viewer_cannot_update_category()
    {
        $this->assertFalse($this->policy->update($this->staff, $this->category));
        $this->assertFalse($this->policy->update($this->viewer, $this->category));
    }

    public function test_admin_can_delete_category()
    {
        $this->assertTrue($this->policy->delete($this->admin, $this->category));
    }

    public function test_staff_and_viewer_cannot_delete_category()
    {
        $this->assertFalse($this->policy->delete($this->staff, $this->category));
        $this->assertFalse($this->policy->delete($this->viewer, $this->category));
    }

    public function test_admin_can_restore_category()
    {
        $this->assertTrue($this->policy->restore($this->admin, $this->category));
    }

    public function test_staff_and_viewer_cannot_restore_category()
    {
        $this->assertFalse($this->policy->restore($this->staff, $this->category));
        $this->assertFalse($this->policy->restore($this->viewer, $this->category));
    }
    
    public function test_admin_can_force_delete_category()
    {
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->category));
    }

    public function test_staff_and_viewer_cannot_force_delete_category()
    {
        $this->assertFalse($this->policy->forceDelete($this->staff, $this->category));
        $this->assertFalse($this->policy->forceDelete($this->viewer, $this->category));
    }
} 