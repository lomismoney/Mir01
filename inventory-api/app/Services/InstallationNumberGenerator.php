<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * 安裝單編號生成器服務
 * 
 * 負責生成唯一的安裝單編號，格式為 I-YYYYMM-XXXX
 * 使用資料庫事務和行鎖確保並發安全
 */
class InstallationNumberGenerator
{
    /**
     * 生成下一個安裝單編號
     * 
     * @return string 格式化的安裝單編號 (例如: I-202506-0001)
     * @throws \Exception 當生成失敗時
     */
    public function generateNextNumber(): string
    {
        return DB::transaction(function () {
            // 獲取當前年月
            $yearMonth = Carbon::now()->format('Y-m'); // 例如: 2025-06
            
            // 查詢並鎖定該月的計數器記錄
            $counter = DB::table('monthly_installation_counters')
                ->where('year_month', $yearMonth)
                ->lockForUpdate()
                ->first();
            
            if (!$counter) {
                // 如果記錄不存在，創建新記錄
                DB::table('monthly_installation_counters')->insert([
                    'year_month' => $yearMonth,
                    'last_sequence' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                $newSequence = 1;
            } else {
                // 如果記錄存在，遞增序號
                $newSequence = $counter->last_sequence + 1;
                
                DB::table('monthly_installation_counters')
                    ->where('year_month', $yearMonth)
                    ->update([
                        'last_sequence' => $newSequence,
                        'updated_at' => now(),
                    ]);
            }
            
            // 格式化安裝單編號
            // 添加 I- 前綴以區分安裝單，移除年月中的連字符，並格式化序號為4位數
            $installationNumber = sprintf('I-%s-%04d', str_replace('-', '', $yearMonth), $newSequence);
            
            return $installationNumber;
        });
    }
    
    /**
     * 獲取指定年月的當前序號（不遞增）
     * 
     * @param string|null $yearMonth 年月格式 (YYYY-MM)，預設為當前年月
     * @return int 當前序號，如果不存在則返回0
     */
    public function getCurrentSequence(?string $yearMonth = null): int
    {
        $yearMonth = $yearMonth ?? Carbon::now()->format('Y-m');
        
        $counter = DB::table('monthly_installation_counters')
            ->where('year_month', $yearMonth)
            ->first();
        
        return $counter ? $counter->last_sequence : 0;
    }
    
    /**
     * 重置指定年月的序號計數器（僅供測試或特殊情況使用）
     * 
     * @param string $yearMonth 年月格式 (YYYY-MM)
     * @param int $sequence 要設置的序號
     * @return void
     */
    public function resetSequence(string $yearMonth, int $sequence = 0): void
    {
        DB::table('monthly_installation_counters')->updateOrInsert(
            ['year_month' => $yearMonth],
            [
                'last_sequence' => $sequence,
                'updated_at' => now(),
            ]
        );
    }
} 