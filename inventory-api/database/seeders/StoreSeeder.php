<?php

namespace Database\Seeders;

use App\Models\Store;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 禁用外鍵檢查以避免 truncate 問題
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // 清除現有資料以避免重複
        Store::truncate();
        
        // 重新啟用外鍵檢查
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        // 建立桃園店
        Store::create([
            'name' => '桃園店',
            'address' => '桃園市八德區和平路1101之16號',
        ]);
        
        // 建立台中店
        Store::create([
            'name' => '台中店',
            'address' => '台中市北屯區建和路一段113號',
        ]);
    }
}
