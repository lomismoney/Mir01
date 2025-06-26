<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * 給用戶分配角色的命令
 */
class AssignRoleToUser extends Command
{
    /**
     * 命令的名稱和簽名
     *
     * @var string
     */
    protected $signature = 'user:assign-role 
                            {user : 用戶 ID 或用戶名} 
                            {role : 要分配的角色名稱}
                            {--remove : 移除角色而不是添加}';

    /**
     * 命令描述
     *
     * @var string
     */
    protected $description = '給用戶分配或移除角色';

    /**
     * 執行命令
     */
    public function handle()
    {
        $userIdentifier = $this->argument('user');
        $roleName = $this->argument('role');
        $remove = $this->option('remove');

        // 查找用戶
        $user = User::find($userIdentifier) ?? User::where('username', $userIdentifier)->first();

        if (!$user) {
            $this->error("找不到用戶: {$userIdentifier}");
            return 1;
        }

        // 檢查角色是否存在
        $availableRoles = array_keys(User::getAvailableRoles());
        if (!in_array($roleName, $availableRoles)) {
            $this->error("無效的角色: {$roleName}");
            $this->line("可用角色: " . implode(', ', $availableRoles));
            return 1;
        }

        if ($remove) {
            // 移除角色
            $user->removeRole($roleName);
            $this->info("✓ 已從用戶 {$user->name} (ID: {$user->id}) 移除角色: {$roleName}");
        } else {
            // 分配角色
            $user->assignRole($roleName);
            $this->info("✓ 已給用戶 {$user->name} (ID: {$user->id}) 分配角色: {$roleName}");
        }

        // 顯示用戶當前的所有角色
        $currentRoles = $user->getRoleNames()->toArray();
        $this->line("用戶當前的角色: " . (empty($currentRoles) ? '無' : implode(', ', $currentRoles)));

        return 0;
    }
} 