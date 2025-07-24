<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * User Model 完整測試
 * 
 * 測試用戶模型的所有關聯、屬性和業務邏輯方法
 */
class UserModelTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        // 創建測試用戶
        $this->user = User::factory()->create();
    }

    /**
     * 測試 User 模型有正確的 fillable 屬性
     */
    public function test_user_has_correct_fillable_attributes(): void
    {
        $expectedFillable = [
            'name',
            'username',
            'email',
            'password',
        ];

        $this->assertEquals($expectedFillable, $this->user->getFillable());
    }

    /**
     * 測試 User 模型有正確的 hidden 屬性
     */
    public function test_user_has_correct_hidden_attributes(): void
    {
        $expectedHidden = [
            'password',
            'remember_token',
        ];

        $this->assertEquals($expectedHidden, $this->user->getHidden());
    }

    /**
     * 測試 User 模型有正確的屬性轉換
     */
    public function test_user_has_correct_casts(): void
    {
        $casts = $this->user->getCasts();
        
        $this->assertArrayHasKey('password', $casts);
        $this->assertEquals('hashed', $casts['password']);
    }

    /**
     * 測試 User 可以進行批量賦值
     */
    public function test_user_can_be_mass_assigned(): void
    {
        $data = [
            'name' => '測試用戶',
            'username' => 'testuser',
            'password' => 'password123'
        ];

        $user = User::create($data);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals($data['name'], $user->name);
        $this->assertEquals($data['username'], $user->username);
        $this->assertTrue(Hash::check($data['password'], $user->password));
    }

    /**
     * 測試 User 使用必要的 traits
     */
    public function test_user_uses_required_traits(): void
    {
        $traits = class_uses(User::class);
        
        $this->assertContains('Laravel\Sanctum\HasApiTokens', $traits);
        $this->assertContains('Illuminate\Database\Eloquent\Factories\HasFactory', $traits);
        $this->assertContains('Illuminate\Notifications\Notifiable', $traits);
        $this->assertContains('Spatie\Permission\Traits\HasRoles', $traits);
    }

    /**
     * 測試 User 角色常數定義
     */
    public function test_user_role_constants(): void
    {
        $this->assertEquals('admin', User::ROLE_ADMIN);
        $this->assertEquals('staff', User::ROLE_STAFF);
        $this->assertEquals('viewer', User::ROLE_VIEWER);
        $this->assertEquals('installer', User::ROLE_INSTALLER);
    }

    /**
     * 測試 User 與 Store 的多對多關聯
     */
    public function test_user_belongs_to_many_stores(): void
    {
        $store1 = Store::factory()->create();
        $store2 = Store::factory()->create();

        $this->user->stores()->attach([$store1->id, $store2->id]);

        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\BelongsToMany', $this->user->stores());
        $this->assertCount(2, $this->user->stores);
        $this->assertTrue($this->user->stores->contains($store1));
        $this->assertTrue($this->user->stores->contains($store2));
    }

    /**
     * 測試 isAdmin 方法
     */
    public function test_is_admin_method(): void
    {
        // 測試非管理員
        $this->assertFalse($this->user->isAdmin());

        // 賦予管理員角色
        $this->user->assignRole(User::ROLE_ADMIN);
        $this->assertTrue($this->user->isAdmin());

        // 移除管理員角色
        $this->user->removeRole(User::ROLE_ADMIN);
        $this->assertFalse($this->user->isAdmin());
    }

    /**
     * 測試 isStaff 方法
     */
    public function test_is_staff_method(): void
    {
        // 測試非員工
        $this->assertFalse($this->user->isStaff());

        // 賦予員工角色
        $this->user->assignRole(User::ROLE_STAFF);
        $this->assertTrue($this->user->isStaff());

        // 移除員工角色
        $this->user->removeRole(User::ROLE_STAFF);
        $this->assertFalse($this->user->isStaff());
    }

    /**
     * 測試 isViewer 方法
     */
    public function test_is_viewer_method(): void
    {
        // 測試非檢視者
        $this->assertFalse($this->user->isViewer());

        // 賦予檢視者角色
        $this->user->assignRole(User::ROLE_VIEWER);
        $this->assertTrue($this->user->isViewer());

        // 移除檢視者角色
        $this->user->removeRole(User::ROLE_VIEWER);
        $this->assertFalse($this->user->isViewer());
    }

    /**
     * 測試 isInstaller 方法
     */
    public function test_is_installer_method(): void
    {
        // 測試非安裝師傅
        $this->assertFalse($this->user->isInstaller());

        // 賦予安裝師傅角色
        $this->user->assignRole(User::ROLE_INSTALLER);
        $this->assertTrue($this->user->isInstaller());

        // 移除安裝師傅角色
        $this->user->removeRole(User::ROLE_INSTALLER);
        $this->assertFalse($this->user->isInstaller());
    }

    /**
     * 測試用戶可以有多個角色
     */
    public function test_user_can_have_multiple_roles(): void
    {
        $this->user->assignRole([User::ROLE_ADMIN, User::ROLE_STAFF]);

        $this->assertTrue($this->user->isAdmin());
        $this->assertTrue($this->user->isStaff());
        $this->assertFalse($this->user->isViewer());
        $this->assertFalse($this->user->isInstaller());
    }

    /**
     * 測試 getAvailableRoles 靜態方法
     */
    public function test_get_available_roles_static_method(): void
    {
        $expectedRoles = [
            User::ROLE_ADMIN => '管理員',
            User::ROLE_STAFF => '員工',
            User::ROLE_VIEWER => '檢視者',
            User::ROLE_INSTALLER => '安裝師傅',
        ];

        $availableRoles = User::getAvailableRoles();

        $this->assertEquals($expectedRoles, $availableRoles);
        $this->assertCount(4, $availableRoles);
        $this->assertArrayHasKey(User::ROLE_ADMIN, $availableRoles);
        $this->assertArrayHasKey(User::ROLE_STAFF, $availableRoles);
        $this->assertArrayHasKey(User::ROLE_VIEWER, $availableRoles);
        $this->assertArrayHasKey(User::ROLE_INSTALLER, $availableRoles);
    }

    /**
     * 測試用戶密碼自動哈希
     */
    public function test_user_password_is_automatically_hashed(): void
    {
        $plainPassword = 'test_password_123';
        
        $user = User::create([
            'name' => '測試用戶',
            'username' => 'test_hash_user',
            'password' => $plainPassword
        ]);

        $this->assertNotEquals($plainPassword, $user->password);
        $this->assertTrue(Hash::check($plainPassword, $user->password));
    }

    /**
     * 測試用戶名的唯一性
     */
    public function test_username_uniqueness(): void
    {
        $username = 'unique_test_user';
        
        User::factory()->create(['username' => $username]);

        $this->expectException(\Illuminate\Database\QueryException::class);
        
        User::factory()->create(['username' => $username]);
    }

    /**
     * 測試用戶角色檢查方法的準確性
     */
    public function test_role_checking_methods_accuracy(): void
    {
        // 測試沒有角色的用戶
        $this->assertFalse($this->user->isAdmin());
        $this->assertFalse($this->user->isStaff());
        $this->assertFalse($this->user->isViewer());
        $this->assertFalse($this->user->isInstaller());

        // 分別測試每個角色
        $roles = [User::ROLE_ADMIN, User::ROLE_STAFF, User::ROLE_VIEWER, User::ROLE_INSTALLER];
        $methods = ['isAdmin', 'isStaff', 'isViewer', 'isInstaller'];

        foreach ($roles as $index => $role) {
            $this->user->syncRoles([$role]);
            
            foreach ($methods as $methodIndex => $method) {
                if ($index === $methodIndex) {
                    $this->assertTrue($this->user->$method(), "用戶應該是 $role");
                } else {
                    $this->assertFalse($this->user->$method(), "用戶不應該是其他角色");
                }
            }
        }
    }

    /**
     * 測試用戶與門市的關聯操作
     */
    public function test_user_store_relationship_operations(): void
    {
        $store1 = Store::factory()->create(['name' => '門市1']);
        $store2 = Store::factory()->create(['name' => '門市2']);
        $store3 = Store::factory()->create(['name' => '門市3']);

        // 確保用戶開始時沒有關聯的門市
        $this->user->stores()->detach();
        $this->assertCount(0, $this->user->fresh()->stores);

        // 測試添加門市
        $this->user->stores()->attach([$store1->id, $store2->id]);
        $this->assertCount(2, $this->user->fresh()->stores);

        // 測試添加額外門市（避免重複添加）
        $this->user->stores()->syncWithoutDetaching([$store3->id]);
        $this->assertCount(3, $this->user->fresh()->stores);

        // 測試移除門市
        $this->user->stores()->detach($store1->id);
        $this->assertCount(2, $this->user->fresh()->stores);
        $this->assertFalse($this->user->fresh()->stores->contains($store1));

        // 測試同步門市
        $this->user->stores()->sync([$store1->id]);
        $this->assertCount(1, $this->user->fresh()->stores);
        $this->assertTrue($this->user->fresh()->stores->contains($store1));
    }

    /**
     * 測試用戶 Factory 創建不同角色的用戶
     */
    public function test_user_factory_creates_different_roles(): void
    {
        $adminUser = User::factory()->admin()->create();
        $staffUser = User::factory()->staff()->create();
        $viewerUser = User::factory()->viewer()->create();
        $installerUser = User::factory()->installer()->create();

        $this->assertTrue($adminUser->isAdmin());
        $this->assertTrue($staffUser->isStaff());
        $this->assertTrue($viewerUser->isViewer());
        $this->assertTrue($installerUser->isInstaller());
    }

    /**
     * 測試用戶屬性的序列化隱藏
     */
    public function test_user_attributes_are_hidden_in_serialization(): void
    {
        $user = User::factory()->create([
            'password' => 'secret_password'
        ]);

        $serialized = $user->toArray();

        $this->assertArrayNotHasKey('password', $serialized);
        $this->assertArrayNotHasKey('remember_token', $serialized);
        $this->assertArrayHasKey('name', $serialized);
        $this->assertArrayHasKey('username', $serialized);
    }

    /**
     * 測試用戶的基本驗證功能
     */
    public function test_user_authentication_functionality(): void
    {
        $password = 'test_auth_password';
        $user = User::factory()->create([
            'password' => $password
        ]);

        // 測試正確密碼
        $this->assertTrue(Hash::check($password, $user->password));

        // 測試錯誤密碼
        $this->assertFalse(Hash::check('wrong_password', $user->password));
    }

    /**
     * 測試用戶角色常數的完整性
     */
    public function test_user_role_constants_completeness(): void
    {
        $reflection = new \ReflectionClass(User::class);
        $constants = $reflection->getConstants();
        
        $roleConstants = array_filter($constants, function($key) {
            return strpos($key, 'ROLE_') === 0;
        }, ARRAY_FILTER_USE_KEY);

        $this->assertArrayHasKey('ROLE_ADMIN', $roleConstants);
        $this->assertArrayHasKey('ROLE_STAFF', $roleConstants);
        $this->assertArrayHasKey('ROLE_VIEWER', $roleConstants);
        $this->assertArrayHasKey('ROLE_INSTALLER', $roleConstants);
        
        // 確保 getAvailableRoles 包含所有角色常數
        $availableRoles = User::getAvailableRoles();
        foreach ($roleConstants as $roleConstant) {
            $this->assertArrayHasKey($roleConstant, $availableRoles);
        }
    }
}