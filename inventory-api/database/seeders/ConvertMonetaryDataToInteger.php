<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ConvertMonetaryDataToInteger extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚨 ConvertMonetaryDataToInteger Seeder 已廢棄');
        $this->command->info('💡 原因：');
        $this->command->info('   1. Factory 和 Seeder 現在已直接以分為單位產生數據');
        $this->command->info('   2. Model 使用 MoneyCast 自動處理分/元轉換');
        $this->command->info('   3. 此 Seeder 會造成數據重複轉換問題');
        $this->command->info('');
        $this->command->info('✅ 如果需要修正錯誤的舊數據，請執行：');
        $this->command->info('   php artisan db:seed --class=FixIncorrectMonetaryData');
        $this->command->info('');
        $this->command->info('⚠️  此 Seeder 不再執行任何轉換操作');
    }
}
