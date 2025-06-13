<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserStoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 獲取超級管理員用戶（第一個用戶）
        $superAdmin = User::find(1);
        
        // 獲取所有分店
        $stores = Store::all();
        
        // 將所有分店分配給超級管理員
        if ($superAdmin) {
            $superAdmin->stores()->sync($stores->pluck('id'));
        }
        
        // 為其他用戶隨機分配分店
        $otherUsers = User::where('id', '>', 1)->get();
        
        foreach ($otherUsers as $user) {
            // 隨機選擇0-2間分店
            $count = rand(0, min(2, $stores->count()));
            // Skip when no stores are requested to avoid InvalidArgumentException
            if ($count === 0) {
                $user->stores()->sync([]);   // detach all
                continue;
            }

            $randomStores = $stores->random($count);
            
            // 分配分店給用戶
            $user->stores()->sync($randomStores->pluck('id'));
        }
    }
} 