<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;

/**
 * 將單一角色系統遷移到多角色系統的命令
 */
class MigrateToMultipleRoles extends Command
{
    /**
     * 命令的名稱和簽名
     *
     * @var string
     */
    protected $signature = 'roles:migrate {--dry-run : 只顯示將要執行的操作，不實際執行}';

    /**
     * 命令描述
     *
     * @var string
     */
    protected $description = '將現有的單一角色系統遷移到 Spatie 多角色系統';

    /**
     * 執行命令
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->info('=== DRY RUN MODE - 不會實際修改數據 ===');
        }

        $this->info('開始遷移角色數據...');

        // 開始事務
        DB::beginTransaction();

        try {
            // 步驟 1: 創建角色（如果不存在）
            $this->createRoles($isDryRun);

            // 步驟 2: 遷移用戶角色
            $this->migrateUserRoles($isDryRun);

            if ($isDryRun) {
                DB::rollBack();
                $this->info('=== DRY RUN 完成，所有更改已回滾 ===');
            } else {
                DB::commit();
                $this->info('✓ 角色遷移成功完成！');
            }

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('遷移失敗: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * 創建系統角色
     */
    private function createRoles(bool $isDryRun)
    {
        $this->info('步驟 1: 創建系統角色...');

        $roles = [
            'admin' => '管理員',
            'staff' => '員工', 
            'viewer' => '檢視者',
            'installer' => '安裝師傅'
        ];

        foreach ($roles as $name => $description) {
            // 為每個 guard 創建角色
            foreach (['web', 'sanctum'] as $guard) {
                $exists = Role::where('name', $name)->where('guard_name', $guard)->exists();
                
                if (!$exists) {
                    if (!$isDryRun) {
                        Role::create(['name' => $name, 'guard_name' => $guard]);
                    }
                    $this->line("  ✓ 創建角色: {$name} ({$description}) for guard: {$guard}");
                } else {
                    $this->line("  - 角色已存在: {$name} for guard: {$guard}");
                }
            }
        }
    }

    /**
     * 遷移用戶的角色
     */
    private function migrateUserRoles(bool $isDryRun)
    {
        $this->info('步驟 2: 遷移用戶角色...');

        $users = User::whereNotNull('role')->get();
        $this->line("  找到 {$users->count()} 個需要遷移的用戶");

        $migratedCount = 0;
        $skippedCount = 0;

        foreach ($users as $user) {
            // 檢查用戶是否已有該角色
            if ($user->roles()->where('name', $user->role)->exists()) {
                $this->line("  - 跳過: {$user->name} (ID: {$user->id}) - 已有角色 {$user->role}");
                $skippedCount++;
                continue;
            }

            if (!$isDryRun) {
                // 分配角色
                $user->assignRole($user->role);
            }
            
            $this->line("  ✓ 遷移: {$user->name} (ID: {$user->id}) - 分配角色 {$user->role}");
            $migratedCount++;
        }

        $this->info("  遷移完成: {$migratedCount} 個用戶已遷移, {$skippedCount} 個用戶已跳過");
    }
} 