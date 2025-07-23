<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 重置快取
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 建立權限
        $permissions = [
            // 產品管理
            'products.view' => '檢視產品',
            'products.create' => '建立產品',
            'products.edit' => '編輯產品',
            'products.delete' => '刪除產品',

            // 庫存管理
            'inventory.view' => '檢視庫存',
            'inventory.adjust' => '調整庫存',
            'inventory.transfer' => '轉移庫存',

            // 訂單管理
            'orders.view' => '檢視訂單',
            'orders.create' => '建立訂單',
            'orders.edit' => '編輯訂單',
            'orders.cancel' => '取消訂單',

            // 客戶管理
            'customers.view' => '檢視客戶',
            'customers.create' => '建立客戶',
            'customers.edit' => '編輯客戶',

            // 報表查看
            'reports.view' => '檢視報表',
        ];

        foreach ($permissions as $name => $description) {
            // 為每個 guard 建立權限
            foreach (['web', 'sanctum'] as $guard) {
                Permission::firstOrCreate(
                    ['name' => $name, 'guard_name' => $guard]
                );
            }
        }

        // 建立角色並分配權限
        $roles = [
            'super-admin' => [
                'display_name' => '超級管理員',
                'permissions' => Permission::all()->pluck('name')->toArray(),
            ],
            'admin' => [
                'display_name' => '管理員',
                'permissions' => [
                    'products.view', 'products.create', 'products.edit', 'products.delete',
                    'inventory.view', 'inventory.adjust', 'inventory.transfer',
                    'orders.view', 'orders.create', 'orders.edit', 'orders.cancel',
                    'customers.view', 'customers.create', 'customers.edit',
                    'reports.view',
                ],
            ],
            'manager' => [
                'display_name' => '經理',
                'permissions' => [
                    'products.view', 'products.create', 'products.edit',
                    'inventory.view', 'inventory.adjust',
                    'orders.view', 'orders.create', 'orders.edit',
                    'customers.view', 'customers.create', 'customers.edit',
                    'reports.view',
                ],
            ],
            'staff' => [
                'display_name' => '員工',
                'permissions' => [
                    'products.view',
                    'inventory.view',
                    'orders.view', 'orders.create',
                    'customers.view', 'customers.create',
                ],
            ],
            'viewer' => [
                'display_name' => '檢視者',
                'permissions' => [
                    'products.view',
                    'inventory.view',
                    'orders.view',
                    'customers.view',
                    'reports.view',
                ],
            ],
            'installer' => [
                'display_name' => '安裝師傅',
                'permissions' => [
                    'orders.view', 'orders.edit',
                    'customers.view',
                ],
            ],
        ];

        foreach ($roles as $name => $config) {
            // 為每個 guard 建立角色
            foreach (['web', 'sanctum'] as $guard) {
                $role = Role::firstOrCreate(
                    ['name' => $name, 'guard_name' => $guard]
                );

                // 同步權限
                $role->syncPermissions($config['permissions']);
            }
        }

        $this->command->info('角色與權限建立完成！');
        $this->displayRolePermissions();
    }

    /**
     * 顯示角色權限分配表
     */
    private function displayRolePermissions(): void
    {
        $this->command->newLine();
        $this->command->info('角色權限分配表：');
        $this->command->newLine();

        $roles = Role::with('permissions')->get();

        foreach ($roles as $role) {
            $this->command->line(sprintf(
                '<fg=cyan>%s</> - %d 個權限',
                $role->name,
                $role->permissions->count()
            ));

            if ($role->permissions->isNotEmpty()) {
                $permissions = $role->permissions->pluck('name')->sort()->map(function ($permission) {
                    return '  • ' . $permission;
                })->join("\n");
                $this->command->line($permissions);
            }

            $this->command->newLine();
        }
    }
}