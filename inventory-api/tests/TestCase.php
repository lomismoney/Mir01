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
        
        // 安全地檢查並清理事務（避免 Mock 問題）
        try {
            while (\Illuminate\Support\Facades\DB::transactionLevel() > 0) {
                \Illuminate\Support\Facades\DB::rollBack();
            }
        } catch (\Exception $e) {
            // 如果 DB 被 Mock，跳過事務檢查
        }
        
        // 創建所有必要的角色
        $this->createRoles();
    }

    protected function tearDown(): void
    {
        // 安全地清理任何未提交的事務（避免 Mock 問題）
        try {
            while (\Illuminate\Support\Facades\DB::transactionLevel() > 0) {
                \Illuminate\Support\Facades\DB::rollBack();
            }
        } catch (\Exception $e) {
            // 如果 DB 被 Mock，跳過事務檢查
        }
        
        parent::tearDown();
    }

    /**
     * 創建測試所需的角色
     */
    protected function createRoles(): void
    {
        // 安全地檢查是否在事務中（避免 Mock 問題）
        try {
            if (\Illuminate\Support\Facades\DB::transactionLevel() > 0) {
                return;
            }
        } catch (\Exception $e) {
            // 如果 DB 被 Mock，繼續執行
        }
        
        // 為 web 和 sanctum guard 創建角色（每次都檢查，適合並行測試）
        foreach (User::getAvailableRoles() as $roleName => $roleConfig) {
            try {
                if (!Role::where('name', $roleName)->where('guard_name', 'web')->exists()) {
                    Role::create(['name' => $roleName, 'guard_name' => 'web']);
                }
            } catch (\Exception $e) {
                // 角色可能已經被其他並行進程創建，忽略重複創建錯誤
            }
            
            try {
                if (!Role::where('name', $roleName)->where('guard_name', 'sanctum')->exists()) {
                    Role::create(['name' => $roleName, 'guard_name' => 'sanctum']);
                }
            } catch (\Exception $e) {
                // 角色可能已經被其他並行進程創建，忽略重複創建錯誤
            }
        }
        
        // 創建安裝師傅角色（如果存在）
        if (defined('App\Models\User::ROLE_INSTALLER')) {
            try {
                if (!Role::where('name', User::ROLE_INSTALLER)->where('guard_name', 'web')->exists()) {
                    Role::create(['name' => User::ROLE_INSTALLER, 'guard_name' => 'web']);
                }
            } catch (\Exception $e) {
                // 忽略重複創建錯誤
            }
            
            try {
                if (!Role::where('name', User::ROLE_INSTALLER)->where('guard_name', 'sanctum')->exists()) {
                    Role::create(['name' => User::ROLE_INSTALLER, 'guard_name' => 'sanctum']);
                }
            } catch (\Exception $e) {
                // 忽略重複創建錯誤
            }
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
