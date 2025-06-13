<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 禁用外鍵檢查以避免 truncate 問題
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // 為了避免重複執行 seeder 時出錯，先清空資料表是個好習慣
        User::truncate();
        
        // 重新啟用外鍵檢查
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 建立一個指定的超級管理員
        User::create([
            'name' => 'Super Admin',
            'username' => 'superadmin',
            'password' => Hash::make('password'), // 注意：請在生產環境中使用更安全的密碼
            'role' => User::ROLE_ADMIN, // 指定角色
        ]);

        // 工廠生成的用戶將自動擁有 'viewer' 角色
        User::factory(10)->create();
    }
} 