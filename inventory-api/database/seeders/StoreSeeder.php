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
        
        // 建立台北總店（預設門市）
        Store::create([
            'name' => '台北總店',
            'code' => 'TPE001',
            'address' => '台北市信義區忠孝東路五段1號',
            'phone' => '02-2758-1234',
            'business_hours' => [
                'monday' => ['09:00-21:00'],
                'tuesday' => ['09:00-21:00'],
                'wednesday' => ['09:00-21:00'],
                'thursday' => ['09:00-21:00'],
                'friday' => ['09:00-22:00'],
                'saturday' => ['09:00-22:00'],
                'sunday' => ['10:00-20:00']
            ],
            'latitude' => 25.041079,
            'longitude' => 121.565414,
            'is_active' => true,
            'is_default' => true
        ]);
        
        // 建立桃園店
        Store::create([
            'name' => '桃園店',
            'code' => 'TYN001',
            'address' => '桃園市八德區和平路1101之16號',
            'phone' => '03-378-5678',
            'business_hours' => [
                'monday' => ['09:30-21:00'],
                'tuesday' => ['09:30-21:00'],
                'wednesday' => ['09:30-21:00'],
                'thursday' => ['09:30-21:00'],
                'friday' => ['09:30-21:30'],
                'saturday' => ['09:30-21:30'],
                'sunday' => ['10:00-20:00']
            ],
            'latitude' => 24.954742,
            'longitude' => 121.298349,
            'is_active' => true,
            'is_default' => false
        ]);
        
        // 建立新竹店
        Store::create([
            'name' => '新竹店',
            'code' => 'HSC001',
            'address' => '新竹市東區光復路二段295號',
            'phone' => '03-571-2345',
            'business_hours' => [
                'monday' => ['10:00-21:00'],
                'tuesday' => ['10:00-21:00'],
                'wednesday' => ['10:00-21:00'],
                'thursday' => ['10:00-21:00'],
                'friday' => ['10:00-21:30'],
                'saturday' => ['10:00-21:30'],
                'sunday' => ['10:00-20:30']
            ],
            'latitude' => 24.810829,
            'longitude' => 120.988759,
            'is_active' => true,
            'is_default' => false
        ]);
        
        // 建立台中店
        Store::create([
            'name' => '台中店',
            'code' => 'TCH001',
            'address' => '台中市北屯區建和路一段113號',
            'phone' => '04-2437-8901',
            'business_hours' => [
                'monday' => ['09:00-21:30'],
                'tuesday' => ['09:00-21:30'],
                'wednesday' => ['09:00-21:30'],
                'thursday' => ['09:00-21:30'],
                'friday' => ['09:00-22:00'],
                'saturday' => ['09:00-22:00'],
                'sunday' => ['09:30-21:00']
            ],
            'latitude' => 24.165629,
            'longitude' => 120.696369,
            'is_active' => true,
            'is_default' => false
        ]);
        
        // 建立高雄店
        Store::create([
            'name' => '高雄店',
            'code' => 'KHH001',
            'address' => '高雄市左營區博愛二路777號',
            'phone' => '07-556-7890',
            'business_hours' => [
                'monday' => ['10:00-22:00'],
                'tuesday' => ['10:00-22:00'],
                'wednesday' => ['10:00-22:00'],
                'thursday' => ['10:00-22:00'],
                'friday' => ['10:00-22:30'],
                'saturday' => ['10:00-22:30'],
                'sunday' => ['10:00-21:30']
            ],
            'latitude' => 22.674090,
            'longitude' => 120.308592,
            'is_active' => true,
            'is_default' => false
        ]);
        
        // 建立線上商店（特殊門市）
        Store::create([
            'name' => '線上商店',
            'code' => 'ONLINE',
            'address' => '線上服務中心',
            'phone' => '0800-123-456',
            'business_hours' => [
                'monday' => ['00:00-23:59'],
                'tuesday' => ['00:00-23:59'],
                'wednesday' => ['00:00-23:59'],
                'thursday' => ['00:00-23:59'],
                'friday' => ['00:00-23:59'],
                'saturday' => ['00:00-23:59'],
                'sunday' => ['00:00-23:59']
            ],
            'latitude' => null,
            'longitude' => null,
            'is_active' => true,
            'is_default' => false
        ]);
    }
}
