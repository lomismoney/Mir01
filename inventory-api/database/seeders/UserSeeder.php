<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 確保角色存在
        $this->ensureRolesExist();
        
        // 禁用外鍵檢查以避免 truncate 問題
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // 為了避免重複執行 seeder 時出錯，先清空資料表是個好習慣
        User::truncate();
        
        // 重新啟用外鍵檢查
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 建立一個指定的超級管理員
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'username' => 'superadmin',
            'password' => Hash::make('password'), // 注意：請在生產環境中使用更安全的密碼
        ]);
        
        // 分配管理員角色
        $superAdmin->assignRole('admin');

        // 工廠生成的用戶將自動擁有 'viewer' 角色
        User::factory(10)->create();
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