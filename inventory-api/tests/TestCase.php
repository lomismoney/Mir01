<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use App\Models\User;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * 創建測試用戶並分配管理員角色
     *
     * @return \App\Models\User
     */
    protected function createAdminUser(): User
    {
        $user = User::factory()->create([
            'role' => User::ROLE_ADMIN
        ]);
        
        return $user;
    }

    /**
     * 創建測試用戶，使用普通用戶角色
     *
     * @return \App\Models\User
     */
    protected function createStandardUser(): User
    {

        $user = User::factory()->create([
            'role' => User::ROLE_VIEWER
        ]);
        
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
