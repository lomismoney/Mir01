<?php

namespace Tests\Unit;

use App\Http\Resources\Api\UserCollection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Tests\TestCase;

class UserCollectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_collection_transforms_data_correctly()
    {
        // 建立測試用戶
        $adminUser = User::factory()->create();
        $adminUser->assignRole('admin');
        $viewerUser1 = User::factory()->create();
        $viewerUser1->assignRole('viewer');
        $viewerUser2 = User::factory()->create();
        $viewerUser2->assignRole('viewer');

        $users = collect([$adminUser, $viewerUser1, $viewerUser2]);
        
        // 建立 UserCollection
        $collection = new UserCollection($users);
        $request = new Request();
        
        $result = $collection->toArray($request);
        
        // 驗證資料結構
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('meta', $result);
        
        // 驗證資料內容
        $this->assertCount(3, $result['data']);
        $this->assertEquals(3, $result['meta']['total']);
        
        // 驗證角色統計
        $this->assertEquals(1, $result['meta']['roles']['admin_count']);
        $this->assertEquals(2, $result['meta']['roles']['viewer_count']);
    }

    public function test_user_collection_handles_empty_collection()
    {
        $emptyUsers = collect([]);
        
        $collection = new UserCollection($emptyUsers);
        $request = new Request();
        
        $result = $collection->toArray($request);
        
        // 驗證空集合處理
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('meta', $result);
        $this->assertCount(0, $result['data']);
        $this->assertEquals(0, $result['meta']['total']);
        $this->assertEquals(0, $result['meta']['roles']['admin_count']);
        $this->assertEquals(0, $result['meta']['roles']['viewer_count']);
    }

    public function test_user_collection_handles_only_admin_users()
    {
        $adminUser1 = User::factory()->create();
        $adminUser1->assignRole('admin');
        $adminUser2 = User::factory()->create();
        $adminUser2->assignRole('admin');

        $users = collect([$adminUser1, $adminUser2]);
        
        $collection = new UserCollection($users);
        $request = new Request();
        
        $result = $collection->toArray($request);
        
        // 驗證只有管理員的情況
        $this->assertEquals(2, $result['meta']['total']);
        $this->assertEquals(2, $result['meta']['roles']['admin_count']);
        $this->assertEquals(0, $result['meta']['roles']['viewer_count']);
    }

    public function test_user_collection_handles_only_viewer_users()
    {
        $viewerUser1 = User::factory()->create();
        $viewerUser1->assignRole('viewer');
        $viewerUser2 = User::factory()->create();
        $viewerUser2->assignRole('viewer');

        $users = collect([$viewerUser1, $viewerUser2]);
        
        $collection = new UserCollection($users);
        $request = new Request();
        
        $result = $collection->toArray($request);
        
        // 驗證只有瀏覽者的情況
        $this->assertEquals(2, $result['meta']['total']);
        $this->assertEquals(0, $result['meta']['roles']['admin_count']);
        $this->assertEquals(2, $result['meta']['roles']['viewer_count']);
    }

    public function test_user_collection_handles_staff_role()
    {
        $adminUser = User::factory()->create();
        $adminUser->assignRole('admin');
        $staffUser = User::factory()->create();
        $staffUser->assignRole('staff');
        $viewerUser = User::factory()->create();
        $viewerUser->assignRole('viewer');

        $users = collect([$adminUser, $staffUser, $viewerUser]);
        
        $collection = new UserCollection($users);
        $request = new Request();
        
        $result = $collection->toArray($request);
        
        // 驗證包含 staff 角色的情況（staff 不會被計入統計）
        $this->assertEquals(3, $result['meta']['total']);
        $this->assertEquals(1, $result['meta']['roles']['admin_count']);
        $this->assertEquals(1, $result['meta']['roles']['viewer_count']);
    }
} 