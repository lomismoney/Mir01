<?php

namespace Database\Seeders;

use App\Models\Store;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 清除現有資料以避免重複
        Store::truncate();
        
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
