<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use App\Models\User;
use Spatie\Permission\Models\Role;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase {
        refreshDatabase as baseRefreshDatabase;
    }
    
    /**
     * 設置測試環境
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // SQLite 平行測試專用處理
        if (DB::getDriverName() === 'sqlite') {
            $this->setUpSQLiteParallelTesting();
        } else {
            // MySQL 環境的標準處理 - 先清理再刷新
            try {
                $this->cleanupTransactions();
                $this->refreshDatabase();
            } catch (\Exception $e) {
                // 如果刷新失敗，嘗試直接運行遷移
                Artisan::call('migrate:fresh', ['--force' => true]);
            }
        }
        
        // 創建所有必要的角色
        $this->createRoles();
    }
    
    /**
     * SQLite 平行測試專用設置
     */
    protected function setUpSQLiteParallelTesting(): void
    {
        // 1. 清理任何現有事務
        $this->forceCleanupTransactions();
        
        // 2. 確保使用獨立的記憶體資料庫
        $this->ensureIndependentDatabase();
        
        // 3. 執行遷移（只在需要時）
        $this->runMigrationsIfNeeded();
        
        // 4. 確保角色表存在
        $this->ensureRolesTableExists();
    }
    
    /**
     * 強制清理所有事務
     */
    protected function forceCleanupTransactions(): void
    {
        try {
            // 強制結束所有活動事務
            while (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            
            // 確保連接處於乾淨狀態
            DB::disconnect();
            DB::reconnect();
        } catch (\Exception $e) {
            // 忽略錯誤，繼續執行
        }
    }
    
    /**
     * 確保使用獨立的資料庫連接
     */
    protected function ensureIndependentDatabase(): void
    {
        // 對於 SQLite :memory: 資料庫，每個連接都是獨立的
        // 重新連接確保獲得全新的記憶體資料庫
        try {
            DB::purge('sqlite');
            DB::reconnect('sqlite');
        } catch (\Exception $e) {
            // 如果出錯，至少嘗試重新連接
            DB::reconnect();
        }
    }
    
    /**
     * 只在需要時執行遷移
     */
    protected function runMigrationsIfNeeded(): void
    {
        static $migrationsCacheKey = null;
        
        try {
            // 使用靜態變數快取避免重複檢查
            $currentProcessId = getmypid();
            $cacheKey = "migrations_done_{$currentProcessId}";
            
            if ($migrationsCacheKey === $cacheKey) {
                return; // 此進程已執行過遷移
            }
            
            // 檢查是否已有關鍵業務表（更有效的檢查）
            $hasUserTable = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
            
            if (empty($hasUserTable)) {
                // 沒有關鍵表，需要執行完整遷移
                Artisan::call('migrate', ['--force' => true]);
                $migrationsCacheKey = $cacheKey; // 標記已完成
            } else {
                $migrationsCacheKey = $cacheKey; // 無需遷移，但標記檢查已完成
            }
        } catch (\Exception $e) {
            // 如果檢查失敗，嘗試執行遷移（但只執行一次）
            if ($migrationsCacheKey !== "failed_{$currentProcessId}") {
                try {
                    Artisan::call('migrate', ['--force' => true]);
                    $migrationsCacheKey = "migrations_done_{$currentProcessId}";
                } catch (\Exception $e2) {
                    $migrationsCacheKey = "failed_{$currentProcessId}"; // 避免重複失敗
                }
            }
        }
    }
    
    /**
     * 標準事務清理
     */
    protected function cleanupTransactions(): void
    {
        try {
            while (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
        } catch (\Exception $e) {
            // 如果 DB 被 Mock，跳過事務檢查
        }
    }
    
    /**
     * 自定義的資料庫刷新方法
     */
    protected function refreshDatabase()
    {
        // 使用原始的 RefreshDatabase trait 但確保執行正確
        try {
            $this->baseRefreshDatabase();
        } catch (\Exception $e) {
            // 如果 RefreshDatabase 失敗，根據資料庫類型處理
            if (\Illuminate\Support\Facades\DB::getDriverName() === 'sqlite') {
                // SQLite 環境：使用 migrate 而非 migrate:fresh 避免 VACUUM 問題
                Artisan::call('migrate', ['--force' => true]);
            } else {
                // MySQL 環境：使用 migrate:fresh
                Artisan::call('migrate:fresh');
            }
        }
    }

    protected function tearDown(): void
    {
        // SQLite 和 MySQL 的不同清理策略
        if (DB::getDriverName() === 'sqlite') {
            $this->tearDownSQLiteParallelTesting();
        } else {
            $this->cleanupTransactions();
        }
        
        parent::tearDown();
    }
    
    /**
     * SQLite 平行測試專用清理
     */
    protected function tearDownSQLiteParallelTesting(): void
    {
        try {
            // 1. 清理事務
            $this->forceCleanupTransactions();
            
            // 2. 對於 :memory: 資料庫，斷開連接會自動清理
            DB::disconnect();
        } catch (\Exception $e) {
            // 忽略清理錯誤
        }
    }

    /**
     * 創建測試所需的角色
     */
    protected function createRoles(): void
    {
        // SQLite 平行測試中，每個進程都有獨立的記憶體資料庫
        if (DB::getDriverName() === 'sqlite') {
            $this->createRolesForSQLite();
        } else {
            $this->createRolesForMySQL();
        }
    }
    
    /**
     * 確保角色表存在
     */
    protected function ensureRolesTableExists(): void
    {
        try {
            // 檢查 roles 表是否存在
            $hasRolesTable = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='roles'");
            if (empty($hasRolesTable)) {
                // 強制執行遷移
                Artisan::call('migrate', ['--force' => true]);
            }
        } catch (\Exception $e) {
            // 如果失敗，至少嘗試執行遷移
            try {
                Artisan::call('migrate', ['--force' => true]);
            } catch (\Exception $e2) {
                // 忽略錯誤
            }
        }
    }
    
    /**
     * SQLite 環境創建角色
     */
    protected function createRolesForSQLite(): void
    {
        try {
            // 確保角色表存在
            $this->ensureRolesTableExists();
            
            // SQLite 記憶體資料庫是獨立的，直接創建即可
            foreach (User::getAvailableRoles() as $roleName => $roleConfig) {
                Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
                Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'sanctum']);
            }
            
            // 創建安裝師傅角色（如果存在）
            if (defined('App\Models\User::ROLE_INSTALLER')) {
                Role::firstOrCreate(['name' => User::ROLE_INSTALLER, 'guard_name' => 'web']);
                Role::firstOrCreate(['name' => User::ROLE_INSTALLER, 'guard_name' => 'sanctum']);
            }
        } catch (\Exception $e) {
            // SQLite 角色創建失敗，記錄但繼續
        }
    }
    
    /**
     * MySQL 環境創建角色
     */
    protected function createRolesForMySQL(): void
    {
        // 檢查是否在事務中
        try {
            if (DB::transactionLevel() > 0) {
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
