<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use App\Models\User;
use Spatie\Permission\Models\Role;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * 設置測試環境
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建所有必要的角色
        $this->createRoles();
    }

    /**
     * 創建測試所需的角色
     */
    protected function createRoles(): void
    {
        // 為 web 和 sanctum guard 創建角色
        foreach (User::getAvailableRoles() as $roleName => $roleConfig) {
            Role::findOrCreate($roleName, 'web');
            Role::findOrCreate($roleName, 'sanctum');
        }
        
        // 創建安裝師傅角色（如果存在）
        if (defined('App\Models\User::ROLE_INSTALLER')) {
            Role::findOrCreate(User::ROLE_INSTALLER, 'web');
            Role::findOrCreate(User::ROLE_INSTALLER, 'sanctum');
        }
    }

    /**
     * 創建測試用戶並分配管理員角色
     *
     * @return \App\Models\User
     */
    protected function createAdminUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(User::ROLE_ADMIN);
        
        return $user;
    }

    /**
     * 創建測試用戶，使用普通用戶角色
     *
     * @return \App\Models\User
     */
    protected function createStandardUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(User::ROLE_VIEWER);
        
        return $user;
    }
    
    /**
     * 以管理員身份進行授權
     *
     * @return \Illuminate\Testing\TestResponse
     */
    protected function actingAsAdmin()
    {
        $admin = $this->createAdminUser();
        return $this->actingAs($admin);
    }
    
    /**
     * 以普通用戶身份進行授權
     *
     * @return \Illuminate\Testing\TestResponse
     */
    protected function actingAsUser()
    {
        $user = $this->createStandardUser();
        return $this->actingAs($user);
    }
}
