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

        // 建立測試用戶並分配角色
        $users = [
            [
                'name' => 'Super Admin',
                'username' => 'superadmin',
                'password' => Hash::make('password'),
                'role' => 'super-admin'
            ],
            [
                'name' => 'Admin User',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'role' => 'admin'
            ],
            [
                'name' => 'Manager User',
                'username' => 'manager',
                'password' => Hash::make('password'),
                'role' => 'manager'
            ],
            [
                'name' => 'Staff User',
                'username' => 'staff',
                'password' => Hash::make('password'),
                'role' => 'staff'
            ],
            [
                'name' => 'Viewer User',
                'username' => 'viewer',
                'password' => Hash::make('password'),
                'role' => 'viewer'
            ],
            [
                'name' => 'Installer User',
                'username' => 'installer',
                'password' => Hash::make('password'),
                'role' => 'installer'
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);
            
            $user = User::create($userData);
            $user->assignRole($role);
            
            $this->command->info("建立用戶 {$user->username} 並分配角色 {$role}");
        }

        // 建立額外的測試用戶（都分配 staff 角色）
        User::factory(5)->create()->each(function ($user) {
            $user->assignRole('staff');
        });
        
        $this->command->info('建立 5 個額外的員工用戶');
    }
} 