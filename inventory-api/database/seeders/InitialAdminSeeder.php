<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class InitialAdminSeeder extends Seeder
{
    /**
     * 建立初始管理員帳號
     * 只在系統沒有任何用戶時執行
     */
    public function run(): void
    {
        // 檢查是否已有用戶
        if (User::count() > 0) {
            $this->command->info('系統已有用戶，跳過初始管理員建立');
            return;
        }

        // 確保角色存在
        $this->ensureRolesExist();

        // 從環境變數取得初始管理員資訊
        $adminUsername = env('INITIAL_ADMIN_USERNAME', 'admin');
        $adminPassword = env('INITIAL_ADMIN_PASSWORD');
        $adminName = env('INITIAL_ADMIN_NAME', '系統管理員');

        // 如果沒有設定密碼，使用隨機密碼
        if (empty($adminPassword)) {
            $adminPassword = $this->generateSecurePassword();
            $this->command->warn("未設定 INITIAL_ADMIN_PASSWORD，已生成隨機密碼：$adminPassword");
            $this->command->warn("請立即記錄此密碼，因為它不會再顯示！");
        }

        // 建立管理員帳號
        $admin = User::create([
            'name' => $adminName,
            'username' => $adminUsername,
            'password' => Hash::make($adminPassword),
        ]);

        // 分配管理員角色
        $admin->assignRole('admin');

        $this->command->info("✅ 初始管理員帳號已建立");
        $this->command->info("   帳號：$adminUsername");
        
        // 只在開發環境顯示密碼
        if (app()->environment('local', 'development')) {
            $this->command->info("   密碼：$adminPassword");
        } else {
            $this->command->info("   密碼：請查看環境變數設定或系統日誌");
        }
        
        $this->command->warn("⚠️  請立即登入並修改密碼！");
    }

    /**
     * 生成安全的隨機密碼
     */
    private function generateSecurePassword(): string
    {
        $length = 16;
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()';
        $password = '';
        
        for ($i = 0; $i < $length; $i++) {
            $password .= $characters[random_int(0, strlen($characters) - 1)];
        }
        
        return $password;
    }

    /**
     * 確保所有角色存在
     */
    private function ensureRolesExist(): void
    {
        foreach (User::getAvailableRoles() as $roleName => $roleConfig) {
            Role::findOrCreate($roleName, 'web');
            Role::findOrCreate($roleName, 'sanctum');
        }
    }
}